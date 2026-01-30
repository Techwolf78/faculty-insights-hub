# Faculty Insights Hub

## Overview

**Faculty Insights Hub** is a **multi-college, role-based Faculty Feedback System** built entirely as a **frontend-only React application** using **localStorage** as its data store.

The system is designed for **academic institutions** to collect **anonymous and authenticated student feedback**, analyze faculty performance, and generate rich analytics — **without any backend dependency**.

This updated architecture replaces the concept of rigid **Feedback Cycles** with a more **open, flexible, and academic-friendly concept called `Feedback Sessions`**.

A **Feedback Session** represents a real classroom context:

> **One Faculty + One Subject + One Batch + One Academic Context**

Each session generates a **unique feedback link**, allowing students to submit feedback seamlessly.

---

## Key Architectural Shift (IMPORTANT)

### ❌ Old Concept

* Feedback Cycles (Semester-based, rigid)

### ✅ New Concept (Final)

* **Feedback Sessions** (Open, simple, real-world aligned)

### A Feedback Session is created by selecting:

* **Course / Program** (Engineering, MBA, MCA, etc.)
* **Academic Year** (1st Year, 2nd Year, etc.)
* **Department** (CSE, IT, Finance, etc.)
* **Subject**
* **Batch** (A, B, C, D)
* **Faculty**

Once created:

* A **unique anonymous feedback URL** is generated
* Session can be **activated / deactivated** anytime
* Submissions are tied **only to that session**

This makes the system:

* More intuitive for colleges
* Easier to scale
* Easier to analyze at micro & macro levels

---

## Tech Stack

| Layer           | Technology                            |
| --------------- | ------------------------------------- |
| UI              | React (Functional Components + Hooks) |
| Styling         | Tailwind CSS                          |
| Routing         | React Router DOM                      |
| State & Caching | React Query                           |
| Charts          | Recharts                              |
| Icons           | lucide-react                          |
| Dates           | date-fns                              |
| Notifications   | sonner                                |
| Persistence     | localStorage                          |

---

## Production Setup

### Prerequisites

- Node.js 18+
- Firebase Project
- Environment variables configured

### Firebase Configuration

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication with Email/Password provider
3. Enable Firestore Database
4. Copy your Firebase config values

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase:**
   - Update `.env` with your Firebase project credentials
   - Ensure Firebase Security Rules are properly configured

3. **Create Super Admin:**
   - Run the application
   - Use "Create Super Admin Account" on the login page
   - This creates the first administrator account

4. **Setup Colleges & Users:**
   - Super admin creates college administrators
   - College admins add departments and faculty
   - Faculty accounts are created automatically with secure passwords

### Security Features

- **No hardcoded credentials** - All user accounts created through admin interface
- **Firebase Authentication** - Secure user management
- **Password reset** - Built-in forgot password functionality
- **Role-based access** - Granular permissions system
- **Environment variables** - Sensitive config not in code

---

## Color Palette

* **Primary:** `#01224E` (Deep Navy Blue)
* **Secondary:** `#f5f5f5 / #f8f9fa`
* **Success:** `#10b981`
* **Warning:** `#f59e0b`
* **Error:** `#ef4444`
* **White:** `#ffffff`

---

## Application Routes

### Public

* `/` – Landing Page
* `/feedback/anonymous/:sessionId` – Anonymous Feedback Form

### Authenticated

* `/login` – Admin / Staff Login

### Role-Based Dashboards

* `/super-admin` – System Owner
* `/admin/dashboard` – College Admin
* `/admin/sessions` – Feedback Session Management
* `/admin/faculty` – Faculty Management
* `/admin/departments` – Department Management
* `/admin/questions` – Question Bank
* `/admin/reports` – Reports & Analytics
* `/admin/settings` – College Settings
* `/hod/dashboard` – Department-Level View
* `/faculty/dashboard` – Faculty Personal Dashboard

---

## Feedback Session Lifecycle

1. **College Admin creates a Session**
2. Selects academic context:

   * Course / Program
   * Academic Year
   * Department
   * Subject
   * Batch
   * Faculty
3. System generates:

   * `uniqueSessionId`
   * `anonymousFeedbackURL`
4. Session is activated
5. Students submit feedback anonymously
6. Faculty & Admin view analytics

---

## Roles & Permissions

### Super Admin

* Manage colleges
* Create college admins
* Reset demo data
* View system-wide analytics

### College Admin

* Manage departments & faculty
* Create feedback sessions
* Manage question bank
* View full college reports

### HOD

* Department-only access
* View faculty performance
* Department analytics

### Faculty

* View own feedback only
* Trend analysis
* Anonymous comments
* Download reports

---

## Feedback Form Structure

### Question Categories

* Teaching Effectiveness
* Communication Skills
* Subject Knowledge
* Course Materials
* Overall Feedback

### Response Types

* Rating (1–5)
* Text
* Rating + Comment
* Select Dropdown
* Boolean (Yes/No)

### Features

* Multi-step form
* Auto-save every 30 seconds
* Progress indicator
* Accessibility compliant

---

## Updated localStorage Data Model

### Colleges

```js
ffs_colleges
```

### Users

```js
ffs_users
```

### Departments

```js
ffs_departments
```

### Faculty

```js
ffs_faculty
```

### Feedback Sessions (NEW CORE ENTITY)

```js
ffs_feedback_sessions: [
  {
    id: 'session-1',
    collegeId: '1',
    departmentId: '1',
    facultyId: '1',

    course: 'Engineering',
    academicYear: '2nd Year',
    subject: 'Data Structures',
    batch: 'A',

    accessMode: 'anonymous',
    uniqueUrl: 'feedback-session-abc123',
    isActive: true,

    createdAt: '2024-02-01T10:00:00',
    expiresAt: '2024-02-15T23:59:59'
  }
]
```

### Questions

```js
ffs_questions
```

### Feedback Submissions

```js
ffs_feedback_submissions: [
  {
    id: 'sub-1',
    sessionId: 'session-1',
    facultyId: '1',
    collegeId: '1',
    responses: [
      { questionId: 'q1', rating: 4 },
      { questionId: 'q2', comment: 'Very clear teaching' }
    ],
    submittedAt: '2024-02-05T14:30:00'
  }
]
```

---

## Reports & Analytics

### Admin / HOD

* Department-wise averages
* Faculty comparisons
* Subject-wise performance
* Batch-wise trends
* Response rates

### Faculty

* Personal score trends
* Category radar chart
* Anonymous student comments
* Percentile comparison

### Charts Used

* Bar Chart
* Line Chart
* Pie Chart
* Radar Chart

---

## UX & Accessibility

* WCAG AA color contrast
* Keyboard navigation
* ARIA labels
* Screen-reader friendly tables
* Focus indicators
* Skip-to-content link

---

## Demo & Development

### Seed Data

The application includes a production-safe seed data script that:

* Creates demo colleges (ICEM, IGSB)
* Sets up sample departments
* Creates a super admin account (you provide email/password)
* Pre-configures question banks

**No hardcoded user credentials** - All accounts created securely through Firebase Auth.

### Development Setup

1. Run the seed data script from `/seed-data` page
2. Create your super admin account
3. Add college administrators
4. College admins can then add faculty and create feedback sessions

---

## Utilities & Helpers

* `localStorageService.js`
* `authService.js`
* `sessionService.js`
* `reportService.js`
* Simulated API delay (200–500ms)

---

## Reset Demo Data

Available for:

* Super Admin
* College Admin

Resets all localStorage keys safely.

---

## Success Criteria

✔ Multi-college support
✔ Session-based architecture
✔ Fully frontend-only
✔ Professional academic UI
✔ Accessible & responsive
✔ Realistic demo-ready system

---

## Branding

**Gryphon Academy Pvt Ltd**

---

> This README represents the **final, production-grade architecture** for the Faculty Insights Hub using a **Session-first academic model**.
