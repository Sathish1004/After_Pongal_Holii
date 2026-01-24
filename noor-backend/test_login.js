const axios = require("axios");

const API_URL = "http://localhost:5000/api";

async function testLogin() {
  try {
    console.log("🔄 Testing login with admin credentials...\n");

    const response = await axios.post(`${API_URL}/auth/login`, {
      identifier: "admin@noor.com",
      password: "admin123",
    });

    console.log("✅ LOGIN SUCCESSFUL!\n");
    console.log("Response:", JSON.stringify(response.data, null, 2));

    if (response.data.token) {
      console.log(
        "\n✅ Token received:",
        response.data.token.substring(0, 20) + "...",
      );
    }

    if (response.data.user) {
      console.log("✅ User data:", response.data.user);
    }

    return response.data;
  } catch (error) {
    console.error("❌ LOGIN FAILED!\n");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Error:", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error("No response from server:", error.request);
      console.error(
        "⚠️  Make sure backend is running on http://localhost:5000",
      );
    } else {
      console.error("Error:", error.message);
    }

    throw error;
  }
}

// Run test
testLogin().catch((err) => process.exit(1));
