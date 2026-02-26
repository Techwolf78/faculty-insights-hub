import React from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CacheRefreshButton } from '@/components/ui/CacheRefreshButton';
import {
  BarChart3, RefreshCw, RotateCcw, Building2, Calendar, Users, FileText, User, TrendingUp, MessageSquare, ClipboardCheck
} from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import { College, FeedbackStats, FeedbackSubmission, Faculty, Department } from '@/lib/storage';
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

interface DashboardOverviewProps {
  // Add props for all the data and state needed
  college: College | null;
  selectedCourse: string;
  setSelectedCourse: (value: string) => void;
  selectedYear: string;
  setSelectedYear: (value: string) => void;
  selectedSemester: string;
  setSelectedSemester: (value: string) => void;
  selectedDepartment: string;
  setSelectedDepartment: (value: string) => void;
  selectedSubject: string;
  setSelectedSubject: (value: string) => void;
  selectedBatch: string;
  setSelectedBatch: (value: string) => void;
  dateRange: { from: string; to: string };
  setDateRange: (range: { from: string; to: string }) => void;
  courseData: Record<string, { years: string[]; yearDepartments?: Record<string, string[]> }>;
  availableSemesters: string[];
  availableDepartments: string[];
  availableSubjects: string[];
  availableBatches: string[];
  filteredStats: { totalResponses: number; avgRating: number };
  todaySubmissions: FeedbackSubmission[];
  weekSubmissions: FeedbackSubmission[];
  filteredData: { departments: Department[]; faculty: Faculty[]; submissions: FeedbackSubmission[] };
  deptPerformance: Array<{ department: string; average: number }>;
  trendData: Array<{ date: string; responses: number }>;
  responseTrendYAxisDomain: number[];
  performanceTrendData: Array<{ [key: string]: string | number }>;
  feedbackTrendYAxisDomain: number[];
  categoryBreakdownData: Array<{ category: string; score: number }>;
  // Cache refresh props
  onRefresh?: () => Promise<boolean>;
  hasStaleData?: boolean;
  isRefreshing?: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = React.memo(({
  college,
  selectedCourse,
  setSelectedCourse,
  selectedYear,
  setSelectedYear,
  selectedSemester,
  setSelectedSemester,
  selectedDepartment,
  setSelectedDepartment,
  selectedSubject,
  setSelectedSubject,
  selectedBatch,
  setSelectedBatch,
  dateRange,
  setDateRange,
  courseData,
  availableSemesters,
  availableDepartments,
  availableSubjects,
  availableBatches,
  filteredStats,
  todaySubmissions,
  weekSubmissions,
  filteredData,
  deptPerformance,
  trendData,
  responseTrendYAxisDomain,
  performanceTrendData,
  feedbackTrendYAxisDomain,
  categoryBreakdownData,
  onRefresh,
  hasStaleData = false,
  isRefreshing = false,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name}. Here's what's happening.`}
        college={college}
      />

      {/* Hierarchical Filtering */}
      <div className="p-3 border-b bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 backdrop-blur-sm">
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
              {(selectedCourse !== 'all' || selectedYear !== 'all' || selectedSemester !== 'all' || selectedDepartment !== 'all' || selectedSubject !== 'all' || selectedBatch !== 'all' || dateRange.from || dateRange.to) && (
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
                    {selectedSemester !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        Sem: {selectedSemester}
                        <button
                          onClick={() => setSelectedSemester('all')}
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
              <div className="flex items-center gap-2">
                {onRefresh && (
                  <CacheRefreshButton
                    onRefresh={onRefresh}
                    hasStaleData={hasStaleData}
                    isRefreshing={isRefreshing}
                    compact={true}
                    label="Refresh"
                  />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCourse('all');
                    setSelectedYear('all');
                    setSelectedSemester('all');
                    setSelectedDepartment('all');
                    setSelectedSubject('all');
                    setSelectedBatch('all');
                    setDateRange({ from: '', to: '' });
                  }}
                  className="text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset Filters
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
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
                <Calendar className="h-4 w-4 text-primary" />
                <Label htmlFor="semester-select" className="text-sm font-medium">Semester</Label>
              </div>
              <Select
                value={selectedSemester}
                onValueChange={setSelectedSemester}
                disabled={selectedCourse === 'all' || selectedYear === 'all'}
              >
                <SelectTrigger id="semester-select" className={`bg-background/80 backdrop-blur-sm ${selectedCourse === 'all' || selectedYear === 'all' ? 'opacity-50' : 'border-primary/20 focus:border-primary'}`}>
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {availableSemesters.map(semester => (
                    <SelectItem key={semester} value={semester}>{semester}</SelectItem>
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
                disabled={selectedCourse === 'all' || selectedYear === 'all' || selectedSemester === 'all'}
              >
                <SelectTrigger id="department-select" className={`bg-background/80 backdrop-blur-sm ${selectedCourse === 'all' || selectedYear === 'all' || selectedSemester === 'all' ? 'opacity-50' : 'border-primary/20 focus:border-primary'}`}>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {availableDepartments.map(dept => (
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
                disabled={selectedCourse === 'all' || selectedYear === 'all' || selectedSemester === 'all' || selectedDepartment === 'all'}
              >
                <SelectTrigger id="subject-select" className={`bg-background/80 backdrop-blur-sm ${selectedCourse === 'all' || selectedYear === 'all' || selectedSemester === 'all' || selectedDepartment === 'all' ? 'opacity-50' : 'border-primary/20 focus:border-primary'}`}>
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
                disabled={selectedCourse === 'all' || selectedYear === 'all' || selectedSemester === 'all' || selectedDepartment === 'all' || selectedSubject === 'all'}
              >
                <SelectTrigger id="batch-select" className={`bg-background/80 backdrop-blur-sm ${selectedCourse === 'all' || selectedYear === 'all' || selectedSemester === 'all' || selectedDepartment === 'all' || selectedSubject === 'all' ? 'opacity-50' : 'border-primary/20 focus:border-primary'}`}>
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
                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date-to" className="text-sm font-medium">End Date</Label>
                      <input
                        id="date-to"
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
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
            value={todaySubmissions.length + weekSubmissions.length}
            subtitle={`${todaySubmissions.length} today, ${weekSubmissions.length} this week`}
            icon={ClipboardCheck}
          />
          <StatsCard
            title="Average Rating"
            value={(filteredData.submissions.length > 0 
              ? filteredData.submissions.reduce((sum, s) => sum + (s.metrics?.overallRating || 0), 0) / filteredData.submissions.length
              : 0).toFixed(1)}
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
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: "Inter" }} />
                    <YAxis dataKey="department" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: "Inter" }} width={80} />
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
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: "Inter" }} />
                  <YAxis
                    domain={responseTrendYAxisDomain}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: "Inter" }}
                  />
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
                <h3 className="font-display text-lg font-semibold text-foreground">Feedback Trend</h3>
                <p className="text-sm text-muted-foreground">Monthly submission overview</p>
              </div>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: "Inter" }} />
                  <YAxis
                    domain={feedbackTrendYAxisDomain}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: "Inter" }}
                  />
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
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontFamily: "Inter" }}
                      className="text-xs"
                    />
                    <PolarRadiusAxis
                      domain={[0, 5]}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9, fontFamily: "Inter" }}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
