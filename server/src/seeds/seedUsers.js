import mongoose from "mongoose";

import { connectDatabase } from "../config/db.js";
import { User } from "../models/User.js";

const seedUsers = [
  {
    name: "Super Admin",
    email: "superadmin@veloraestates.com",
    password: "SuperAdmin@123",
    role: "super-admin",
    phone: "9000000001",
  },
  {
    name: "Admin Manager",
    email: "admin@veloraestates.com",
    password: "Admin@123",
    role: "admin",
    phone: "9000000002",
  },
  {
    name: "Sales Manager",
    email: "manager@veloraestates.com",
    password: "Manager@123",
    role: "manager",
    phone: "9000000003",
  },
  {
    name: "Sales Executive",
    email: "sales@veloraestates.com",
    password: "Sales@123",
    role: "sales",
    phone: "9000000004",
  },
  {
    name: "Marketing Team",
    email: "marketing@veloraestates.com",
    password: "Marketing@123",
    role: "marketing",
    phone: "9000000005",
  },
];

const run = async () => {
  try {
    await connectDatabase();

    for (const payload of seedUsers) {
      const existingUser = await User.findOne({ email: payload.email });

      if (existingUser) {
        existingUser.name = payload.name;
        existingUser.role = payload.role;
        existingUser.phone = payload.phone;
        existingUser.password = payload.password;
        await existingUser.save();
        console.log(`Updated ${payload.email}`);
      } else {
        await User.create(payload);
        console.log(`Created ${payload.email}`);
      }
    }

    console.log("User seeding completed");
  } catch (error) {
    console.error("User seeding failed", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();

