import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Trash2 } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import {
  usersApi,
  collegesApi,
  departmentsApi,
  User,
  College,
  Department,
} from '@/lib/storage';
import { Timestamp } from 'firebase/firestore';

const SeedData = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const deleteOldData = async () => {
    setIsDeleting(true);
    setMessage('');
    setError('');

    try {
      setMessage('Deleting old data...');

      // Collections to clear
      const collections = [
        'users',
        'colleges',
        'departments',
        'faculty',
        'feedbackCycles',
        'accessCodes',
        'feedbackSessions',
        'questions',
        'submissions',
        'questionGroups'
      ];

      for (const collectionName of collections) {
        setMessage(`Deleting ${collectionName}...`);
        const querySnapshot = await getDocs(collection(db, collectionName));
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      }

      setMessage('All old data deleted successfully!');

    } catch (err) {
      console.error('Delete error:', err);
      setError(`Failed to delete old data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const generateSeedData = async () => {
    setIsSeeding(true);
    setMessage('');
    setError('');

    try {
      // Check if we're in production
      if (import.meta.env.PROD) {
        throw new Error('Seed data should not be run in production environment!');
      }

      // Only create Super Admin for production setup
      setMessage('Creating super admin...');
      const superAdminEmail = prompt('Enter super admin email:') || 'superadmin@facultyhub.com';
      const superAdminPassword = prompt('Enter super admin password (min 6 characters):') || 'password123';

      if (superAdminPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Create super admin in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, superAdminEmail, superAdminPassword);
      const firebaseUser = userCredential.user;

      const superAdminData = {
        email: superAdminEmail,
        name: 'Super Administrator',
        role: 'superAdmin' as const,
        isActive: true,
      };

      await usersApi.create(superAdminData, firebaseUser.uid);
      setMessage(`Super admin created successfully! Email: ${superAdminEmail}, Password: ${superAdminPassword}`);

      // Create a sample college
      setMessage('Creating sample college...');
      const collegeData = {
        name: 'Indira College of Engineering and Management',
        code: 'ICEM',
        email: 'info@icem.edu',
        phone: '+91-1234567890',
        address: 'Sample Address, City, State',
        website: 'https://www.icem.edu',
        settings: {
          allowAnonymousFeedback: true,
          feedbackReminderDays: 7,
          defaultSessionDuration: 30,
        },
        isActive: true,
      };
      const college = await collegesApi.create(collegeData);
      setMessage('Sample college created successfully!');

      // Create admin user for the college
      setMessage('Creating college admin...');
      const adminEmail = 'admin@icem.edu';
      const adminPassword = 'admin123';

      // Create admin in Firebase Auth
      const adminCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const adminFirebaseUser = adminCredential.user;

      const adminData = {
        email: adminEmail,
        name: 'College Administrator',
        role: 'admin' as const,
        collegeId: college.id,
        isActive: true,
      };

      await usersApi.create(adminData, adminFirebaseUser.uid);
      setMessage(`College admin created successfully! Email: ${adminEmail}, Password: ${adminPassword}`);

      // Create a sample department
      setMessage('Creating sample department...');
      const departmentData = {
        collegeId: college.id,
        name: 'Computer Science & Engineering',
        code: 'CSE',
        description: 'Department of Computer Science and Engineering',
        facultyCount: 0,
        activeSessionCount: 0,
        isActive: true,
      };

      await departmentsApi.create(departmentData);
      setMessage('Sample department created successfully!');

      setMessage('Initial setup completed! You can now login with the super admin or college admin credentials.');

    } catch (err) {
      console.error('Seeding error:', err);
      setError(`Failed to generate seed data: ${err instanceof Error ? err.message : 'Unknown error'}. Check console for details.`);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Initial Setup</CardTitle>
          <CardDescription>
            Production-ready initial setup for the Faculty Insights Hub.
            This creates a super admin, sample college (ICEM), college admin, and a sample department.
            All passwords are encrypted and stored securely in Firestore only.
            <strong className="text-red-600">⚠️ This should only be run once during initial deployment.</strong>
            <br />
            <strong className="text-blue-600">🔐 Passwords are encrypted and stored securely in Firestore only.</strong>
            <br />
            <strong>Default Credentials:</strong>
            <br />• Super Admin: superadmin@facultyhub.com / password123
            <br />• College Admin: admin@icem.edu / admin123
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={deleteOldData}
              disabled={isDeleting || isSeeding}
              variant="destructive"
              className="flex-1"
              size="lg"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isDeleting && <Trash2 className="mr-2 h-4 w-4" />}
              Delete Old Data
            </Button>

            <Button
              onClick={generateSeedData}
              disabled={isSeeding || isDeleting}
              className="flex-1"
              size="lg"
            >
              {isSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Super Admin
            </Button>
          </div>

          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-600">
            <p><strong>What this creates:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Super Admin user account (with Firebase Auth)</li>
            </ul>
            <p className="mt-2"><strong>What you should create manually:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Colleges and Departments (via Admin Dashboard)</li>
              <li>Faculty accounts and profiles</li>
              <li>Question templates and groups</li>
              <li>Feedback sessions and cycles</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeedData;