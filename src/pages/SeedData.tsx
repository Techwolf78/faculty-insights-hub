import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Trash2 } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import {
  collegesApi,
  usersApi,
  departmentsApi,
  facultyApi,
  feedbackCyclesApi,
  accessCodesApi,
  feedbackSessionsApi,
  questionsApi,
  submissionsApi,
  College,
  User,
  Department,
  Faculty,
  FeedbackCycle,
  AccessCode,
  FeedbackSession,
  Question,
  FeedbackSubmission,
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
        'submissions'
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
      // Logout any existing user to ensure clean state
      setMessage('Logging out existing user...');
      await signOut(auth);

      // 1. Create Colleges
      setMessage('Creating colleges...');
      const icemCollege: Omit<College, 'id' | 'createdAt'> = {
        name: 'Indira College of Engineering and Management',
        code: 'ICEM',
      };
      const icem = await collegesApi.create(icemCollege);

      const igsbCollege: Omit<College, 'id' | 'createdAt'> = {
        name: 'Indira Global Business School',
        code: 'IGSB',
      };
      const igsb = await collegesApi.create(igsbCollege);

      setMessage('Colleges created...');

      // 2. Create Users (Super Admin, Admins, HODs, Faculty)
      setMessage('Creating users...');
      const users = [
        // Super Admin
        { email: 'superadmin@facultyhub.com', password: 'password123', role: 'superAdmin' as const, name: 'Super Admin' },
        // ICEM Admin
        { email: 'admin@icem.edu', password: 'password123', role: 'admin' as const, name: 'ICEM Admin', collegeId: icem.id },
        // IGSB Admin
        { email: 'admin@igsb.edu', password: 'password123', role: 'admin' as const, name: 'IGSB Admin', collegeId: igsb.id },
        // ICEM HODs
        { email: 'hod.cs@icem.edu', password: 'password123', role: 'hod' as const, name: 'Dr. Rajesh Kumar', collegeId: icem.id },
        { email: 'hod.ee@icem.edu', password: 'password123', role: 'hod' as const, name: 'Dr. Priya Sharma', collegeId: icem.id },
        // IGSB HODs
        { email: 'hod.mba@igsb.edu', password: 'password123', role: 'hod' as const, name: 'Dr. Amit Singh', collegeId: igsb.id },
        // Faculty
        { email: 'faculty1@icem.edu', password: 'password123', role: 'faculty' as const, name: 'Prof. Anil Gupta', collegeId: icem.id },
        { email: 'faculty2@icem.edu', password: 'password123', role: 'faculty' as const, name: 'Prof. Sunita Patel', collegeId: icem.id },
        { email: 'faculty3@igsb.edu', password: 'password123', role: 'faculty' as const, name: 'Prof. Vikram Rao', collegeId: igsb.id },
      ];

      const createdUsers: User[] = [];
      for (const userData of users) {
        try {
          let userCredential;
          let userId;

          try {
            // Try to create Firebase Auth user
            userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
            userId = userCredential.user.uid;
          } catch (authError: { code?: string }) {
            if (authError.code === 'auth/email-already-in-use') {
              // Auth user already exists, try to sign in to get the UID
              try {
                userCredential = await signInWithEmailAndPassword(auth, userData.email, userData.password);
                userId = userCredential.user.uid;
                // Sign out immediately to not interfere with other operations
                await signOut(auth);
              } catch (signInError) {
                console.error(`❌ Failed to sign in existing user ${userData.email}:`, signInError);
                continue; // Skip this user
              }
            } else {
              console.error(`❌ Failed to create/sign in user ${userData.email}:`, authError);
              continue; // Skip this user
            }
          }

          // Always try to create/update the Firestore user document
          try {
            const user = await usersApi.create(userData, userId);
            createdUsers.push(user);
          } catch (createError) {
            console.error(`❌ Failed to create/update Firestore user: ${userData.email}`, createError);
            // Try to get existing user as fallback
            try {
              const existingUser = await usersApi.getByEmail(userData.email);
              if (existingUser) {
                createdUsers.push(existingUser);
              } else {
                console.error(`❌ No existing user found for: ${userData.email}`);
                continue; // Skip this user
              }
            } catch (getError) {
              console.error(`❌ Failed to get existing user: ${userData.email}`, getError);
              continue; // Skip this user
            }
          }
        } catch (userError) {
          console.error(`❌ Failed to process user ${userData.email}:`, userError);
          // Continue with other users
        }
      }

      setMessage('Users created...');

      // 3. Create Departments
      setMessage('Creating departments...');
      const departments = [
        { name: 'Computer Science', code: 'CS', collegeId: icem.id, hodId: createdUsers.find(u => u.email === 'hod.cs@icem.edu')?.id },
        { name: 'Electrical Engineering', code: 'EE', collegeId: icem.id, hodId: createdUsers.find(u => u.email === 'hod.ee@icem.edu')?.id },
        { name: 'MBA', code: 'MBA', collegeId: igsb.id, hodId: createdUsers.find(u => u.email === 'hod.mba@igsb.edu')?.id },
      ];

      const createdDepartments: Department[] = [];
      for (const dept of departments) {
        try {
          const department = await departmentsApi.create(dept);
          createdDepartments.push(department);
        } catch (deptError) {
          console.error(`Failed to create department ${dept.name}:`, deptError);
        }
      }

      setMessage('Departments created...');

      // Update users with departmentId
      const csDept = createdDepartments.find(d => d.code === 'CS');
      const eeDept = createdDepartments.find(d => d.code === 'EE');
      const mbaDept = createdDepartments.find(d => d.code === 'MBA');

      // Update HODs
      if (csDept) {
        try {
          const csHod = createdUsers.find(u => u.email === 'hod.cs@icem.edu');
          if (csHod) {
            await usersApi.update(csHod.id, { departmentId: csDept.id });
          }
        } catch (updateError) {
          console.error('Failed to update CS HOD:', updateError);
        }
      }
      if (eeDept) {
        try {
          const eeHod = createdUsers.find(u => u.email === 'hod.ee@icem.edu');
          if (eeHod) {
            await usersApi.update(eeHod.id, { departmentId: eeDept.id });
          }
        } catch (updateError) {
          console.error('Failed to update EE HOD:', updateError);
        }
      }
      if (mbaDept) {
        try {
          const mbaHod = createdUsers.find(u => u.email === 'hod.mba@igsb.edu');
          if (mbaHod) {
            await usersApi.update(mbaHod.id, { departmentId: mbaDept.id });
          }
        } catch (updateError) {
          console.error('Failed to update MBA HOD:', updateError);
        }
      }

      // 4. Create Faculty profiles
      setMessage('Creating faculty profiles...');
      const facultyProfiles: Omit<Faculty, 'id' | 'createdAt'>[] = [
        {
          userId: createdUsers.find(u => u.email === 'faculty1@icem.edu')!.id,
          employeeId: 'F001',
          name: 'Prof. Anil Gupta',
          email: 'faculty1@icem.edu',
          designation: 'Assistant Professor',
          specialization: 'Data Structures',
          experience: 8,
          qualifications: 'M.Tech, PhD',
          researchInterests: ['AI', 'Machine Learning'],
          publications: 15,
          teachingSubjects: ['DSA', 'Algorithms'],
          achievements: ['Best Teacher Award'],
          departmentId: csDept!.id,
          collegeId: icem.id,
          subjects: ['Data Structures', 'Algorithms'],
        },
        {
          userId: createdUsers.find(u => u.email === 'faculty2@icem.edu')!.id,
          employeeId: 'F002',
          name: 'Prof. Sunita Patel',
          email: 'faculty2@icem.edu',
          designation: 'Associate Professor',
          specialization: 'Power Systems',
          experience: 12,
          qualifications: 'M.Tech, PhD',
          researchInterests: ['Renewable Energy'],
          publications: 20,
          teachingSubjects: ['Electrical Machines', 'Power Systems'],
          achievements: ['Research Excellence Award'],
          departmentId: eeDept!.id,
          collegeId: icem.id,
          subjects: ['Electrical Machines', 'Power Systems'],
        },
        {
          userId: createdUsers.find(u => u.email === 'faculty3@igsb.edu')!.id,
          employeeId: 'F003',
          name: 'Prof. Vikram Rao',
          email: 'faculty3@igsb.edu',
          designation: 'Professor',
          specialization: 'Marketing',
          experience: 15,
          qualifications: 'MBA, PhD',
          researchInterests: ['Digital Marketing'],
          publications: 25,
          teachingSubjects: ['Marketing Management', 'Consumer Behavior'],
          achievements: ['Best Researcher Award'],
          departmentId: mbaDept!.id,
          collegeId: igsb.id,
          subjects: ['Marketing Management', 'Consumer Behavior'],
        },
      ];

      for (const faculty of facultyProfiles) {
        try {
          await facultyApi.create(faculty);
        } catch (facultyError) {
          console.error(`Failed to create faculty ${faculty.name}:`, facultyError);
        }
      }

      setMessage('Faculty profiles created...');

      // 5. Create Questions
      setMessage('Creating questions...');
      const questions: Omit<Question, 'id' | 'createdAt'>[] = [
        { collegeId: icem.id, category: 'Teaching', text: 'How would you rate the teacher\'s knowledge of the subject?', responseType: 'rating', required: true, order: 1 },
        { collegeId: icem.id, category: 'Teaching', text: 'How effective was the teaching methodology?', responseType: 'rating', required: true, order: 2 },
        { collegeId: icem.id, category: 'Teaching', text: 'Was the course material helpful?', responseType: 'rating', required: true, order: 3 },
        { collegeId: icem.id, category: 'Communication', text: 'How clear was the teacher\'s communication?', responseType: 'rating', required: true, order: 4 },
        { collegeId: icem.id, category: 'Overall', text: 'Overall satisfaction with the teacher', responseType: 'rating', required: true, order: 5 },
        { collegeId: icem.id, category: 'Comments', text: 'Any additional comments or suggestions?', responseType: 'text', required: false, order: 6 },
        { collegeId: igsb.id, category: 'Teaching', text: 'How would you rate the faculty\'s subject expertise?', responseType: 'rating', required: true, order: 1 },
        { collegeId: igsb.id, category: 'Teaching', text: 'How engaging were the lectures?', responseType: 'rating', required: true, order: 2 },
        { collegeId: igsb.id, category: 'Communication', text: 'How approachable was the faculty?', responseType: 'rating', required: true, order: 3 },
        { collegeId: igsb.id, category: 'Overall', text: 'Overall experience with the faculty', responseType: 'rating', required: true, order: 4 },
        { collegeId: igsb.id, category: 'Comments', text: 'Suggestions for improvement?', responseType: 'text', required: false, order: 5 },
      ];

      const createdQuestions: Question[] = [];
      for (const q of questions) {
        try {
          const question = await questionsApi.create(q);
          createdQuestions.push(question);
        } catch (qError) {
          console.error(`Failed to create question:`, qError);
        }
      }

      setMessage('Questions created...');

      // 6. Create Feedback Cycles
      setMessage('Creating feedback cycles...');
      const cycles: Omit<FeedbackCycle, 'id' | 'createdAt'>[] = [
        {
          name: 'Semester 1 2025',
          title: 'Mid-Semester Feedback',
          description: 'Feedback for first half of semester',
          collegeId: icem.id,
          startDate: Timestamp.fromDate(new Date('2025-01-01')),
          endDate: Timestamp.fromDate(new Date('2025-06-30')),
          accessMode: 'anonymous',
          status: 'completed',
        },
        {
          name: 'Semester 2 2025',
          title: 'End-Semester Feedback',
          description: 'Feedback for second half of semester',
          collegeId: icem.id,
          startDate: Timestamp.fromDate(new Date('2025-07-01')),
          endDate: Timestamp.fromDate(new Date('2025-12-31')),
          accessMode: 'anonymous',
          status: 'active',
        },
        {
          name: 'MBA Semester 1 2025',
          title: 'MBA Feedback Cycle',
          description: 'Feedback for MBA program',
          collegeId: igsb.id,
          startDate: Timestamp.fromDate(new Date('2025-01-01')),
          endDate: Timestamp.fromDate(new Date('2025-06-30')),
          accessMode: 'anonymous',
          status: 'completed',
        },
      ];

      const createdCycles: FeedbackCycle[] = [];
      for (const cycle of cycles) {
        try {
          const createdCycle = await feedbackCyclesApi.create(cycle);
          createdCycles.push(createdCycle);
        } catch (cycleError) {
          console.error(`Failed to create cycle ${cycle.name}:`, cycleError);
        }
      }

      setMessage('Feedback cycles created...');

      // 7. Create Feedback Sessions
      setMessage('Creating feedback sessions...');
      const sessions: Omit<FeedbackSession, 'id' | 'createdAt'>[] = [
        {
          collegeId: icem.id,
          departmentId: csDept!.id,
          facultyId: createdUsers.find(u => u.email === 'faculty1@icem.edu')!.id,
          course: 'B.Tech Computer Science',
          academicYear: '3rd Year',
          subject: 'Data Structures',
          batch: 'A',
          accessMode: 'anonymous',
          uniqueUrl: 'ds-cs-a-2025',
          isActive: true,
          expiresAt: Timestamp.fromDate(new Date('2025-12-31')),
        },
        {
          collegeId: icem.id,
          departmentId: eeDept!.id,
          facultyId: createdUsers.find(u => u.email === 'faculty2@icem.edu')!.id,
          course: 'B.Tech Electrical',
          academicYear: '2nd Year',
          subject: 'Electrical Machines',
          batch: 'B',
          accessMode: 'anonymous',
          uniqueUrl: 'em-ee-b-2025',
          isActive: true,
          expiresAt: Timestamp.fromDate(new Date('2025-12-31')),
        },
        {
          collegeId: igsb.id,
          departmentId: mbaDept!.id,
          facultyId: createdUsers.find(u => u.email === 'faculty3@igsb.edu')!.id,
          course: 'MBA',
          academicYear: '1st Year',
          subject: 'Marketing Management',
          batch: 'A',
          accessMode: 'anonymous',
          uniqueUrl: 'mm-mba-a-2025',
          isActive: true,
          expiresAt: Timestamp.fromDate(new Date('2025-12-31')),
        },
      ];

      const createdSessions: FeedbackSession[] = [];
      for (const session of sessions) {
        try {
          const createdSession = await feedbackSessionsApi.create(session);
          createdSessions.push(createdSession);
        } catch (sessionError) {
          console.error(`Failed to create session for ${session.subject}:`, sessionError);
        }
      }

      setMessage('Feedback sessions created...');

      // 8. Create Access Codes
      setMessage('Creating access codes...');
      const accessCodes: Omit<AccessCode, 'id' | 'createdAt'>[] = [];
      for (const session of createdSessions) {
        accessCodes.push({
          code: `CODE-${session.id.slice(0, 8)}`,
          cycleId: createdCycles.find(c => c.collegeId === session.collegeId)!.id,
          facultyId: session.facultyId,
          collegeId: session.collegeId,
          used: false,
          expiresAt: Timestamp.fromDate(new Date('2025-12-31')),
        });
      }

      for (const code of accessCodes) {
        try {
          await accessCodesApi.create(code);
        } catch (codeError) {
          console.error(`Failed to create access code:`, codeError);
        }
      }

      setMessage('Access codes created...');

      // 9. Generate Dummy Feedback Submissions (past few months)
      setMessage('Generating dummy feedback submissions...');
      const submissions: Omit<FeedbackSubmission, 'id' | 'submittedAt'>[] = [];
      const icemQuestions = createdQuestions.filter(q => q.collegeId === icem.id);
      const igsbQuestions = createdQuestions.filter(q => q.collegeId === igsb.id);

      // Generate submissions for past 6 months
      for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);

        for (const session of createdSessions) {
          const questions = session.collegeId === icem.id ? icemQuestions : igsbQuestions;
          const numSubmissions = Math.floor(Math.random() * 20) + 10; // 10-30 submissions per session per month

          for (let j = 0; j < numSubmissions; j++) {
            const responses = questions.map(q => {
              if (q.responseType === 'rating') {
                return { questionId: q.id, rating: Math.floor(Math.random() * 5) + 1 };
              } else if (q.responseType === 'text') {
                const comments = ['Good teacher', 'Needs improvement', 'Excellent', 'Average', 'Very helpful'];
                return { questionId: q.id, comment: comments[Math.floor(Math.random() * comments.length)] };
              }
              return { questionId: q.id };
            });

            submissions.push({
              sessionId: session.id,
              facultyId: session.facultyId,
              collegeId: session.collegeId,
              responses,
            });
          }
        }
      }

      for (const submission of submissions) {
        try {
          await submissionsApi.create(submission);
        } catch (subError) {
          console.error(`Failed to create submission:`, subError);
        }
      }

      setMessage('Dummy feedback submissions created...');

      setMessage('All seed data generated successfully!');

    } catch (err) {
      console.error('Seeding error:', err);
      setError(`Failed to generate seed data: ${err instanceof Error ? err.message : 'Unknown error'}. Check console for details.`);
    } finally {
      // Ensure we're logged out
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error('❌ Error signing out:', signOutError);
      }
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Seed Database</CardTitle>
          <CardDescription>
            Generate comprehensive demo data for testing the Faculty Insights Hub.
            Use "Delete Old Data" first to clear existing data, then "Generate Seed Data" to create fresh demo data including colleges, users, departments, faculty, sessions, and dummy feedback data.
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
              Generate Seed Data
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
            <p><strong>Data Hierarchy:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Colleges → Departments → Faculty → Users</li>
              <li>Colleges → Questions</li>
              <li>Colleges → Feedback Cycles → Access Codes</li>
              <li>Departments → Feedback Sessions → Submissions</li>
              <li>Dummy feedback data for past 6 months</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeedData;