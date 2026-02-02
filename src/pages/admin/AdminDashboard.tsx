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
import { SessionTable } from '@/components/admin/SessionTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAcademicConfig, AcademicConfigData } from '@/lib/academicConfig';
import { BarChart3, RefreshCw, Building2, Calendar, Users, FileText, User, TrendingUp, MessageSquare, Plus, Edit, Download, Upload, Trash2, ClipboardCheck, GraduationCap, FileQuestion } from 'lucide-react';
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

  // Question form state
  const [questionFormOpen, setQuestionFormOpen] = useState(false);

  // Question group form state
  const [questionGroupFormOpen, setQuestionGroupFormOpen] = useState(false);

  // Faculty report state
  const [facultyReportOpen, setFacultyReportOpen] = useState(false);

  // Academic config state
  const [academicConfigOpen, setAcademicConfigOpen] = useState(false);

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
    let filteredSubs = submissions;
    let filteredFac = faculty;
    const filteredDepts = departments;

    // Filter by course/program
    if (selectedCourse !== 'all') {
      // Get all department names for the selected course
      const courseInfo = courseData[selectedCourse as keyof typeof courseData];
      if (courseInfo) {
        const allCourseDepts = new Set<string>();
        Object.values(courseInfo.yearDepartments).forEach(deptList => {
          deptList.forEach(dept => allCourseDepts.add(dept));
        });
        // Filter faculty based on department names matching course departments
        filteredFac = faculty.filter(f => f.departmentId && allCourseDepts.has(f.departmentId));
        filteredSubs = submissions.filter(sub => filteredFac.some(f => f.id === sub.facultyId));
      }
    }

    // Filter by year (this would require additional data structure in submissions)
    // For now, we'll skip year filtering as it requires more complex data modeling

    // Filter by department
    if (selectedDepartment !== 'all') {
      filteredFac = filteredFac.filter(f => f.departmentId === selectedDepartment);
      filteredSubs = filteredSubs.filter(sub => filteredFac.some(f => f.id === sub.facultyId));
    }

    // Filter by subject
    if (selectedSubject !== 'all') {
      const subjectSessions = sessions.filter(s => s.subject === selectedSubject);
      const subjectSessionIds = subjectSessions.map(s => s.id);
      filteredSubs = filteredSubs.filter(sub => subjectSessionIds.includes(sub.sessionId));
      // Don't filter faculty by subject - show all faculty in the department
    }

    // Filter by batch
    if (selectedBatch !== 'all') {
      const batchSessions = sessions.filter(s => s.batch === selectedBatch);
      const batchSessionIds = batchSessions.map(s => s.id);
      filteredSubs = filteredSubs.filter(sub => batchSessionIds.includes(sub.sessionId));
      // Don't filter faculty by batch - show all faculty in the department
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

    return {
      submissions: filteredSubs,
      faculty: filteredFac,
      departments: filteredDepts
    };
  }, [submissions, faculty, departments, selectedCourse, selectedDepartment, selectedSubject, selectedBatch, dateRange, courseData, sessions]);

  // Calculate metrics
  const activeSessions = sessions.filter(s => s.isActive);
  const todaySubmissions = submissions.filter(s =>
    s.submittedAt && format(s.submittedAt.toDate(), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );
  const weekSubmissions = submissions.filter(s =>
    s.submittedAt && isAfter(s.submittedAt.toDate(), subDays(new Date(), 7))
  );

  // Calculate average rating - using pre-computed stats
  const avgRating = collegeStats?.averageRating || 0;

  // Calculate trend - using pre-computed trend data
  const trendValue = collegeStats?.trend?.last30Days || 0;
  const isPositive = trendValue >= 0;

  // Department performance data - using pre-computed stats
  const deptPerformance = useMemo(() => {
    return departmentStats.map(stat => {
      const dept = departments.find(d => d.id === stat.entityId);
      return {
        department: dept?.name || 'Unknown',
        average: Math.round(stat.averageRating * 10) / 10,
      };
    }).filter(d => d.average > 0);
  }, [departmentStats, departments]);

  // Response trend data (last 7 days)
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

  // Status distribution
  const statusData = [
    { name: 'Active', value: sessions.filter(s => s.isActive).length },
    { name: 'Inactive', value: sessions.filter(s => !s.isActive).length },
  ].filter(d => d.value > 0);

  // Performance Trend data (last 6 months) - using pre-computed stats
  const performanceTrendData = useMemo(() => {
    if (!collegeStats?.monthly) return [];

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthData = collegeStats.monthly[monthKey];
      months.push({
        month: format(date, 'MMM'),
        responses: monthData?.submissions || 0,
      });
    }
    return months;
  }, [collegeStats?.monthly]);

  // Category Breakdown data - using pre-computed stats
  const categoryBreakdownData = useMemo(() => {
    if (!collegeStats?.categoryScores) return [];

    return Object.entries(collegeStats.categoryScores).map(([category, data]) => ({
      category,
      score: Math.round(data.average * 10) / 10,
    })).filter(item => item.score > 0);
  }, [collegeStats?.categoryScores]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm">Almost there. Just a moment…</p>
      </div>
    );
  }

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
                  value={collegeStats?.totalSubmissions || 0}
                  subtitle={`${todaySubmissions.length} today, ${weekSubmissions.length} this week`}
                  icon={ClipboardCheck}
                />
                <StatsCard
                  title="Average Rating"
                  value={avgRating.toFixed(1)}
                  subtitle="Out of 5.0"
                  icon={TrendingUp}
                  trend={{ value: Math.abs(trendValue), isPositive }}
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

              {/* Report Export Section */}
              <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border">
                <div>
                  <h3 className="font-medium text-foreground">Export Reports</h3>
                  <p className="text-sm text-muted-foreground">Download comprehensive Excel reports for analysis</p>
                </div>
                <div className="flex gap-3">
                  <CollegeExcelReport
                    collegeName={college?.name || 'College'}
                    collegeStats={collegeStats}
                    departmentStats={departmentStats}
                    facultyStats={facultyStats}
                    loading={collegeStatsLoading || departmentStatsLoading || facultyStatsLoading}
                  />
                  <DepartmentExcelReport
                    departmentName={userDepartmentName}
                    facultyStats={facultyStats.filter(f => f.departmentId === user?.departmentId)}
                    departmentStats={departmentStats.find(d => d.departmentId === user?.departmentId)}
                    loading={facultyStatsLoading || departmentStatsLoading}
                  />
                </div>
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
                    {faculty.slice(0, 8).map((member, index) => {
                      const memberStats = facultyStats.find(stat => stat.entityId === member.id);
                      const avgRating = memberStats?.averageRating || 0;

                      // Get comments from pre-computed stats
                      const allComments = memberStats?.recentComments || [];

                      // Sort all comments by rating to get highest and lowest
                      const sortedByRating = [...allComments].sort((a, b) => b.rating - a.rating);

                      // Take top 2 highest rated as positive feedback
                      const positiveComments = sortedByRating.slice(0, 2);

                      // Take bottom 2 lowest rated as negative feedback
                      const negativeComments = sortedByRating.slice(-2).reverse(); // Reverse to show lowest first

                      const displayComments = [...positiveComments, ...negativeComments].slice(0, 4);

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
                              <p className="text-xs text-muted-foreground mt-1">{weekSubmissions.length} responses</p>
                            </div>
                          </div>

                          {/* Comments Section */}
                          <div className="space-y-3">
                            <h5 className="text-sm font-medium text-foreground flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              Recent Comments
                            </h5>

                            {displayComments.length > 0 ? (
                              <div className="space-y-3">
                                {/* Positive Comments Row */}
                                {positiveComments.length > 0 && (
                                  <div>
                                    <h6 className="text-xs font-medium text-green-600 mb-2 flex items-center gap-1">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      Positive Feedback
                                    </h6>
                                    <div className="grid gap-2 md:grid-cols-2">
                                      {positiveComments.map((item, commentIndex) => (
                                        <div
                                          key={`positive-${commentIndex}`}
                                          className="bg-green-50 border border-green-200 rounded-lg p-3"
                                        >
                                          <div className="flex items-start justify-between mb-2">
                                            <span className="text-xs text-green-600">
                                              {format(item.submittedAt.toDate(), 'MMM d, yyyy')}
                                            </span>
                                            {item.rating && (
                                              <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                                                {item.rating}/5
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-sm text-green-800 leading-relaxed">
                                            "{item.text}"
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Negative Comments Row */}
                                {negativeComments.length > 0 && (
                                  <div>
                                    <h6 className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1">
                                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                      Areas for Improvement
                                    </h6>
                                    <div className="grid gap-2 md:grid-cols-2">
                                      {negativeComments.map((item, commentIndex) => (
                                        <div
                                          key={`negative-${commentIndex}`}
                                          className="bg-red-50 border border-red-200 rounded-lg p-3"
                                        >
                                          <div className="flex items-start justify-between mb-2">
                                            <span className="text-xs text-red-600">
                                              {format(item.submittedAt.toDate(), 'MMM d, yyyy')}
                                            </span>
                                            {item.rating && (
                                              <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">
                                                {item.rating}/5
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-sm text-red-800 leading-relaxed">
                                            "{item.text}"
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
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
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">Feedback Sessions</h3>
                  <p className="text-sm text-muted-foreground">Create and manage anonymous feedback sessions</p>
                </div>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => setSessionFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Session
                </Button>
              </div>

              <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All Sessions ({sessions.length})</TabsTrigger>
                  <TabsTrigger value="active">Active Sessions ({sessions.filter(s => s.isActive).length})</TabsTrigger>
                  <TabsTrigger value="inactive">Inactive Sessions ({sessions.filter(s => !s.isActive).length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  <SessionTable
                    sessions={sessions}
                    faculty={faculty}
                    departments={departments}
                    onRefresh={refreshSessions}
                    onOptimisticUpdate={handleOptimisticSessionUpdate}
                  />
                </TabsContent>

                <TabsContent value="active" className="mt-6">
                  <SessionTable
                    sessions={sessions.filter(s => s.isActive)}
                    faculty={faculty}
                    departments={departments}
                    onRefresh={refreshSessions}
                    onOptimisticUpdate={handleOptimisticSessionUpdate}
                  />
                </TabsContent>

                <TabsContent value="inactive" className="mt-6">
                  <SessionTable
                    sessions={sessions.filter(s => !s.isActive)}
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
                  <Button className="bg-primary hover:bg-primary/90" onClick={() => setAcademicConfigOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Configure Structure
                  </Button>
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
                      Click "Configure Structure" to build and manage the academic hierarchy.
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