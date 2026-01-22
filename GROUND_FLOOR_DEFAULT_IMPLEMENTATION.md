# Ground Floor Default Assignment - Implementation Complete

## Summary
All 14 default construction stages now automatically assigned `floor = "Ground Floor"` when a **new project is created**. This applies ONLY to template-based project creation and does NOT affect manual stage additions or edits.

---

## Changes Made

### 1. **Construction Template** (`noor-backend/templates/construction-template.js`)
- Updated all 14 stages to include `floorName: "Ground Floor"`
- Each stage in `CONSTRUCTION_TEMPLATE` now has this property set

**Example:**
```javascript
{
    serialNumber: 1,
    floorNumber: 0,
    floorName: "Ground Floor",  // ✅ ADDED
    stageName: "Initial Planning & Site Preparation",
    tasks: [...]
}
```

**Affected Stages:**
1. Initial Planning & Site Preparation
2. Basement / Foundation Construction
3. Lintel Level Construction
4. Roof Level Construction
5. Wall & Finishing Works
6. Compound Wall Construction
7. Electrical & Plumbing Rough-In
8. Plumbing Finishes
9. Electrical Finishes
10. Painting
11. Tiles Work
12. Granite & Staircase Work
13. Carpentry Finishes
14. Optional Extras

---

### 2. **Database Schema** (`noor-backend/index.js`)
Added automatic schema check for `floor_name` column in `phases` table:

```javascript
// Check phases table for floor_name column
try {
    await db.query("SELECT floor_name FROM phases LIMIT 1");
} catch (error) {
    if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log("Adding missing column 'floor_name' to phases table...");
        await db.query("ALTER TABLE phases ADD COLUMN floor_name VARCHAR(255) DEFAULT 'Ground Floor'");
        console.log("Column 'floor_name' added successfully.");
    }
}
```

**Behavior:**
- Runs automatically on server startup
- Adds `floor_name` column if it doesn't exist
- Sets DEFAULT value to `'Ground Floor'`
- No manual migration required

---

### 3. **Project Creation Flow** (`noor-backend/controllers/siteController.js` - `createSite`)
✅ **Already Correct** - No changes needed

The `createSite` function already correctly uses the template:

```javascript
const [phaseResult] = await db.query(
    `INSERT INTO phases (
        site_id, name, order_num, budget, 
        floor_number, floor_name
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
        siteId,
        phaseTemplate.stageName,
        phaseTemplate.serialNumber,
        0,                           // Default budget
        phaseTemplate.floorNumber,   // = 0
        phaseTemplate.floorName      // = "Ground Floor" ✅
    ]
);
```

---

### 4. **Manual Stage Addition** (`noor-backend/controllers/siteController.js` - `addPhase`)
✅ **Fixed** - Removed automatic "Ground Floor" default

**Before:**
```javascript
const fName = floorName || "Ground Floor";  // ❌ ALWAYS defaulted to Ground Floor
```

**After:**
```javascript
// When manually adding a stage, use the exact floor name provided (no default)
const fName = floorName || null;  // ✅ NO default for manual adds
```

**Behavior:**
- When admin manually adds a new stage, the `floor_name` field is respected exactly as provided
- If no floor name provided, it remains NULL (not auto-filled)
- Admin can later update the floor via the `updatePhase` endpoint

---

## Verification

### ✅ Rule 1: Default applies ONLY during new project creation
- Template stages use `floorName: "Ground Floor"` 
- `createSite` loads from template and applies the floor
- Manual `addPhase` has NO default

### ✅ Rule 2: All 14 stages show [ Ground Floor ]
- Construction template updated: All 14 entries have `floorName: "Ground Floor"`
- Database inserts all values correctly

### ✅ Rule 3: Admin can later edit/remove floor
- `updatePhase` endpoint (line 310+) accepts `floorName` parameter
- Admin can change or clear the floor value via API

### ✅ Rule 4: Does NOT apply when adding manually
- `addPhase` endpoint now has `const fName = floorName || null`
- Manual stage additions do NOT get "Ground Floor" auto-assigned

### ✅ Rule 5: Does NOT apply when editing existing stage
- `updatePhase` endpoint respects admin input exactly
- No auto-defaults applied

---

## Testing Checklist

To verify the implementation works:

1. **Create New Project**
   - Go to Admin Dashboard → Create New Project
   - Check that all 14 stages appear with "Ground Floor" label
   - Database: Verify `phases.floor_name = "Ground Floor"` for all 14 stages

2. **Add Manual Stage to Existing Project**
   - Go to existing project → Add Stage
   - Do NOT specify a floor name
   - Verify database: `phases.floor_name = NULL` (not "Ground Floor")

3. **Edit Existing Stage Floor**
   - Click on any stage → Edit
   - Change the floor name to something else (e.g., "1st Floor")
   - Verify the change persists and displays correctly

4. **Database Verification**
   ```sql
   -- Check all stages in a newly created project
   SELECT id, name, floor_name FROM phases WHERE site_id = ? ORDER BY order_num;
   
   -- Expected: All rows should have floor_name = "Ground Floor"
   ```

---

## API Response Example

### Create New Project (POST `/api/createSite`)
```json
{
  "site": {
    "id": 42,
    "name": "Test Project",
    ...
  },
  "message": "Project created with complete construction workflow"
}
```

**Database Result (New Project):**
```
| id  | site_id | name                              | floor_name     |
|-----|---------|-----------------------------------|----------------|
| 120 | 42      | Initial Planning & Site Prep      | Ground Floor   |
| 121 | 42      | Basement / Foundation Const       | Ground Floor   |
| 122 | 42      | Lintel Level Construction         | Ground Floor   |
| ...
```

### Add Stage Manually (POST `/api/phases`)
```json
{
  "siteId": 42,
  "name": "Custom Stage",
  "serialNumber": 3,
  "floorName": null  // Or omitted from request
}
```

**Database Result (Manual Add):**
```
| id  | site_id | name          | floor_name |
|-----|---------|---------------|------------|
| 150 | 42      | Custom Stage  | NULL       |  ✅ No auto-default
```

---

## Files Modified

| File | Change | Lines |
|------|--------|-------|
| `noor-backend/templates/construction-template.js` | Updated all 14 stages: `floorName: ""` → `floorName: "Ground Floor"` | All 14 entries |
| `noor-backend/index.js` | Added schema check for `floor_name` column in phases table | +12 lines |
| `noor-backend/controllers/siteController.js` | Removed "Ground Floor" default in `addPhase` endpoint | Line 272 |

---

## Rollback Instructions (if needed)

If changes need to be reverted:

1. **Construction Template:**
   - Change all `floorName: "Ground Floor"` back to `floorName: ""`

2. **siteController.js:**
   - Change `const fName = floorName || null;` back to `const fName = floorName || "Ground Floor";`

3. **index.js:**
   - Remove the phases table floor_name check (lines 75-86)

---

## Notes

- The `floor_number` field (used for ordering) remains `0` for all template stages
- The `floor_name` field is purely for display/organizational purposes
- No migration script needed; schema auto-updates on server startup
- This feature is backward compatible; existing projects are unaffected

