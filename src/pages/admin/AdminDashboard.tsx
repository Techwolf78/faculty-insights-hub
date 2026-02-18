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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
  facultyAllocationsApi,
  FacultyAllocation,
} from '@/lib/storage';
import { SessionForm } from '@/components/admin/SessionForm';
import DepartmentForm from '@/components/admin/DepartmentForm';
import FacultyForm from '@/components/admin/FacultyForm';
import QuestionForm from '@/components/admin/QuestionForm';
import QuestionGroupForm from '@/components/admin/QuestionGroupForm';
import BulkCreateFaculty from '@/components/admin/BulkCreateFaculty';
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
import { DashboardOverview } from '@/components/admin/DashboardOverview';
import { FacultyManagement } from '@/components/admin/FacultyManagement';
import { BulkEmail } from '@/components/admin/BulkEmail';
import { SessionManagement } from '@/components/admin/SessionManagement';
import { DepartmentManagement } from '@/components/admin/DepartmentManagement';

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

  // Faculty allocations state
  const [allocations, setAllocations] = useState<FacultyAllocation[]>([]);
  const [allocationsLoading, setAllocationsLoading] = useState(false);

  // Load faculty allocations
  useEffect(() => {
    const loadAllocations = async () => {
      if (!user?.collegeId) return;
      setAllocationsLoading(true);
      try {
        const allocs = await facultyAllocationsApi.getByCollege(user.collegeId);
        setAllocations(allocs);
      } catch (error) {
        console.error('Error loading allocations:', error);
      } finally {
        setAllocationsLoading(false);
      }
    };
    loadAllocations();
  }, [user?.collegeId]);

  // Stats hooks for pre-computed analytics
  const { data: collegeStats, isLoading: collegeStatsLoading } = useCollegeStats(user?.collegeId);
  const { data: departmentStats = [], isLoading: departmentStatsLoading } = useAllDepartmentStats(user?.collegeId);
  const { data: facultyStats = [], isLoading: facultyStatsLoading } = useAllFacultyStats(user?.collegeId);

  const isLoading = departmentsLoading || facultyLoading || questionGroupsLoading || questionsLoading || sessionsLoading || submissionsLoading || collegeLoading || academicConfigLoading || collegeStatsLoading || departmentStatsLoading || facultyStatsLoading || allocationsLoading;

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
  const [bulkCreateOpen, setBulkCreateOpen] = useState(false);
  const [facultyRoleFilter, setFacultyRoleFilter] = useState<'all' | 'faculty' | 'hod' | 'admin'>('all');
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
    const headers = ['Faculty ID', 'Name', 'Email', 'Password', 'Departments', 'Role'];
    const rows = faculty.map(member => {
      // Get unique departments from faculty allocations
      const memberAllocations = allocations.filter(a => a.facultyId === member.id);
      const uniqueDepartments = [...new Set(memberAllocations.map(a => a.department))];
      const departmentNames = uniqueDepartments.map(deptName => {
        const dept = departments.find(d => d.name === deptName);
        return dept?.name || deptName;
      }).join(', ');

      const password = member.employeeId.replace('FAC', 'Fac') + '@';
      return [
        member.employeeId,
        member.name,
        member.email,
        password,
        departmentNames || 'No Allocations',
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
    return subjectBatches?.batches || [];
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
        const toDate = dateRange.to ? new Date(dateRange.to + 'T23:59:59.999') : null;

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

  // Feedback Trend data (last 6 months) - calculated from filtered submissions
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

  // Calculate Y-axis domain for feedback trend chart
  const feedbackTrendYAxisDomain = useMemo(() => {
    const maxValue = Math.max(...performanceTrendData.map(d => d.responses), 0);
    if (maxValue === 0) return [0, 50]; // Minimum range for empty data
    
    // Round up to nearest multiple of 50
    const roundedMax = Math.ceil(maxValue / 50) * 50;
    return [0, roundedMax];
  }, [performanceTrendData]);

  // Calculate Y-axis domain for response trend chart
  const responseTrendYAxisDomain = useMemo(() => {
    const maxValue = Math.max(...trendData.map(d => d.responses), 0);
    if (maxValue === 0) return [0, 50]; // Minimum range for empty data
    
    // Round up to nearest multiple of 50
    const roundedMax = Math.ceil(maxValue / 50) * 50;
    return [0, roundedMax];
  }, [trendData]);

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
          <DashboardOverview
            college={college}
            selectedCourse={selectedCourse}
            setSelectedCourse={setSelectedCourse}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedDepartment={selectedDepartment}
            setSelectedDepartment={setSelectedDepartment}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
            selectedBatch={selectedBatch}
            setSelectedBatch={setSelectedBatch}
            dateRange={dateRange}
            setDateRange={setDateRange}
            courseData={courseData}
            availableSubjects={availableSubjects}
            availableBatches={availableBatches}
            filteredStats={filteredStats}
            todaySubmissions={todaySubmissions}
            weekSubmissions={weekSubmissions}
            filteredData={filteredData}
            deptPerformance={deptPerformance}
            trendData={trendData}
            responseTrendYAxisDomain={responseTrendYAxisDomain}
            performanceTrendData={performanceTrendData}
            feedbackTrendYAxisDomain={feedbackTrendYAxisDomain}
            categoryBreakdownData={categoryBreakdownData}
          />
        );
      case 'faculty':
        return (
          <FacultyManagement
            college={college}
            facultyRoleFilter={facultyRoleFilter}
            setFacultyRoleFilter={setFacultyRoleFilter}
            allocations={allocations}
            handleExportFaculty={handleExportFaculty}
            setFacultyFormOpen={setFacultyFormOpen}
            setBulkCreateOpen={setBulkCreateOpen}
            handleEditFaculty={handleEditFaculty}
            handleDeleteFaculty={handleDeleteFaculty}
          />
        );
      case 'bulk-email':
        return (
          <BulkEmail
            college={college}
          />
        );
      case 'sessions':
        return (
          <SessionManagement
            college={college}
            sessions={sessions}
            sessionDepartmentFilter={sessionDepartmentFilter}
            setSessionDepartmentFilter={setSessionDepartmentFilter}
            currentSessionTab={currentSessionTab}
            setCurrentSessionTab={setCurrentSessionTab}
            departments={departments}
            faculty={faculty}
            getTotalSessionCount={getTotalSessionCount}
            getDepartmentSessionCount={getDepartmentSessionCount}
            setSessionFormOpen={setSessionFormOpen}
            refreshSessions={refreshSessions}
            handleOptimisticSessionUpdate={handleOptimisticSessionUpdate}
          />
        );
      case 'departments':
        return (
          <DepartmentManagement
            college={college}
            courseData={courseData}
            subjectsData={subjectsData}
            setLoadTemplateOpen={setLoadTemplateOpen}
            setAcademicConfigOpen={setAcademicConfigOpen}
          />
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

      {/* Bulk Create Faculty Dialog */}
      <BulkCreateFaculty
        open={bulkCreateOpen}
        onOpenChange={setBulkCreateOpen}
        collegeId={user?.collegeId || ''}
        onSuccess={() => {
          // Invalidate faculty data to refresh the list
          queryClient.invalidateQueries({ queryKey: ['faculty', 'college', user?.collegeId] });
        }}
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