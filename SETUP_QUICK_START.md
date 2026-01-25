# Admin Panel Files Calendar - Quick Setup Guide

## 🚀 Quick Start (5 Minutes)

### Backend Setup

1. **Verify Database Schema**
```bash
# Files are stored in task_messages table
# Required fields:
# - id (INT PRIMARY KEY)
# - sender_id (INT)
# - task_id (INT)
# - type (ENUM: 'image', 'video', 'audio', 'document', 'link')
# - media_url (VARCHAR)
# - content (TEXT)
# - created_at (TIMESTAMP)
# - site_id (INT)
```

2. **Files Routes Already Added**
✅ `/noor-backend/routes/filesRoutes.js` - Created
✅ `/noor-backend/controllers/filesController.js` - Created
✅ Server configured in `/noor-backend/index.js` - Updated

3. **Start Backend**
```bash
cd noor-backend
npm start
```

### Frontend Already Implemented

✅ Calendar component - AdminDashboardScreen.tsx
✅ File display - Grid & List layouts
✅ Date filtering - By selected date
✅ API integration - Custom hook provided

**No additional setup required!**

---

## 📡 API Endpoints Available

All endpoints are live at `http://localhost:5000/api/files/`

### 1. Get Calendar Data
```bash
GET /api/files/calendar?month=2026-01&siteId=1
```

### 2. Get Files by Date
```bash
GET /api/files/by-date?date=2026-01-25&siteId=1
```

### 3. Get File Preview
```bash
GET /api/files/preview/123
```

### 4. Search Files
```bash
GET /api/files/search?query=inspection&type=image&siteId=1
```

### 5. Get Statistics
```bash
GET /api/files/stats?siteId=1&year=2026&month=01
```

### 6. Delete File
```bash
DELETE /api/files/123
```

---

## 🎯 Frontend Components

### Location: AdminDashboardScreen.tsx

**Features Already Integrated**:
- ✅ Calendar grid with month navigation
- ✅ File count badges
- ✅ Selected date highlighting
- ✅ File list with Media (grid) and Voice (list) tabs
- ✅ Date filtering logic
- ✅ Empty states
- ✅ Loading states

**States**:
```typescript
const [projectFiles, setProjectFiles] = useState([]);
const [currentMonth, setCurrentMonth] = useState(new Date());
const [selectedFileDate, setSelectedFileDate] = useState(null);
const [activeFileTab, setActiveFileTab] = useState("Media");
```

---

## 🧪 Testing

### In Admin Dashboard

1. **View Calendar**
   - Files tab → Calendar appears
   - Shows current month
   - Dates with files show count badge

2. **Select Date**
   - Tap any date with count > 0
   - Date turns dark red
   - Banner shows "📅 Selected Date: [date]"
   - Files list updates to show only that date's files

3. **View Files**
   - Media tab: 3-column grid of images/videos
   - Voice tab: List of audio files
   - Both respect selected date filter

4. **Clear Selection**
   - Click X in date banner
   - Shows all files again grouped by date

---

## 🔄 Data Flow

```
Calendar API ─────→ File Count Badges
    ↓
User Selects Date ─→ Update selectedFileDate state
    ↓
Filter Files ──────→ Match selected date + type
    ↓
Display Results ───→ Media grid or Voice list
```

---

## 🎨 UI Components

### Calendar
- Month: January 2026
- Days: 1-31 with borders
- Badges: Red circles showing file count
- Selection: Dark red background
- Today: Yellow background with gold border

### Files Display
- **Media**: 3-column grid
  - Image thumbnails
  - Video play icon overlay
  - Rounded corners, shadows
  
- **Voice**: Vertical list
  - Microphone icon (blue)
  - File name
  - Timestamp

### Banner
- Yellow background with gold left border
- Shows selected date in full format
- Clear button (X) to reset

---

## 🔧 Using the Custom Hook (Advanced)

```typescript
import { useFilesAPI } from '../hooks/useFilesAPI';

export const MyComponent = () => {
  const {
    loading,
    error,
    calendarData,
    fetchCalendar,
    fetchFilesByDate,
    fetchFilePreview,
    deleteFile
  } = useFilesAPI();

  // Fetch calendar for January 2026
  useEffect(() => {
    fetchCalendar('2026-01', siteId);
  }, [siteId]);

  // Fetch files for specific date
  const handleDateSelect = (date) => {
    fetchFilesByDate('2026-01-25', siteId);
  };

  // Delete file
  const handleDelete = (fileId) => {
    deleteFile(fileId).then(() => {
      // Refresh files
      fetchFilesByDate('2026-01-25', siteId);
    });
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {calendarData && <Calendar data={calendarData} />}
    </div>
  );
};
```

---

## 📊 File Types Supported

| Type | Icon | Color | Layout |
|------|------|-------|--------|
| Image | 🖼️ | Auto preview | Grid |
| Video | ▶️ | Blue overlay | Grid |
| Audio | 🎵 | Blue circle | List |

---

## ❌ Common Issues & Solutions

### Issue: "Module not found" error
**Solution**: Ensure all files created:
- ✅ `filesController.js`
- ✅ `filesRoutes.js`
- ✅ `useFilesAPI.ts`

### Issue: API returns 401
**Solution**: Token authentication required
- Ensure you're logged in as admin
- Token sent in Authorization header

### Issue: Files not showing
**Solution**: Check database
- Task messages must have `type` IN ('image', 'video', 'audio', ...)
- `created_at` must be valid timestamp
- `media_url` or `content` must have file URL

### Issue: Calendar showing wrong dates
**Solution**: Check state management
- Verify `currentMonth` updates on navigation
- Check `selectedFileDate` is Date object, not string

---

## 📱 Mobile & Web Support

**Both fully supported**:
- ✅ Touch interactions (tap to select date)
- ✅ Responsive grid layouts
- ✅ Mobile-friendly file display
- ✅ Works on tablets and desktops

---

## 🎓 Learning Resources

### Key Files to Review
1. **Backend**: `filesController.js` - API logic
2. **Routes**: `filesRoutes.js` - Endpoint definitions
3. **Frontend**: `AdminDashboardScreen.tsx` - Calendar UI
4. **Hook**: `useFilesAPI.ts` - API client

### Important Concepts
- **Date Formatting**: ISO 8601 (YYYY-MM-DD)
- **File Types**: image, video, audio (document/link removed)
- **Grouping**: Files organized by created_at timestamp
- **Filtering**: Type + Date combined filtering

---

## 🚀 Next Steps

### Optional Enhancements
1. **Image Preview Modal**
   - Full-screen image viewer
   - Navigation (prev/next)
   - Download button

2. **Video Player**
   - React Native Video component
   - Play/pause controls
   - Timeline scrubber

3. **File Management**
   - Delete with confirmation
   - Bulk select & delete
   - Move between phases

4. **Advanced Search**
   - Date range picker
   - File type filter
   - Uploader filter
   - Full-text search

5. **Export Features**
   - Download selected files
   - Export metadata as CSV
   - Generate report

---

## 📞 Support

### Test Endpoints
Use Postman or curl:

```bash
# Test calendar endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/files/calendar?month=2026-01"

# Test by-date endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/files/by-date?date=2026-01-25"
```

### Debug Mode
Enable logging in controllers:
```javascript
console.log("Fetching calendar for:", month);
console.log("Results:", results);
```

---

## 📋 Checklist

### Backend ✅
- [x] Files controller created
- [x] Files routes created
- [x] Server configured to use routes
- [x] All API endpoints working
- [x] Database queries optimized
- [x] Error handling implemented

### Frontend ✅
- [x] Calendar component built
- [x] File display implemented
- [x] Date selection working
- [x] File filtering logic complete
- [x] Empty states handled
- [x] Loading states shown
- [x] TypeScript compilation successful

### Testing ✅
- [x] Calendar displays correctly
- [x] File counts accurate
- [x] Date selection works
- [x] Files filter by date
- [x] Tab switching maintains state
- [x] Empty states show properly
- [x] No console errors

---

**Status**: ✅ READY FOR PRODUCTION

All features implemented and tested. Ready to deploy!

