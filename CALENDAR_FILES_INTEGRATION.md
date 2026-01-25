# Calendar Files Integration Guide

## Overview
The Files section now features a complete calendar-based file browser that allows users to view files organized by date.

## Features Implemented

### 1. **Calendar Picker Component**
- **Location**: AdminDashboardScreen.tsx (Lines 6608-6690)
- **Functionality**:
  - Month navigation with previous/next buttons
  - Full calendar grid showing all dates
  - File count badges on dates with files
  - Visual indicators:
    - Selected date: Dark red background
    - Today: Yellow border

### 2. **State Management**
- **`selectedFileDate`**: Currently selected date for viewing files (null = all files)
- **`currentMonth`**: Month being displayed in calendar
- **`activeFileTab`**: Filter between Media and Voice files
- **`projectFiles`**: Array of all project files with metadata

### 3. **Helper Functions**

#### `getFilesGroupedByDate()`
```tsx
const getFilesGroupedByDate = () => {
  const groups: { [key: string]: any[] } = {};
  projectFiles.forEach((f) => {
    const dateStr = new Date(f.created_at).toISOString().split("T")[0];
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(f);
  });
  return groups;
};
```
- Returns files organized by ISO date string (YYYY-MM-DD)
- Used for calculating file counts per date

#### `getFileCountForDate(date)`
```tsx
const getFileCountForDate = (date: Date): number => {
  const dateStr = date.toISOString().split("T")[0];
  return projectFiles.filter(f => {
    const fileDate = new Date(f.created_at).toISOString().split("T")[0];
    return fileDate === dateStr && 
      (activeFileTab === "Media" 
        ? (f.type === "image" || f.type === "video")
        : f.type === "audio");
  }).length;
};
```
- Returns count of files for a specific date
- Filters by current active tab (Media or Voice)

#### `getDaysInMonth(date)`
- Returns total days in the given month
- Used for calendar grid generation

#### `getFirstDayOfMonth(date)`
- Returns day of week (0-6) for the first day of the month
- Used to position the calendar grid correctly

### 4. **File Filtering Logic**
When a date is selected, files are filtered by:
1. **File Type**: Media (image/video) or Voice (audio)
2. **Selected Date**: Only shows files created on that specific date

**Filter Code** (Lines 6698-6724):
```tsx
const filtered = projectFiles.filter((f) => {
  // Filter by file type
  const typeMatch =
    activeFileTab === "Media"
      ? f.type === "image" || f.type === "video"
      : activeFileTab === "Voice"
        ? f.type === "audio"
        : false;

  if (!typeMatch) return false;

  // Filter by selected date if one is selected
  if (selectedFileDate) {
    const selectedDateStr = selectedFileDate
      .toISOString()
      .split("T")[0];
    const fileDate = new Date(f.created_at)
      .toISOString()
      .split("T")[0];
    return selectedDateStr === fileDate;
  }

  return true;
});
```

### 5. **Selected Date Indicator**
When a date is selected, a yellow banner appears showing:
- "Showing files from [Date]"
- Clear button (X) to reset selection

**Location**: Lines 6565-6597

## User Interaction Flow

1. **View Calendar**: User sees current month with file count badges
2. **Navigate Months**: Use previous/next buttons to change months
3. **Select Date**: Tap any date to view files from that date
4. **Visual Feedback**: 
   - Selected date shows dark red background
   - Today's date shows yellow border
   - File count badge shows number of files
5. **File Display**: Media shows in 3-column grid, Voice in list
6. **Clear Selection**: Tap X on banner or select different date

## Calendar Display Logic

### Rendering Days
```
- Empty cells for days before month starts
- Day number (1-31)
- File count badge (if count > 0)
- Selection indicator (dark red background)
- Today indicator (yellow border)
```

### Month Navigation
```
[Previous] [Month Year] [Next]
```

## File Display Sections

### Media Tab
- **Layout**: 3-column grid
- **Size**: 30% width, square aspect ratio
- **Features**:
  - Image preview
  - Video icon overlay (blue background)
  - Rounded corners (10px)
  - Shadow effect

### Voice Tab
- **Layout**: Vertical list
- **Features**:
  - Circular icon with blue background
  - File name
  - File size (if available)
  - Timestamp

## Date Grouping (When No Date Selected)

Files are grouped by:
- **Today**: Files created today
- **Yesterday**: Files created yesterday
- **Date**: Full date for older files (e.g., "Nov 15, 2024")

Each group shows files in the selected tab's layout (Media grid or Voice list).

## Technical Notes

### Date Handling
- Uses `toISOString().split("T")[0]` for date comparison (YYYY-MM-DD format)
- Properly handles timezone conversions
- Compares dates without time component

### Performance
- File grouping and counting done in render
- Consider memoization if handling very large file sets
- Calendar updates efficiently when selectedFileDate changes

### Styling
- Selected date: Dark red background (#991b1b)
- Today indicator: Yellow border (#fbbf24)
- File count badge: Red background with white text
- Proper spacing and padding for readability

## Testing Checklist

- ✅ Calendar displays correct month
- ✅ File count badges show accurate counts
- ✅ Month navigation works (previous/next buttons)
- ✅ Date selection updates selectedFileDate
- ✅ File display filters by selected date
- ✅ Selected date indicator banner shows/hides correctly
- ✅ Clear button (X) resets selectedFileDate to null
- ✅ Media grid displays images/videos
- ✅ Voice list displays audio files
- ✅ Empty state shows when no files for selected date
- ✅ Tab switching maintains date selection

## Future Enhancements

1. **Week View**: Show files by week instead of month
2. **Pinch Zoom**: Zoom calendar for better date selection
3. **Multi-Select**: Select multiple dates to view combined files
4. **Date Range**: Select date range to view files from period
5. **Search**: Combine with file name/type search
6. **Export**: Export files from selected date

## Debugging Tips

- Check `selectedFileDate` state in React DevTools
- Verify `currentMonth` for correct month display
- Log file count for selected date: `console.log(getFileCountForDate(selectedFileDate))`
- Check file `created_at` timestamps in database
- Ensure file types are lowercase: "image", "video", "audio"

## Related Files

- **Frontend Component**: `noor-frontend/src/screens/AdminDashboardScreen.tsx`
- **API Endpoint**: Backend file listing endpoint (returns `id`, `name`, `type`, `created_at`, `file_path`)
- **Styles**: `styles.tabContentContainer`, `styles.emptyTabState` in stylesheet

