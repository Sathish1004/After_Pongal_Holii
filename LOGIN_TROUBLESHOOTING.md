📱 **NOOR BUILDERS - LOGIN TROUBLESHOOTING GUIDE**

## **Problem: Login Failed Error**

### **Possible Causes & Solutions:**

#### **1. ✅ Backend Not Running**
- Check if backend terminal shows server running on port 5000
- Look for: `Backend is ready to accept connections`

**Fix:**
```bash
cd noor-backend
npm start
```

---

#### **2. ✅ Frontend/Phone Network Connection**
- **Requirement:** Phone MUST be on SAME WiFi as PC
- **Your PC IP:** 172.16.80.131
- **Port:** 5000

**Test on your phone browser:**
```
http://172.16.80.131:5000/api/test
```
✅ Should show: `{"message":"Backend is running!"}`

---

#### **3. ✅ Credentials Issue**
**Default Admin Login:**
- Email: `admin@noor.com`
- Password: `admin123`

**Verify in .env file** (noor-backend/.env):
```
ADMIN_EMAIL=admin@noor.com
ADMIN_PASSWORD=admin123
```

---

#### **4. ✅ Database Connection**
Backend might not be connecting to database. Check:
- Is MySQL running?
- Database name: `noor_client`
- DB credentials in `.env` are correct

---

#### **5. ✅ CORS/Port Issues**
If request reaches backend but fails:

**Check backend logs for:**
- Port already in use
- Database connection errors
- Request body format

---

### **QUICK VERIFICATION STEPS:**

**Step 1:** On your PC, run test:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@noor.com","password":"admin123"}'
```

**Step 2:** On phone browser, test connection:
```
http://172.16.80.131:5000/api/test
```

**Step 3:** Check both terminals are showing:
- Backend: listening on :5000
- Frontend: Expo running with QR code

---

### **If Still Failing:**

1. Restart both services
2. Clear phone's app data
3. Rescan QR code in Expo
4. Check browser console for network errors
5. Verify firewall not blocking port 5000

---

**Status Check URL:** http://172.16.80.131:5000/api/test
