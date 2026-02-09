import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import {
  useDepartments,
  useFaculty,
  useQuestionGroups,
  useQuestions,
  useSessions,
  useRecentSubmissions,
  useCollege,
  useAcademicConfig,
  useCollegeStats,
  useAllDepartmentStats,
  useAllFacultyStats,
  useAllSubmissions,
} from '@/hooks/useCollegeData';
import {
  departmentsApi,
  facultyApi,
  questionGroupsApi,
  questionsApi,
  feedbackSessionsApi,
  submissionsApi,
  resetDemoData,
  Department,
  Faculty,
  FeedbackSession,
  FeedbackSubmission,
  College,
  QuestionGroup,
  Question,
  collegesApi,
} from '@/lib/storage';
import { SessionForm } from '@/components/admin/SessionForm';
import DepartmentForm from '@/components/admin/DepartmentForm';
import FacultyForm from '@/components/admin/FacultyForm';
import QuestionForm from '@/components/admin/QuestionForm';
import QuestionGroupForm from '@/components/admin/QuestionGroupForm';
import FacultyReport from '@/components/admin/FacultyReport';
import { DepartmentExcelReport } from '@/components/reports/DepartmentExcelReport';
import { CollegeExcelReport } from '@/components/reports/CollegeExcelReport';
import AcademicConfig from '@/components/admin/AcademicConfig';
import LoadTemplate from '@/components/admin/LoadTemplate';
import { SessionTable } from '@/components/admin/SessionTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAcademicConfig, AcademicConfigData } from '@/lib/academicConfig';
import { BarChart3, RefreshCw, Building2, Calendar, Users, FileText, User, TrendingUp, MessageSquare, Plus, Edit, Download, Upload, Trash2, ClipboardCheck, GraduationCap, FileQuestion, Filter, X } from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  ResponsiveContainer,
  BarChart,
  LineChart,
  RadarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Line,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const CHART_COLORS = ['hsl(213, 96%, 16%)', 'hsl(213, 80%, 25%)', 'hsl(213, 60%, 35%)', 'hsl(160, 84%, 39%)'];

const AdminDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // React Query hooks for optimized data fetching
  const { data: departments = [], isLoading: departmentsLoading } = useDepartments(user?.collegeId);
  const { data: faculty = [], isLoading: facultyLoading } = useFaculty(user?.collegeId);
  const { data: questionGroups = [], isLoading: questionGroupsLoading } = useQuestionGroups(user?.collegeId);
  const { data: questions = [], isLoading: questionsLoading } = useQuestions(user?.collegeId);
  const { data: sessions = [], isLoading: sessionsLoading } = useSessions(user?.collegeId);
  const { data: submissions = [], isLoading: submissionsLoading } = useRecentSubmissions(user?.collegeId);
  const { data: allSubmissions = [], isLoading: allSubmissionsLoading } = useAllSubmissions(user?.collegeId);
  const { data: college, isLoading: collegeLoading } = useCollege(user?.collegeId);
  const { data: academicConfig, isLoading: academicConfigLoading } = useAcademicConfig(user?.collegeId);

  // Stats hooks for pre-computed analytics
  const { data: collegeStats, isLoading: collegeStatsLoading } = useCollegeStats(user?.collegeId);
  const { data: departmentStats = [], isLoading: departmentStatsLoading } = useAllDepartmentStats(user?.collegeId);
  const { data: facultyStats = [], isLoading: facultyStatsLoading } = useAllFacultyStats(user?.collegeId);

  const isLoading = departmentsLoading || facultyLoading || questionGroupsLoading || questionsLoading || sessionsLoading || submissionsLoading || collegeLoading || academicConfigLoading || collegeStatsLoading || departmentStatsLoading || facultyStatsLoading;

  // Get current user's department name
  const userDepartmentName = useMemo(() => {
    if (!user?.departmentId || !departments.length) return 'Department';
    const dept = departments.find(d => d.id === user.departmentId);
    return dept?.name || 'Department';
  }, [user?.departmentId, departments]);

  // Refresh function for invalidating queries
  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['departments'] });
    queryClient.invalidateQueries({ queryKey: ['faculty'] });
    queryClient.invalidateQueries({ queryKey: ['questionGroups'] });
    queryClient.invalidateQueries({ queryKey: ['questions'] });
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
    queryClient.invalidateQueries({ queryKey: ['submissions'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  }, [queryClient]);

  // Optimized refresh for session operations only
  const refreshSessions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['sessions', 'college', user?.collegeId] });
    queryClient.invalidateQueries({ queryKey: ['sessions', 'college', user?.collegeId, 'active'] });
  }, [queryClient, user?.collegeId]);

  // Optimistic update for session changes
  const handleOptimisticSessionUpdate = useCallback((sessionId: string, updates: Partial<FeedbackSession>) => {
    // Update the sessions query cache optimistically
    queryClient.setQueryData(
      ['sessions', 'college', user?.collegeId],
      (oldData: FeedbackSession[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(session =>
          session.id === sessionId ? { ...session, ...updates } : session
        );
      }
    );

    // Also update the active sessions query cache
    queryClient.setQueryData(
      ['sessions', 'college', user?.collegeId, 'active'],
      (oldData: FeedbackSession[] | undefined) => {
        if (!oldData) return oldData;
        const updatedSessions = oldData.map(session =>
          session.id === sessionId ? { ...session, ...updates } : session
        );
        return updatedSessions.filter(session => session.isActive);
      }
    );
  }, [queryClient, user?.collegeId]);

  // Session form state
  const [sessionFormOpen, setSessionFormOpen] = useState(false);

  // Session department filter state
  const [sessionDepartmentFilter, setSessionDepartmentFilter] = useState<string>('all');

  // Current tab state for sessions
  const [currentSessionTab, setCurrentSessionTab] = useState<string>('active');

  // Function to get session count for department based on current tab
  const getDepartmentSessionCount = (deptId: string) => {
    let filteredSessions = sessions;
    
    // Filter by tab first
    if (currentSessionTab === 'active') {
      filteredSessions = sessions.filter(s => s.isActive);
    } else if (currentSessionTab === 'inactive') {
      filteredSessions = sessions.filter(s => !s.isActive);
    }
    // For 'all' tab, use all sessions
    
    return filteredSessions.filter(s => s.departmentId === deptId).length;
  };

  // Function to get total count for current tab
  const getTotalSessionCount = () => {
    if (currentSessionTab === 'active') {
      return sessions.filter(s => s.isActive).length;
    } else if (currentSessionTab === 'inactive') {
      return sessions.filter(s => !s.isActive).length;
    }
    return sessions.length;
  };

  // Department form state
  const [departmentFormOpen, setDepartmentFormOpen] = useState(false);

  // Faculty form state
  const [facultyFormOpen, setFacultyFormOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [deletingFaculty, setDeletingFaculty] = useState<Faculty | null>(null);
  const handleEditFaculty = (faculty: Faculty) => {
    setEditingFaculty(faculty);
    setFacultyFormOpen(true);
  };

  const handleFacultyFormClose = () => {
    setFacultyFormOpen(false);
    setEditingFaculty(null);
  };

  const handleDeleteFaculty = async (faculty: Faculty) => {
    try {
      await facultyApi.delete(faculty.id);
      toast.success('Faculty member deleted successfully');
      // Invalidate and refetch faculty data
      queryClient.invalidateQueries({ queryKey: ['faculty', 'college', user?.collegeId] });
    } catch (error) {
      console.error('Error deleting faculty:', error);
      toast.error('Failed to delete faculty member');
    } finally {
      setDeletingFaculty(null);
    }
  };

  const handleExportFaculty = () => {
    // Create Excel workbook
    const wb = XLSX.utils.book_new();

    // Prepare data
    const headers = ['Faculty ID', 'Name', 'Email', 'Password', 'Department', 'Role'];
    const rows = faculty.map(member => {
      const dept = departments.find(d => d.id === member.departmentId);
      const password = member.employeeId.replace('FAC', 'Fac') + '@';
      return [
        member.employeeId,
        member.name,
        member.email,
        password,
        dept?.name || 'Unknown Department',
        member.role === 'hod' ? 'Head of Department' : 'Faculty Member'
      ];
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // Faculty ID
      { wch: 25 }, // Name
      { wch: 30 }, // Email
      { wch: 15 }, // Password
      { wch: 25 }, // Department
      { wch: 20 }  // Role
    ];

    // Style the header row
    const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          font: { bold: true, sz: 12 },
          fill: { fgColor: { rgb: "FFE6E6FA" } }, // Light lavender background
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Faculty Members');

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `faculty_members_${currentDate}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);

    toast.success('Faculty data exported successfully!');
  };

  const handleDownloadICEMTemplate = () => {
    // Create Excel workbook
    const wb = XLSX.utils.book_new();

    // Prepare headers for ICEM template based on FacultyForm fields
    const headers = [
      'Full Name *',
      'Email *',
      'Role (faculty/hod) *',
      'Course/Program *',
      'Academic Year *',
      'Department *',
      'Subjects *',
      'Designation',
      'Specialization',
      'Experience (years)',
      'Qualifications',
      'Publications',
      'Teaching Subjects',
      'Research Interests',
      'Achievements'
    ];

    // Create worksheet with headers only
    const ws = XLSX.utils.aoa_to_sheet([headers]);

    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Full Name *
      { wch: 30 }, // Email *
      { wch: 20 }, // Role *
      { wch: 25 }, // Course/Program *
      { wch: 15 }, // Academic Year *
      { wch: 25 }, // Department *
      { wch: 25 }, // Subjects *
      { wch: 20 }, // Designation
      { wch: 25 }, // Specialization
      { wch: 18 }, // Experience (years)
      { wch: 25 }, // Qualifications
      { wch: 15 }, // Publications
      { wch: 25 }, // Teaching Subjects
      { wch: 25 }, // Research Interests
      { wch: 25 }  // Achievements
    ];

    // Style the header row
    const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          font: { bold: true, sz: 12 },
          fill: { fgColor: { rgb: "FFE6E6FA" } }, // Light lavender background
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
    }

    // Create instructions worksheet
    const instructionsData = [
      ['ICEM Faculty Template Instructions'],
      [''],
      ['IMPORTANT: Please read all instructions carefully before filling the template.'],
      [''],
      ['REQUIRED FIELDS (marked with *):'],
      ['- Full Name *: Enter the complete name of the faculty member (e.g., Dr. John Smith)'],
      ['- Email *: Enter a valid email address (e.g., john.smith@icem.edu)'],
      ['- Role (faculty/hod) *: Choose either "faculty" or "hod" (Head of Department)'],
      ['- Course/Program *: Select from available courses (e.g., B.Tech, M.Tech, MBA)'],
      ['- Academic Year *: Select from available years (e.g., 1st Year, 2nd Year)'],
      ['- Department *: Select from departments available for the chosen course/year'],
      ['- Subjects *: Select subjects taught by the faculty'],
      [''],
      ['OPTIONAL FIELDS:'],
      ['- Designation: Job title (e.g., Assistant Professor, Associate Professor)'],
      ['- Specialization: Area of expertise (e.g., Machine Learning, Data Structures)'],
      ['- Experience (years): Number of years of teaching/research experience'],
      ['- Qualifications: Educational qualifications (e.g., PhD in Computer Science)'],
      ['- Publications: Number of research publications'],
      ['- Teaching Subjects: Comma-separated list of subjects taught'],
      ['- Research Interests: Comma-separated list of research areas'],
      ['- Achievements: Comma-separated list of awards/achievements'],
      [''],
      ['GUIDELINES:'],
      ['1. Do not modify the header row'],
      ['2. Fill data starting from row 2'],
      ['3. Use consistent formatting for similar data'],
      ['4. Ensure email addresses are unique and valid'],
      ['5. Role should be exactly "faculty" or "hod" (case-sensitive)'],
      ['6. Course/Program, Academic Year, Department, and Subjects must match your college configuration'],
      ['7. For comma-separated fields, use commas without spaces (e.g., AI,Machine Learning,Data Science)'],
      ['8. Save the file as .xlsx format before uploading'],
      [''],
      ['SAMPLE DATA:'],
      ['Full Name *,Email *,Role *,Course/Program *,Academic Year *,Department *,Subjects *,Designation,Specialization,Experience (years),Qualifications,Publications,Teaching Subjects,Research Interests,Achievements'],
      ['Dr. John Smith,john.smith@icem.edu,faculty,B.Tech,3rd Year,Computer Science & Engineering,Data Structures,Assistant Professor,Machine Learning,8,PhD in CS,25,Data Structures,Algorithms,AI,Machine Learning,Best Teacher Award 2023'],
      ['Dr. Sarah Johnson,sarah.johnson@icem.edu,hod,MBA,1st Year,Business Administration,Marketing Management,Professor,Marketing,15,PhD in Business,45,Marketing,Management,Business Strategy,Research Excellence Award']
    ];

    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);

    // Style the instructions sheet
    wsInstructions['!cols'] = [{ wch: 80 }]; // Wide column for instructions

    // Style headers in instructions
    if (wsInstructions['A1']) {
      wsInstructions['A1'].s = {
        font: { bold: true, sz: 14, color: { rgb: "FF0000" } },
        alignment: { horizontal: "center" }
      };
    }

    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Faculty Data');
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

    // Save file
    XLSX.writeFile(wb, 'ICEM_Faculty_Template.xlsx');

    toast.success('ICEM Faculty Template downloaded successfully!');
  };

  const handleDownloadIGSBTemplate = () => {
    // Create Excel workbook
    const wb = XLSX.utils.book_new();

    // Prepare headers for IGSB template based on FacultyForm fields
    const headers = [
      'Full Name *',
      'Email *',
      'Role (faculty/hod) *',
      'Course/Program *',
      'Academic Year *',
      'Department *',
      'Subjects *',
      'Designation',
      'Specialization',
      'Experience (years)',
      'Qualifications',
      'Publications',
      'Teaching Subjects',
      'Research Interests',
      'Achievements'
    ];

    // Create worksheet with headers only
    const ws = XLSX.utils.aoa_to_sheet([headers]);

    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Full Name *
      { wch: 30 }, // Email *
      { wch: 20 }, // Role *
      { wch: 25 }, // Course/Program *
      { wch: 15 }, // Academic Year *
      { wch: 25 }, // Department *
      { wch: 25 }, // Subjects *
      { wch: 20 }, // Designation
      { wch: 25 }, // Specialization
      { wch: 18 }, // Experience (years)
      { wch: 25 }, // Qualifications
      { wch: 15 }, // Publications
      { wch: 25 }, // Teaching Subjects
      { wch: 25 }, // Research Interests
      { wch: 25 }  // Achievements
    ];

    // Style the header row
    const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          font: { bold: true, sz: 12 },
          fill: { fgColor: { rgb: "FFE6E6FA" } }, // Light lavender background
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
    }

    // Create instructions worksheet
    const instructionsData = [
      ['IGSB Faculty Template Instructions'],
      [''],
      ['IMPORTANT: Please read all instructions carefully before filling the template.'],
      [''],
      ['REQUIRED FIELDS (marked with *):'],
      ['- Full Name *: Enter the complete name of the faculty member (e.g., Dr. John Smith)'],
      ['- Email *: Enter a valid email address (e.g., john.smith@igsb.edu)'],
      ['- Role (faculty/hod) *: Choose either "faculty" or "hod" (Head of Department)'],
      ['- Course/Program *: Select from available courses (e.g., B.Tech, M.Tech, MBA)'],
      ['- Academic Year *: Select from available years (e.g., 1st Year, 2nd Year)'],
      ['- Department *: Select from departments available for the chosen course/year'],
      ['- Subjects *: Select subjects taught by the faculty'],
      [''],
      ['OPTIONAL FIELDS:'],
      ['- Designation: Job title (e.g., Assistant Professor, Associate Professor)'],
      ['- Specialization: Area of expertise (e.g., Machine Learning, Data Structures)'],
      ['- Experience (years): Number of years of teaching/research experience'],
      ['- Qualifications: Educational qualifications (e.g., PhD in Computer Science)'],
      ['- Publications: Number of research publications'],
      ['- Teaching Subjects: Comma-separated list of subjects taught'],
      ['- Research Interests: Comma-separated list of research areas'],
      ['- Achievements: Comma-separated list of awards/achievements'],
      [''],
      ['GUIDELINES:'],
      ['1. Do not modify the header row'],
      ['2. Fill data starting from row 2'],
      ['3. Use consistent formatting for similar data'],
      ['4. Ensure email addresses are unique and valid'],
      ['5. Role should be exactly "faculty" or "hod" (case-sensitive)'],
      ['6. Course/Program, Academic Year, Department, and Subjects must match your college configuration'],
      ['7. For comma-separated fields, use commas without spaces (e.g., AI,Machine Learning,Data Science)'],
      ['8. Save the file as .xlsx format before uploading'],
      [''],
      ['SAMPLE DATA:'],
      ['Full Name *,Email *,Role *,Course/Program *,Academic Year *,Department *,Subjects *,Designation,Specialization,Experience (years),Qualifications,Publications,Teaching Subjects,Research Interests,Achievements'],
      ['Dr. John Smith,john.smith@igsb.edu,faculty,B.Tech,3rd Year,Computer Science & Engineering,Data Structures,Assistant Professor,Machine Learning,8,PhD in CS,25,Data Structures,Algorithms,AI,Machine Learning,Best Teacher Award 2023'],
      ['Dr. Sarah Johnson,sarah.johnson@igsb.edu,hod,MBA,1st Year,Business Administration,Marketing Management,Professor,Marketing,15,PhD in Business,45,Marketing,Management,Business Strategy,Research Excellence Award']
    ];

    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);

    // Style the instructions sheet
    wsInstructions['!cols'] = [{ wch: 80 }]; // Wide column for instructions

    // Style headers in instructions
    if (wsInstructions['A1']) {
      wsInstructions['A1'].s = {
        font: { bold: true, sz: 14, color: { rgb: "FF0000" } },
        alignment: { horizontal: "center" }
      };
    }

    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Faculty Data');
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

    // Save file
    XLSX.writeFile(wb, 'IGSB_Faculty_Template.xlsx');

    toast.success('IGSB Faculty Template downloaded successfully!');
  };

  // Question form state
  const [questionFormOpen, setQuestionFormOpen] = useState(false);

  // Question group form state
  const [questionGroupFormOpen, setQuestionGroupFormOpen] = useState(false);

  // Faculty report state
  const [facultyReportOpen, setFacultyReportOpen] = useState(false);

  // Academic config state
  const [academicConfigOpen, setAcademicConfigOpen] = useState(false);
  const [loadTemplateOpen, setLoadTemplateOpen] = useState(false);

  // Derive academic config data from hook
  const courseData = useMemo(() => academicConfig?.courseData || {}, [academicConfig?.courseData]);
  const subjectsData = useMemo(() => academicConfig?.subjectsData || {}, [academicConfig?.subjectsData]);

  // Filtering state
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: '',
    to: ''
  });

  // Get available subjects based on current selections
  const availableSubjects = useMemo(() => {
    if (selectedCourse === 'all' || selectedYear === 'all' || selectedDepartment === 'all') {
      return [];
    }

    const courseSubjects = subjectsData[selectedCourse as keyof typeof subjectsData];
    if (!courseSubjects) return [];

    const yearSubjects = courseSubjects[selectedYear as keyof typeof courseSubjects];
    if (!yearSubjects) return [];

    const departmentSubjects = yearSubjects[selectedDepartment as keyof typeof yearSubjects];
    return Object.keys(departmentSubjects || {});
  }, [selectedCourse, selectedYear, selectedDepartment, subjectsData]);

  // Get available batches based on current selections
  const availableBatches = useMemo(() => {
    if (selectedCourse === 'all' || selectedYear === 'all' || selectedDepartment === 'all' || selectedSubject === 'all') {
      return [];
    }

    const courseSubjects = subjectsData[selectedCourse as keyof typeof subjectsData];
    if (!courseSubjects) return [];

    const yearSubjects = courseSubjects[selectedYear as keyof typeof courseSubjects];
    if (!yearSubjects) return [];

    const departmentSubjects = yearSubjects[selectedDepartment as keyof typeof yearSubjects];
    if (!departmentSubjects) return [];

    const subjectBatches = departmentSubjects[selectedSubject as keyof typeof departmentSubjects];
    return subjectBatches || [];
  }, [selectedCourse, selectedYear, selectedDepartment, selectedSubject, subjectsData]);

  // Get current section from URL
  const currentSection = location.pathname.split('/').pop() || 'dashboard';

  // Filtered data based on selections
  const filteredData = useMemo(() => {
    let filteredSubs = allSubmissions; // Use all submissions, not just recent
    let filteredFac = faculty;
    const filteredDepts = departments;

    // Filter by course/program
    if (selectedCourse !== 'all') {
      const courseSessions = sessions.filter(s => s.course === selectedCourse);
      const courseSessionIds = courseSessions.map(s => s.id);
      filteredSubs = filteredSubs.filter(sub => courseSessionIds.includes(sub.sessionId));
    }

    // Filter by year
    if (selectedYear !== 'all') {
      const yearSessions = sessions.filter(s => s.academicYear === selectedYear);
      const yearSessionIds = yearSessions.map(s => s.id);
      filteredSubs = filteredSubs.filter(sub => yearSessionIds.includes(sub.sessionId));
    }

    // Filter by department
    if (selectedDepartment !== 'all') {
      const deptObj = departments.find(d => d.name === selectedDepartment);
      if (deptObj) {
        const deptSessions = sessions.filter(s => s.departmentId === deptObj.id);
        const deptSessionIds = deptSessions.map(s => s.id);
        filteredSubs = filteredSubs.filter(sub => deptSessionIds.includes(sub.sessionId));
      }
    }

    // Filter by subject
    if (selectedSubject !== 'all') {
      const subjectSessions = sessions.filter(s => s.subject === selectedSubject);
      const subjectSessionIds = subjectSessions.map(s => s.id);
      filteredSubs = filteredSubs.filter(sub => subjectSessionIds.includes(sub.sessionId));
    }

    // Filter by batch
    if (selectedBatch !== 'all') {
      const batchSessions = sessions.filter(s => s.batch === selectedBatch);
      const batchSessionIds = batchSessions.map(s => s.id);
      filteredSubs = filteredSubs.filter(sub => batchSessionIds.includes(sub.sessionId));
    }

    // Filter by date range
    if (dateRange.from || dateRange.to) {
      filteredSubs = filteredSubs.filter(sub => {
        if (!sub.submittedAt) return false;
        const submissionDate = sub.submittedAt.toDate();
        const fromDate = dateRange.from ? new Date(dateRange.from) : null;
        const toDate = dateRange.to ? new Date(dateRange.to) : null;

        if (fromDate && toDate) {
          return submissionDate >= fromDate && submissionDate <= toDate;
        } else if (fromDate) {
          return submissionDate >= fromDate;
        } else if (toDate) {
          return submissionDate <= toDate;
        }
        return true;
      });
    }

    // Filter faculty based on filtered submissions
    const facultyIdsWithSubmissions = [...new Set(filteredSubs.map(sub => sub.facultyId))];
    filteredFac = faculty.filter(f => facultyIdsWithSubmissions.includes(f.id));

    return {
      submissions: filteredSubs,
      faculty: filteredFac,
      departments: filteredDepts
    };
  }, [allSubmissions, faculty, departments, selectedCourse, selectedYear, selectedDepartment, selectedSubject, selectedBatch, dateRange, sessions]);

  // Calculate metrics
  const activeSessions = sessions.filter(s => s.isActive);

  // Calculate filtered stats
  const filteredStats = useMemo(() => {
    const filteredSubs = filteredData.submissions;
    const totalResponses = filteredSubs.length;
    const totalRating = filteredSubs.reduce((sum, sub) => sum + (sub.metrics?.overallRating || 0), 0);
    const avgRating = totalResponses > 0 ? totalRating / totalResponses : 0;

    return {
      totalResponses,
      avgRating: Math.round(avgRating * 10) / 10,
    };
  }, [filteredData.submissions]);

  // Calculate trend - using pre-computed trend data (filtered if needed)
  const trendValue = collegeStats?.trend?.last30Days || 0;
  const isPositive = trendValue >= 0;

  // Department performance data - calculated from filtered submissions
  const deptPerformance = useMemo(() => {
    const deptMap = new Map<string, { total: number; count: number }>();
    
    filteredData.submissions.forEach(sub => {
      const deptId = sub.departmentId;
      if (deptId) {
        const current = deptMap.get(deptId) || { total: 0, count: 0 };
        deptMap.set(deptId, {
          total: current.total + (sub.metrics?.overallRating || 0),
          count: current.count + 1,
        });
      }
    });

    return Array.from(deptMap.entries()).map(([deptId, data]) => {
      const dept = departments.find(d => d.id === deptId);
      const average = data.count > 0 ? data.total / data.count : 0;
      return {
        department: dept?.name || 'Unknown',
        average: Math.round(average * 10) / 10,
      };
    }).filter(d => d.average > 0);
  }, [filteredData.submissions, departments]);

  // Response trend data (last 7 days) - filtered by current filters
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const daySubs = filteredData.submissions.filter(s =>
      s.submittedAt && format(s.submittedAt.toDate(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );

    return {
      date: format(date, 'MMM d'),
      responses: daySubs.length,
    };
  });

  // Today's submissions
  const todaySubmissions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return filteredData.submissions.filter(s =>
      s.submittedAt && s.submittedAt.toDate() >= today
    );
  }, [filteredData.submissions]);

  // This week's submissions
  const weekSubmissions = useMemo(() => {
    const weekAgo = subDays(new Date(), 7);
    return filteredData.submissions.filter(s =>
      s.submittedAt && s.submittedAt.toDate() >= weekAgo
    );
  }, [filteredData.submissions]);

  // Status distribution
  const statusData = [
    { name: 'Active', value: sessions.filter(s => s.isActive).length },
    { name: 'Inactive', value: sessions.filter(s => !s.isActive).length },
  ].filter(d => d.value > 0);

  // Performance Trend data (last 6 months) - calculated from filtered submissions
  const performanceTrendData = useMemo(() => {
    const monthlyMap = new Map<string, number>();
    
    filteredData.submissions.forEach(sub => {
      if (sub.submittedAt) {
        const monthKey = format(sub.submittedAt.toDate(), 'yyyy-MM');
        const current = monthlyMap.get(monthKey) || 0;
        monthlyMap.set(monthKey, current + 1);
      }
    });

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      months.push({
        month: format(date, 'MMM'),
        responses: monthlyMap.get(monthKey) || 0,
      });
    }
    return months;
  }, [filteredData.submissions]);

  // Category Breakdown data - calculated from filtered submissions
  const categoryBreakdownData = useMemo(() => {
    const categoryMap = new Map<string, { total: number; count: number }>();
    
    filteredData.submissions.forEach(sub => {
      if (sub.metrics?.categoryRatings) {
        Object.entries(sub.metrics.categoryRatings).forEach(([category, rating]) => {
          const current = categoryMap.get(category) || { total: 0, count: 0 };
          categoryMap.set(category, {
            total: current.total + rating,
            count: current.count + 1,
          });
        });
      }
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      score: data.count > 0 ? Math.round((data.total / data.count) * 10) / 10 : 0,
    })).filter(item => item.score > 0);
  }, [filteredData.submissions]);

  const renderContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title="Dashboard"
              subtitle={`Welcome back, ${user?.name}. Here's what's happening.`}
              college={college}
            />

            {/* Hierarchical Filtering */}
            <div className="p-6 border-b bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 backdrop-blur-sm">
              <div className="max-w-full mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">Academic Structure Filters</h3>
                      <p className="text-sm text-muted-foreground">Navigate through courses, departments, and more</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Active Filters Display */}
                    {(selectedCourse !== 'all' || selectedYear !== 'all' || selectedDepartment !== 'all' || selectedSubject !== 'all' || selectedBatch !== 'all' || dateRange.from || dateRange.to) && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Filters:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedCourse !== 'all' && (
                            <Badge variant="secondary" className="text-xs">
                              Course: {selectedCourse}
                              <button
                                onClick={() => setSelectedCourse('all')}
                                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                              >
                                ×
                              </button>
                            </Badge>
                          )}
                          {selectedYear !== 'all' && (
                            <Badge variant="secondary" className="text-xs">
                              Year: {selectedYear}
                              <button
                                onClick={() => setSelectedYear('all')}
                                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                              >
                                ×
                              </button>
                            </Badge>
                          )}
                          {selectedDepartment !== 'all' && (
                            <Badge variant="secondary" className="text-xs">
                              Dept: {selectedDepartment}
                              <button
                                onClick={() => setSelectedDepartment('all')}
                                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                              >
                                ×
                              </button>
                            </Badge>
                          )}
                          {selectedSubject !== 'all' && (
                            <Badge variant="secondary" className="text-xs">
                              Subject: {selectedSubject}
                              <button
                                onClick={() => setSelectedSubject('all')}
                                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                              >
                                ×
                              </button>
                            </Badge>
                          )}
                          {selectedBatch !== 'all' && (
                            <Badge variant="secondary" className="text-xs">
                              Batch: {selectedBatch}
                              <button
                                onClick={() => setSelectedBatch('all')}
                                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                              >
                                ×
                              </button>
                            </Badge>
                          )}
                          {(dateRange.from || dateRange.to) && (
                            <Badge variant="secondary" className="text-xs">
                              Date: {dateRange.from || 'Start'} - {dateRange.to || 'End'}
                              <button
                                onClick={() => setDateRange({ from: '', to: '' })}
                                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                              >
                                ×
                              </button>
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCourse('all');
                        setSelectedYear('all');
                        setSelectedDepartment('all');
                        setSelectedSubject('all');
                        setSelectedBatch('all');
                        setDateRange({ from: '', to: '' });
                      }}
                      className="text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reset Filters
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <Label htmlFor="course-select" className="text-sm font-medium">Course/Program</Label>
                    </div>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger id="course-select" className="bg-background/80 backdrop-blur-sm border-primary/20 focus:border-primary">
                        <SelectValue placeholder="Select Course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {Object.keys(courseData).map(course => (
                          <SelectItem key={course} value={course}>{course}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <Label htmlFor="year-select" className="text-sm font-medium">Academic Year</Label>
                    </div>
                    <Select
                      value={selectedYear}
                      onValueChange={setSelectedYear}
                      disabled={selectedCourse === 'all'}
                    >
                      <SelectTrigger id="year-select" className={`bg-background/80 backdrop-blur-sm ${selectedCourse === 'all' ? 'opacity-50' : 'border-primary/20 focus:border-primary'}`}>
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {selectedCourse !== 'all' && courseData[selectedCourse as keyof typeof courseData]?.years.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <Label htmlFor="department-select" className="text-sm font-medium">Department</Label>
                    </div>
                    <Select
                      value={selectedDepartment}
                      onValueChange={setSelectedDepartment}
                      disabled={selectedCourse === 'all' || selectedYear === 'all'}
                    >
                      <SelectTrigger id="department-select" className={`bg-background/80 backdrop-blur-sm ${selectedCourse === 'all' || selectedYear === 'all' ? 'opacity-50' : 'border-primary/20 focus:border-primary'}`}>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {selectedCourse !== 'all' && selectedYear !== 'all' && courseData[selectedCourse as keyof typeof courseData]?.yearDepartments?.[selectedYear]?.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <Label htmlFor="subject-select" className="text-sm font-medium">Subject</Label>
                    </div>
                    <Select
                      value={selectedSubject}
                      onValueChange={setSelectedSubject}
                      disabled={selectedCourse === 'all' || selectedYear === 'all' || selectedDepartment === 'all'}
                    >
                      <SelectTrigger id="subject-select" className={`bg-background/80 backdrop-blur-sm ${selectedCourse === 'all' || selectedYear === 'all' || selectedDepartment === 'all' ? 'opacity-50' : 'border-primary/20 focus:border-primary'}`}>
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {availableSubjects.map(subject => (
                          <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <Label htmlFor="batch-select" className="text-sm font-medium">Batch</Label>
                    </div>
                    <Select 
                      value={selectedBatch} 
                      onValueChange={setSelectedBatch}
                      disabled={selectedCourse === 'all' || selectedYear === 'all' || selectedDepartment === 'all' || selectedSubject === 'all'}
                    >
                      <SelectTrigger id="batch-select" className={`bg-background/80 backdrop-blur-sm ${selectedCourse === 'all' || selectedYear === 'all' || selectedDepartment === 'all' || selectedSubject === 'all' ? 'opacity-50' : 'border-primary/20 focus:border-primary'}`}>
                        <SelectValue placeholder="Select Batch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Batches</SelectItem>
                        {availableBatches.map(batch => (
                          <SelectItem key={batch} value={batch}>{batch}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-medium">Date Range</Label>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal bg-background/80 backdrop-blur-sm border-primary/20 focus:border-primary ${
                            !dateRange.from && !dateRange.to ? 'text-muted-foreground' : ''
                          }`}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dateRange.from || dateRange.to ? (
                            <>
                              {dateRange.from ? format(new Date(dateRange.from), 'd MMM') : 'Start date'} - {' '}
                              {dateRange.to ? format(new Date(dateRange.to), 'd MMM') : 'End date'}
                            </>
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-3 space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="date-from" className="text-sm font-medium">Start Date</Label>
                            <input
                              id="date-from"
                              type="date"
                              value={dateRange.from}
                              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:border-primary focus:outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="date-to" className="text-sm font-medium">End Date</Label>
                            <input
                              id="date-to"
                              type="date"
                              value={dateRange.to}
                              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:border-primary focus:outline-none"
                            />
                          </div>
                          {(dateRange.from || dateRange.to) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDateRange({ from: '', to: '' })}
                              className="w-full"
                            >
                              Clear Dates
                            </Button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="Total Responses"
                  value={filteredStats.totalResponses}
                  subtitle={`${todaySubmissions.length} today, ${weekSubmissions.length} this week`}
                  icon={ClipboardCheck}
                />
                <StatsCard
                  title="Average Rating"
                  value={filteredStats.avgRating.toFixed(1)}
                  subtitle="Out of 5.0"
                  icon={TrendingUp}
                />
                <StatsCard
                  title="Departments"
                  value={filteredData.departments.length}
                  subtitle="Academic departments"
                  icon={Building2}
                />
                <StatsCard
                  title="Faculty Members"
                  value={filteredData.faculty.length}
                  subtitle={`Across ${filteredData.departments.length} departments`}
                  icon={Users}
                />
              </div>

              {/* Main Analytics Grid */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Department Performance */}
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">Department Performance</h3>
                      <p className="text-sm text-muted-foreground">Average scores by department</p>
                    </div>
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="h-64">
                    {deptPerformance.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={deptPerformance} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                          <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                          <YAxis dataKey="department" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={80} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Bar dataKey="average" fill="hsl(213, 96%, 16%)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No department data available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Response Trend */}
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">Response Trend</h3>
                      <p className="text-sm text-muted-foreground">Last 7 days</p>
                    </div>
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="responses"
                          stroke="hsl(213, 96%, 16%)"
                          strokeWidth={2}
                          dot={{ fill: 'hsl(213, 96%, 16%)', strokeWidth: 2 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Performance Trend */}
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">Performance Trend</h3>
                      <p className="text-sm text-muted-foreground">Monthly overview</p>
                    </div>
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="responses"
                          stroke="hsl(142, 76%, 36%)"
                          strokeWidth={3}
                          dot={{ fill: 'hsl(142, 76%, 36%)', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Bottom Analytics Grid */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Category Breakdown */}
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">Category Breakdown</h3>
                      <p className="text-sm text-muted-foreground">Performance by category</p>
                    </div>
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="h-80">
                    {categoryBreakdownData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={categoryBreakdownData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis
                            dataKey="category"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                            className="text-xs"
                          />
                          <PolarRadiusAxis
                            domain={[0, 5]}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                            tickCount={6}
                          />
                          <Radar
                            name="Average Score"
                            dataKey="score"
                            stroke="hsl(221, 83%, 53%)"
                            fill="hsl(221, 83%, 53%)"
                            fillOpacity={0.2}
                            strokeWidth={2}
                            dot={{ fill: 'hsl(221, 83%, 53%)', strokeWidth: 2, r: 3 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                            formatter={(value) => [value, 'Average Score']}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No category data available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Faculty Performance - Full Width */}
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-6">Faculty Feedback & Comments</h3>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/admin/faculty-details')}
                      className="text-sm"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View All
                    </Button>
                  </div>
                  <div className="space-y-6 max-h-96 overflow-y-auto">
                    {filteredData.faculty.slice(0, 8).map((member, index) => {
                      // Calculate faculty stats directly from filtered submissions
                      const memberSubmissions = filteredData.submissions.filter(s => s.facultyId === member.id);
                      const memberWeekSubmissions = memberSubmissions.filter(s =>
                        s.submittedAt && isAfter(s.submittedAt.toDate(), subDays(new Date(), 7))
                      );

                      // Calculate average rating from submissions
                      const avgRating = memberSubmissions.length > 0
                        ? memberSubmissions.reduce((sum, s) => sum + (s.metrics?.overallRating || 0), 0) / memberSubmissions.length
                        : 0;

                      // Get all comments from submissions
                      const allComments = memberSubmissions
                        .filter(s => s.responses && s.responses.length > 0)
                        .flatMap(s => s.responses
                          .filter(r => r.comment && r.comment.trim())
                          .map(r => ({
                            text: r.comment!,
                            rating: s.metrics?.overallRating || 0, // Use submission's overall rating from metrics
                            submittedAt: s.submittedAt!
                          }))
                        )
                        .sort((a, b) => b.submittedAt.toDate().getTime() - a.submittedAt.toDate().getTime())
                        .slice(0, 10); // Get recent 10 comments

                      // Sort comments by rating to get highest and lowest
                      const sortedByRating = [...allComments].sort((a, b) => b.rating - a.rating);

                      // Check if we have varied ratings (some low ratings to show as red)
                      const hasLowRatings = sortedByRating.length > 0 && sortedByRating[sortedByRating.length - 1].rating < 4.0;
                      const hasVariedRatings = sortedByRating.length > 2 && (sortedByRating[0].rating - sortedByRating[sortedByRating.length - 1].rating) >= 1.0;

                      let topComments = [];
                      let bottomComments = [];

                      if (hasVariedRatings) {
                        // Show top 2 and bottom 2 if there are significantly different ratings
                        topComments = sortedByRating.slice(0, 2);
                        bottomComments = sortedByRating.slice(-2);
                      } else if (hasLowRatings) {
                        // All ratings are low with no variety, show only bottom 2 in red
                        topComments = [];
                        bottomComments = sortedByRating.slice(-2);
                      } else {
                        // All ratings are high, just show top 2 in green
                        topComments = sortedByRating.slice(0, 2);
                        bottomComments = [];
                      }

                      const displayComments = [...topComments, ...bottomComments];

                      return (
                        <div
                          key={member.id}
                          className="border border-border rounded-lg p-6 hover:bg-secondary/10 transition-colors animate-fade-up"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          {/* Faculty Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-foreground">{member.name}</h4>
                                <p className="text-sm text-muted-foreground">{member.designation}</p>
                              </div>
                            </div>

                            {/* Rating Summary */}
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl font-bold text-foreground">{avgRating.toFixed(1)}</span>
                                <span className="text-sm text-muted-foreground">/ 5.0</span>
                              </div>
                              <div className="flex text-yellow-400">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span key={star} className="text-sm">
                                    {star <= Math.round(avgRating) ? '★' : '☆'}
                                  </span>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{memberSubmissions.length} responses</p>
                            </div>
                          </div>

                          {/* Comments Section */}
                          <div className="space-y-3">
                            <h5 className="text-sm font-medium text-foreground flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              Recent Comments
                            </h5>

                            {displayComments.length > 0 ? (
                              <div className="grid gap-2 md:grid-cols-2">
                                {displayComments.map((item, commentIndex) => {
                                  const isTopComment = commentIndex < topComments.length;
                                  return (
                                    <div
                                      key={`comment-${commentIndex}`}
                                      className={`border rounded-lg p-3 ${
                                        isTopComment
                                          ? 'bg-green-50 border-green-200'
                                          : 'bg-red-50 border-red-200'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <span className={`text-xs ${
                                          isTopComment ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                          {format(item.submittedAt.toDate(), 'MMM d, yyyy')}
                                        </span>
                                        {item.rating && (
                                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                                            isTopComment
                                              ? 'text-green-700 bg-green-100'
                                              : 'text-red-700 bg-red-100'
                                          }`}>
                                            {item.rating % 1 === 0 ? item.rating.toString() : item.rating.toFixed(1)}/5
                                          </span>
                                        )}
                                      </div>
                                      <p className={`text-sm leading-relaxed ${
                                        isTopComment ? 'text-green-800' : 'text-red-800'
                                      }`}>
                                        "{item.text}"
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">No comments yet</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {faculty.length === 0 && (
                      <div className="text-center py-12">
                        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No faculty members yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'faculty':
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title="Faculty Management"
              subtitle="Manage faculty members and their departments"
              college={college}
            />

            <div className="p-6">
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-lg font-semibold text-foreground">Faculty Members</h3>
                  <div className="flex gap-2">
                    {/* <Button variant="outline" onClick={handleDownloadICEMTemplate}>
                      <Download className="h-4 w-4 mr-2" />
                      Download ICEM Template
                    </Button>
                    <Button variant="outline" onClick={handleDownloadIGSBTemplate}>
                      <Download className="h-4 w-4 mr-2" />
                      Download IGSB Template
                    </Button> */}
                    <Button variant="outline" onClick={handleExportFaculty}>
                      <Download className="h-4 w-4 mr-2" />
                      Export to Excel
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90" onClick={() => setFacultyFormOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Faculty
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {faculty.map((member) => (
                    <div key={member.id} className="grid grid-cols-12 gap-4 items-center p-4 border border-border rounded-lg">
                      <div className="col-span-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-foreground truncate">{member.name}</h4>
                          <p className="text-sm text-muted-foreground truncate">{member.employeeId}</p>
                          <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {departments.find(d => d.id === member.departmentId)?.name || 'Unknown Department'}
                          </p>
                        </div>
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <Badge variant={member.role === 'hod' ? 'default' : 'secondary'} className="text-center">
                          {member.role === 'hod' ? 'Head of Department' : 'Faculty Member'}
                        </Badge>
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditFaculty(member)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Faculty Member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {member.name}? This action cannot be undone and will remove all associated feedback data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteFaculty(member)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'sessions':
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title="Feedback Sessions"
              subtitle="Manage feedback collection sessions"
              college={college}
            />

            <div className="p-6">
              <div className="grid grid-cols-3 items-center mb-6">
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">Session Overview</h3>
                  <p className="text-sm text-muted-foreground">Monitor and organize feedback sessions</p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="flex items-center gap-1">
                    <Filter className="h-3 w-3 text-muted-foreground" />
                    <Select value={sessionDepartmentFilter} onValueChange={setSessionDepartmentFilter}>
                      <SelectTrigger className="w-48 text-xs bg-background/80 backdrop-blur-sm border-primary/20 focus:border-primary">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          All Departments ({getTotalSessionCount()})
                        </SelectItem>
                        {departments
                          .map((dept) => ({
                            dept,
                            count: getDepartmentSessionCount(dept.id)
                          }))
                          .filter(({ count }) => count > 0)
                          .map(({ dept, count }) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name} ({count})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {sessionDepartmentFilter !== 'all' && (
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0.5" onClick={() => setSessionDepartmentFilter('all')}>
                        <X className="h-2.5 w-2.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button className="bg-primary hover:bg-primary/90" onClick={() => setSessionFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Session
                  </Button>
                </div>
              </div>

              <Tabs value={currentSessionTab} onValueChange={setCurrentSessionTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All Sessions ({sessions.filter(s => sessionDepartmentFilter === 'all' || s.departmentId === sessionDepartmentFilter).length})</TabsTrigger>
                  <TabsTrigger value="active">Active Sessions ({sessions.filter(s => s.isActive && (sessionDepartmentFilter === 'all' || s.departmentId === sessionDepartmentFilter)).length})</TabsTrigger>
                  <TabsTrigger value="inactive">Inactive Sessions ({sessions.filter(s => !s.isActive && (sessionDepartmentFilter === 'all' || s.departmentId === sessionDepartmentFilter)).length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  <SessionTable
                    sessions={sessions.filter(s => sessionDepartmentFilter === 'all' || s.departmentId === sessionDepartmentFilter)}
                    faculty={faculty}
                    departments={departments}
                    onRefresh={refreshSessions}
                    onOptimisticUpdate={handleOptimisticSessionUpdate}
                  />
                </TabsContent>

                <TabsContent value="active" className="mt-6">
                  <SessionTable
                    sessions={sessions.filter(s => s.isActive && (sessionDepartmentFilter === 'all' || s.departmentId === sessionDepartmentFilter))}
                    faculty={faculty}
                    departments={departments}
                    onRefresh={refreshSessions}
                    onOptimisticUpdate={handleOptimisticSessionUpdate}
                  />
                </TabsContent>

                <TabsContent value="inactive" className="mt-6">
                  <SessionTable
                    sessions={sessions.filter(s => !s.isActive && (sessionDepartmentFilter === 'all' || s.departmentId === sessionDepartmentFilter))}
                    faculty={faculty}
                    departments={departments}
                    onRefresh={refreshSessions}
                    onOptimisticUpdate={handleOptimisticSessionUpdate}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        );
      case 'departments':
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title="Academic Config"
              subtitle="Configure academic structure and manage departments"
              college={college}
            />

            <div className="p-6">
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-lg font-semibold text-foreground">Academic Structure Configuration</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setLoadTemplateOpen(true)}>
                      <Download className="h-4 w-4 mr-2" />
                      Load Template
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90" onClick={() => setAcademicConfigOpen(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Configure Structure
                    </Button>
                  </div>
                </div>

                {/* Conditional Display: Placeholder or Current Structure */}
                {Object.keys(courseData).length === 0 ? (
                  <div className="text-center py-12">
                    <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-foreground mb-2">Academic Structure Management</h4>
                    <p className="text-muted-foreground mb-4">
                      Configure courses, years, departments, subjects, and batches for your institution.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click "Load Template" to start with a pre-configured structure, or "Configure Structure" to build from scratch.
                    </p>
                  </div>
                ) : (
                  <div className="mt-8">
                    <h4 className="text-lg font-medium text-foreground mb-4">Current Academic Structure</h4>
                    <div className="space-y-4">
                      {Object.entries(courseData).map(([courseName, courseInfo]) => (
                        <div key={courseName} className="border border-border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <GraduationCap className="h-5 w-5 text-primary" />
                            <h5 className="font-medium text-foreground">{courseName}</h5>
                          </div>
                          <div className="ml-7 space-y-3">
                            {courseInfo.years.map((yearName) => (
                              <div key={yearName} className="border-l-2 border-primary/20 pl-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Calendar className="h-4 w-4 text-green-600" />
                                  <span className="font-medium text-green-700">{yearName}</span>
                                </div>
                                <div className="ml-6 space-y-2">
                                  {(courseInfo.yearDepartments?.[yearName] || []).map((deptName) => (
                                    <div key={deptName} className="border-l-2 border-green-200 pl-4">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Building2 className="h-4 w-4 text-blue-600" />
                                        <span className="font-medium text-blue-700">{deptName}</span>
                                      </div>
                                      <div className="ml-6 space-y-1">
                                        {/* Subjects */}
                                        {subjectsData[courseName]?.[yearName]?.[deptName] && Object.keys(subjectsData[courseName][yearName][deptName]).length > 0 && (
                                          <div>
                                            <span className="text-xs font-medium text-muted-foreground mr-2">Subjects:</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              {Object.entries(subjectsData[courseName][yearName][deptName]).map(([subject, batches]) => (
                                                <div key={subject} className="flex flex-col gap-1">
                                                  <Badge variant="outline" className="text-xs">
                                                    <FileText className="h-3 w-3 mr-1" />
                                                    {subject}
                                                  </Badge>
                                                  {batches && batches.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 ml-2">
                                                      {batches.map((batch) => (
                                                        <Badge key={batch} variant="secondary" className="text-xs">
                                                          <Users className="h-3 w-3 mr-1" />
                                                          {batch}
                                                        </Badge>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'questions':
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title="Question Bank"
              subtitle="Manage feedback question groups"
              college={college}
            />

            <div className="p-6">
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-lg font-semibold text-foreground">Question Groups</h3>
                  <Button className="bg-primary hover:bg-primary/90" onClick={() => setQuestionGroupFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Question Group
                  </Button>
                </div>

                <div className="space-y-4">
                  {questionGroups.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileQuestion className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No question groups created yet.</p>
                      <p className="text-sm">Create your first question group to get started.</p>
                    </div>
                  ) : (
                    questionGroups.map((group) => (
                      <div key={group.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-foreground">{group.name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant={group.isActive ? "default" : "secondary"}>
                              {group.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // TODO: Navigate to questions in this group
                                toast.info(`View questions in "${group.name}" group`);
                              }}
                            >
                              <FileQuestion className="h-4 w-4 mr-1" />
                              View Questions
                            </Button>
                          </div>
                        </div>
                        {group.description && (
                          <p className="text-sm text-muted-foreground mb-2">{group.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Created: {format(new Date(group.createdAt.toDate()), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title="Reports & Analytics"
              subtitle="Generate and view detailed reports"
              college={college}
            />

            <div className="p-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">Faculty Report</h3>
                      <p className="text-sm text-muted-foreground">Individual faculty performance</p>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => setFacultyReportOpen(true)}>Generate Report</Button>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">Department Report</h3>
                      <p className="text-sm text-muted-foreground">Department-wide analytics</p>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => {
                    // TODO: Generate department report
                    alert('Department report generation coming soon!');
                  }}>Generate Report</Button>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">Trend Analysis</h3>
                      <p className="text-sm text-muted-foreground">Historical performance trends</p>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => {
                    // TODO: Generate trend analysis report
                    alert('Trend analysis report generation coming soon!');
                  }}>Generate Report</Button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title="Dashboard"
              subtitle={`Welcome back, ${user?.name}. Here's what's happening.`}
              college={college}
            />
          </div>
        );
    }
  };

  return (
    <>
      {renderContent()}
      <SessionForm
        open={sessionFormOpen}
        onOpenChange={setSessionFormOpen}
        onSuccess={() => {
          // Refresh only session-related data
          refreshSessions();
        }}
      />
      <DepartmentForm
        open={departmentFormOpen}
        onOpenChange={setDepartmentFormOpen}
        onSuccess={() => {
          // Invalidate departments data
          queryClient.invalidateQueries({ queryKey: ['departments', 'college', user?.collegeId] });
        }}
      />
      <FacultyForm
        open={facultyFormOpen}
        onOpenChange={handleFacultyFormClose}
        onSuccess={() => {
          // Invalidate faculty data
          queryClient.invalidateQueries({ queryKey: ['faculty', 'college', user?.collegeId] });
        }}
        editingFaculty={editingFaculty}
      />
      <QuestionForm
        open={questionFormOpen}
        onOpenChange={setQuestionFormOpen}
        onSuccess={() => {
          // Invalidate questions data
          queryClient.invalidateQueries({ queryKey: ['questions', 'college', user?.collegeId] });
        }}
      />
      <QuestionGroupForm
        open={questionGroupFormOpen}
        onOpenChange={setQuestionGroupFormOpen}
        onSuccess={() => {
          // Invalidate question groups data
          queryClient.invalidateQueries({ queryKey: ['questionGroups', 'college', user?.collegeId] });
        }}
      />
      <FacultyReport
        open={facultyReportOpen}
        onOpenChange={setFacultyReportOpen}
      />
      <LoadTemplate
        open={loadTemplateOpen}
        onOpenChange={setLoadTemplateOpen}
        onSuccess={() => {
          // Invalidate academic config data
          queryClient.invalidateQueries({ queryKey: ['academicConfig', user?.collegeId] });
        }}
      />
      <AcademicConfig
        open={academicConfigOpen}
        onOpenChange={setAcademicConfigOpen}
        onSuccess={() => {
          // Invalidate academic config data
          queryClient.invalidateQueries({ queryKey: ['academicConfig', user?.collegeId] });
        }}
      />
    </>
  );
};

export default AdminDashboard;