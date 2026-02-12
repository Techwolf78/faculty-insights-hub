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
  facultyApi,
  feedbackSessionsApi,
  submissionsApi,
  questionGroupsApi,
  questionsApi,
  academicConfigApi,
  User,
  College,
  Department,
  Faculty,
  FeedbackSession,
  FeedbackSubmission,
  QuestionGroup,
  Question,
  AcademicConfig,
} from '@/lib/storage';
import { Timestamp } from 'firebase/firestore';
import { saveAcademicConfig } from '@/lib/academicConfig';

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

      // Create departments
      setMessage('Creating departments...');
      const cseDept = await departmentsApi.create({
        collegeId: college.id,
        name: 'Computer Science & Engineering',
        code: 'CSE',
        description: 'Department of Computer Science and Engineering',
        isActive: true,
      });

      const itDept = await departmentsApi.create({
        collegeId: college.id,
        name: 'Information Technology',
        code: 'IT',
        description: 'Department of Information Technology',
        isActive: true,
      });

      setMessage('Departments created successfully!');

      // Create academic configuration
      setMessage('Creating academic configuration...');
      await saveAcademicConfig(college.id, {
        'B.E': {
          years: ['1', '2', '3', '4'],
          yearDepartments: {
            '1': ['Computer Science & Engineering', 'Information Technology'],
            '2': ['Computer Science & Engineering', 'Information Technology'],
            '3': ['Computer Science & Engineering', 'Information Technology'],
            '4': ['Computer Science & Engineering', 'Information Technology'],
          },
          semesters: ['Odd', 'Even'],
        },
      }, {
        'B.E': {
          '1': {
            'Computer Science & Engineering': {
              'Programming Fundamentals': ['A', 'B', 'C', 'D'],
              'Data Structures': ['A', 'B', 'C', 'D'],
              'Mathematics': ['A', 'B', 'C', 'D']
            },
            'Information Technology': {
              'Web Development': ['A', 'B', 'C', 'D'],
              'Networking': ['A', 'B', 'C', 'D'],
              'Mathematics': ['A', 'B', 'C', 'D']
            }
          },
          '2': {
            'Computer Science & Engineering': {
              'Algorithms': ['A', 'B', 'C', 'D'],
              'Operating Systems': ['A', 'B', 'C', 'D'],
              'Database Systems': ['A', 'B', 'C', 'D']
            },
            'Information Technology': {
              'Mobile Development': ['A', 'B', 'C', 'D'],
              'Cloud Computing': ['A', 'B', 'C', 'D'],
              'Cyber Security': ['A', 'B', 'C', 'D']
            }
          }
        }
      });
      setMessage('Academic configuration created successfully!');

      // Create faculty members
      setMessage('Creating faculty members...');

      // Create faculty user accounts
      const faculty1Email = 'john.doe@icem.edu';
      const faculty1Password = 'faculty123';
      const faculty1Credential = await createUserWithEmailAndPassword(auth, faculty1Email, faculty1Password);
      const faculty1User = await usersApi.create({
        email: faculty1Email,
        name: 'Dr. John Doe',
        role: 'faculty' as const,
        collegeId: college.id,
        departmentId: cseDept.id,
        isActive: true,
      }, faculty1Credential.user.uid);

      const faculty1 = await facultyApi.create({
        userId: faculty1User.id,
        collegeId: college.id,
        departmentId: cseDept.id,
        employeeId: 'EMP001',
        name: 'Dr. John Doe',
        email: faculty1Email,
        designation: 'Associate Professor',
        specialization: 'Computer Science',
        highestQualification: 'Ph.D. in Computer Science',
        experience: 8,
        subjects: ['Data Structures', 'Algorithms', 'Operating Systems'],
        subjectCode: 'CS101',
        subjectType: 'Theory',
        course: 'B.E',
        academicYear: '2024-25',
      });

      const faculty2Email = 'jane.smith@icem.edu';
      const faculty2Password = 'faculty123';
      const faculty2Credential = await createUserWithEmailAndPassword(auth, faculty2Email, faculty2Password);
      const faculty2User = await usersApi.create({
        email: faculty2Email,
        name: 'Prof. Jane Smith',
        role: 'faculty' as const,
        collegeId: college.id,
        departmentId: itDept.id,
        isActive: true,
      }, faculty2Credential.user.uid);

      const faculty2 = await facultyApi.create({
        userId: faculty2User.id,
        collegeId: college.id,
        departmentId: itDept.id,
        employeeId: 'EMP002',
        name: 'Prof. Jane Smith',
        email: faculty2Email,
        designation: 'Assistant Professor',
        specialization: 'Information Technology',
        highestQualification: 'M.Tech in Information Technology',
        experience: 5,
        subjects: ['Web Development', 'Networking', 'Cyber Security'],
        subjectCode: 'IT101',
        subjectType: 'Practical',
        course: 'B.E',
        academicYear: '2024-25',
      });

      setMessage('Faculty members created successfully!');

      // Create question group
      setMessage('Creating question group...');
      const questionGroup = await questionGroupsApi.create({
        collegeId: college.id,
        name: 'Standard Faculty Feedback',
        description: 'Standard feedback questions for faculty evaluation',
        isActive: true,
      });

      // Create questions
      setMessage('Creating questions...');
      const questions = [
        {
          collegeId: college.id,
          groupId: questionGroup.id,
          category: 'Teaching Quality',
          text: 'How would you rate the teacher\'s ability to explain concepts clearly?',
          helpText: 'Rate from 1 (Poor) to 5 (Excellent)',
          responseType: 'rating' as const,
          required: true,
          order: 1,
          categoryOrder: 1,
        },
        {
          collegeId: college.id,
          groupId: questionGroup.id,
          category: 'Teaching Quality',
          text: 'How effective was the teacher in maintaining student interest?',
          helpText: 'Rate from 1 (Poor) to 5 (Excellent)',
          responseType: 'rating' as const,
          required: true,
          order: 2,
          categoryOrder: 1,
        },
        {
          collegeId: college.id,
          groupId: questionGroup.id,
          category: 'Course Content',
          text: 'How relevant was the course content to your field of study?',
          helpText: 'Rate from 1 (Poor) to 5 (Excellent)',
          responseType: 'rating' as const,
          required: true,
          order: 3,
          categoryOrder: 2,
        },
        {
          collegeId: college.id,
          groupId: questionGroup.id,
          category: 'Course Content',
          text: 'How well did the assignments and projects help in understanding the subject?',
          helpText: 'Rate from 1 (Poor) to 5 (Excellent)',
          responseType: 'rating' as const,
          required: true,
          order: 4,
          categoryOrder: 2,
        },
        {
          collegeId: college.id,
          groupId: questionGroup.id,
          category: 'Assessment',
          text: 'How fair were the evaluation methods used?',
          helpText: 'Rate from 1 (Poor) to 5 (Excellent)',
          responseType: 'rating' as const,
          required: true,
          order: 5,
          categoryOrder: 3,
        },
        {
          collegeId: college.id,
          groupId: questionGroup.id,
          category: 'Overall',
          text: 'What is your overall rating of this faculty member?',
          helpText: 'Rate from 1 (Poor) to 5 (Excellent)',
          responseType: 'rating' as const,
          required: true,
          order: 6,
          categoryOrder: 4,
        },
        {
          collegeId: college.id,
          groupId: questionGroup.id,
          category: 'Comments',
          text: 'Any additional comments or suggestions for improvement?',
          responseType: 'text' as const,
          required: false,
          minLength: 10,
          maxLength: 500,
          order: 7,
          categoryOrder: 5,
        }
      ];

      const createdQuestions = [];
      for (const q of questions) {
        const question = await questionsApi.create(q);
        createdQuestions.push(question);
      }

      setMessage('Questions created successfully!');

      // Create feedback sessions
      setMessage('Creating feedback sessions...');

      const session1 = await feedbackSessionsApi.create({
        collegeId: college.id,
        departmentId: cseDept.id,
        facultyId: faculty1.id,
        questionGroupId: questionGroup.id,
        course: 'B.E',
        academicYear: '2024-25',
        subject: 'Data Structures',
        batch: 'A',
        semester: 'Odd',
        accessMode: 'anonymous' as const,
        uniqueUrl: `feedback-${Date.now()}-1`,
        isActive: true,
        status: 'active' as const,
        startDate: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days
        createdBy: adminFirebaseUser.uid,
      });

      const session2 = await feedbackSessionsApi.create({
        collegeId: college.id,
        departmentId: itDept.id,
        facultyId: faculty2.id,
        questionGroupId: questionGroup.id,
        course: 'B.E',
        academicYear: '2024-25',
        subject: 'Web Development',
        batch: 'B',
        semester: 'Odd',
        accessMode: 'anonymous' as const,
        uniqueUrl: `feedback-${Date.now()}-2`,
        isActive: true,
        status: 'active' as const,
        startDate: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days
        createdBy: adminFirebaseUser.uid,
      });

      setMessage('Feedback sessions created successfully!');

      // Create sample feedback submissions
      setMessage('Creating sample feedback submissions...');

      // Sample responses for session 1
      const sampleResponses1 = [
        {
          sessionId: session1.id,
          facultyId: faculty1.id,
          collegeId: college.id,
          departmentId: cseDept.id,
          responses: [
            { questionId: createdQuestions[0].id, questionCategory: 'Teaching Quality', rating: 5 },
            { questionId: createdQuestions[1].id, questionCategory: 'Teaching Quality', rating: 4 },
            { questionId: createdQuestions[2].id, questionCategory: 'Course Content', rating: 5 },
            { questionId: createdQuestions[3].id, questionCategory: 'Course Content', rating: 4 },
            { questionId: createdQuestions[4].id, questionCategory: 'Assessment', rating: 5 },
            { questionId: createdQuestions[5].id, questionCategory: 'Overall', rating: 5 },
            { questionId: createdQuestions[6].id, questionCategory: 'Comments', comment: 'Excellent teaching methodology and clear explanations.' },
          ],
        },
        {
          sessionId: session1.id,
          facultyId: faculty1.id,
          collegeId: college.id,
          departmentId: cseDept.id,
          responses: [
            { questionId: createdQuestions[0].id, questionCategory: 'Teaching Quality', rating: 4 },
            { questionId: createdQuestions[1].id, questionCategory: 'Teaching Quality', rating: 4 },
            { questionId: createdQuestions[2].id, questionCategory: 'Course Content', rating: 4 },
            { questionId: createdQuestions[3].id, questionCategory: 'Course Content', rating: 5 },
            { questionId: createdQuestions[4].id, questionCategory: 'Assessment', rating: 4 },
            { questionId: createdQuestions[5].id, questionCategory: 'Overall', rating: 4 },
            { questionId: createdQuestions[6].id, questionCategory: 'Comments', comment: 'Good course content and practical examples.' },
          ],
        },
        {
          sessionId: session1.id,
          facultyId: faculty1.id,
          collegeId: college.id,
          departmentId: cseDept.id,
          responses: [
            { questionId: createdQuestions[0].id, questionCategory: 'Teaching Quality', rating: 5 },
            { questionId: createdQuestions[1].id, questionCategory: 'Teaching Quality', rating: 5 },
            { questionId: createdQuestions[2].id, questionCategory: 'Course Content', rating: 5 },
            { questionId: createdQuestions[3].id, questionCategory: 'Course Content', rating: 5 },
            { questionId: createdQuestions[4].id, questionCategory: 'Assessment', rating: 4 },
            { questionId: createdQuestions[5].id, questionCategory: 'Overall', rating: 5 },
            { questionId: createdQuestions[6].id, questionCategory: 'Comments', comment: 'Outstanding professor with deep knowledge.' },
          ],
        }
      ];

      // Sample responses for session 2
      const sampleResponses2 = [
        {
          sessionId: session2.id,
          facultyId: faculty2.id,
          collegeId: college.id,
          departmentId: itDept.id,
          responses: [
            { questionId: createdQuestions[0].id, questionCategory: 'Teaching Quality', rating: 4 },
            { questionId: createdQuestions[1].id, questionCategory: 'Teaching Quality', rating: 5 },
            { questionId: createdQuestions[2].id, questionCategory: 'Course Content', rating: 4 },
            { questionId: createdQuestions[3].id, questionCategory: 'Course Content', rating: 4 },
            { questionId: createdQuestions[4].id, questionCategory: 'Assessment', rating: 5 },
            { questionId: createdQuestions[5].id, questionCategory: 'Overall', rating: 4 },
            { questionId: createdQuestions[6].id, questionCategory: 'Comments', comment: 'Interactive sessions and good practical knowledge.' },
          ],
        },
        {
          sessionId: session2.id,
          facultyId: faculty2.id,
          collegeId: college.id,
          departmentId: itDept.id,
          responses: [
            { questionId: createdQuestions[0].id, questionCategory: 'Teaching Quality', rating: 5 },
            { questionId: createdQuestions[1].id, questionCategory: 'Teaching Quality', rating: 4 },
            { questionId: createdQuestions[2].id, questionCategory: 'Course Content', rating: 5 },
            { questionId: createdQuestions[3].id, questionCategory: 'Course Content', rating: 5 },
            { questionId: createdQuestions[4].id, questionCategory: 'Assessment', rating: 4 },
            { questionId: createdQuestions[5].id, questionCategory: 'Overall', rating: 5 },
            { questionId: createdQuestions[6].id, questionCategory: 'Comments', comment: 'Excellent web development course with modern technologies.' },
          ],
        }
      ];

      // Create all submissions
      for (const response of [...sampleResponses1, ...sampleResponses2]) {
        await submissionsApi.create(response);
      }

      setMessage('Sample feedback submissions created successfully!');

      setMessage('🎉 Complete setup completed successfully! You can now login and explore the dashboard.');

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
            This creates comprehensive test data including:
            <br />• Super Admin and College Admin accounts
            <br />• Sample college (ICEM) with departments
            <br />• Academic configuration with courses, subjects, and batches
            <br />• Faculty members with profiles
            <br />• Question groups and feedback questions
            <br />• Active feedback sessions
            <br />• Sample feedback submissions with ratings and comments
            <br />
            <strong className="text-red-600">⚠️ This should only be run once during initial deployment.</strong>
            <br />
            <strong className="text-blue-600">🔐 Passwords are encrypted and stored securely in Firestore only.</strong>
            <br />
            <strong>Default Credentials:</strong>
            <br />• Super Admin: superadmin@facultyhub.com / password123
            <br />• College Admin: admin@icem.edu / admin123
            <br />• Faculty: john.doe@icem.edu / faculty123, jane.smith@icem.edu / faculty123
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
              <li>Super Admin and College Admin user accounts (with Firebase Auth)</li>
              <li>Sample college (ICEM) with multiple departments</li>
              <li>Complete academic configuration (courses, subjects, batches)</li>
              <li>Faculty members with detailed profiles</li>
              <li>Question groups and comprehensive feedback questions</li>
              <li>Active feedback sessions for different subjects</li>
              <li>Sample feedback submissions with ratings and comments</li>
            </ul>
            <p className="mt-2"><strong>This provides a complete working demo with:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>College admin dashboard with real data</li>
              <li>Faculty performance analytics</li>
              <li>Department-wise feedback reports</li>
              <li>Active feedback sessions ready for testing</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeedData;