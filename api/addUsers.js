import mongoose from "mongoose";
import User from "./src/models/user.model.js";

const MONGODB_URI = "mongodb+srv://user1:user1@cluster1.fh1zcnp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1";
  //"mongodb+srv://ramdhankumar1425:rk8ceqhdh800@cluster0.hgvo9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const dummyUsers = [
  {
    name: "Ramdhan Kumar",
    email: "k.ramdhan@iitg.ac.in",
    role: "admin",
    companies: [],
  },
  {
    name: "UNP",
    email: "u.pandey@iitg.ac.in",
    role: "admin",
    companies: [],
  },
  {
    name: "Rohit Sharma",
    email: "rohit.sharma@example.com",
    role: "dpr",
    companies: [],
  },
  {
    name: "Meera Nair",
    email: "meera.nair@example.com",
    role: "dpr",
    companies: [],
  },
  {
    name: "Kunal Joshi",
    email: "kunal.joshi@example.com",
    role: "dpr",
    companies: [],
  },
  {
    name: "Tanya Singh",
    email: "tanya.singh@example.com",
    role: "dpr",
    companies: [],
  },
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
