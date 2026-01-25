# Admin Panel Files Calendar - System Architecture

## 🏛️ Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD (Web/Mobile)                    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  Files Section (Tab)                         │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │        CALENDAR PICKER (Month View)                    │ │  │
│  │  │                                                        │ │  │
│  │  │  [←] January 2026 [→]                                 │ │  │
│  │  │                                                        │ │  │
│  │  │  Sun Mon Tue Wed Thu Fri Sat                          │ │  │
│  │  │   1   2   3   4   5   6   7                           │ │  │
│  │  │   8   9  10  11  12  13  14                           │ │  │
│  │  │  15  16  17  18  19  20  21                           │ │  │
│  │  │  22  23  24 [25] 26  27  28                           │ │  │
│  │  │      (dark red, count=2)                              │ │  │
│  │  │  29  30  31                                           │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  📅 Selected Date: Saturday, January 25, 2026    [X]  │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌─────────────┬──────────────┐                             │  │
│  │  │   MEDIA     │    VOICE     │                             │  │
│  │  └─────────────┴──────────────┘                             │  │
│  │                                                              │  │
│  │  MEDIA (Grid - 3 columns)           VOICE (List)            │  │
│  │  ┌────────┬────────┬────────┐       ♪ Voice File 1          │  │
│  │  │ Image  │ Video  │ Image  │       ♪ Voice File 2          │  │
│  │  │  [1]   │  [▶]   │  [2]   │                              │  │
│  │  └────────┴────────┴────────┘                              │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ API Calls
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND API (Node.js/Express)                  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    FILES CONTROLLER                          │  │
│  │                                                              │  │
│  │  ✓ getFilesCalendar()     → /api/files/calendar            │  │
│  │  ✓ getFilesByDate()       → /api/files/by-date             │  │
│  │  ✓ getFilePreview()       → /api/files/preview/:id         │  │
│  │  ✓ searchFiles()          → /api/files/search              │  │
│  │  ✓ getFileStats()         → /api/files/stats               │  │
│  │  ✓ deleteFile()           → DELETE /api/files/:id          │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                  │                                  │
│                                  │ Database Queries                 │
│                                  ↓                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    FILES ROUTES                              │  │
│  │  (Endpoint definitions, auth middleware, validation)         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    DATABASE (MySQL)                                │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │            TABLE: task_messages                              │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │ id    │ sender_id │ task_id │ type    │ created_at  │  │ │  │
│  │  ├───────┼───────────┼─────────┼─────────┼─────────────┤  │ │  │
│  │  │ 101   │ 5         │ 42      │ image   │ 2026-01-25  │  │ │  │
│  │  │ 102   │ 6         │ 42      │ video   │ 2026-01-25  │  │ │  │
│  │  │ 103   │ 7         │ 43      │ audio   │ 2026-01-24  │  │ │  │
│  │  │ ...   │ ...       │ ...     │ ...     │ ...         │  │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  Related: tasks, phases, employees, sites                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                  USER INTERACTION                               │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │  Admin opens Files   │
        │  section in dashboard│
        └──────────┬───────────┘
                   │
                   ↓
        ┌──────────────────────────────────────────┐
        │  fetchProjectFiles(siteId)               │
        │  GET /api/sites/{siteId}/files           │
        └──────────┬───────────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────────────────────┐
        │  Set projectFiles state                  │
        │  [{ id, type, url, created_at, ... }]    │
        └──────────┬───────────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────────────────────┐
        │  Render Calendar                         │
        │  getFileCountForDate(date)                │
        │  Shows badges with counts                │
        └──────────┬───────────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────────────────────┐
        │  User Clicks Date 25                     │
        │  setSelectedFileDate(cellDate)            │
        └──────────┬───────────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────────────────────┐
        │  Filter Files                            │
        │  Match: type + date (YYYY-MM-DD)         │
        │  filtered = projectFiles.filter(...)     │
        └──────────┬───────────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────────────────────┐
        │  Display Files                           │
        │  Media: 3-column grid                    │
        │  Voice: Vertical list                    │
        │  Show date banner: "Sat, Jan 25, 2026"   │
        └──────────┬───────────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────────────────────┐
        │  User Clicks X (Clear)                   │
        │  setSelectedFileDate(null)                │
        │  Show all files again                    │
        └──────────────────────────────────────────┘
```

---

## 🗂️ Component Hierarchy

```
AdminDashboardScreen
├── Project Tabs (Tasks, Transactions, Materials, Files)
│   └── Files Tab
│       ├── File Type Tabs (Media, Voice)
│       │   └── Tab Selector Buttons
│       │
│       ├── Calendar Picker
│       │   ├── Month Header
│       │   │   ├── Previous Button
│       │   │   ├── Month/Year Display
│       │   │   └── Next Button
│       │   │
│       │   ├── Day Headers (Sun-Sat)
│       │   │
│       │   └── Calendar Grid
│       │       ├── Empty Cells (prev month)
│       │       └── Day Cells
│       │           ├── Day Number
│       │           └── File Count Badge (if > 0)
│       │
│       ├── Selected Date Banner (conditional)
│       │   ├── Calendar Icon (📅)
│       │   ├── Date Text
│       │   └── Clear Button (X)
│       │
│       └── Files Display
│           ├── Media Tab
│           │   └── Grid Layout (3 columns)
│           │       └── Image/Video Items
│           │
│           └── Voice Tab
│               └── List Layout
│                   └── Audio Items
```

---

## 📋 State Management Map

```
AdminDashboardScreen State
│
├── Project Management
│   ├── activeProjectTab        → "Files"
│   ├── selectedSite            → { id, name, ... }
│   └── selectedSiteId          → number
│
├── Files Management
│   ├── projectFiles            → Array of file objects
│   ├── fileLoading             → boolean
│   ├── activeFileTab           → "Media" | "Voice"
│   │
│   ├── Calendar State
│   │   ├── currentMonth        → Date object
│   │   └── selectedFileDate    → Date | null
│   │
│   └── Helper Functions
│       ├── getFilesGroupedByDate()
│       ├── getFileCountForDate(date)
│       ├── getDaysInMonth(date)
│       └── getFirstDayOfMonth(date)
│
└── Rendering Logic
    └── Filter + Display Files
        ├── By type (Media/Voice)
        ├── By date (if selected)
        └── Group by date (if not selected)
```

---

## 🔌 API Integration Flow

```
Frontend Request Chain
│
├── Component Mounts/Updates
│   └── useEffect with dependencies
│
├── API Call
│   ├── GET /api/sites/{siteId}/files  (all files)
│   │   └── Response: { files: [...] }
│   │
│   ├── Optional: GET /api/files/calendar?month=YYYY-MM
│   │   └── Response: { dates: [...] }
│   │
│   └── Optional: GET /api/files/by-date?date=YYYY-MM-DD
│       └── Response: { files: [...], grouped: {...} }
│
├── State Update
│   └── setProjectFiles(response.data.files)
│
├── Rendering
│   ├── Calculate file counts
│   ├── Filter by type
│   ├── Filter by date (if selected)
│   └── Render UI
│
└── User Interaction
    ├── Click date → setSelectedFileDate()
    ├── Click tab → setActiveFileTab()
    ├── Click X → setSelectedFileDate(null)
    └── Cycle repeats
```

---

## 🛠️ Technology Stack Map

```
FRONTEND LAYER
├── React Native / React
│   └── TypeScript
│       └── React Hooks (useState, useCallback, useEffect)
│           └── Axios API Client
│               └── Custom Hook: useFilesAPI
│
MIDDLEWARE LAYER
├── API Service (api.ts)
│   ├── Base URL Configuration
│   ├── Axios Instance
│   ├── Interceptors (Auth tokens)
│   └── Error Handling
│
BACKEND LAYER
├── Express.js Server
│   ├── Routes (filesRoutes.js)
│   │   ├── GET /calendar
│   │   ├── GET /by-date
│   │   ├── GET /preview
│   │   ├── GET /search
│   │   ├── GET /stats
│   │   └── DELETE /:id
│   │
│   ├── Controllers (filesController.js)
│   │   ├── Query Building
│   │   ├── Data Transformation
│   │   └── Error Handling
│   │
│   └── Middleware
│       ├── verifyToken (Authentication)
│       ├── cors (Cross-origin)
│       └── express.json (Body parsing)
│
DATABASE LAYER
└── MySQL
    ├── task_messages (Primary table)
    ├── tasks (Foreign key)
    ├── phases (Foreign key)
    ├── employees (Foreign key)
    └── sites (Foreign key)
```

---

## 📊 Query Execution Map

```
User Selects Date 25
    ↓
JavaScript:
  setSelectedFileDate(new Date(2026, 0, 25))
    ↓
Rendering:
  const filtered = projectFiles.filter((f) => {
    // Type filter
    const typeMatch = (f.type === "image" || f.type === "video")
    
    // Date filter
    const dateMatch = new Date(f.created_at)
                      .toISOString()
                      .split("T")[0] === "2026-01-25"
    
    return typeMatch && dateMatch
  })
    ↓
File Count Calculation:
  const fileCount = filtered.length
    ↓
Display Update:
  ├── Show banner: "Selected Date: Sat, Jan 25, 2026"
  ├── Update calendar: Selected date = dark red
  ├── Update badge count: Shows filtered count
  └── Render files: Grid/List with filtered results
```

---

## 🎯 Feature Implementation Map

```
CALENDAR FEATURE
├── Layout
│   ├── 7-column grid (Sun-Sat)
│   ├── 6 rows (weeks)
│   └── Dynamic content (1-31 dates)
│
├── Navigation
│   ├── Previous month (click < button)
│   ├── Next month (click > button)
│   └── Update currentMonth state
│
├── Display Logic
│   ├── getFirstDayOfMonth() → Empty cells
│   ├── getDaysInMonth() → Full calendar
│   ├── getFileCountForDate() → Badges
│   └── Visual indicators → Colors/backgrounds
│
└── Interaction
    ├── Tap date → setSelectedFileDate()
    ├── Show banner → "Selected Date: ..."
    └── Filter files → Match selected date

FILES DISPLAY FEATURE
├── Tab System
│   ├── Media Tab → Images/Videos
│   └── Voice Tab → Audio files
│
├── Media Layout
│   ├── 3-column grid
│   ├── Thumbnail display
│   └── Video icon overlay
│
├── Voice Layout
│   ├── Vertical list
│   ├── Icon + filename
│   └── Metadata display
│
├── Date Grouping
│   ├── "TODAY"
│   ├── "YESTERDAY"
│   └── "Full Date"
│
└── State Handling
    ├── Loading spinner
    ├── Empty state message
    └── Error display

FILTERING FEATURE
├── Type Filter
│   ├── Media: image OR video
│   └── Voice: audio
│
├── Date Filter
│   ├── If selectedFileDate == null → Show all
│   └── If selectedFileDate != null → Match date only
│
└── Combined Logic
    └── Type AND (Date OR All)
```

---

## 🔐 Security Architecture

```
REQUEST FLOW
│
├── Frontend
│   └── Axios adds Authorization header
│       └── Bearer {token}
│
├── Express Middleware
│   └── verifyToken()
│       ├── Decode JWT
│       ├── Validate signature
│       └── Attach user to req
│
├── Route Handler
│   └── Check authentication
│       └── Allow or deny request
│
├── Controller
│   ├── Parameterized SQL queries
│   ├── Input validation
│   └── Site-level filtering
│
└── Database
    └── Execute safe queries
```

---

## 📈 Performance Optimization Map

```
QUERY OPTIMIZATION
├── Use indexes on:
│   ├── created_at (date filtering)
│   ├── type (file type filtering)
│   ├── site_id (site filtering)
│   └── sender_id (user filtering)
│
├── SQL techniques:
│   ├── GROUP BY for aggregation
│   ├── LEFT JOIN for relationships
│   ├── WHERE for filtering
│   └── LIMIT for pagination
│
└── Results:
    └── Fast calendar rendering
    └── Quick date selection
    └── Smooth file display

FRONTEND OPTIMIZATION
├── Memoization:
│   ├── useCallback for functions
│   └── useMemo for computed values
│
├── Lazy loading:
│   ├── Load files on demand
│   └── Paginate file lists
│
└── Results:
    └── Smooth interactions
    └── No lag on tab switch
    └── Responsive calendar

CACHING
├── Frontend:
│   ├── Keep projectFiles in state
│   └── Filter client-side
│
├── Optional:
│   ├── Cache calendar data
│   └── Cache frequently accessed dates
│
└── Benefits:
    └── Reduce API calls
    └── Faster navigation
```

---

## 🚀 Deployment Architecture

```
PRODUCTION DEPLOYMENT
│
├── Frontend
│   ├── Build: npm run build
│   ├── Bundle: Webpack/Babel
│   ├── Deploy: Static hosting
│   └── URL: admin.example.com
│
├── Backend
│   ├── Build: node index.js
│   ├── Container: Docker (optional)
│   ├── Deploy: Cloud server/VM
│   ├── Port: 5000
│   └── URL: api.example.com
│
├── Database
│   ├── Host: Cloud database or local
│   ├── Engine: MySQL 5.7+
│   ├── Backups: Daily automated
│   └── Replication: (optional)
│
└── Monitoring
    ├── Frontend: Error tracking
    ├── Backend: Log aggregation
    ├── Database: Performance monitoring
    └── Uptime: Health checks
```

---

**Architecture Diagram Version**: 1.0  
**Last Updated**: January 25, 2026  
**Status**: Complete ✅

