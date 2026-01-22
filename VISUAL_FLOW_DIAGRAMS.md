# Visual Flow Diagrams - Strict Admin Phase Control

## 1. Complete User Flow

```
┌─────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                       │
│              (Project Management View)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────┐
        │  Click "Add Phase"      │
        │      Button            │
        └────────────┬───────────┘
                     │
                     ↓
    ┌────────────────────────────────┐
    │  "Create New Project Phase"     │
    │        Modal Opens             │
    │  ┌──────────────────────────┐  │
    │  │ Phase Name Input Field   │  │
    │  │                          │  │
    │  │ Helper Text Shown        │  │
    │  │ "You can add tasks later"│  │
    │  │                          │  │
    │  │ [Create Phase] Button    │  │
    │  └──────────────────────────┘  │
    └────────────────┬────────────────┘
                     │
        ┌────────────┴────────────┐
        │   Admin Types Name      │
        │   e.g., "Foundation"    │
        │                         │
        └────────────┬────────────┘
                     │
                     ↓
        ┌────────────────────────┐
        │ Click "Create Phase"   │
        │      Button            │
        └────────────┬───────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │  VALIDATION LAYER     │
         │  ✓ Input not empty?   │
         │  ✓ Site selected?     │
         │  ✓ No duplicates?     │
         └────────────┬──────────┘
                      │
        ┌─────────────┴──────────────┐
        │                            │
    Validation                   Validation
    FAILED ❌                    PASSED ✅
        │                            │
        ↓                            ↓
    Toast Error              POST /phases API
    "Error message"          ────────────→
                                    │
                                    ↓
                            Backend Processes:
                            • Insert phase
                            • Assign serial number
                            • NO auto-tasks
                            • Return phaseId
                                    │
                                    ↓
                            Check Response
                            • phaseId exists?
                                    │
        ┌───────────────────────────┴──────────────────┐
        │                                              │
    NO PHASE ID                                    HAS PHASE ID
    Response ERROR ❌                          Response SUCCESS ✅
        │                                              │
        ↓                                              ↓
    Toast Error                              Refresh Project Data
    "Failed to create"                       GET /phases
                                                    │
                                                    ↓
                                            Toast Success
                                            "Phase created"
                                                    │
                                                    ↓
                                            Close Modal
                                            Clear Input
                                                    │
                                                    ↓
                                            ┌─────────────┐
                                            │ Admin sees  │
                                            │ new phase   │
                                            │ in list     │
                                            └─────────────┘
```

---

## 2. Validation Decision Tree

```
                    Admin Submits
                         │
                         ↓
            ┌────────────────────────┐
            │  INPUT VALIDATION      │
            └────────┬───────────────┘
                     │
        ┌────────────┴──────────────┐
        │                           │
        ↓                           ↓
   Is input          ────NO────→ ❌ Error
   empty or          Toast: "Please enter phase name"
   whitespace?
   │
   │ YES
   ↓
   ┌─────────────────────────────┐
   │  SITE VALIDATION            │
   └─────────┬───────────────────┘
             │
    ┌────────┴──────────┐
    │                   │
    ↓                   ↓
 Is site           ────NO────→ ❌ Error
 selected?         Toast: "No project selected"
 │
 │ YES
 ↓
 ┌──────────────────────────────┐
 │  DUPLICATE CHECK             │
 └──────────┬───────────────────┘
            │
    ┌───────┴─────────────────────────────┐
    │                                     │
    ↓                                     ↓
 Does phase name         ────YES────→ ❌ Error
 already exist?          Toast: "Phase with this
 (Case-insensitive)      name already exists"
 │
 │ NO
 ↓
 ┌──────────────────────────────┐
 │  ✅ ALL VALIDATION PASSED   │
 │  Proceed to API Call         │
 └──────────────────────────────┘
```

---

## 3. API Request/Response Flow

```
┌─────────────────────────────────────────────────────────┐
│              FRONTEND (React Native)                    │
│                                                         │
│  Phase Input: "Foundation Work"                        │
│  Serial Number: 3 (calculated)                         │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  PAYLOAD CONSTRUCTION (EXACT, NO MODIFICATIONS) │  │
│  │                                                  │  │
│  │  {                                              │  │
│  │    siteId: 42,                                  │  │
│  │    name: "Foundation Work",  ←── EXACT INPUT   │  │
│  │    floorName: "Custom",      ←── EXPLICIT ONLY │  │
│  │    floorNumber: 0,                              │  │
│  │    budget: 0,                                   │  │
│  │    orderNum: 3,                                 │  │
│  │    serialNumber: 3                              │  │
│  │  }                                              │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│              │                                          │
│              │ POST /phases                             │
│              │ (HTTP Request)                           │
│              ↓                                          │
│  ╔═══════════════════════════════════════════════════╗ │
│  ║                      BACKEND                      ║ │
│  ╠═════════════════════════════════════════════════╗ ║ │
│  ║  1. Validate input                            ║ ║ │
│  ║  2. Check duplicate order numbers            ║ ║ │
│  ║  3. Insert phase into database               ║ ║ │
│  ║  4. Reindex phases if needed                 ║ ║ │
│  ║  ✅ NO auto-tasks created                    ║ ║ │
│  ║  ✅ NO template injection                    ║ ║ │
│  ║  5. Return phaseId                           ║ ║ │
│  ╚═════════════════════════════════════════════╝ ║ │
│  ║                                               ║ │
│  ║  Response:                                  ║ │
│  ║  {                                          ║ │
│  ║    message: "Stage added successfully",    ║ │
│  ║    phaseId: 156                            ║ │
│  ║  }                                          ║ │
│  ║                                               ║ │
│  ╚═══════════════════════════════════════════════╝ │
│              │                                      │
│              │ (HTTP Response)                      │
│              │                                      │
│  ┌───────────↓─────────────────────────────────┐  │
│  │  SUCCESS PATH:                              │  │
│  │  ✅ Response has phaseId                    │  │
│  │  ✅ Refresh project phases data             │  │
│  │  ✅ Show toast: "Phase created"             │  │
│  │  ✅ Close modal                             │  │
│  │  ✅ Clear input field                       │  │
│  │                                              │  │
│  │  ERROR PATH:                                │  │
│  │  ❌ Response missing phaseId                │  │
│  │  ❌ Show toast: "Failed to create phase"   │  │
│  │  ❌ Keep modal open for retry              │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 4. State Management Flow

```
┌──────────────────────────────────┐
│   COMPONENT STATE (React)        │
└──────────────────────────────────┘
         │
         ├─ newStageName: string
         │  (Admin input)
         │
         ├─ addStageModalVisible: boolean
         │  (Modal visibility)
         │
         ├─ projectPhases: array
         │  (Current phases list)
         │
         ├─ selectedSite: object
         │  (Current project)
         │
         └─ otherState...

         ↓

FLOW ON "CREATE PHASE" CLICK:

Step 1: Read current state
  newStageName = "Foundation Work"
  selectedSite = { id: 42, name: "Krishnagiri" }
  projectPhases = [existing phases...]

Step 2: Validation (read-only)
  Check: !selectedSite → false (OK)
  Check: !newStageName → false (OK)
  Check: duplicate? → false (OK)

Step 3: Calculate values
  const nextSerialNumber = Math.max(...) + 1
  (No mutations yet)

Step 4: API Call
  const phaseRes = await api.post("/phases", payload)
  (No state change)

Step 5: Validate response
  if (phaseRes.data?.phaseId) {
    SUCCESS PATH
  } else {
    ERROR PATH
  }

Step 6: SUCCESS PATH
  → showToast("Phase created")
  → setAddStageModalVisible(false)  [STATE CHANGE 1]
  → setNewStageName("")             [STATE CHANGE 2]
  → fetchProjectDetails()            [DATA REFRESH]
    (Updates projectPhases)

Step 7: Error Handling
  if (error) {
    → showToast("Error message")
    (Modal stays open, input preserved)
  }

         ↑
         │
    USER SEES
    ┌─────────────────┐
    │ Success Toast   │
    │ "Phase created" │
    │ Modal Closes    │
    │ New Phase in    │
    │ Project List    │
    └─────────────────┘
```

---

## 5. Validation Rules Summary

```
┌─────────────────────────────────────────────────────────────┐
│              VALIDATION RULES (SEQUENTIAL)                   │
└─────────────────────────────────────────────────────────────┘

Rule 1: REQUIRED - Site Selection
┌────────────────────────────────────┐
│ if (!selectedSite)                 │
│ → Error: "No project selected"     │
│ → STOP                             │
└────────────────────────────────────┘
         │ PASS
         ↓

Rule 2: REQUIRED - Input Text
┌────────────────────────────────────┐
│ if (!newStageName.trim())          │
│ → Error: "Please enter phase name" │
│ → STOP                             │
└────────────────────────────────────┘
         │ PASS
         ↓

Rule 3: UNIQUE - No Duplicates
┌──────────────────────────────────────────────────────┐
│ const existingNames = projectPhases                  │
│   .map(p => p.name.toLowerCase())                   │
│ if (existingNames.includes(name.toLowerCase()))      │
│ → Error: "Phase with this name exists"              │
│ → STOP                                              │
└──────────────────────────────────────────────────────┘
         │ PASS
         ↓

┌────────────────────────────────────┐
│ ✅ ALL VALIDATIONS PASSED          │
│ PROCEED TO API CALL                │
└────────────────────────────────────┘

═════════════════════════════════════════════════════════════

REMOVED RULES (NO LONGER ENFORCED):

❌ Predefined Name Check
   (Was: Block if matches MAIN_CONSTRUCTION_STAGES)
   (Now: Removed - Admin full control)

❌ Default Floor Assignment
   (Was: Auto-assign to "Other" floor)
   (Now: Explicit "Custom" only)
```

---

## 6. Complete Lifecycle

```
┌────────────────────────────────────────────────────────────────┐
│                  PHASE CREATION LIFECYCLE                       │
└────────────────────────────────────────────────────────────────┘

TIME ──────────────────────────────────────────────────────────→

  T0: INITIAL STATE
  ├─ Modal is closed
  ├─ Input field is empty
  ├─ No phase selected
  └─ ProjectPhases list is loaded

  T1: OPEN MODAL
  ├─ User clicks "Add Phase" button
  ├─ Modal becomes visible
  ├─ Focus moves to input field
  └─ Helper text displayed

  T2: USER INPUT
  ├─ User types phase name
  ├─ Input state updates in real-time
  ├─ Button becomes enabled
  └─ [Example: User types "Foundation"]

  T3: VALIDATION
  ├─ User clicks "Create Phase" button
  ├─ Validation logic executes
  ├─ All rules checked
  ├─ Result: ✅ PASS
  └─ Proceed to Step 4

  T4: API REQUEST
  ├─ Payload constructed
  ├─ POST /phases called
  ├─ Request sent to backend
  ├─ Button disabled (optional)
  └─ Loading indicator shown (optional)

  T5: BACKEND PROCESSING
  ├─ Phase validated
  ├─ Serial number assigned
  ├─ Inserted into database
  ├─ ✅ NO auto-tasks created
  └─ Response sent back

  T6: RESPONSE HANDLING
  ├─ Check response validity
  ├─ phaseId received
  ├─ Success path activated
  └─ Proceed to Step 7

  T7: SUCCESS ACTIONS
  ├─ Toast message shown: "Phase created"
  ├─ Modal visibility set to false
  ├─ Input field cleared
  ├─ Refresh triggered
  └─ Proceed to Step 8

  T8: DATA REFRESH
  ├─ fetchProjectDetails() called
  ├─ GET /phases requested
  ├─ New phase data received
  ├─ ProjectPhases state updated
  └─ Proceed to Step 9

  T9: FINAL STATE
  ├─ Modal is closed
  ├─ Input field is empty
  ├─ Toast dismisses
  ├─ New phase visible in list
  ├─ Dashboard updated
  └─ ✅ READY FOR NEXT ACTION

═════════════════════════════════════════════════════════════

ERROR CASES (Branch at T3 if validation FAILS):

  T3E: VALIDATION FAILED
  ├─ Error identified
  ├─ Toast error shown
  ├─ Modal stays open
  ├─ Input preserved
  ├─ User can retry
  └─ ❌ NO API CALL

  T4E: API FAILED
  ├─ Network error or server error
  ├─ Response check fails
  ├─ Toast error shown
  ├─ Modal stays open
  ├─ Input preserved
  ├─ User can retry
  └─ ❌ NO STATE CHANGES

═════════════════════════════════════════════════════════════

LOGGING (Visible in Console):

  T4: [ADMIN-STRICT-CREATE] Phase Name (Exact Input): "Foundation"
  T4: [ADMIN-STRICT-CREATE] Next Serial Number: 3
  T4: [ADMIN-STRICT-CREATE] Creating Phase with payload: {...}
  T5: [ADMIN-STRICT-CREATE] ✅ Phase created with ID: 42
  T8: ✅ Data refreshed

═════════════════════════════════════════════════════════════
```

---

## 7. Comparison: Before vs After

```
┌──────────────────┬────────────────┬───────────────────┐
│    BEHAVIOR      │    BEFORE      │      AFTER        │
├──────────────────┼────────────────┼───────────────────┤
│ Input Handling   │ Auto-modified  │ ✅ Exact as typed │
├──────────────────┼────────────────┼───────────────────┤
│ Floor Assignment │ Auto "Other"   │ ✅ Explicit       │
│                  │   (floor 99)   │    "Custom" only  │
├──────────────────┼────────────────┼───────────────────┤
│ Template Inject  │ ❌ YES         │ ✅ NO             │
├──────────────────┼────────────────┼───────────────────┤
│ Auto-Tasks       │ ❌ Created     │ ✅ None created   │
├──────────────────┼────────────────┼───────────────────┤
│ Predefined Check │ ❌ Blocked if  │ ✅ Allowed all    │
│                  │    matches     │    names          │
├──────────────────┼────────────────┼───────────────────┤
│ State Management │ Inferred       │ ✅ Explicit       │
│                  │ updates        │    updates        │
├──────────────────┼────────────────┼───────────────────┤
│ Admin Control    │ Limited        │ ✅ Full control   │
├──────────────────┼────────────────┼───────────────────┤
│ Logging          │ Minimal        │ ✅ Comprehensive  │
│                  │                │    with prefix    │
├──────────────────┼────────────────┼───────────────────┤
│ Predictability   │ Low            │ ✅ High           │
│                  │ (auto-changes) │    (deterministic)│
└──────────────────┴────────────────┴───────────────────┘
```

---

## 8. Success Indicators

```
✅ Phase Created Successfully When:

┌─────────────────────────────────────┐
│  1. Phase appears in project list   │
│  2. Serial number is correct        │
│  3. Floor name is "Custom"          │
│  4. No auto-tasks created          │
│  5. No template data injected      │
│  6. Input was used exactly         │
│  7. Toast shows success message    │
│  8. Modal closes automatically     │
│  9. Data persists after refresh    │
│ 10. Console shows [ADMIN-STRICT]   │
│     logs with success markers      │
└─────────────────────────────────────┘

❌ Issues to Watch For:

┌──────────────────────────────────────┐
│ • Phase not visible in list          │
│ • Wrong serial number assigned       │
│ • Auto-tasks were created           │
│ • Floor name is not "Custom"        │
│ • Original input was modified       │
│ • No console logs present           │
│ • Toast messages don't appear       │
│ • Modal doesn't close               │
│ • Data lost after refresh           │
│ • Error message shown               │
└──────────────────────────────────────┘
```

---

All visual flows diagram the **strict admin control** behavior with **zero auto-operations**.
