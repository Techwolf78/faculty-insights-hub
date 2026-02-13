// Firebase Firestore utility functions - Production Ready Schema

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  increment,
  runTransaction,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from './firebase';

// Re-export Timestamp for convenience
export { Timestamp };

// ============================================================================
// TYPE DEFINITIONS - Production Schema
// ============================================================================

// Firestore field value types
type FirestoreFieldValue = string | number | boolean | null | Timestamp | string[] | Record<string, unknown>;

export interface College {
  id: string;
  name: string;
  code: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  settings: {
    allowAnonymousFeedback: boolean;
    feedbackReminderDays: number;
    defaultSessionDuration: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'superAdmin' | 'admin' | 'hod' | 'faculty';
  collegeId?: string;
  departmentId?: string;
  isActive: boolean;
  lastLoginAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Department {
  id: string;
  collegeId: string;
  name: string;
  code: string;
  description?: string;
  hodId?: string;
  facultyCount: number;
  activeSessionCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

export interface Faculty {
  id: string;
  userId: string;
  collegeId: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  designation: string;
  specialization: string;
  highestQualification: string;
  experience: number;
  role: 'faculty' | 'hod';
  stats: {
    totalSessions: number;
    totalSubmissions: number;
    averageRating: number;
    lastFeedbackAt?: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

export interface FacultyAllocation {
  id: string;
  facultyId: string;
  collegeId: string;
  course: string;
  department: string;
  years: string[];
  subjects: {
    name: string;
    code: string;
    type: 'Theory' | 'Practical';
  }[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

export interface FeedbackSession {
  id: string;
  collegeId: string;
  departmentId?: string;
  facultyId: string;
  questionGroupId: string;
  course: string;
  academicYear: string;
  subject: string;
  subjectCode: string;
  subjectType: 'Theory' | 'Practical';
  batch: string;
  semester?: string;
  accessMode: 'anonymous' | 'authenticated' | 'mixed';
  uniqueUrl: string;
  qrCodeUrl?: string;
  isActive: boolean;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'expired';
  stats: {
    submissionCount: number;
    averageRating: number;
    lastSubmissionAt?: Timestamp;
  };
  startDate: Timestamp;
  expiresAt: Timestamp;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
}

export interface QuestionGroup {
  id: string;
  collegeId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Question {
  id: string;
  collegeId: string;
  groupId: string;
  category: string;
  text: string;
  helpText?: string;
  responseType: 'rating' | 'text' | 'both' | 'select' | 'boolean';
  options?: string[];
  required: boolean;
  minLength?: number;
  maxLength?: number;
  order: number;
  categoryOrder: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FeedbackResponse {
  questionId: string;
  questionCategory: string;
  rating?: number;
  comment?: string;
  selectValue?: string;
  booleanValue?: boolean;
}

export interface FeedbackSubmission {
  id: string;
  sessionId: string;
  facultyId: string;
  collegeId: string;
  departmentId?: string;
  responses: FeedbackResponse[];
  metrics: {
    overallRating: number;
    categoryRatings: Record<string, number>;
    hasComments: boolean;
    commentCount: number;
  };
  submittedAt: Timestamp;
  clientInfo?: {
    userAgent?: string;
    platform?: string;
  };
}

export interface FeedbackStats {
  id: string;
  type: 'college' | 'department' | 'faculty' | 'session';
  entityId: string;
  collegeId: string;
  departmentId?: string;
  facultyId?: string;
  totalSubmissions: number;
  averageRating: number;
  categoryScores: Record<string, { average: number; count: number }>;
  monthly: Record<string, { submissions: number; averageRating: number }>;
  ratingDistribution: Record<number, number>;
  trend: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
  };
  recentComments: Array<{
    text: string;
    rating: number;
    submittedAt: Timestamp;
  }>;
  lastUpdated: Timestamp;
}

export interface AcademicConfig {
  id: string;
  collegeId: string;
  courseData: Record<string, {
    years: string[];
    yearDepartments: Record<string, string[]>;
    semesters?: string[];
  }>;
  subjectsData: Record<string, Record<string, Record<string, Record<string, { code: string; type: string; batches: string[] }>>>>;
  batches: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AccessCode {
  id: string;
  code: string;
  sessionId: string;
  facultyId: string;
  collegeId: string;
  used: boolean;
  usedAt?: Timestamp;
  expiresAt: Timestamp;
  createdAt: Timestamp;
}

// Legacy types for backward compatibility
export interface FeedbackCycle {
  id: string;
  name: string;
  title?: string;
  description?: string;
  collegeId: string;
  startDate: Timestamp;
  endDate: Timestamp;
  accessMode: 'anonymous' | 'authenticated' | 'mixed';
  status: 'draft' | 'active' | 'completed';
  createdAt: Timestamp;
}

// ============================================================================
// COLLEGES API
// ============================================================================

export const collegesApi = {
  getAll: async (): Promise<College[]> => {
    const querySnapshot = await getDocs(collection(db, 'colleges'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as College));
  },

  getById: async (id: string): Promise<College | null> => {
    const docSnap = await getDoc(doc(db, 'colleges', id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as College;
    }
    return null;
  },

  getByCode: async (code: string): Promise<College | null> => {
    const q = query(collection(db, 'colleges'), where('code', '==', code));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as College;
    }
    return null;
  },

  create: async (college: Omit<College, 'id' | 'createdAt' | 'updatedAt'>): Promise<College> => {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'colleges'), {
      ...college,
      createdAt: now,
      updatedAt: now,
    });
    return { id: docRef.id, ...college, createdAt: now, updatedAt: now };
  },

  update: async (id: string, updates: Partial<Omit<College, 'id' | 'createdAt'>>): Promise<College | null> => {
    const docRef = doc(db, 'colleges', id);
    await updateDoc(docRef, { ...updates, updatedAt: Timestamp.now() });
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return { id: updatedDoc.id, ...updatedDoc.data() } as College;
    }
    return null;
  },
};

// ============================================================================
// USERS API
// ============================================================================

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  },

  getById: async (id: string): Promise<User | null> => {
    const docSnap = await getDoc(doc(db, 'users', id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
  },

  getByEmail: async (email: string): Promise<User | undefined> => {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as User;
    }
    return undefined;
  },

  getByCollege: async (collegeId: string): Promise<User[]> => {
    const q = query(collection(db, 'users'), where('collegeId', '==', collegeId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  },

  getByRole: async (collegeId: string, role: User['role']): Promise<User[]> => {
    const q = query(
      collection(db, 'users'),
      where('collegeId', '==', collegeId),
      where('role', '==', role)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  },

  create: async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, id?: string): Promise<User> => {
    const now = Timestamp.now();
    const userData = { ...user, createdAt: now, updatedAt: now };
    
    if (id) {
      await setDoc(doc(db, 'users', id), userData);
      return { id, ...userData };
    } else {
      const docRef = await addDoc(collection(db, 'users'), userData);
      return { id: docRef.id, ...userData };
    }
  },

  update: async (id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> => {
    try {
      await updateDoc(doc(db, 'users', id), { ...updates, updatedAt: Timestamp.now() });
      const updatedDoc = await getDoc(doc(db, 'users', id));
      if (updatedDoc.exists()) {
        return { id: updatedDoc.id, ...updatedDoc.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  },

  updateLastLogin: async (id: string): Promise<void> => {
    await updateDoc(doc(db, 'users', id), { lastLoginAt: Timestamp.now() });
  },
};

// ============================================================================
// DEPARTMENTS API
// ============================================================================

export const departmentsApi = {
  getAll: async (): Promise<Department[]> => {
    const querySnapshot = await getDocs(collection(db, 'departments'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
  },

  getById: async (id: string): Promise<Department | null> => {
    const docSnap = await getDoc(doc(db, 'departments', id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Department;
    }
    return null;
  },

  getByCollege: async (collegeId: string): Promise<Department[]> => {
    const q = query(collection(db, 'departments'), where('collegeId', '==', collegeId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
  },

  getActiveByCollege: async (collegeId: string): Promise<Department[]> => {
    const q = query(
      collection(db, 'departments'),
      where('collegeId', '==', collegeId),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
  },

  create: async (department: Omit<Department, 'id' | 'createdAt' | 'updatedAt' | 'facultyCount' | 'activeSessionCount'>): Promise<Department> => {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'departments'), {
      ...department,
      facultyCount: 0,
      activeSessionCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return { id: docRef.id, ...department, facultyCount: 0, activeSessionCount: 0, createdAt: now, updatedAt: now };
  },

  update: async (id: string, updates: Partial<Omit<Department, 'id' | 'createdAt'>>): Promise<Department | null> => {
    const docRef = doc(db, 'departments', id);
    await updateDoc(docRef, { ...updates, updatedAt: Timestamp.now() });
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return { id: updatedDoc.id, ...updatedDoc.data() } as Department;
    }
    return null;
  },

  incrementFacultyCount: async (id: string, delta: number): Promise<void> => {
    await updateDoc(doc(db, 'departments', id), {
      facultyCount: increment(delta),
      updatedAt: Timestamp.now(),
    });
  },

  incrementSessionCount: async (id: string, delta: number): Promise<void> => {
    await updateDoc(doc(db, 'departments', id), {
      activeSessionCount: increment(delta),
      updatedAt: Timestamp.now(),
    });
  },

  getByHodId: async (hodId: string): Promise<Department | null> => {
    const q = query(collection(db, 'departments'), where('hodId', '==', hodId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Department;
    }
    return null;
  },

  getByName: async (name: string, collegeId: string): Promise<Department | null> => {
    const q = query(collection(db, 'departments'), where('name', '==', name), where('collegeId', '==', collegeId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Department;
    }
    return null;
  },
};

// ============================================================================
// FACULTY API
// ============================================================================

export const facultyApi = {
  getAll: async (): Promise<Faculty[]> => {
    const querySnapshot = await getDocs(collection(db, 'faculty'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Faculty));
  },

  getById: async (id: string): Promise<Faculty | null> => {
    const docSnap = await getDoc(doc(db, 'faculty', id));
    if (docSnap.exists()) {
      const facultyData = { id: docSnap.id, ...docSnap.data() } as Omit<Faculty, 'role'>;

      // Fetch role from user document
      try {
        const userDoc = await getDoc(doc(db, 'users', facultyData.userId));
        const role = userDoc.exists() ? (userDoc.data() as User).role : 'faculty';
        return { ...facultyData, role: role as 'faculty' | 'hod' };
      } catch (error) {
        console.error(`Error fetching role for faculty ${id}:`, error);
        return { ...facultyData, role: 'faculty' as const };
      }
    }
    return null;
  },

  getByUserId: async (userId: string): Promise<Faculty | null> => {
    const q = query(collection(db, 'faculty'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const facultyData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Omit<Faculty, 'role'>;

      // Fetch role from user document
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        const role = userDoc.exists() ? (userDoc.data() as User).role : 'faculty';
        return { ...facultyData, role: role as 'faculty' | 'hod' };
      } catch (error) {
        console.error(`Error fetching role for faculty with userId ${userId}:`, error);
        return { ...facultyData, role: 'faculty' as const };
      }
    }
    return null;
  },

  getByCollege: async (collegeId: string): Promise<Faculty[]> => {
    const q = query(collection(db, 'faculty'), where('collegeId', '==', collegeId));
    const querySnapshot = await getDocs(q);
    const facultyData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Omit<Faculty, 'role'>));

    const isAuthenticated = getAuth().currentUser !== null;

    // Fetch roles from user documents only if authenticated
    const facultyWithRoles = await Promise.all(
      facultyData.map(async (faculty) => {
        if (!isAuthenticated) {
          return { ...faculty, role: 'faculty' as const };
        }
        try {
          const userDoc = await getDoc(doc(db, 'users', faculty.userId));
          const role = userDoc.exists() ? (userDoc.data() as User).role : 'faculty';
          return { ...faculty, role: role as 'faculty' | 'hod' };
        } catch (error) {
          console.error(`Error fetching role for faculty ${faculty.id}:`, error);
          return { ...faculty, role: 'faculty' as const };
        }
      })
    );

    return facultyWithRoles;
  },

  getByDepartment: async (departmentIdOrName: string): Promise<Faculty[]> => {
    try {
      // First, try to get department by ID to get its name
      let departmentName = departmentIdOrName;
      try {
        const deptDoc = await getDoc(doc(db, 'departments', departmentIdOrName));
        if (deptDoc.exists()) {
          const deptData = deptDoc.data() as Department;
          departmentName = deptData.name;
        }
      } catch (e) {
        // If not found by ID, assume it's already a department name
        departmentName = departmentIdOrName;
      }

      // Get allocations for this department
      const q = query(collection(db, 'facultyAllocations'), where('department', '==', departmentName));
      const querySnapshot = await getDocs(q);
      const facultyIds = [...new Set(querySnapshot.docs.map(doc => (doc.data() as FacultyAllocation).facultyId))];

      // Get faculty details
      const facultyPromises = facultyIds.map(id => facultyApi.getById(id));
      const facultyList = await Promise.all(facultyPromises);
      return facultyList.filter(f => f !== null) as Faculty[];
    } catch (error) {
      console.error('Error fetching faculty by department:', error);
      return [];
    }
  },

  getActiveByCollege: async (collegeId: string): Promise<Faculty[]> => {
    const q = query(
      collection(db, 'faculty'),
      where('collegeId', '==', collegeId),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    const facultyData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Omit<Faculty, 'role'>));

    // Fetch roles from user documents
    const facultyWithRoles = await Promise.all(
      facultyData.map(async (faculty) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', faculty.userId));
          const role = userDoc.exists() ? (userDoc.data() as User).role : 'faculty';
          return { ...faculty, role: role as 'faculty' | 'hod' };
        } catch (error) {
          console.error(`Error fetching role for faculty ${faculty.id}:`, error);
          return { ...faculty, role: 'faculty' as const };
        }
      })
    );

    return facultyWithRoles;
  },

  create: async (member: Omit<Faculty, 'id' | 'createdAt' | 'updatedAt' | 'stats'>): Promise<Faculty> => {
    const now = Timestamp.now();
    const facultyData = {
      ...member,
      stats: {
        totalSessions: 0,
        totalSubmissions: 0,
        averageRating: 0,
      },
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await addDoc(collection(db, 'faculty'), facultyData);
    
    return { id: docRef.id, ...facultyData };
  },

  update: async (id: string, updates: Partial<Omit<Faculty, 'id' | 'createdAt'>>): Promise<Faculty | null> => {
    const docRef = doc(db, 'faculty', id);
    await updateDoc(docRef, { ...updates, updatedAt: Timestamp.now() });
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return { id: updatedDoc.id, ...updatedDoc.data() } as Faculty;
    }
    return null;
  },

  updateStats: async (id: string, statsUpdate: Partial<Faculty['stats']>): Promise<void> => {
    const faculty = await facultyApi.getById(id);
    if (faculty) {
      await updateDoc(doc(db, 'faculty', id), {
        stats: { ...faculty.stats, ...statsUpdate },
        updatedAt: Timestamp.now(),
      });
    }
  },

  delete: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'faculty', id));
  },
};

// ============================================================================
// FACULTY ALLOCATIONS API
// ============================================================================

export const facultyAllocationsApi = {
  getAll: async (): Promise<FacultyAllocation[]> => {
    const querySnapshot = await getDocs(collection(db, 'facultyAllocations'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FacultyAllocation));
  },

  getById: async (id: string): Promise<FacultyAllocation | null> => {
    const docSnap = await getDoc(doc(db, 'facultyAllocations', id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FacultyAllocation;
    }
    return null;
  },

  getByFaculty: async (facultyId: string): Promise<FacultyAllocation[]> => {
    const q = query(collection(db, 'facultyAllocations'), where('facultyId', '==', facultyId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FacultyAllocation));
  },

  getByCollege: async (collegeId: string): Promise<FacultyAllocation[]> => {
    const q = query(collection(db, 'facultyAllocations'), where('collegeId', '==', collegeId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FacultyAllocation));
  },

  getActiveByCollege: async (collegeId: string): Promise<FacultyAllocation[]> => {
    const q = query(
      collection(db, 'facultyAllocations'),
      where('collegeId', '==', collegeId),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FacultyAllocation));
  },

  create: async (allocation: Omit<FacultyAllocation, 'id' | 'createdAt' | 'updatedAt'>): Promise<FacultyAllocation> => {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'facultyAllocations'), {
      ...allocation,
      createdAt: now,
      updatedAt: now,
    });
    return { id: docRef.id, ...allocation, createdAt: now, updatedAt: now };
  },

  update: async (id: string, updates: Partial<Omit<FacultyAllocation, 'id' | 'createdAt'>>): Promise<FacultyAllocation | null> => {
    const docRef = doc(db, 'facultyAllocations', id);
    await updateDoc(docRef, { ...updates, updatedAt: Timestamp.now() });
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return { id: updatedDoc.id, ...updatedDoc.data() } as FacultyAllocation;
    }
    return null;
  },

  delete: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'facultyAllocations', id));
  },

  checkSubjectConflicts: async (
    collegeId: string,
    course: string,
    department: string,
    year: string,
    subjects: { name: string; code: string; type: 'Theory' | 'Practical' }[],
    excludeFacultyId?: string
  ): Promise<{ subjectName: string; facultyName: string; facultyId: string }[]> => {
    // Fetch all active allocations for the college
    const allocations = await facultyAllocationsApi.getActiveByCollege(collegeId);

    // Filter allocations that match course, department, and include the year
    const relevantAllocations = allocations.filter(
      (alloc) =>
        alloc.course === course &&
        alloc.department === department &&
        alloc.years.includes(year) &&
        alloc.facultyId !== excludeFacultyId
    );

    const conflicts: { subjectName: string; facultyName: string; facultyId: string }[] = [];

    // For each subject, check if it's already allocated
    for (const subject of subjects) {
      for (const alloc of relevantAllocations) {
        const hasSubject = alloc.subjects.some(
          (s) => s.name === subject.name && s.code === subject.code
        );
        if (hasSubject) {
          // Fetch faculty name
          const faculty = await facultyApi.getById(alloc.facultyId);
          if (faculty) {
            conflicts.push({
              subjectName: subject.name,
              facultyName: faculty.name,
              facultyId: alloc.facultyId,
            });
          }
          break; // Only report once per subject
        }
      }
    }

    return conflicts;
  },
};

// ============================================================================
// FEEDBACK SESSIONS API
// ============================================================================

export const feedbackSessionsApi = {
  getAll: async (): Promise<FeedbackSession[]> => {
    const querySnapshot = await getDocs(collection(db, 'feedbackSessions'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSession));
  },

  getById: async (id: string): Promise<FeedbackSession | null> => {
    const docSnap = await getDoc(doc(db, 'feedbackSessions', id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FeedbackSession;
    }
    return null;
  },

  getByUrl: async (url: string): Promise<FeedbackSession | null> => {
    console.log('getByUrl called with url:', url);

    try {
      // Try the indexed query first
      console.log('Trying indexed query...');
      const q = query(collection(db, 'feedbackSessions'), where('uniqueUrl', '==', url));
      const querySnapshot = await getDocs(q);
      console.log('Indexed query result - Empty:', querySnapshot.empty, 'Count:', querySnapshot.docs.length);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        console.log('Found session via indexed query:', doc.id);
        return { id: doc.id, ...doc.data() } as FeedbackSession;
      }

      // If indexed query fails, try getting all sessions and filtering client-side
      console.log('Indexed query returned no results, trying client-side filter...');
      const allSessionsQuery = query(collection(db, 'feedbackSessions'));
      const allSessionsSnapshot = await getDocs(allSessionsQuery);
      console.log('All sessions query returned', allSessionsSnapshot.docs.length, 'documents');

      for (const doc of allSessionsSnapshot.docs) {
        const data = doc.data() as FeedbackSession;
        console.log('Checking session:', doc.id, 'uniqueUrl:', data.uniqueUrl);
        if (data.uniqueUrl === url) {
          console.log('Found session via client-side filter:', doc.id);
          return { id: doc.id, ...data };
        }
      }

      console.log('No session found for url:', url);
      return null;
    } catch (error) {
      console.error('Error in getByUrl:', error);
      throw error;
    }
  },

  getByCollege: async (collegeId: string): Promise<FeedbackSession[]> => {
    const q = query(collection(db, 'feedbackSessions'), where('collegeId', '==', collegeId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSession));
  },

  getActiveByCollege: async (collegeId: string, maxResults = 50): Promise<FeedbackSession[]> => {
    const q = query(
      collection(db, 'feedbackSessions'),
      where('collegeId', '==', collegeId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSession));
  },

  getByFaculty: async (facultyId: string): Promise<FeedbackSession[]> => {
    const q = query(collection(db, 'feedbackSessions'), where('facultyId', '==', facultyId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSession));
  },

  getActiveByFaculty: async (facultyId: string): Promise<FeedbackSession[]> => {
    const q = query(
      collection(db, 'feedbackSessions'),
      where('facultyId', '==', facultyId),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSession));
  },

  getByDepartment: async (departmentId: string): Promise<FeedbackSession[]> => {
    try {
      const q = query(collection(db, 'feedbackSessions'), where('departmentId', '==', departmentId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSession));
    } catch (error) {
      console.error('Error fetching sessions by department:', error);
      return [];
    }
  },

  getActive: async (): Promise<FeedbackSession[]> => {
    const q = query(collection(db, 'feedbackSessions'), where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSession));
  },

  create: async (session: Omit<FeedbackSession, 'id' | 'createdAt' | 'updatedAt' | 'stats'>): Promise<FeedbackSession> => {
    const now = Timestamp.now();
    const sessionData = {
      ...session,
      stats: {
        submissionCount: 0,
        averageRating: 0,
      },
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await addDoc(collection(db, 'feedbackSessions'), sessionData);
    
    // Increment department session count if active
    if (session.isActive) {
      await departmentsApi.incrementSessionCount(session.departmentId, 1);
    }
    
    // Increment faculty session count
    await facultyApi.updateStats(session.facultyId, {
      totalSessions: ((await facultyApi.getById(session.facultyId))?.stats?.totalSessions ?? 0) + 1,
    });
    
    return { id: docRef.id, ...sessionData };
  },

  update: async (id: string, updates: Partial<Omit<FeedbackSession, 'id' | 'createdAt'>>): Promise<FeedbackSession | null> => {
    const docRef = doc(db, 'feedbackSessions', id);
    const currentSession = await feedbackSessionsApi.getById(id);
    
    await updateDoc(docRef, { ...updates, updatedAt: Timestamp.now() });
    
    // Update department session count if isActive changed
    if (currentSession && updates.isActive !== undefined && updates.isActive !== currentSession.isActive) {
      const delta = updates.isActive ? 1 : -1;
      await departmentsApi.incrementSessionCount(currentSession.departmentId, delta);
    }
    
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return { id: updatedDoc.id, ...updatedDoc.data() } as FeedbackSession;
    }
    return null;
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      const session = await feedbackSessionsApi.getById(id);
      if (session?.isActive) {
        await departmentsApi.incrementSessionCount(session.departmentId, -1);
      }
      await deleteDoc(doc(db, 'feedbackSessions', id));
      return true;
    } catch {
      return false;
    }
  },

  // Legacy methods for backward compatibility
  getByCourse: async (course: string): Promise<FeedbackSession[]> => {
    const q = query(collection(db, 'feedbackSessions'), where('course', '==', course));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSession));
  },

  getByAcademicYear: async (academicYear: string): Promise<FeedbackSession[]> => {
    const q = query(collection(db, 'feedbackSessions'), where('academicYear', '==', academicYear));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSession));
  },

  getBySubject: async (subject: string): Promise<FeedbackSession[]> => {
    const q = query(collection(db, 'feedbackSessions'), where('subject', '==', subject));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSession));
  },
};

// ============================================================================
// FEEDBACK SUBMISSIONS API
// ============================================================================

export const submissionsApi = {
  getAll: async (): Promise<FeedbackSubmission[]> => {
    const querySnapshot = await getDocs(collection(db, 'feedbackSubmissions'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSubmission));
  },

  getById: async (id: string): Promise<FeedbackSubmission | null> => {
    const docSnap = await getDoc(doc(db, 'feedbackSubmissions', id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FeedbackSubmission;
    }
    return null;
  },

  getBySession: async (sessionId: string): Promise<FeedbackSubmission[]> => {
    const q = query(collection(db, 'feedbackSubmissions'), where('sessionId', '==', sessionId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSubmission));
  },

  getByCollege: async (collegeId: string): Promise<FeedbackSubmission[]> => {
    const q = query(collection(db, 'feedbackSubmissions'), where('collegeId', '==', collegeId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSubmission));
  },

  getByCollegeRecent: async (collegeId: string, maxResults = 100): Promise<FeedbackSubmission[]> => {
    const q = query(
      collection(db, 'feedbackSubmissions'),
      where('collegeId', '==', collegeId),
      orderBy('submittedAt', 'desc'),
      limit(maxResults)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSubmission));
  },

  getByFaculty: async (facultyId: string): Promise<FeedbackSubmission[]> => {
    const q = query(collection(db, 'feedbackSubmissions'), where('facultyId', '==', facultyId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSubmission));
  },

  getByFacultyRecent: async (facultyId: string, maxResults = 50): Promise<FeedbackSubmission[]> => {
    const q = query(
      collection(db, 'feedbackSubmissions'),
      where('facultyId', '==', facultyId),
      orderBy('submittedAt', 'desc'),
      limit(maxResults)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSubmission));
  },

  getByDepartment: async (departmentId: string): Promise<FeedbackSubmission[]> => {
    try {
      const q = query(collection(db, 'feedbackSubmissions'), where('departmentId', '==', departmentId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSubmission));
    } catch (error) {
      console.error('Error fetching submissions by department:', error);
      return [];
    }
  },

  create: async (submission: Omit<FeedbackSubmission, 'id' | 'submittedAt' | 'metrics'>): Promise<FeedbackSubmission> => {
    const now = Timestamp.now();
    
    // Calculate metrics
    const ratings = submission.responses.filter(r => r.rating).map(r => r.rating!);
    const overallRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    
    const categoryRatings: Record<string, number> = {};
    const categoryGroups: Record<string, number[]> = {};
    
    submission.responses.forEach(r => {
      if (r.rating && r.questionCategory) {
        if (!categoryGroups[r.questionCategory]) {
          categoryGroups[r.questionCategory] = [];
        }
        categoryGroups[r.questionCategory].push(r.rating);
      }
    });
    
    Object.entries(categoryGroups).forEach(([cat, catRatings]) => {
      categoryRatings[cat] = catRatings.reduce((a, b) => a + b, 0) / catRatings.length;
    });
    
    const comments = submission.responses.filter(r => r.comment && r.comment.trim());
    
    const submissionData = {
      ...submission,
      metrics: {
        overallRating,
        categoryRatings,
        hasComments: comments.length > 0,
        commentCount: comments.length,
      },
      submittedAt: now,
    };
    
    const isAuthenticated = getAuth().currentUser !== null;
    
    if (isAuthenticated) {
      // Use transaction to update stats atomically for authenticated users
      const docRef = await runTransaction(db, async (transaction) => {
        // First, read all documents we need to update
        const sessionRef = doc(db, 'feedbackSessions', submission.sessionId);
        const sessionDoc = await transaction.get(sessionRef);
        
        const facultyRef = doc(db, 'faculty', submission.facultyId);
        const facultyDoc = await transaction.get(facultyRef);
        
        // Now perform all writes
        // Create submission
        const subRef = doc(collection(db, 'feedbackSubmissions'));
        transaction.set(subRef, submissionData);
        
        // Update session stats
        if (sessionDoc.exists()) {
          const sessionData = sessionDoc.data() as FeedbackSession;
          const newCount = (sessionData.stats?.submissionCount || 0) + 1;
          const oldTotal = (sessionData.stats?.submissionCount || 0) * (sessionData.stats?.averageRating || 0);
          const newAvg = (oldTotal + overallRating) / newCount;
          
          transaction.update(sessionRef, {
            'stats.submissionCount': newCount,
            'stats.averageRating': newAvg,
            'stats.lastSubmissionAt': now,
            updatedAt: now,
          });
        }
        
        // Update faculty stats
        if (facultyDoc.exists()) {
          const facultyData = facultyDoc.data() as Faculty;
          const newCount = (facultyData.stats?.totalSubmissions || 0) + 1;
          const oldTotal = (facultyData.stats?.totalSubmissions || 0) * (facultyData.stats?.averageRating || 0);
          const newAvg = (oldTotal + overallRating) / newCount;
          
          transaction.update(facultyRef, {
            'stats.totalSubmissions': newCount,
            'stats.averageRating': newAvg,
            'stats.lastFeedbackAt': now,
            updatedAt: now,
          });
        }
        
        return subRef;
      });
      
      // Update feedbackStats collection (non-transactional for performance)
      await updateFeedbackStats(submission.collegeId, submission.departmentId, submission.facultyId, submission.sessionId, overallRating, categoryRatings, comments, now);
      
      return { id: docRef.id, ...submissionData };
    } else {
      // For anonymous users, just create the submission without updating stats
      const docRef = await addDoc(collection(db, 'feedbackSubmissions'), submissionData);
      return { id: docRef.id, ...submissionData };
    }
  },
};

// ============================================================================
// FEEDBACK STATS API
// ============================================================================

interface StatsUpdate {
  type: string;
  entityId: string;
  collegeId: string;
  departmentId?: string;
  facultyId?: string;
}

async function updateFeedbackStats(
  collegeId: string,
  departmentId: string,
  facultyId: string,
  sessionId: string,
  rating: number,
  categoryRatings: Record<string, number>,
  comments: { comment?: string; rating?: number }[],
  timestamp: Timestamp
): Promise<void> {
  const monthKey = new Date().toISOString().slice(0, 7); // "2025-01"
  const ratingBucket = Math.round(rating);
  
  const statsUpdates: StatsUpdate[] = [
    { type: 'college', entityId: collegeId, collegeId },
  ];
  
  // Only add department-dependent stats if departmentId is valid
  if (departmentId) {
    statsUpdates.push(
      { type: 'department', entityId: departmentId, collegeId, departmentId },
      { type: 'faculty', entityId: facultyId, collegeId, departmentId, facultyId },
      { type: 'session', entityId: sessionId, collegeId, departmentId, facultyId }
    );
  }
  
  const batch = writeBatch(db);
  
  for (const update of statsUpdates) {
    const statsId = `${update.type}_${update.entityId}`;
    const statsRef = doc(db, 'feedbackStats', statsId);
    const statsDoc = await getDoc(statsRef);
    
    if (statsDoc.exists()) {
      const data = statsDoc.data() as FeedbackStats;
      const newCount = data.totalSubmissions + 1;
      const newAvg = ((data.totalSubmissions * data.averageRating) + rating) / newCount;
      
      // Update category scores
      const newCategoryScores = { ...data.categoryScores };
      Object.entries(categoryRatings).forEach(([cat, catRating]) => {
        if (newCategoryScores[cat]) {
          const catCount = newCategoryScores[cat].count + 1;
          newCategoryScores[cat] = {
            average: ((newCategoryScores[cat].count * newCategoryScores[cat].average) + catRating) / catCount,
            count: catCount,
          };
        } else {
          newCategoryScores[cat] = { average: catRating, count: 1 };
        }
      });
      
      // Update monthly data
      const newMonthly = { ...data.monthly };
      if (newMonthly[monthKey]) {
        const monthCount = newMonthly[monthKey].submissions + 1;
        newMonthly[monthKey] = {
          submissions: monthCount,
          averageRating: ((newMonthly[monthKey].submissions * newMonthly[monthKey].averageRating) + rating) / monthCount,
        };
      } else {
        newMonthly[monthKey] = { submissions: 1, averageRating: rating };
      }
      
      // Update rating distribution
      const newDist = { ...data.ratingDistribution };
      newDist[ratingBucket] = (newDist[ratingBucket] || 0) + 1;
      
      // Update recent comments
      const newComments = [...data.recentComments];
      comments.forEach(c => {
        if (c.comment) {
          newComments.unshift({
            text: c.comment,
            rating: c.rating || 0,
            submittedAt: timestamp,
          });
        }
      });
      
      batch.update(statsRef, {
        totalSubmissions: newCount,
        averageRating: newAvg,
        categoryScores: newCategoryScores,
        monthly: newMonthly,
        ratingDistribution: newDist,
        'trend.last7Days': increment(1),
        'trend.last30Days': increment(1),
        'trend.last90Days': increment(1),
        recentComments: newComments.slice(0, 10),
        lastUpdated: timestamp,
      });
    } else {
      // Create new stats document
      const initialDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      initialDist[ratingBucket] = 1;
      
      const initialCategoryScores: Record<string, { average: number; count: number }> = {};
      Object.entries(categoryRatings).forEach(([cat, catRating]) => {
        initialCategoryScores[cat] = { average: catRating, count: 1 };
      });
      
      const recentComments = comments
        .filter(c => c.comment)
        .map(c => ({
          text: c.comment!,
          rating: c.rating || 0,
          submittedAt: timestamp,
        }))
        .slice(0, 10);
      
      batch.set(statsRef, {
        id: statsId,
        type: update.type,
        entityId: update.entityId,
        collegeId: update.collegeId,
        ...(update.departmentId && { departmentId: update.departmentId }),
        ...(update.facultyId && { facultyId: update.facultyId }),
        totalSubmissions: 1,
        averageRating: rating,
        categoryScores: initialCategoryScores,
        monthly: { [monthKey]: { submissions: 1, averageRating: rating } },
        ratingDistribution: initialDist,
        trend: { last7Days: 1, last30Days: 1, last90Days: 1 },
        recentComments,
        lastUpdated: timestamp,
      });
    }
  }
  
  await batch.commit();
}

export const feedbackStatsApi = {
  getByCollege: async (collegeId: string): Promise<FeedbackStats | null> => {
    const statsId = `college_${collegeId}`;
    const docSnap = await getDoc(doc(db, 'feedbackStats', statsId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FeedbackStats;
    }
    return null;
  },

  getByDepartment: async (departmentId: string): Promise<FeedbackStats | null> => {
    const statsId = `department_${departmentId}`;
    const docSnap = await getDoc(doc(db, 'feedbackStats', statsId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FeedbackStats;
    }
    return null;
  },

  getByFaculty: async (facultyId: string): Promise<FeedbackStats | null> => {
    const statsId = `faculty_${facultyId}`;
    const docSnap = await getDoc(doc(db, 'feedbackStats', statsId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FeedbackStats;
    }
    return null;
  },

  getBySession: async (sessionId: string): Promise<FeedbackStats | null> => {
    const statsId = `session_${sessionId}`;
    const docSnap = await getDoc(doc(db, 'feedbackStats', statsId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FeedbackStats;
    }
    return null;
  },

  getAllByCollege: async (collegeId: string): Promise<FeedbackStats[]> => {
    const q = query(collection(db, 'feedbackStats'), where('collegeId', '==', collegeId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackStats));
  },

  getDepartmentStats: async (collegeId: string): Promise<FeedbackStats[]> => {
    const q = query(
      collection(db, 'feedbackStats'),
      where('type', '==', 'department'),
      where('collegeId', '==', collegeId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackStats));
  },

  getFacultyStats: async (collegeId: string): Promise<FeedbackStats[]> => {
    const q = query(
      collection(db, 'feedbackStats'),
      where('type', '==', 'faculty'),
      where('collegeId', '==', collegeId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackStats));
  },
};

// ============================================================================
// ACADEMIC CONFIG API
// ============================================================================

export const academicConfigApi = {
  getByCollege: async (collegeId: string): Promise<AcademicConfig | null> => {
    const q = query(collection(db, 'academicConfigs'), where('collegeId', '==', collegeId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as AcademicConfig;
    }
    return null;
  },

  create: async (config: Omit<AcademicConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<AcademicConfig> => {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'academicConfigs'), {
      ...config,
      createdAt: now,
      updatedAt: now,
    });
    return { id: docRef.id, ...config, createdAt: now, updatedAt: now };
  },

  update: async (id: string, updates: Partial<Omit<AcademicConfig, 'id' | 'createdAt'>>): Promise<AcademicConfig | null> => {
    try {
      await updateDoc(doc(db, 'academicConfigs', id), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      const updatedDoc = await getDoc(doc(db, 'academicConfigs', id));
      if (updatedDoc.exists()) {
        return { id: updatedDoc.id, ...updatedDoc.data() } as AcademicConfig;
      }
      return null;
    } catch (error) {
      console.error('Error updating academic config:', error);
      return null;
    }
  },

  upsert: async (collegeId: string, config: Omit<AcademicConfig, 'id' | 'collegeId' | 'createdAt' | 'updatedAt'>): Promise<AcademicConfig> => {
    const existing = await academicConfigApi.getByCollege(collegeId);
    if (existing) {
      return await academicConfigApi.update(existing.id, config) || existing;
    } else {
      return await academicConfigApi.create({ ...config, collegeId });
    }
  },
};

// ============================================================================
// QUESTION GROUPS API
// ============================================================================

export const questionGroupsApi = {
  getAll: async (): Promise<QuestionGroup[]> => {
    const querySnapshot = await getDocs(collection(db, 'questionGroups'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuestionGroup));
  },

  getById: async (id: string): Promise<QuestionGroup | null> => {
    const docSnap = await getDoc(doc(db, 'questionGroups', id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as QuestionGroup;
    }
    return null;
  },

  getByCollege: async (collegeId: string): Promise<QuestionGroup[]> => {
    const q = query(collection(db, 'questionGroups'), where('collegeId', '==', collegeId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuestionGroup));
  },

  create: async (group: Omit<QuestionGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<QuestionGroup> => {
    const now = Timestamp.now();
    
    // Filter out undefined values to prevent Firestore errors
    const cleanGroup: Record<string, FirestoreFieldValue> = {};
    Object.entries(group).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanGroup[key] = value;
      }
    });
    
    const docRef = await addDoc(collection(db, 'questionGroups'), {
      ...cleanGroup,
      createdAt: now,
      updatedAt: now,
    });
    return { id: docRef.id, ...group, createdAt: now, updatedAt: now };
  },

  update: async (id: string, updates: Partial<Omit<QuestionGroup, 'id' | 'createdAt'>>): Promise<QuestionGroup | null> => {
    const docRef = doc(db, 'questionGroups', id);
    
    // Filter out undefined values to prevent Firestore errors
    const cleanUpdates: Record<string, FirestoreFieldValue> = { updatedAt: Timestamp.now() };
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    });
    
    await updateDoc(docRef, cleanUpdates);
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return { id: updatedDoc.id, ...updatedDoc.data() } as QuestionGroup;
    }
    return null;
  },

  delete: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'questionGroups', id));
  },

  cloneToCollege: async (groupId: string, targetCollegeId: string): Promise<QuestionGroup> => {
    // Get the original group
    const originalGroup = await questionGroupsApi.getById(groupId);
    if (!originalGroup) {
      throw new Error('Question group not found');
    }

    // Create new group for target college
    const newGroup = await questionGroupsApi.create({
      collegeId: targetCollegeId,
      name: originalGroup.name,
      description: originalGroup.description || undefined,
      isActive: true,
    });

    // Get all questions from the original group
    const originalQuestions = await questionsApi.getByGroup(groupId);

    // Clone each question to the new group
    for (const question of originalQuestions) {
      await questionsApi.create({
        collegeId: targetCollegeId,
        groupId: newGroup.id,
        category: question.category,
        text: question.text,
        helpText: question.helpText,
        responseType: question.responseType,
        options: question.options,
        required: question.required,
        minLength: question.minLength,
        maxLength: question.maxLength,
        order: question.order,
        categoryOrder: question.categoryOrder,
        isActive: true,
      });
    }

    return newGroup;
  },
};

// ============================================================================
// QUESTIONS API
// ============================================================================

export const questionsApi = {
  getAll: async (): Promise<Question[]> => {
    const querySnapshot = await getDocs(collection(db, 'questions'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
  },

  getById: async (id: string): Promise<Question | null> => {
    const docSnap = await getDoc(doc(db, 'questions', id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Question;
    }
    return null;
  },

  getByCollege: async (collegeId: string): Promise<Question[]> => {
    const q = query(collection(db, 'questions'), where('collegeId', '==', collegeId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
  },

  getActiveByCollege: async (collegeId: string): Promise<Question[]> => {
    const q = query(
      collection(db, 'questions'),
      where('collegeId', '==', collegeId),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
  },

  getByGroup: async (groupId: string): Promise<Question[]> => {
    const q = query(
      collection(db, 'questions'), 
      where('groupId', '==', groupId),
      where('isActive', '==', true),
      orderBy('order', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
  },

  create: async (question: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Promise<Question> => {
    const now = Timestamp.now();
    
    // Filter out undefined values to prevent Firestore errors
    const cleanQuestion: Record<string, FirestoreFieldValue> = {};
    Object.entries(question).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanQuestion[key] = value;
      }
    });
    
    const docRef = await addDoc(collection(db, 'questions'), {
      ...cleanQuestion,
      createdAt: now,
      updatedAt: now,
    });
    return { id: docRef.id, ...question, createdAt: now, updatedAt: now };
  },

  update: async (id: string, updates: Partial<Omit<Question, 'id' | 'createdAt'>>): Promise<Question | null> => {
    const docRef = doc(db, 'questions', id);
    
    // Filter out undefined values to prevent Firestore errors
    const cleanUpdates: Record<string, FirestoreFieldValue> = { updatedAt: Timestamp.now() };
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    });
    
    await updateDoc(docRef, cleanUpdates);
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return { id: updatedDoc.id, ...updatedDoc.data() } as Question;
    }
    return null;
  },

  delete: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'questions', id));
  },
};

export const accessCodesApi = {
  getAll: async (): Promise<AccessCode[]> => {
    const querySnapshot = await getDocs(collection(db, 'accessCodes'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessCode));
  },

  getByCode: async (code: string): Promise<AccessCode | undefined> => {
    const q = query(collection(db, 'accessCodes'), where('code', '==', code));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as AccessCode;
    }
    return undefined;
  },

  getBySession: async (sessionId: string): Promise<AccessCode[]> => {
    const q = query(collection(db, 'accessCodes'), where('sessionId', '==', sessionId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessCode));
  },

  getUnusedBySession: async (sessionId: string): Promise<AccessCode[]> => {
    const q = query(
      collection(db, 'accessCodes'),
      where('sessionId', '==', sessionId),
      where('used', '==', false)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessCode));
  },

  create: async (accessCode: Omit<AccessCode, 'id' | 'createdAt'>): Promise<AccessCode> => {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'accessCodes'), {
      ...accessCode,
      createdAt: now,
    });
    return { id: docRef.id, ...accessCode, createdAt: now };
  },

  markUsed: async (id: string): Promise<void> => {
    const docRef = doc(db, 'accessCodes', id);
    await updateDoc(docRef, { used: true, usedAt: Timestamp.now() });
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'accessCodes', id));
      return true;
    } catch {
      return false;
    }
  },
};

// ============================================================================
// LEGACY FEEDBACK CYCLES API (for backward compatibility)
// ============================================================================

export const feedbackCyclesApi = {
  getAll: async (): Promise<FeedbackCycle[]> => {
    const querySnapshot = await getDocs(collection(db, 'feedbackCycles'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackCycle));
  },

  getByCollege: async (collegeId: string): Promise<FeedbackCycle[]> => {
    const q = query(collection(db, 'feedbackCycles'), where('collegeId', '==', collegeId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackCycle));
  },

  create: async (cycle: Omit<FeedbackCycle, 'id' | 'createdAt'>): Promise<FeedbackCycle> => {
    const docRef = await addDoc(collection(db, 'feedbackCycles'), {
      ...cycle,
      createdAt: Timestamp.now(),
    });
    return { id: docRef.id, ...cycle, createdAt: Timestamp.now() };
  },

  update: async (id: string, updates: Partial<FeedbackCycle>): Promise<FeedbackCycle | null> => {
    const docRef = doc(db, 'feedbackCycles', id);
    await updateDoc(docRef, updates);
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return { id: updatedDoc.id, ...updatedDoc.data() } as FeedbackCycle;
    }
    return null;
  },
};

// ============================================================================
// DEPRECATED FUNCTIONS
// ============================================================================

export const initializeDemoData = async (): Promise<void> => {
  console.warn('initializeDemoData is deprecated. Use SeedData.tsx instead.');
};

export const resetDemoData = async (): Promise<void> => {
  console.warn('resetDemoData is deprecated.');
};