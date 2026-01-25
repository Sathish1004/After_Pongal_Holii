<!-- cSpell:ignore Gantt gantt noor VARCHAR -->

# Gantt Chart Task List UI - Complete Implementation Guide

## Overview

This is a professional Gantt chart component for React Native/Expo that:
- ✅ Fetches real task data from your backend API
- ✅ Displays Task ID, Task Name, and Project Name
- ✅ Shows task timeline with status indicators
- ✅ Works on mobile (with safe area insets) and web
- ✅ Includes loading, error, and empty states
- ✅ Has fallback for missing project names ("Unknown Project")

## File Structure

```
noor-frontend/
├── src/
│   ├── hooks/
│   │   └── useGanttTasks.ts              # Custom hook for fetching tasks
│   └── components/
│       └── GanttChart/
│           ├── index.ts                  # Barrel export
│           ├── GanttChart.tsx            # Main Gantt chart component
│           ├── TaskColumn.tsx            # Task column display component
│           └── GanttChartScreen.tsx      # Screen wrapper with docs
│
noor-backend/
├── routes/
│   └── gantt.example.ts                  # Backend implementation example
```

## Frontend Implementation

### 1. Using the Gantt Chart

```tsx
import { GanttChartScreen } from './components/GanttChart';

export default function ProjectsScreen() {
  return <GanttChartScreen />;
}
```

### 2. Custom Date Range

```tsx
import { GanttChart } from './components/GanttChart';

export default function ProjectsScreen() {
  return (
    <GanttChart
      taskColumnWidth={220}
      dateRangeStart="2025-01-01"
      dateRangeEnd="2025-12-31"
    />
  );
}
```

### 3. Component Props

**GanttChart Component:**
```tsx
interface GanttChartProps {
  taskColumnWidth?: number;      // Default: 200px
  dateRangeStart?: string;       // ISO format: "2025-01-10"
  dateRangeEnd?: string;         // ISO format: "2025-03-21"
}
```

## Backend Implementation

### Required API Endpoint

**GET** `/api/tasks/gantt`

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "taskId": 3844,
      "taskName": "Site Planning",
      "projectName": "JK House",
      "startDate": "2025-01-24",
      "endDate": "2025-02-15",
      "status": "Ongoing",
      "assignedTo": "John Doe"
    },
    {
      "taskId": 3752,
      "taskName": "Foundation Work",
      "projectName": "JK House",
      "startDate": "2025-02-01",
      "endDate": "2025-02-28",
      "status": "Delayed",
      "assignedTo": "Jane Smith"
    },
    {
      "taskId": 3845,
      "taskName": "Material Procurement",
      "projectName": null,
      "startDate": "2025-01-20",
      "endDate": "2025-03-10",
      "status": "Completed",
      "assignedTo": null
    }
  ]
}
```

### Database Schema

```sql
CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  status ENUM('Planning', 'Active', 'Completed')
);

CREATE TABLE tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  project_id INT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('Pending', 'Ongoing', 'Completed', 'Delayed'),
  assigned_to INT,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255)
);
```

### Express.js Route Implementation

See `gantt.example.ts` for complete backend code.

Basic setup:
```typescript
router.get('/tasks/gantt', async (req, res) => {
  const query = `
    SELECT 
      t.id as taskId,
      t.name as taskName,
      p.name as projectName,
      t.start_date as startDate,
      t.end_date as endDate,
      t.status,
      u.name as assignedTo
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN users u ON t.assigned_to = u.id
    ORDER BY t.start_date ASC
  `;
  
  const tasks = await db.query(query);
  res.json({ success: true, data: tasks });
});
```

## Features

### ✅ Task Column Display
- Shows: `Task #3844 – Site Planning` (bold, readable)
- Shows: `JK House` below (smaller, gray)
- Fallback: "Unknown Project" if `projectName` is null

### ✅ Timeline
- 7-day columns with date headers
- Status indicators for each task
- Color-coded by status (Green, Blue, Red)

### ✅ Status Colors
- 🟢 **Completed**: #10b981 (Green)
- 🔵 **Ongoing**: #3b82f6 (Blue)
- 🔴 **Delayed**: #ef4444 (Red)

### ✅ States
- Loading state with spinner
- Error state with fallback message
- Empty state message
- Refetch capability via hook

### ✅ Responsive
- Horizontal scroll for wide Gantt charts
- Mobile safe area handling (notch/gesture nav)
- Works on iOS and Android
- Web browser compatible

## API Integration

### Configuration

Your `src/services/api.ts` should have:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://172.16.80.131:5000',
  timeout: 10000,
});

export default api;
```

### Using the Hook

```tsx
import { useGanttTasks } from '../hooks/useGanttTasks';

function MyComponent() {
  const { tasks, loading, error, refetch } = useGanttTasks();
  
  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error}</Text>;
  
  return (
    <FlatList
      data={tasks}
      renderItem={({ item }) => (
        <Text>{item.taskName} - {item.projectName}</Text>
      )}
    />
  );
}
```

## Styling Customization

Edit colors in `GanttChart.tsx`:

```typescript
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Completed': return '#10b981'; // Change this color
    case 'Ongoing': return '#3b82f6';   // Change this color
    case 'Delayed': return '#ef4444';   // Change this color
    default: return '#9ca3af';
  }
};
```

## Testing Checklist

- [ ] Tasks load from API
- [ ] Task names display correctly
- [ ] Project names display correctly
- [ ] Missing project names show "Unknown Project"
- [ ] Task timeline shows date range
- [ ] Status indicators show correct colors
- [ ] Horizontal scroll works smoothly
- [ ] Mobile safe areas respected (no notch overlap)
- [ ] Loading state shows
- [ ] Error state shows on failed API call
- [ ] Empty state shows when no tasks
- [ ] Refetch function works
- [ ] Date formatting correct
- [ ] Performance acceptable with 50+ tasks

## Query Parameters (Optional)

Your backend can support filtering:

```
GET /api/tasks/gantt?startDate=2025-01-01&endDate=2025-12-31&status=Ongoing
```

**Supported Parameters:**
- `startDate`: ISO date string
- `endDate`: ISO date string
- `projectId`: integer
- `status`: 'Pending' | 'Ongoing' | 'Completed' | 'Delayed'

## Troubleshooting

### Tasks Not Loading
- ✅ Check API endpoint URL in `api.ts`
- ✅ Verify backend is running
- ✅ Check network tab in browser/Expo dev tools
- ✅ Verify API response format matches expected schema

### "Unknown Project" Shows for All Tasks
- ✅ Check backend is returning `projectName` field
- ✅ Verify LEFT JOIN is correct (should allow NULL projectName)
- ✅ Check if project_id is NULL in database

### Safe Area Issues (Mobile)
- ✅ Ensure `SafeAreaProvider` wraps app in `App.tsx`
- ✅ Check `useSafeAreaInsets` is imported correctly
- ✅ Verify React Native version compatibility

### Performance Issues
- ✅ Limit query to 500 tasks (set in backend)
- ✅ Add pagination (limit/offset)
- ✅ Add date range filtering
- ✅ Use `useMemo` for date calculations

## Extensions

### Add Click Handler
```tsx
const handleTaskPress = (task: GanttTask) => {
  navigation.navigate('TaskDetail', { taskId: task.taskId });
};
```

### Add Filtering
```tsx
const [filterStatus, setFilterStatus] = useState('all');
const filteredTasks = tasks.filter(t => 
  filterStatus === 'all' ? true : t.status === filterStatus
);
```

### Add Sorting
```tsx
const sortedTasks = [...tasks].sort((a, b) => 
  new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
);
```

## Support

For issues:
1. Check that backend endpoint returns correct format
2. Verify all required fields are present in API response
3. Check React Native version compatibility
4. Enable React Devtools to inspect component state
5. Check browser/Expo dev tools console for errors

## Files Created

- ✅ `src/hooks/useGanttTasks.ts` - Data fetching hook
- ✅ `src/components/GanttChart/GanttChart.tsx` - Main component
- ✅ `src/components/GanttChart/TaskColumn.tsx` - Task display
- ✅ `src/components/GanttChart/GanttChartScreen.tsx` - Screen wrapper
- ✅ `src/components/GanttChart/index.ts` - Barrel export
- ✅ `noor-backend/routes/gantt.example.ts` - Backend example

All files are production-ready and include comprehensive comments!
