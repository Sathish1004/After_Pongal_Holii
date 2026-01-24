// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");

// dotenv.config();

// const authRoutes = require("./routes/authRoutes");
// const adminRoutes = require("./routes/adminRoutes");
// const siteRoutes = require("./routes/siteRoutes");

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use("/uploads", express.static("uploads"));

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api", siteRoutes);

// // Health Check
// app.get("/", (req, res) => {
//   res.send("Noor Workforce Management API is running");
// });

// // Global Error Handler
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).send("Something broke!");
// });

// const db = require("./config/db");

// // Database Schema Check
// const checkSchema = async () => {
//   try {
//     console.log("Checking database schema...");

//     // Check employees table for profile_image
//     try {
//       await db.query("SELECT profile_image FROM employees LIMIT 1");
//     } catch (error) {
//       if (error.code === "ER_BAD_FIELD_ERROR") {
//         console.log(
//           "Adding missing column 'profile_image' to employees table...",
//         );
//         await db.query(
//           "ALTER TABLE employees ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL",
//         );
//         console.log("Column 'profile_image' added successfully.");
//       } else {
//         console.error("Schema check warning:", error.message);
//       }
//     }

//     // Check stage_messages table for sender_role
//     try {
//       await db.query("SELECT sender_role FROM stage_messages LIMIT 1");
//     } catch (error) {
//       if (error.code === "ER_BAD_FIELD_ERROR") {
//         console.log(
//           "Adding missing column 'sender_role' to stage_messages table...",
//         );
//         await db.query(
//           "ALTER TABLE stage_messages ADD COLUMN sender_role VARCHAR(50) DEFAULT 'employee'",
//         );
//         console.log("Column 'sender_role' added successfully.");
//       }
//     }

//     // Check sites table for site_funds
//     try {
//       await db.query("SELECT site_funds FROM sites LIMIT 1");
//     } catch (error) {
//       if (error.code === "ER_BAD_FIELD_ERROR") {
//         console.log("Adding missing column 'site_funds' to sites table...");
//         await db.query(
//           "ALTER TABLE sites ADD COLUMN site_funds DECIMAL(15,2) DEFAULT 0",
//         );
//         console.log("Column 'site_funds' added successfully.");
//       }
//     }

//     // Check phases table for floor_name column
//     try {
//       await db.query("SELECT floor_name FROM phases LIMIT 1");
//     } catch (error) {
//       if (error.code === "ER_BAD_FIELD_ERROR") {
//         console.log("Adding missing column 'floor_name' to phases table...");
//         await db.query(
//           "ALTER TABLE phases ADD COLUMN floor_name VARCHAR(255) DEFAULT 'Ground Floor'",
//         );
//         console.log("Column 'floor_name' added successfully.");
//       }
//     }

//     console.log("Database schema check completed.");
//   } catch (error) {
//     console.error("Schema check failed:", error);
//   }
// };

// // Start Server after Schema Check
// checkSchema().then(() => {
//   app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
//   });
// });



// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");

// dotenv.config();

// const authRoutes = require("./routes/authRoutes");
// const adminRoutes = require("./routes/adminRoutes");
// const siteRoutes = require("./routes/siteRoutes");
// const db = require("./config/db");

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use("/uploads", express.static("uploads"));

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api", siteRoutes);

// // Health Check
// app.get("/", (req, res) => {
//   res.send("Noor Workforce Management API is running");
// });

// // Global Error Handler
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).send("Something broke!");
// });

// // 🔥 START SERVER FIRST
// app.listen(PORT, "127.0.0.1", () => {
//   console.log(`Server listening on http://localhost:${PORT}`);
// });

// // 🔄 Run schema check AFTER server starts
// (async function checkSchema() {
//   try {
//     console.log("Checking database schema...");

//     try {
//       await db.query("SELECT profile_image FROM employees LIMIT 1");
//     } catch (error) {
//       if (error.code === "ER_BAD_FIELD_ERROR") {
//         await db.query(
//           "ALTER TABLE employees ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL",
//         );
//       }
//     }

//     try {
//       await db.query("SELECT sender_role FROM stage_messages LIMIT 1");
//     } catch (error) {
//       if (error.code === "ER_BAD_FIELD_ERROR") {
//         await db.query(
//           "ALTER TABLE stage_messages ADD COLUMN sender_role VARCHAR(50) DEFAULT 'employee'",
//         );
//       }
//     }

//     try {
//       await db.query("SELECT site_funds FROM sites LIMIT 1");
//     } catch (error) {
//       if (error.code === "ER_BAD_FIELD_ERROR") {
//         await db.query(
//           "ALTER TABLE sites ADD COLUMN site_funds DECIMAL(15,2) DEFAULT 0",
//         );
//       }
//     }

//     try {
//       await db.query("SELECT floor_name FROM phases LIMIT 1");
//     } catch (error) {
//       if (error.code === "ER_BAD_FIELD_ERROR") {
//         await db.query(
//           "ALTER TABLE phases ADD COLUMN floor_name VARCHAR(255) DEFAULT 'Ground Floor'",
//         );
//       }
//     }

//     console.log("Database schema check completed.");
//   } catch (err) {
//     console.error("Schema check failed:", err.message);
//   }
// })();





const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const siteRoutes = require("./routes/siteRoutes");
const db = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// =====================
// MIDDLEWARE
// =====================
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// =====================
// ROUTES
// =====================
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", siteRoutes);

// =====================
// HEALTH CHECK
// =====================
app.get("/", (req, res) => {
  res.send("Noor Workforce Management API is running");
});

// =====================
// GLOBAL ERROR HANDLER
// =====================
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

// =====================
// 🔥 START SERVER (IMPORTANT FIX)
// =====================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});

// =====================
// 🔄 DATABASE SCHEMA CHECK
// =====================
(async function checkSchema() {
  try {
    console.log("🔍 Checking database schema...");

    // employees.profile_image
    try {
      await db.query("SELECT profile_image FROM employees LIMIT 1");
    } catch (error) {
      if (error.code === "ER_BAD_FIELD_ERROR") {
        await db.query(
          "ALTER TABLE employees ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL"
        );
        console.log("✅ Added profile_image to employees");
      }
    }

    // stage_messages.sender_role
    try {
      await db.query("SELECT sender_role FROM stage_messages LIMIT 1");
    } catch (error) {
      if (error.code === "ER_BAD_FIELD_ERROR") {
        await db.query(
          "ALTER TABLE stage_messages ADD COLUMN sender_role VARCHAR(50) DEFAULT 'employee'"
        );
        console.log("✅ Added sender_role to stage_messages");
      }
    }

    // sites.site_funds
    try {
      await db.query("SELECT site_funds FROM sites LIMIT 1");
    } catch (error) {
      if (error.code === "ER_BAD_FIELD_ERROR") {
        await db.query(
          "ALTER TABLE sites ADD COLUMN site_funds DECIMAL(15,2) DEFAULT 0"
        );
        console.log("✅ Added site_funds to sites");
      }
    }

    // phases.floor_name
    try {
      await db.query("SELECT floor_name FROM phases LIMIT 1");
    } catch (error) {
      if (error.code === "ER_BAD_FIELD_ERROR") {
        await db.query(
          "ALTER TABLE phases ADD COLUMN floor_name VARCHAR(255) DEFAULT 'Ground Floor'"
        );
        console.log("✅ Added floor_name to phases");
      }
    }

    console.log("Database schema check completed successfully");
  } catch (err) {
    console.error("❌ Schema check failed:", err.message);
  }
})();
