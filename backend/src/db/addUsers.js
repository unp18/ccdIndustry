import mongoose from "mongoose";
import User from "../models/user.model.js";
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const dummyUsers = [
  {
    name: "Srayash Singh",
    email: "s.srayash@iitg.ac.in",
    role: "admin",
    companies: [],
  },
  {
    name: "Utkarsh Narayan Pandey",
    email: "u.pandey@iitg.ac.in",
    role: "admin",
    companies: [],
  }

];

async function insertUsers() {
  try {
    await mongoose.connect(MONGODB_URI);

    console.log("Connected to MongoDB");

    await User.insertMany(dummyUsers);
    console.log("✅ Dummy users inserted");

    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error inserting users:", err);
  }
}

insertUsers();
