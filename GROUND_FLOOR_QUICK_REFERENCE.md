# Ground Floor Assignment - Quick Reference

## Implementation Status: ✅ COMPLETE

### What Changed?

When a **new project is created**, all 14 default construction stages automatically get:
```
stage.floor_name = "Ground Floor"
```

### Three Scenarios

#### 1️⃣ **NEW PROJECT CREATION** ✅ Gets "Ground Floor"
```
Admin creates new project → system loads CONSTRUCTION_TEMPLATE
  ↓
All 14 stages created with floorName: "Ground Floor"
  ↓
Database: floor_name = "Ground Floor" for all 14 stages
  ↓
Display: [ Ground Floor ] shown on each stage
```

**Code Path:**
- Frontend → `POST /api/createSite`
- Backend → `siteController.createSite()`
- Loads → `construction-template.js` (all with `floorName: "Ground Floor"`)
- Inserts → 14 phases with `floor_name = "Ground Floor"`

---

#### 2️⃣ **MANUAL STAGE ADDITION** ❌ NO default
```
Admin clicks "Add Stage" button → enters custom stage details
  ↓
Admin may or may not specify floor name
  ↓
Database: floor_name = whatever admin provided (or NULL if omitted)
  ↓
Display: Shows whatever is in the floor_name field
```

**Code Path:**
- Frontend → `POST /api/phases`
- Backend → `siteController.addPhase()`
- Takes → `const fName = floorName || null;` (NO default to "Ground Floor")
- Inserts → Custom stage with exact floor value provided

---

#### 3️⃣ **EDITING EXISTING STAGE** ❌ NO auto-changes
```
Admin clicks edit on any stage → modifies floor name
  ↓
Admin submits changes
  ↓
Database: floor_name updated to admin's new value
  ↓
Display: Shows new floor name
```

**Code Path:**
- Frontend → `PUT /api/phases/:id`
- Backend → `siteController.updatePhase()`
- Updates → Only what admin submits, no defaults applied

---

## Code Changes Summary

### 1. Construction Template (14 Stages)
```javascript
// BEFORE
{
    serialNumber: 1,
    floorName: "",  // ❌ Empty
    stageName: "Initial Planning & Site Preparation",
    ...
}

// AFTER  
{
    serialNumber: 1,
    floorName: "Ground Floor",  // ✅ Set
    stageName: "Initial Planning & Site Preparation",
    ...
}
```
Applied to ALL 14 stages in `construction-template.js`

---

### 2. Database Schema Check
```javascript
// ADDED to index.js checkSchema()
try {
    await db.query("SELECT floor_name FROM phases LIMIT 1");
} catch (error) {
    if (error.code === 'ER_BAD_FIELD_ERROR') {
        await db.query("ALTER TABLE phases ADD COLUMN floor_name VARCHAR(255) DEFAULT 'Ground Floor'");
    }
}
```

---

### 3. Manual Stage Addition (Fixed)
```javascript
// BEFORE
const fName = floorName || "Ground Floor";  // ❌ Always defaults

// AFTER
const fName = floorName || null;  // ✅ No default
```
In `siteController.js` → `addPhase()` function

---

## Expected Database State

### After Creating New Project
```sql
SELECT id, order_num, name, floor_name FROM phases 
WHERE site_id = 42 
ORDER BY order_num;

Results:
┌────┬───────────┬──────────────────────────────────┬────────────────┐
│ id │ order_num │ name                             │ floor_name     │
├────┼───────────┼──────────────────────────────────┼────────────────┤
│ 1  │ 1         │ Initial Planning & Site Prep     │ Ground Floor   │
│ 2  │ 2         │ Basement / Foundation Const      │ Ground Floor   │
│ 3  │ 3         │ Lintel Level Construction        │ Ground Floor   │
│ 4  │ 4         │ Roof Level Construction          │ Ground Floor   │
│ 5  │ 5         │ Wall & Finishing Works           │ Ground Floor   │
│ 6  │ 6         │ Compound Wall Construction       │ Ground Floor   │
│ 7  │ 7         │ Electrical & Plumbing Rough-In   │ Ground Floor   │
│ 8  │ 8         │ Plumbing Finishes                │ Ground Floor   │
│ 9  │ 9         │ Electrical Finishes              │ Ground Floor   │
│ 10 │ 10        │ Painting                         │ Ground Floor   │
│ 11 │ 11        │ Tiles Work                       │ Ground Floor   │
│ 12 │ 12        │ Granite & Staircase Work         │ Ground Floor   │
│ 13 │ 13        │ Carpentry Finishes               │ Ground Floor   │
│ 14 │ 14        │ Optional Extras                  │ Ground Floor   │
└────┴───────────┴──────────────────────────────────┴────────────────┘
```

✅ All 14 stages have `floor_name = "Ground Floor"`

---

### After Manually Adding Stage (Without Floor)
```sql
-- Admin adds custom stage without specifying floor
SELECT floor_name FROM phases WHERE id = 150;

Result:
┌────────────┐
│ floor_name │
├────────────┤
│ NULL       │  ✅ NO auto-default
└────────────┘
```

---

## Files Modified

| File | What | Line(s) |
|------|------|---------|
| `construction-template.js` | All 14 stages: `floorName: ""` → `"Ground Floor"` | 1, 19, 43, 62, 86, 108, 126, 145, 165, 182, 201, 214, 227, 240 |
| `index.js` | Added schema check for phases.floor_name | +12 |
| `siteController.js` | Changed `addPhase()` default from `|| "Ground Floor"` to `|| null` | 272 |

---

## How to Test

### Test 1: New Project Gets "Ground Floor"
```
1. Go to Admin Dashboard
2. Click "Create New Project"
3. Fill details, submit
4. View project → click any stage
5. ✅ Should show [ Ground Floor ] label
```

### Test 2: Manual Add Doesn't Get "Ground Floor"
```
1. Go to existing project
2. Click "Add Stage"
3. Enter name only (leave Floor blank)
4. Click Save
5. ✅ Floor field should be empty (not "Ground Floor")
```

### Test 3: Admin Can Edit Floor
```
1. Click any stage → Edit
2. Change floor to "1st Floor"
3. Save
4. ✅ Should now display "1st Floor" (not "Ground Floor")
```

---

## Notes

- Server restart automatically adds `floor_name` column if missing
- Backward compatible; existing projects unchanged
- No data migration needed
- Works with all 14 default construction phases
- Manual stages respect admin's exact input

