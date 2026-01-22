// Firebase Firestore utility functions

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
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export { Timestamp };
export interface College {
  id: string;
  name: string;
  code: string;
  createdAt: Timestamp;
}

export interface User {
  id: string;
  email: string;
  role: 'superAdmin' | 'admin' | 'hod' | 'faculty';
  name: string;
  collegeId?: string;
  departmentId?: string;
  createdAt: Timestamp;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  collegeId: string;
  hodId?: string;
  createdAt: Timestamp;
}

export interface Faculty {
  id: string;
  userId: string;
  employeeId: string;
  name: string;
  email: string;
  designation: string;
  specialization: string;
  experience: number;
  qualifications: string;
  researchInterests: string[];
  publications: number;
  teachingSubjects: string[];
  achievements: string[];
  departmentId: string;
  collegeId: string;
  subjects: string[];
  createdAt: Timestamp;
}

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

export interface AccessCode {
  id: string;
  code: string;
  cycleId: string;
  facultyId: string;
  collegeId: string;
  used: boolean;
  expiresAt: Timestamp;
  createdAt: Timestamp;
}

export interface FeedbackSession {
  id: string;
  collegeId: string;
  departmentId: string;
  facultyId: string;
  course: string;
  academicYear: string;
  subject: string;
  batch: string;
  accessMode: 'anonymous';
  uniqueUrl: string;
  isActive: boolean;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

export interface Question {
  id: string;
  collegeId: string;
  category: string;
  text: string;
  responseType: 'rating' | 'text' | 'both' | 'select' | 'boolean';
  required: boolean;
  order: number;
  createdAt: Timestamp;
  options?: string[];
}

export interface FeedbackSubmission {
  id: string;
  sessionId: string;
  facultyId: string;
  collegeId: string;
  responses: {
    questionId: string;
    rating?: number;
    comment?: string;
    selectValue?: string;
    booleanValue?: boolean;
  }[];
  submittedAt: Timestamp;
}

// Data access functions
export const collegesApi = {
  getAll: async (): Promise<College[]> => {
    const querySnapshot = await getDocs(collection(db, 'colleges'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as College));
  },

  create: async (college: Omit<College, 'id' | 'createdAt'>): Promise<College> => {
    const docRef = await addDoc(collection(db, 'colleges'), {
      ...college,
      createdAt: Timestamp.now(),
    });
    return { id: docRef.id, ...college, createdAt: Timestamp.now() };
  },
};

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
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

  create: async (user: Omit<User, 'id' | 'createdAt'>, id?: string): Promise<User> => {
    if (id) {
      // Use setDoc with specific ID (for Auth users)
      await setDoc(doc(db, 'users', id), {
        ...user,
        createdAt: Timestamp.now(),
      });
      return { id, ...user, createdAt: Timestamp.now() };
    } else {
      // Use addDoc for auto-generated ID
      const docRef = await addDoc(collection(db, 'users'), {
        ...user,
        createdAt: Timestamp.now(),
      });
      return { id: docRef.id, ...user, createdAt: Timestamp.now() };
    }
  },

  update: async (id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> => {
    try {
      await updateDoc(doc(db, 'users', id), updates);
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
};

export const departmentsApi = {
  getAll: async (): Promise<Department[]> => {
    const querySnapshot = await getDocs(collection(db, 'departments'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
  },

  getByCollege: async (collegeId: string): Promise<Department[]> => {
    const q = query(collection(db, 'departments'), where('collegeId', '==', collegeId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
  },

  create: async (department: Omit<Department, 'id' | 'createdAt'>): Promise<Department> => {
    const docRef = await addDoc(collection(db, 'departments'), {
      ...department,
      createdAt: Timestamp.now(),
    });
    return { id: docRef.id, ...department, createdAt: Timestamp.now() };
  },
};

export const facultyApi = {
  getAll: async (): Promise<Faculty[]> => {
    const querySnapshot = await getDocs(collection(db, 'faculty'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Faculty));
  },

  getByCollege: async (collegeId: string): Promise<Faculty[]> => {
    const q = query(collection(db, 'faculty'), where('collegeId', '==', collegeId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Faculty));
  },

  getByDepartment: async (departmentId: string): Promise<Faculty[]> => {
    const q = query(collection(db, 'faculty'), where('departmentId', '==', departmentId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Faculty));
  },

  create: async (member: Omit<Faculty, 'id' | 'createdAt'>): Promise<Faculty> => {
    const docRef = await addDoc(collection(db, 'faculty'), {
      ...member,
      createdAt: Timestamp.now(),
    });
    return { id: docRef.id, ...member, createdAt: Timestamp.now() };
  },
};

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

  create: async (accessCode: Omit<AccessCode, 'id' | 'createdAt'>): Promise<AccessCode> => {
    const docRef = await addDoc(collection(db, 'accessCodes'), {
      ...accessCode,
      createdAt: Timestamp.now(),
    });
    return { id: docRef.id, ...accessCode, createdAt: Timestamp.now() };
  },

  markUsed: async (id: string): Promise<void> => {
    const docRef = doc(db, 'accessCodes', id);
    await updateDoc(docRef, { used: true });
  },
};

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
    const q = query(collection(db, 'feedbackSessions'), where('uniqueUrl', '==', url));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as FeedbackSession;
    }
    return null;
  },

  getByFaculty: async (facultyId: string): Promise<FeedbackSession[]> => {
    const q = query(collection(db, 'feedbackSessions'), where('facultyId', '==', facultyId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSession));
  },

  getByCollege: async (collegeId: string): Promise<FeedbackSession[]> => {
    const q = query(collection(db, 'feedbackSessions'), where('collegeId', '==', collegeId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSession));
  },

  create: async (session: Omit<FeedbackSession, 'id' | 'createdAt'>): Promise<FeedbackSession> => {
    const docRef = await addDoc(collection(db, 'feedbackSessions'), {
      ...session,
      createdAt: Timestamp.now(),
    });
    return { id: docRef.id, ...session, createdAt: Timestamp.now() };
  },

  update: async (id: string, updates: Partial<FeedbackSession>): Promise<FeedbackSession | null> => {
    const docRef = doc(db, 'feedbackSessions', id);
    await updateDoc(docRef, updates);
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return { id: updatedDoc.id, ...updatedDoc.data() } as FeedbackSession;
    }
    return null;
  },

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

  getByDepartment: async (departmentId: string): Promise<FeedbackSession[]> => {
    const q = query(collection(db, 'feedbackSessions'), where('departmentId', '==', departmentId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSession));
  },

  getActive: async (): Promise<FeedbackSession[]> => {
    const q = query(collection(db, 'feedbackSessions'), where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSession));
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'feedbackSessions', id));
      return true;
    } catch {
      return false;
    }
  },
};

export const questionsApi = {
  getAll: async (): Promise<Question[]> => {
    const querySnapshot = await getDocs(collection(db, 'questions'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
  },

  getByCollege: async (collegeId: string): Promise<Question[]> => {
    const q = query(collection(db, 'questions'), where('collegeId', '==', collegeId), orderBy('order'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
  },

  create: async (question: Omit<Question, 'id' | 'createdAt'>): Promise<Question> => {
    const docRef = await addDoc(collection(db, 'questions'), {
      ...question,
      createdAt: Timestamp.now(),
    });
    return { id: docRef.id, ...question, createdAt: Timestamp.now() };
  },
};

export const submissionsApi = {
  getAll: async (): Promise<FeedbackSubmission[]> => {
    const querySnapshot = await getDocs(collection(db, 'feedbackSubmissions'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSubmission));
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

  getByFaculty: async (facultyId: string): Promise<FeedbackSubmission[]> => {
    const q = query(collection(db, 'feedbackSubmissions'), where('facultyId', '==', facultyId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackSubmission));
  },

  create: async (submission: Omit<FeedbackSubmission, 'id' | 'submittedAt'>): Promise<FeedbackSubmission> => {
    const docRef = await addDoc(collection(db, 'feedbackSubmissions'), {
      ...submission,
      submittedAt: Timestamp.now(),
    });
    return { id: docRef.id, ...submission, submittedAt: Timestamp.now() };
  },
};

// Initialize comprehensive demo data for full UI flow demonstration
export const initializeDemoData = async (): Promise<void> => {
  // This function has been moved to SeedData.tsx for proper async Firestore operations
  console.warn('initializeDemoData is deprecated. Use SeedData.tsx instead.');
};

export const resetDemoData = async (): Promise<void> => {
  // This function has been deprecated. Use Firestore operations directly.
  console.warn('resetDemoData is deprecated.');
};
