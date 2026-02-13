import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { RatingStars } from '@/components/ui/RatingStars';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import {
  useDepartment,
  useFacultyByDepartment,
  useDepartmentStats,
  useAllFacultyStats,
  useQuestions,
  useSessions,
  useSubmissionsByDepartment,
  useFacultyByUserId,
  useSubmissionsByFaculty,
  useFacultyMemberStats,
  useSessionsByDepartment,
  useDepartmentByHodId,
  useDepartmentByName,
} from '@/hooks/useCollegeData';
import { Users, TrendingUp, MessageSquare, BarChart3, Filter, BookOpen, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';
import { DepartmentExcelReport } from '@/components/reports/DepartmentExcelReport';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { facultyAllocationsApi, FacultyAllocation, feedbackSessionsApi, FeedbackSession } from '@/lib/storage';
import { format } from 'date-fns';

export const HodDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Get current section from URL
  const currentSection = location.pathname.split('/').pop() || 'dashboard';

  // State declarations
  const [hodAllocations, setHodAllocations] = useState<FacultyAllocation[]>([]);
  const [hodSessions, setHodSessions] = useState<FeedbackSession[]>([]);
  const [hodSelectedSubject, setHodSelectedSubject] = useState<string>('all');
  const [hodDepartmentName, setHodDepartmentName] = useState<string | null>(null);

  // HOD's personal performance data
  const { data: hodFacultyProfile, isLoading: hodProfileLoading } = useFacultyByUserId(user?.id);
  const { data: hodSubmissions = [] } = useSubmissionsByFaculty(hodFacultyProfile?.id);
  const { data: hodStats } = useFacultyMemberStats(hodFacultyProfile?.id);

  useEffect(() => {
    if (hodFacultyProfile?.id) {
      facultyAllocationsApi.getByFaculty(hodFacultyProfile.id).then(allocations => {
        setHodAllocations(allocations);
        // Set department name from allocations
        if (allocations.length > 0) {
          const deptName = allocations[0].department;
          setHodDepartmentName(deptName);
        }
      });
      feedbackSessionsApi.getByFaculty(hodFacultyProfile.id).then(setHodSessions);
    }
  }, [hodFacultyProfile?.id]);

  // React Query hooks for optimized data fetching
  const { data: department, isLoading: deptLoading } = useDepartmentByName(hodDepartmentName, user?.collegeId);
  const { data: faculty = [], isLoading: facultyLoading } = useFacultyByDepartment(department?.name);
  const { data: departmentStats } = useDepartmentStats(department?.id);
  const { data: allFacultyStats = [] } = useAllFacultyStats(user?.collegeId);
  const { data: questions = [], isLoading: questionsLoading } = useQuestions(user?.collegeId);
  const { data: sessions = [], isLoading: sessionsLoading } = useSessionsByDepartment(department?.id);
  const { data: departmentSubmissions = [] } = useSubmissionsByDepartment(department?.id);

  const isLoading = deptLoading || facultyLoading || questionsLoading || sessionsLoading || hodProfileLoading;

  // Subject filter state
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Extract unique subjects from department sessions (excluding HOD's subjects)
  const departmentSubjects = useMemo(() => {
    const subjectSet = new Set<string>();
    sessions
      .filter(s => s.departmentId === department?.id && s.facultyId !== hodFacultyProfile?.id) // Exclude HOD's sessions
      .forEach(session => {
        if (session.subject) {
          subjectSet.add(session.subject);
        }
      });
    return Array.from(subjectSet).sort();
  }, [sessions, department?.id, hodFacultyProfile?.id]);

  // Filter submissions based on selected subject (excluding HOD's submissions)
  const filteredSubmissions = useMemo(() => {
    // First filter out HOD's submissions
    const nonHodSubmissions = departmentSubmissions.filter(sub => sub.facultyId !== hodFacultyProfile?.id);
    
    if (selectedSubject === 'all') {
      return nonHodSubmissions;
    }
    // Get session IDs for the selected subject (excluding HOD's sessions)
    const sessionIdsForSubject = sessions
      .filter(s => s.subject === selectedSubject && s.departmentId === department?.id && s.facultyId !== hodFacultyProfile?.id)
      .map(s => s.id);
    // Filter submissions by session ID
    return nonHodSubmissions.filter(sub => sessionIdsForSubject.includes(sub.sessionId));
  }, [departmentSubmissions, sessions, selectedSubject, department?.id, hodFacultyProfile?.id]);

  // Department stats - calculated dynamically from filtered submissions
  const { deptAverage, totalResponses } = useMemo(() => {
    if (filteredSubmissions.length === 0) {
      return { deptAverage: 0, totalResponses: 0 };
    }
    
    const totalRating = filteredSubmissions.reduce((sum, sub) => sum + (sub.metrics?.overallRating || 0), 0);
    const avg = totalRating / filteredSubmissions.length;
    
    return {
      deptAverage: Math.round(avg * 10) / 10,
      totalResponses: filteredSubmissions.length
    };
  }, [filteredSubmissions]);

  // Faculty performance - calculated dynamically from filtered submissions
  const facultyPerformance = useMemo(() => {
    const facultyMap = new Map<string, { totalRating: number; count: number; submissions: number }>();
    
    filteredSubmissions.forEach(sub => {
      const current = facultyMap.get(sub.facultyId) || { totalRating: 0, count: 0, submissions: 0 };
      facultyMap.set(sub.facultyId, {
        totalRating: current.totalRating + (sub.metrics?.overallRating || 0),
        count: current.count + 1,
        submissions: current.submissions + 1,
      });
    });

    return faculty
      .filter(f => f.userId !== user?.id) // Exclude HOD from department faculty table
      .map(f => {
        const stats = facultyMap.get(f.id);
        return {
          id: f.id,
          name: f.name,
          score: stats ? stats.totalRating / stats.count : 0,
          responses: stats?.submissions || 0,
          subjects: f.specialization,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [faculty, filteredSubmissions, user?.id]);

  // Category breakdown - calculated dynamically from filtered submissions
  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, { total: number; count: number }>();
    
    filteredSubmissions.forEach(sub => {
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
  }, [filteredSubmissions]);

  // Recent comments from filtered submissions
  const recentComments = useMemo(() => {
    const allComments = filteredSubmissions.flatMap(sub => {
      const facultyInfo = faculty.find(f => f.id === sub.facultyId);
      const sessionInfo = sessions.find(s => s.id === sub.sessionId && s.departmentId === department?.id);
      return sub.responses
        .filter(r => r.comment && r.comment.trim() !== '')
        .map(r => ({
          text: r.comment!.trim(),
          rating: sub.metrics?.overallRating || 0,
          submittedAt: sub.submittedAt!,
          facultyName: facultyInfo?.name || 'Unknown Faculty',
          subject: sessionInfo?.subject || 'Unknown Subject',
          sessionTitle: sessionInfo ? `${sessionInfo.course} - ${sessionInfo.batch}` : 'Unknown Session',
        }));
    }).filter(item => item.text.length > 10) // Only substantial comments
    .sort((a, b) => b.submittedAt.toDate().getTime() - a.submittedAt.toDate().getTime())
    .slice(0, 20);

    return allComments;
}, [filteredSubmissions, faculty, sessions, department?.id, hodFacultyProfile?.id]);
  // HOD's Personal Performance Calculations (similar to Faculty Dashboard)
  const hodUniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    hodSessions.forEach(session => {
      if (session.subject) {
        subjects.add(session.subject);
      }
    });
    return Array.from(subjects).sort();
  }, [hodSessions]);

  const hodFilteredSubmissions = useMemo(() => {
    if (hodSelectedSubject === 'all') {
      return hodSubmissions;
    }
    const sessionIdsForSubject = hodSessions
      .filter(s => s.subject === hodSelectedSubject)
      .map(s => s.id);
    return hodSubmissions.filter(sub => sessionIdsForSubject.includes(sub.sessionId));
  }, [hodSubmissions, hodSessions, hodSelectedSubject]);

  const hodFilteredStats = useMemo(() => {
    if (hodSelectedSubject === 'all' || hodFilteredSubmissions.length === 0) {
      return {
        currentScore: hodStats?.averageRating || 0,
        categoryData: hodStats?.categoryScores
          ? Object.entries(hodStats.categoryScores).map(([category, score]) => ({
              category,
              score: parseFloat(score.average.toFixed(2)),
              fullMark: 5,
            }))
          : [],
        trendData: hodStats?.monthly
          ? Object.entries(hodStats.monthly)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([month, data]) => ({
                month: format(new Date(month), 'MMM'),
                score: data.averageRating.toFixed(2),
              }))
          : [],
      };
    }

    const totalRating = hodFilteredSubmissions.reduce((sum, sub) => sum + (sub.metrics?.overallRating || 0), 0);
    const avgRating = hodFilteredSubmissions.length > 0 ? totalRating / hodFilteredSubmissions.length : 0;

    const categoryScores: Record<string, { total: number; count: number }> = {};
    hodFilteredSubmissions.forEach(sub => {
      if (sub.metrics?.categoryRatings) {
        Object.entries(sub.metrics.categoryRatings).forEach(([category, rating]) => {
          if (!categoryScores[category]) {
            categoryScores[category] = { total: 0, count: 0 };
          }
          categoryScores[category].total += rating;
          categoryScores[category].count += 1;
        });
      }
    });

    const categoryData = Object.entries(categoryScores).map(([category, data]) => ({
      category,
      score: parseFloat((data.total / data.count).toFixed(2)),
      fullMark: 5,
    }));

    const monthlyData: Record<string, { total: number; count: number }> = {};
    hodFilteredSubmissions.forEach(sub => {
      if (sub.submittedAt) {
        const monthKey = format(sub.submittedAt.toDate(), 'yyyy-MM');
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { total: 0, count: 0 };
        }
        monthlyData[monthKey].total += sub.metrics?.overallRating || 0;
        monthlyData[monthKey].count += 1;
      }
    });

    const trendData = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: format(new Date(month), 'MMM'),
        score: (data.total / data.count).toFixed(2),
      }));

    return {
      currentScore: avgRating,
      categoryData,
      trendData,
    };
  }, [hodFilteredSubmissions, hodSelectedSubject, hodStats]);

  const hodCurrentScore = hodFilteredStats.currentScore;
  const hodCategoryData = hodFilteredStats.categoryData;
  const hodTrendData = hodFilteredStats.trendData;

  const hodAllFacultyScores = allFacultyStats
    .map(stats => ({
      id: stats.facultyId,
      score: stats.averageRating
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const hodCurrentUserRanking = hodAllFacultyScores.findIndex(item => item.id === hodFacultyProfile?.id) + 1;
  const hodTotalFaculty = hodAllFacultyScores.length;

  const getOrdinalSuffix = (num: number): string => {
    if (num === 0) return '0th';
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return num + 'st';
    if (j === 2 && k !== 12) return num + 'nd';
    if (j === 3 && k !== 13) return num + 'rd';
    return num + 'th';
  };

  const hodRanking = hodCurrentUserRanking > 0 ? getOrdinalSuffix(hodCurrentUserRanking) : 'Unranked';

  const hodComments = hodFilteredSubmissions
    .filter(s => s.responses && s.responses.length > 0)
    .flatMap(s => s.responses
      .filter(r => r.comment && r.comment.trim())
      .map(r => ({
        text: r.comment!,
        rating: s.metrics?.overallRating || 0,
        submittedAt: s.submittedAt!
      }))
    )
    .sort((a, b) => b.rating - a.rating);

  const hodTopComments = hodComments.slice(0, 10);

  const renderContent = () => {
    switch (currentSection) {
      case 'performance':
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title="My Performance"
              subtitle="View your personal feedback scores and student comments"
            />

            <div className="p-6 space-y-6">
              {/* Profile Summary */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xl font-semibold text-primary">
                        {user?.name?.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-semibold text-foreground">{user?.name}</h2>
                      <p className="text-muted-foreground">
                        {hodAllocations.length > 0
                          ? hodAllocations.flatMap(a => a.subjects.map(s => s.name)).join(', ')
                          : 'No subjects assigned'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Subject:</span>
                    <Select value={hodSelectedSubject} onValueChange={setHodSelectedSubject}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {hodUniqueSubjects.map((subject) => {
                          const subjectSessionIds = hodSessions
                            .filter(s => s.subject === subject)
                            .map(s => s.id);
                          const subjectResponseCount = hodSubmissions.filter(sub =>
                            subjectSessionIds.includes(sub.sessionId)
                          ).length;
                          return (
                            <SelectItem key={subject} value={subject} disabled={subjectResponseCount === 0}>
                              {subject} ({subjectResponseCount})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Subject-wise Performance Summary */}
              {hodSelectedSubject === 'all' && hodUniqueSubjects.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">Subject Performance</CardTitle>
                          <CardDescription className="text-xs">Click any subject to filter</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {hodUniqueSubjects.length} subjects
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {hodUniqueSubjects.map((subject) => {
                        const subjectSessionIds = hodSessions
                          .filter(s => s.subject === subject)
                          .map(s => s.id);
                        const subjectSubmissions = hodSubmissions.filter(sub =>
                          subjectSessionIds.includes(sub.sessionId)
                        );
                        const avgRating = subjectSubmissions.length > 0
                          ? subjectSubmissions.reduce((sum, sub) => sum + (sub.metrics?.overallRating || 0), 0) / subjectSubmissions.length
                          : 0;

                        return (
                          <div
                            key={subject}
                            className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer group"
                            onClick={() => setHodSelectedSubject(subject)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-sm text-foreground line-clamp-2 flex-1 leading-tight">
                                {subject}
                              </h4>
                              <Badge variant="secondary" className="ml-2 shrink-0 text-[10px] h-5 px-1.5">
                                {subjectSubmissions.length}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <RatingStars value={Math.round(avgRating)} readonly size="sm" />
                                <span className="text-sm font-semibold text-primary ml-1">
                                  {avgRating.toFixed(1)}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                Filter →
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stats Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="Current Score"
                  value={hodCurrentScore.toFixed(1)}
                  subtitle="Overall rating"
                  icon={TrendingUp}
                />
                <StatsCard
                  title="Peer Ranking"
                  value={hodRanking}
                  subtitle={`Out of ${hodTotalFaculty} faculty`}
                  icon={Award}
                />
                <StatsCard
                  title="Total Responses"
                  value={hodFilteredSubmissions.length}
                  subtitle={hodSelectedSubject === 'all' ? "Student evaluations" : `For ${hodSelectedSubject}`}
                  icon={Users}
                />
                <StatsCard
                  title="Comments"
                  value={hodComments.length}
                  subtitle="Student feedback"
                  icon={MessageSquare}
                />
              </div>

              {/* Charts Row */}
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
                  <div className="h-64">
                    {hodCategoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={hodCategoryData}>
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
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <p className="text-sm">No category data yet</p>
                          <p className="text-xs">Data will appear after receiving feedback</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Historical Trend */}
                <div className="glass-card rounded-xl p-6">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-4">Performance Trend</h3>
                  <div className="h-64">
                    {hodTrendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={hodTrendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: "Inter" }} />
                          <YAxis domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: "Inter" }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="hsl(213, 96%, 16%)"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(213, 96%, 16%)', strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <p className="text-sm">No performance data yet</p>
                          <p className="text-xs">Data will appear after receiving feedback</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Category Details & Comments */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Category Details */}
                <div className="glass-card rounded-xl p-6">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-4">Detailed Scores</h3>
                  <div className="space-y-4">
                    {hodCategoryData.map((cat, index) => (
                      <div key={cat.category} className="animate-fade-up" style={{ animationDelay: `${index * 0.05}s` }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">{cat.category}</span>
                          <div className="flex items-center gap-2">
                            <RatingStars value={Math.round(cat.score)} readonly size="sm" />
                            <span className="text-sm font-medium text-muted-foreground">{cat.score.toFixed(1)}</span>
                          </div>
                        </div>
                        <ProgressBar value={cat.score} max={5} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Comments */}
                <div className="glass-card rounded-xl p-6">
                  <div className="mb-4">
                    <h3 className="font-display text-lg font-semibold text-foreground">Top Student Comments</h3>
                    <p className="text-sm text-muted-foreground">Showing 10 highest rated comments</p>
                  </div>
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {hodTopComments.map((c, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg bg-secondary/50 animate-fade-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs text-muted-foreground">
                            {format(c.submittedAt.toDate(), 'MMM d, yyyy hh:mm a')}
                          </span>
                          {c.rating && (
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                              {c.rating % 1 === 0 ? c.rating.toString() : c.rating.toFixed(1)}/5
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground italic">"{c.text}"</p>
                      </div>
                    ))}
                    {hodTopComments.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No comments yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title="Department Reports"
              subtitle="Generate and download comprehensive reports"
            />

            <div className="p-6 space-y-6">
              {/* Report Export Section - Commented out for now */}
              {/*
              <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border">
                <div>
                  <h3 className="font-medium text-foreground">Export Department Report</h3>
                  <p className="text-sm text-muted-foreground">Download comprehensive Excel report for your department</p>
                </div>
                <DepartmentExcelReport
                  departmentName={department?.name || 'Department'}
                  facultyStats={allFacultyStats.filter(f => f.departmentId === user?.departmentId)}
                  departmentStats={departmentStats}
                />
              </div>
              */}

              {/* Report Preview */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">Report Preview</h3>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <h4 className="font-medium text-foreground mb-2">Department Overview</h4>
                      <p className="text-sm text-muted-foreground">Average Rating: {deptAverage.toFixed(1)}/5.0</p>
                      <p className="text-sm text-muted-foreground">Total Responses: {totalResponses}</p>
                    </div>
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <h4 className="font-medium text-foreground mb-2">Faculty Count</h4>
                      <p className="text-sm text-muted-foreground">Total Faculty: {faculty.length}</p>
                      <p className="text-sm text-muted-foreground">Active Sessions: {faculty.filter(f => f.stats.totalSessions > 0).length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default: // dashboard
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title={`${department?.name || 'Department'} Dashboard`}
              subtitle="Department performance overview and faculty analytics"
              rightElement={
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Subject:</span>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {departmentSubjects.map((subject) => {
                        const subjectSessionIds = sessions
                          .filter(s => s.subject === subject && s.departmentId === department?.id && s.facultyId !== hodFacultyProfile?.id)
                          .map(s => s.id);
                        const subjectResponseCount = departmentSubmissions.filter(sub =>
                          subjectSessionIds.includes(sub.sessionId) && sub.facultyId !== hodFacultyProfile?.id
                        ).length;
                        return (
                          <SelectItem key={subject} value={subject} disabled={subjectResponseCount === 0}>
                            {subject} ({subjectResponseCount})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              }
            />

            {/* Diagnostic Helper - Show if no data */}
            {(faculty.length === 0 || departmentSubmissions.length === 0) && !isLoading && (
              <div className="p-6">
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-900 mb-2">📊 Data Loading Information</p>
                  <ul className="text-xs text-amber-800 space-y-1 font-mono">
                    <li>✓ User: {user?.name} ({user?.email})</li>
                    <li>✓ HOD Department from allocations: {hodDepartmentName || "❌ Not loaded"}</li>
                    <li>✓ Department: {department?.name || "❌ Not loaded"}</li>
                    <li>✓ College ID: {user?.collegeId || "❌ Not set"}</li>
                    <li>✓ Faculty loaded: {faculty.length}</li>
                    <li>✓ Submissions loaded: {departmentSubmissions.length}</li>
                    <li>✓ Sessions loaded: {sessions.length}</li>
                  </ul>
                  {(!department || !user?.collegeId) && (
                    <p className="mt-2 text-xs text-amber-700 font-semibold">⚠️ Please ensure your profile has collegeId set and you are assigned as HOD of a department.</p>
                  )}
                </div>
              </div>
            )}

            <div className="p-6 space-y-6">
              {/* Stats Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="Department Average"
                  value={deptAverage.toFixed(1)}
                  subtitle="Out of 5.0"
                  icon={TrendingUp}
                />
                <StatsCard
                  title="Faculty Members"
                  value={faculty.filter(f => f.userId !== user?.id).length}
                  subtitle="In your department"
                  icon={Users}
                />
                <StatsCard
                  title="Total Responses"
                  value={totalResponses}
                  subtitle={selectedSubject === 'all' ? "All submissions" : `For ${selectedSubject}`}
                  icon={BarChart3}
                />
                <StatsCard
                  title="Comments Received"
                  value={recentComments.length}
                  subtitle="Recent feedback"
                  icon={MessageSquare}
                />
              </div>

              {/* Main Content */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Faculty Performance Table */}
                <div className="lg:col-span-2 glass-card rounded-xl p-6">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-4">Faculty Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Faculty</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Specialization</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Responses</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {facultyPerformance.map((f, index) => (
                          <tr
                            key={f.id}
                            className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors animate-fade-up"
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-medium text-primary">
                                    {f.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <span className="font-medium text-foreground">{f.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-muted-foreground">
                                {f.subjects || 'Not specified'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center text-sm text-muted-foreground">
                              {f.responses}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center gap-2">
                                {f.responses > 0 ? (
                                  <>
                                    <RatingStars value={Math.round(f.score)} readonly size="sm" />
                                    <span className="text-sm font-medium text-foreground">{f.score.toFixed(1)}</span>
                                  </>
                                ) : (
                                  <span className="text-sm text-muted-foreground italic">Not yet</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {facultyPerformance.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-muted-foreground">
                              No faculty members in your department
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

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
                    {categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={categoryData}>
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
              </div>

              {/* Recent Comments */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">Recent Student Comments</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {recentComments.map((c, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-secondary/50 animate-fade-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-muted-foreground">
                          {c.facultyName} | {c.subject} | {c.sessionTitle}
                        </span>
                        {c.rating && (
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                            {c.rating % 1 === 0 ? c.rating.toString() : c.rating.toFixed(1)}/5
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground italic">"{c.text}"</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {c.submittedAt.toDate().toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  {recentComments.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No comments yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return renderContent();
};
