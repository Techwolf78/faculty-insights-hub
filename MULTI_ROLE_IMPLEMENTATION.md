# Multi-Role Implementation for IGSB Dean

## Overview
This document describes the multi-role implementation that allows the IGSB college dean to access both the college admin dashboard and the HOD dashboard with a dynamic role switcher.

## Changes Made

### 1. **User Model Enhancement** (`src/lib/storage.ts`)
**What Changed:**
- Added `roles?: ('admin' | 'hod' | 'faculty')[]` - array of roles for multi-role users
- Added `activeRole?: 'admin' | 'hod' | 'faculty'` - currently active role
- Kept `role: 'superAdmin' | 'admin' | 'hod' | 'faculty'` for backward compatibility

**Impact:**
- Users can now have multiple roles stored in Firestore
- The system tracks which role is currently active for display/navigation

### 2. **Authentication Context** (`src/contexts/AuthContext.tsx`)
**What Changed:**
- Added `setActiveRole(role)` method to AuthContext
- Enhanced login flow to initialize `activeRole` from Firestore
- User data now includes roles array and actively tracked activeRole

**Key Logic:**
```typescript
if (fullUserData.roles && fullUserData.roles.length > 0) {
  if (!fullUserData.activeRole) {
    fullUserData.activeRole = fullUserData.roles[0];
  }
} else {
  fullUserData.activeRole = fullUserData.role as 'admin' | 'hod' | 'faculty';
}
```

### 3. **Dashboard Layout** (`src/components/layout/DashboardLayout.tsx`)
**What Changed:**
- Updated role validation to check `user.activeRole || user.role` instead of just `user.role`
- Redirects now respect the currently active role

### 4. **Dashboard Sidebar** (`src/components/layout/DashboardSidebar.tsx`)
**What Changed:**
- Updated all navigation generation to use `activeRole`
- `getLinks()`, `getRoleIcon()`, `getRoleLabel()` all check activeRole
- Navigation menu items reflect the currently active role

### 5. **Dashboard Header** (`src/components/layout/DashboardHeader.tsx`)
**What Changed:**
- Added **Role Switcher** component (visible only when user has multiple roles)
- Shows a dropdown/Select component with available roles
- On role change:
  - Calls `setActiveRole()` to update session
  - Redirects to appropriate dashboard for selected role
  - Updates localStorage for persistence

**Example:**
```tsx
{hasMultipleRoles && (
  <Select value={activeRole} onValueChange={handleRoleChange}>
    <SelectTrigger>
      <SelectValue placeholder="Select role" />
    </SelectTrigger>
    <SelectContent>
      {/* Shows only the roles user has */}
      <SelectItem value="admin">College Admin</SelectItem>
      <SelectItem value="hod">Head of Department</SelectItem>
    </SelectContent>
  </Select>
)}
```

### 6. **Login Pages** (`src/pages/Login.tsx`, `src/pages/IGSBLogin.tsx`, `src/pages/ICEMLogin.tsx`)
**What Changed:**
- Navigation on login now uses `user.activeRole || user.role`
- First login will direct to the first role in the roles array

### 7. **Faculty Form** (`src/components/admin/FacultyForm.tsx`)
**What Changed:**
- Detects IGSB college and enables multi-role selection for editing
- Shows checkboxes for 'Admin', 'HOD', 'Faculty' roles (IGSB only, edit mode)
- Shows simple role dropdown for other colleges or new faculty creation
- Added special "Dean (Admin + HOD)" option for new faculty in IGSB
- When saving multi-role faculty:
  - Stores roles array in User document
  - Sets activeRole (default: first role or specified)
  - Updates Faculty document with primary role

**UI Example (IGSB Edit Mode):**
```
☑ College Admin
☑ Head of Department (HOD)
☐ Faculty Member

Active Role: [College Admin ▼]
```

## Workflow: Dean with Admin+HOD Roles

### Step 1: Create Dean User
1. College admin goes to Faculty Management
2. Creates new faculty with:
   - Name: "Dr. Dean Name"
   - Role: "Dean (Admin + HOD)" (IGSB only) OR
   - Edit existing HOD and select both Admin + HOD checkboxes

### Step 2: Dean Logs In
1. Dean logs in with their credentials
2. System initializes activeRole to 'admin' (first role)
3. Dean is redirected to `/admin/dashboard`
4. localStorage stores both roles and activeRole

### Step 3: Dean Switches Roles
1. Dean clicks **Role Switcher** in header (shows: "College Admin ▼")
2. Selects "Head of Department"
3. System calls `setActiveRole('hod')`
4. Page redirects to `/hod/dashboard`
5. Sidebar navigation updates to HOD menu:
   - Dashboard → HOD Performance Dashboard
   - My Performance → HOD Performance Analytics
   - Profile Settings → Profile Edit

### Step 4: Dean Switches Back
1. Dean clicks role switcher again
2. Selects "College Admin"
3. System updates activeRole to 'admin'
4. Page redirects to `/admin/dashboard`
5. Sidebar shows admin menu again

## Data Structure in Firestore

### User Document (Admin with HOD Role)
```json
{
  "id": "user123",
  "email": "dean@igsb.edu",
  "name": "Dr. Dean Name",
  "role": "hod",                    // Primary role (for backward compat)
  "roles": ["admin", "hod"],        // Multiple roles
  "activeRole": "admin",            // Currently active role
  "collegeId": "igsb001",
  "departmentId": "cse001",
  "isActive": true,
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

### Faculty Document
```json
{
  "id": "fac123",
  "userId": "user123",
  "collegeId": "igsb001",
  "employeeId": "FAC001",
  "name": "Dr. Dean Name",
  "role": "hod",                    // Primary teaching role
  "email": "dean@igsb.edu",
  "designation": "Associate Professor",
  "specialization": "Computer Science",
  "experience": 10,
  "highestQualification": "PhD",
  "isActive": true,
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

## Session Persistence

**localStorage keeps track of:**
1. `currentUser` - Full user object including roles and activeRole
2. Persisted across page reloads
3. On login, user data is fetched from Firestore and merged into auth context

## Testing the Implementation

### Test Case 1: Create Dean User
```
1. Login as college admin
2. Go to Faculty Management
3. Create faculty with email: dean@igsb.edu
4. Select "Dean (Admin + HOD)" role
5. Copy credentials shown in toast
```

### Test Case 2: Login as Dean
```
1. Go to /login/igsb (IGSB login page)
2. Enter dean@igsb.edu and generated password
3. Should be redirected to /admin/dashboard
4. Check header - should show role switcher
```

### Test Case 3: Switch to HOD Role
```
1. Click role switcher dropdown in header
2. Select "Head of Department"
3. Should redirect to /hod/dashboard
4. Sidebar should show HOD menu items:
   - Dashboard (HOD Dashboard)
   - My Performance (HOD Performance)
   - Profile Settings
```

### Test Case 4: View HOD Performance
```
1. From HOD dashboard, click "My Performance"
2. Should show:
   - Dean's own teaching feedback
   - Department faculty performance
   - Comparison with college averages
```

### Test Case 5: Create/Edit Session
```
1. Switch back to admin role
2. Click role switcher -> "College Admin"
3. Go to Feedback Sessions
4. Create new session
5. Should work with admin privileges
```

## Backward Compatibility

✅ **Fully backward compatible:**
- Users with single role still work (role field is used, roles array is undefined)
- Existing authentication flows unchanged
- Dashboard layout still checks user.role as fallback
- No database migration required (uses optional fields)

## Future Enhancements

1. **Firestore Rules Validation** - Add security rules to validate role assignments
2. **Audit Log** - Track role switches and multi-role activity
3. **Role-Based Permissions** - Granular permission checking within dashboards
4. **Admin Role Selection** - Let college admin choose which role is default for multi-role users
5. **Sub-role Scoping** - Different permissions/access levels for same role (e.g., admin for different departments)

## Troubleshooting

### Role Switcher Not Showing
- Check: User has `roles` array with > 1 items
- Check: `activeRole` field is set in user document
- Check: User is in multi-role scenario

### Redirect Loop on Login
- Check: activeRole is set in user document
- Check: User has at least one valid role in roles array
- Check: Firestore user document structure matches User interface

### Admin+HOD Option Not Showing
- Check: College code is 'IGSB'
- Check: In faculty form, only appears on NEW faculty creation
- Check: For editing, use multi-role checkboxes instead

## Files Modified

1. ✅ `src/lib/storage.ts` - User interface
2. ✅ `src/contexts/AuthContext.tsx` - Multi-role tracking
3. ✅ `src/components/layout/DashboardLayout.tsx` - activeRole checking
4. ✅ `src/components/layout/DashboardSidebar.tsx` - activeRole-based navigation
5. ✅ `src/components/layout/DashboardHeader.tsx` - Role switcher UI
6. ✅ `src/pages/Login.tsx` - activeRole navigation
7. ✅ `src/pages/IGSBLogin.tsx` - activeRole navigation
8. ✅ `src/pages/ICEMLogin.tsx` - activeRole navigation
9. ✅ `src/components/admin/FacultyForm.tsx` - Multi-role selection UI and logic

## Summary

The IGSB dean can now:
1. ✅ See college admin dashboard features
2. ✅ Create feedback sessions and manage faculty
3. ✅ Switch to HOD role to view their teaching performance
4. ✅ See both their own feedback and department faculty feedback
5. ✅ Seamlessly switch between roles with a dropdown in the header
6. ✅ Session persists across page reloads
