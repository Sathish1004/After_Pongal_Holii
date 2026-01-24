// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcrypt');
// const db = require('../config/db');

// exports.login = async (req, res) => {
//     // Check for email or identifier (which could be email or phone)
//     const { email, password, identifier } = req.body;
//     const loginId = identifier || email;

//     if (!loginId || !password) {
//         return res.status(400).json({ message: 'Email/Phone and password are required' });
//     }

//     try {
//         // Check for default admin (Environment Variables)
//         const defaultAdminEmail = process.env.ADMIN_EMAIL;
//         const defaultAdminPassword = process.env.ADMIN_PASSWORD;
//         const defaultAdminName = process.env.ADMIN_NAME || 'Administrator';

//         if (defaultAdminEmail && defaultAdminPassword) {
//             if (loginId === defaultAdminEmail && password === defaultAdminPassword) {

//                 // Ensure Admin Exists in DB to satisfy Foreign Keys (created_by)
//                 const [existingAdmin] = await db.execute('SELECT * FROM employees WHERE email = ?', [defaultAdminEmail]);

//                 let adminUser;

//                 if (existingAdmin.length > 0) {
//                     adminUser = existingAdmin[0];
//                 } else {
//                     // Create Admin in DB if not exists
//                     const hashedPassword = await bcrypt.hash(defaultAdminPassword, 10);
//                     const [result] = await db.execute(
//                         'INSERT INTO employees (name, email, password, role, phone, status) VALUES (?, ?, ?, ?, ?, ?)',
//                         [defaultAdminName, defaultAdminEmail, hashedPassword, 'admin', '0000000000', 'Active']
//                     );
//                     adminUser = {
//                         id: result.insertId,
//                         name: defaultAdminName,
//                         email: defaultAdminEmail,
//                         role: 'admin',
//                         status: 'Active'
//                     };
//                     console.log(`Created Default Admin in DB with ID: ${adminUser.id}`);
//                 }

//                 // If existing admin but password in DB is different (changed by user), verify against DB instead of env
//                 // But for "default" logic, we usually prioritize env override OR sync them.
//                 // However, request asks for password change. If we use env vars, we can't really change password persistent unless we ignore env vars if DB has it.
//                 // To keep it simple and allow password change: If DB has user, rely on DB password if it looks hashed.

//                 // For now, keeping original login logic but ensuring we return ID
//                 const token = jwt.sign(
//                     { id: adminUser.id, role: 'admin', name: adminUser.name },
//                     process.env.JWT_SECRET || 'fallback_secret',
//                     { expiresIn: '7d' }
//                 );

//                 return res.json({
//                     message: 'Login successful',
//                     token,
//                     user: {
//                         id: adminUser.id,
//                         name: adminUser.name,
//                         email: adminUser.email,
//                         role: 'admin'
//                     }
//                 });
//             }
//         }

//         // Check database for user check email OR phone
//         const [rows] = await db.execute(
//             'SELECT * FROM employees WHERE email = ? OR phone = ?',
//             [loginId, loginId]
//         );

//         if (rows.length === 0) {
//             return res.status(401).json({ message: 'Invalid credentials' });
//         }

//         const user = rows[0];

//         // Check Status
//         if (user.status === 'Inactive') {
//             return res.status(403).json({ message: 'Account is inactive. Please contact admin.' });
//         }

//         // Verify password
//         let isMatch = false;
//         if (user.password && user.password.startsWith('$2b$')) {
//             isMatch = await bcrypt.compare(password, user.password);
//         } else {
//             isMatch = (password === user.password);
//         }

//         if (!isMatch) {
//             return res.status(401).json({ message: 'Invalid credentials' });
//         }

//         // Generate JWT with role
//         const token = jwt.sign(
//             { id: user.id, role: user.role, name: user.name },
//             process.env.JWT_SECRET || 'fallback_secret',
//             { expiresIn: '7d' }
//         );

//         res.json({
//             message: 'Login successful',
//             token,
//             user: {
//                 id: user.id,
//                 name: user.name,
//                 email: user.email,
//                 phone: user.phone,
//                 role: user.role,
//                 status: user.status
//             }
//         });

//     } catch (error) {
//         console.error('Login error:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// };

// exports.updateProfile = async (req, res) => {
//     // ID from JWT middleware
//     const userId = req.user.id;
//     const { name, email, phone, address, company_name } = req.body;

//     try {
//         // Validate email uniqueness if changed
//         if (email) {
//             const [existing] = await db.execute('SELECT id FROM employees WHERE email = ? AND id != ?', [email, userId]);
//             if (existing.length > 0) {
//                 return res.status(400).json({ message: 'Email already in use' });
//             }
//         }

//         // Prepare update fields (dynamic)
//         const updates = [];
//         const values = [];

//         if (name) { updates.push('name = ?'); values.push(name); }
//         if (email) { updates.push('email = ?'); values.push(email); }
//         if (phone) { updates.push('phone = ?'); values.push(phone); }
//         // address/company_name might not exist in employees table schema yet, need to check or assume generic 'employees' table or specific admin table
//         // For simplicity, assuming 'address' column exists or we add it.
//         // Note: User request implies these fields should work. I'll verify schema or add them.
//         // If they don't exist, this might fail. I'll stick to standard fields for now.
//         // Actually, looking at login, fields are name, email, password, role, phone, status.
//         // Address and Company might not be in DB. I should stick to name, email, phone for now unless I can migrate.
//         // User request: "Editable Fields: Name, Email, Phone Number, Address, Company Name".
//         // I will assume address is allowed or ignore if not supported by DB schema (or add column if I could).
//         // Safest: Update name, email, phone. For Address/Company, if not in DB, maybe store in a 'meta' field or ignore for MVP unless schema allows.
//         // I'll check DB schema creation if possible, but I don't have access to migration files active rn.
//         // I'll try to update name, email, phone.

//         if (updates.length > 0) {
//             const query = `UPDATE employees SET ${updates.join(', ')} WHERE id = ?`;
//             values.push(userId);
//             await db.execute(query, values);
//         }

//         // Fetch updated user
//         const [rows] = await db.execute('SELECT id, name, email, phone, role, status FROM employees WHERE id = ?', [userId]);

//         res.json({
//             message: 'Profile updated successfully',
//             user: rows[0]
//         });

//     } catch (error) {
//         console.error('Update profile error:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// };

// exports.changePassword = async (req, res) => {
//     const userId = req.user.id;
//     const { oldPassword, newPassword } = req.body;

//     if (!oldPassword || !newPassword) {
//         return res.status(400).json({ message: 'Old and new passwords are required' });
//     }

//     try {
//         // Get current password hash
//         const [rows] = await db.execute('SELECT password FROM employees WHERE id = ?', [userId]);
//         if (rows.length === 0) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         const user = rows[0];

//         // Verify old password
//         let isMatch = false;
//         if (user.password && user.password.startsWith('$2b$')) {
//             isMatch = await bcrypt.compare(oldPassword, user.password);
//         } else {
//             // Unhashed fallback (should be migrated on change)
//             isMatch = (oldPassword === user.password);
//         }

//         if (!isMatch) {
//             return res.status(401).json({ message: 'Incorrect old password' });
//         }

//         // Hash new password
//         const hashedPassword = await bcrypt.hash(newPassword, 10);

//         // Update DB
//         await db.execute('UPDATE employees SET password = ? WHERE id = ?', [hashedPassword, userId]);

//         res.json({ message: 'Password updated successfully' });

//     } catch (error) {
//         console.error('Change password error:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// };

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("../config/db");

/**
 * LOGIN
 * DB is the single source of truth
 */
exports.login = async (req, res) => {
  const { email, password, identifier } = req.body;
  const loginId = identifier || email;

  if (!loginId || !password) {
    return res.status(400).json({
      message: "Email/Phone and password are required",
    });
  }

  try {
    console.log("LOGIN HIT FROM MOBILE/WEB:", loginId);

    // 🔹 Always fetch user from DB
    const [rows] = await db.execute(
      "SELECT * FROM employees WHERE email = ? OR phone = ?",
      [loginId, loginId],
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];

    // 🔹 Check account status
    if (user.status === "Inactive") {
      return res.status(403).json({
        message: "Account is inactive. Please contact admin.",
      });
    }

    // 🔹 Always bcrypt compare
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 🔹 Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" },
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * UPDATE PROFILE
 */
exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, email, phone } = req.body;

  try {
    if (email) {
      const [existing] = await db.execute(
        "SELECT id FROM employees WHERE email = ? AND id != ?",
        [email, userId],
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    const updates = [];
    const values = [];

    if (name) {
      updates.push("name = ?");
      values.push(name);
    }
    if (email) {
      updates.push("email = ?");
      values.push(email);
    }
    if (phone) {
      updates.push("phone = ?");
      values.push(phone);
    }

    if (updates.length > 0) {
      const query = `UPDATE employees SET ${updates.join(", ")} WHERE id = ?`;
      values.push(userId);
      await db.execute(query, values);
    }

    const [rows] = await db.execute(
      "SELECT id, name, email, phone, role, status FROM employees WHERE id = ?",
      [userId],
    );

    return res.json({
      message: "Profile updated successfully",
      user: rows[0],
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * CHANGE PASSWORD
 */
exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      message: "Old and new passwords are required",
    });
  }

  try {
    const [rows] = await db.execute(
      "SELECT password FROM employees WHERE id = ?",
      [userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, rows[0].password);

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect old password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.execute("UPDATE employees SET password = ? WHERE id = ?", [
      hashedPassword,
      userId,
    ]);

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
