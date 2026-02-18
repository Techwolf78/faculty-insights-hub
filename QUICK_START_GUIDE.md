# Multi-Role Implementation - Quick Start Guide

## For IGSB College Dean Setup

### Quick Summary
The dean can now access both **College Admin** and **HOD** dashboards by switching roles using a dropdown in the header. The system automatically manages which role is active.

---

## Step-by-Step Setup

### 1️⃣ Create the Dean Account

**From College Admin Dashboard:**
1. Go to **Faculty Management** → **Add Faculty**
2. Fill form:
   - Name: `Dr. Dean Name`
   - Email: `dean@igsb.edu`
   - Employee ID: Auto-generated (e.g., FAC001)
   - Role: Select **"Dean (Admin + HOD)"** (IGSB specific option)
   - Other details: Designation, Specialization, etc.
3. Click **Save**
4. Copy the auto-generated password from the toast notification

### 2️⃣ Dean Logs In

**First Time Login:**
1. Go to `/login/igsb` (IGSB college login)
2. Email: `dean@igsb.edu`
3. Password: _(the one from step 1)_
4. ✅ Will be redirected to `/admin/dashboard` (default first role)

### 3️⃣ Switch to HOD Role

**In the Header:**
- Look for **Role Switcher** dropdown (shows current role like "College Admin")
- Click dropdown
- Select **"Head of Department"**
- ✅ Page redirects to `/hod/dashboard`
- ✅ Sidebar updates with HOD menu items

### 4️⃣ Access HOD Features

**Available in HOD Dashboard:**
- ✅ View own teaching feedback (as faculty)
- ✅ View department-wide faculty performance
- ✅ See performance trends
- ✅ View feedback by subject

---

## How It Works

### Role Switching Flow
```
Dean Logs In → Admin Dashboard (default)
                      ↓
              [Role Switcher Button]
                      ↓
              Select "Head of Department"
                      ↓
              HOD Dashboard
```

### Behind the Scenes
1. **Firestore User Document** stores:
   - `roles: ["admin", "hod"]` - All roles dean has
   - `activeRole: "admin"` - Currently active role
   - `role: "hod"` - Primary role (backward compatibility)

2. **Session Storage** keeps activeRole in:
   - React Context (AuthContext)
   - Browser localStorage (persistence)

3. **Navigation** responds to activeRole:
   - DashboardLayout checks activeRole for access
   - DashboardSidebar shows menu items for activeRole
   - Route redirects based on activeRole

---

## Key Features

### ✨ Role Switcher (Header)
- Only visible when user has multiple roles
- Dropdown shows available roles
- One-click switching between dashboards
- Persists across page refreshes

### 🔄 Session Persistence
- activeRole saved in localStorage
- Survives page reload
- Restored on login

### 📱 Responsive Design
- Works on mobile and desktop
- Role switcher always accessible in header
- Clean UI integration

---

## Test Scenarios

### ✅ Test 1: Can Dean See Admin Features?
1. Switch to Admin role
2. Go to Sessions, Faculty, Departments
3. Should see all college admin options

### ✅ Test 2: Can Dean See HOD Performance?
1. Switch to HOD role
2. Click "My Performance"
3. Should show dean's teaching feedback + department data

### ✅ Test 3: Does Role Persist on Reload?
1. Switch to HOD role
2. Refresh page (F5)
3. Should stay in HOD dashboard
4. Sidebar should show HOD menu

### ✅ Test 4: Can Create Sessions as Admin?
1. Switch to Admin role
2. Go to Feedback Sessions
3. Click Create Session
4. Should work without issues

### ✅ Test 5: Can Switch Back?
1. In HOD role, click role switcher
2. Select "College Admin"
3. Should redirect to admin dashboard
4. Sidebar updates to admin menu

---

## Troubleshooting

### ❌ Role Switcher Not Showing?
- Check user has `roles` array with multiple items
- Check activeRole is set in Firestore user document
- Login again if it doesn't appear

### ❌ Redirect Not Working?
- Clear browser cache/localStorage
- Check Firestore user document has activeRole field
- Verify user has both admin and hod in roles array

### ❌ HOD Dashboard Shows Empty?
- Check department is assigned to HOD
- Verify faculty are in that department
- Check sessions are active and have submissions

---

## Database Structure (Firestore)

**Collection: `users`**
```
Document: dean_user_id
{
  email: "dean@igsb.edu",
  name: "Dr. Dean Name",
  
  // Single primary role (backward compatible)
  role: "hod",
  
  // New fields for multi-role
  roles: ["admin", "hod"],
  activeRole: "admin",
  
  collegeId: "igsb_college_id",
  isActive: true,
  ...other fields
}
```

**Collection: `faculty`**
```
Document: fac_user_id
{
  userId: "dean_user_id",
  email: "dean@igsb.edu",
  name: "Dr. Dean Name",
  
  # Primary teaching role
  role: "hod",
  
  collegeId: "igsb_college_id",
  ...other fields
}
```

---

## FAQs

**Q: Can other colleges use this?**
- Yes, all colleges can assign multiple roles
- "Dean (Admin + HOD)" option is IGSB-specific
- Other colleges can edit existing users to add multiple roles

**Q: What if dean logs out from HOD role?**
- Next login starts with Admin role (first in roles array)
- Can switch to HOD role again

**Q: Can regular HOD use this?**
- No, only users with multiple roles see the role switcher
- Regular HOD just sees normal HOD dashboard

**Q: Can admin delegate HOD permissions?**
- Yes, when editing a faculty/user, can assign multiple roles
- Use checkboxes: ☑ Admin ☑ HOD

**Q: Is this secure?**
- Yes, frontend and backend both respect activeRole
- Firestore rules can be enhanced further (optional)
- Role assignments only by college admin

---

## Admin Controls

### To Edit Dean's Roles (College Admin):
1. Go to Faculty Management
2. Find dean's record
3. Click Edit
4. Check/uncheck role checkboxes:
   - ☑ College Admin
   - ☑ Head of Department (HOD)
   - ☐ Faculty Member
5. Set Active Role (for multi-role users)
6. Save

### To Create Another Admin+HOD User:
1. Go to Faculty Management → Add Faculty
2. Select "Dean (Admin + HOD)" role
3. Fill other details
4. Save (only for IGSB college)

---

## Features Delivered

✅ Multi-role support in User model  
✅ Active role tracking in AuthContext  
✅ Role switcher in header (only when multiple roles)  
✅ Admin dashboard access verification  
✅ HOD dashboard access verification  
✅ HOD performance view (self + department)  
✅ Seamless role switching  
✅ Session persistence  
✅ Faculty form multi-role selection (IGSB)  
✅ Full backward compatibility  

---

## Next Steps (Optional)

1. **Firestore Security Rules** - Enhance rules to validate role assignments
2. **Audit Logging** - Log every role switch for security
3. **Granular Permissions** - Fine-grained permission checks per role
4. **Role Presets** - Save common role combinations
5. **Bulk Role Assignment** - Assign roles via CSV import

---

**Deployment Ready ✅**

All changes are backward compatible and the app is ready to use. No database migration needed.
