# Admin Phase Management - Quick Reference

## Creating a New Phase

### Step 1: Open the Add Phase Modal
- Navigate to Admin Dashboard
- Select a project site
- Click the "Add Phase" or "Create Phase" button

### Step 2: Enter Phase Name
- Type the exact phase name you want
- Examples:
  - `Foundation Work`
  - `Framing and Walls`
  - `Electrical Installation`
  - `Painting and Finishing`

### Step 3: Confirm Creation
- Click "Create Phase" button
- Wait for confirmation toast message

### Step 4: View Your Phase
- Phase appears in the project phases list
- Ready to add tasks/items to it

---

## Important Rules

### ✅ What WILL Happen
- Your exact phase name is created
- Phase assigned next sequential number
- Phase marked as "Custom"
- Modal closes and resets
- Project data refreshes

### ❌ What WILL NOT Happen
- Auto-generation of default tasks
- Auto-mapping to other phases
- Template injection
- Floor-based grouping
- Overriding your input

---

## Example Scenarios

### Scenario 1: Create Single Custom Phase
```
Input: "My Custom Phase"
Result: Phase created with exact name
        No auto-tasks added
        Ready for manual task addition
```

### Scenario 2: Multiple Phases in Sequence
```
Phase 1: "Foundation" → Created ✅
Phase 2: "Framing" → Created ✅
Phase 3: "Electrical" → Created ✅

Serial Numbers: Auto-assigned (1, 2, 3...)
No conflicts or overwrites
```

### Scenario 3: Duplicate Prevention
```
Phase 1: "Foundation" → Created ✅
Phase 2: "Foundation" → ERROR ❌
         (Duplicate name not allowed)
```

---

## Troubleshooting

### Problem: Phase not created
- Check if name is empty
- Check if phase name already exists
- Check if site is selected
- See console logs for details

### Problem: Duplicate error
- Phase with similar name already exists
- Try adding suffix: "Foundation (Floor 1)"
- Or use completely different name

### Problem: Data not refreshing
- Wait a few seconds
- Refresh project details manually
- Check network connection
- Check browser console for errors

---

## FAQ

**Q: Can I add sub-phases under a phase?**
A: Currently, phases are top-level. You can add tasks to them.

**Q: Can I rename a phase after creation?**
A: Yes, edit the phase details to update the name.

**Q: Can I delete a phase?**
A: Yes, if it has no tasks or minimal data. Admin can delete phases.

**Q: Are default tasks auto-created?**
A: No. You must add tasks manually to each phase.

**Q: Can I reorder phases?**
A: Yes, the system maintains serial numbers that can be adjusted.

---

## Support
- Check console logs (F12 → Console tab)
- Look for logs starting with `[ADMIN-STRICT-CREATE]`
- Contact technical support with error messages
