// Migration script to move faculty allocations to separate collection
// Run this in Node.js with proper Firebase setup

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';

// Firebase config - using dev config
const firebaseConfig = {
  apiKey: "AIzaSyBmf_qgSR_f7aY69IzSXHxuWLEo69KzClE",
  authDomain: "feedback-builder-fe792.firebaseapp.com",
  projectId: "feedback-builder-fe792",
  storageBucket: "feedback-builder-fe792.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateFacultyAllocations() {
  console.log('Starting faculty allocation migration...');

  try {
    // Get all faculty
    const facultySnapshot = await getDocs(collection(db, 'faculty'));
    const facultyDocs = facultySnapshot.docs;

    console.log(`Found ${facultyDocs.length} faculty records to migrate`);

    for (const facultyDoc of facultyDocs) {
      const facultyData = facultyDoc.data();
      const facultyId = facultyDoc.id;

      // Create allocation record
      const allocation = {
        facultyId,
        collegeId: facultyData.collegeId,
        course: facultyData.course,
        department: facultyData.departmentId, // assuming departmentId is the name
        years: [facultyData.academicYear],
        subjects: [{
          name: facultyData.subjects[0] || '',
          code: facultyData.subjectCode,
          type: facultyData.subjectType
        }],
        isActive: facultyData.isActive,
        createdAt: facultyData.createdAt || Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Add to facultyAllocations collection
      await addDoc(collection(db, 'facultyAllocations'), allocation);
      console.log(`Migrated allocation for faculty ${facultyData.name}`);

      // Update faculty document - remove allocation fields
      const updatedFaculty = {
        ...facultyData,
        departmentId: undefined,
        subjects: undefined,
        subjectCode: undefined,
        subjectType: undefined,
        course: undefined,
        academicYear: undefined,
        updatedAt: Timestamp.now()
      };

      // Remove undefined fields
      Object.keys(updatedFaculty).forEach(key => {
        if (updatedFaculty[key] === undefined) {
          delete updatedFaculty[key];
        }
      });

      await updateDoc(doc(db, 'faculty', facultyId), updatedFaculty);
      console.log(`Updated faculty record for ${facultyData.name}`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateFacultyAllocations();