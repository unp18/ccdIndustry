import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import connectDB from './db/index.js';
import { admin, adminRouter } from './adminjs/index.js';
import { authGuard } from './middleware/auth.middleware.js';
import path from 'path';
import fs from 'fs';
import Company from './models/company.model.js';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import fUpload from 'express-fileupload';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Define constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tempDir = path.join(__dirname, '../temp');
const allowedFiles = [".csv", ".xlsx", ".xls"];

// Create temporary directory if not exists
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Helper function to handle file validation
const validateFile = (file) => {
  const fileExtension = path.extname(file.name).toLowerCase();
  if (!allowedFiles.includes(fileExtension)) {
    return {
      isValid: false,
      message: `Invalid file type. Allowed types: ${allowedFiles.join(', ')}`
    };
  }
  return { isValid: true };
};

// Helper function to parse CSV
async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const companiesMap = new Map();

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        const companyName = data.companyName?.trim();
        if (!companyName) return;

        const profile = data.profiles?.trim();
        const poc = {
          name: data.pocName?.trim(),
          email: data.pocEmail?.trim(),
          phone: data.pocPhone?.trim(),
          status: (data.pocStatus || 'yet to contact').trim().toLowerCase(),
          remarks: data.pocRemarks?.trim(),
        };

        if (!companiesMap.has(companyName)) {
          companiesMap.set(companyName, { name: companyName, profiles: [], pocs: [] });
        }

        const company = companiesMap.get(companyName);

        // Add profile if not empty or duplicate
        if (profile && !company.profiles.includes(profile)) {
          company.profiles.push(profile);
        }

        // Add POC if email is provided and not already added
        if (poc.email && !company.pocs.find(p => p.email === poc.email)) {
          company.pocs.push(poc);
        }
      })
      .on('end', () => resolve(Array.from(companiesMap.values())))
      .on('error', reject);
  });
}


// Helper function to parse Excel
async function parseExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);

  return data.map(row => {
    const company = {
      name: row.name || row.companyName || row['company name'] || '',
      profiles: [],
      pocs: [],
    };

    if (row.profiles) {
      const separator = row.profiles.includes(';') ? ';' : ',';
      company.profiles = row.profiles.split(separator).map(p => p.trim());
    }

    if (row.pocName || row['poc name']) {
      company.pocs.push({
        name: row.pocName || row['poc name'],
        email: row.pocEmail || '',
        phone: row.pocPhone || '',
        status: row.pocStatus || 'yet to contact',
        remarks: row.pocRemarks || '',
      });
    }

    return company.name ? company : null;
  }).filter(Boolean);
}

const app = express();

// Connect to the database
connectDB();

// Middleware setup
app.use(admin.options.rootPath, adminRouter);
app.use(fUpload({ useTempFiles: true, tempFileDir: '/tmp/' }));
app.use(cors({ origin: ["http://localhost:5173","https://ccd-industry.vercel.app"], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => res.send('API is running...'));

// Get user role
app.post('/api/get-user-role', authGuard, (req, res) => {
  try {
    const user = req.user;
    res.status(200).json({
      success: true,
      message: 'User role fetched successfully',
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add companies from request body
app.post('/api/add-companies', authGuard, async (req, res) => {
  try {
    const { companies } = req.body;
    const user = req.user;
    const dprEmail = user.email;

    if (!dprEmail || !companies || companies.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    await Company.insertMany(companies.map(company => ({ ...company, dprEmail })));

    res.status(201).json({ success: true, message: 'Companies added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add companies with file
app.post('/api/add-company-with-file', authGuard, async (req, res) => {
  try {
    const user = req.user;
    const dprEmail = user.email;

    if (!user || !user.email) {
      return res.status(400).json({ message: 'User is not authenticated or email is missing' });
    }

    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.files.file;
    const validation = validateFile(file);

    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    const filePath = path.join(tempDir, file.name);
    await file.mv(filePath);

    let companies = [];
    const fileExtension = path.extname(file.name).toLowerCase();

    if (fileExtension === '.csv') {
      companies = await parseCSV(filePath);
    } else if (['.xlsx', '.xls'].includes(fileExtension)) {
      companies = await parseExcel(filePath);
    }

    fs.unlinkSync(filePath);

    if (!companies.length) {
      return res.status(400).json({ message: 'No valid company data found in file' });
    }

const savedCompanies = [];

for (const company of companies) {
  const existing = await Company.findOne({ name: company.name });

  if (existing) {
    const updatedProfiles = Array.from(new Set([
      ...existing.profiles,
      ...(company.profiles || [])
    ]));

    const existingEmails = new Set(existing.pocs.map(p => p.email));
    const newPocs = (company.pocs || []).filter(p => !existingEmails.has(p.email));
    const updatedPocs = [...existing.pocs, ...newPocs];

    existing.profiles = updatedProfiles;
    existing.pocs = updatedPocs;
    existing.dprEmail = dprEmail;

    await existing.save();
    savedCompanies.push(existing);
  } else {
    const newCompany = await Company.create({
      ...company,
      dprEmail,
    });
    savedCompanies.push(newCompany);
  }
}


    res.status(201).json({ message: `Successfully added ${savedCompanies.length} companies`, companies: savedCompanies });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get all companies
app.post('/api/get-all-companies', authGuard, async (req, res) => {
  try {
    let query = Company.find({});

    if (req.user.role === "dpr") {
      
      query = query.select("-pocs.phone -pocs.email");
    }

    const allCompanies = await query.lean();

    res.status(200).json({
      success: true,
      message: "Companies fetched successfully",
      companies: allCompanies,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update POC status
app.post('/api/update-poc-status', authGuard, async (req, res) => {
  try {
    const { companyId, pocId, status } = req.body;

    if (!companyId || !pocId || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const company = await Company.findOneAndUpdate(
      { _id: companyId, 'pocs._id': pocId },
      { $set: { 'pocs.$.status': status } },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ message: 'Company or POC not found' });
    }

    res.status(200).json({ success: true, message: 'POC status updated', company });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update POC remarks
app.post('/api/update-poc-remarks', authGuard, async (req, res) => {
  try {
    const { companyId, pocId, remarks } = req.body;

    if (!companyId || !pocId || !remarks) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const company = await Company.findOneAndUpdate(
      { _id: companyId, 'pocs._id': pocId },
      { $set: { 'pocs.$.remarks': remarks } },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ message: 'Company or POC not found' });
    }

    res.status(200).json({ success: true, message: 'POC remarks updated', company });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
