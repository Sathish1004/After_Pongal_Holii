const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Simple test endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is running!", timestamp: new Date() });
});

// Test login endpoint
app.post("/api/auth/login", (req, res) => {
  const { identifier, password } = req.body;

  console.log("Login attempt:", { identifier, password });

  // For testing - accept any admin@noor.com with admin123
  if (identifier === "admin@noor.com" && password === "admin123") {
    return res.json({
      message: "Login successful",
      token: "test_token_" + Date.now(),
      user: {
        id: 1,
        name: "Administrator",
        email: "admin@noor.com",
        role: "admin",
      },
    });
  }

  res.status(401).json({ message: "Invalid credentials" });
});

const PORT = 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Test backend running on http://0.0.0.0:${PORT}`);
  console.log(`   Local: http://localhost:${PORT}`);
  console.log(`   Network: http://172.16.80.131:${PORT}`);
});
