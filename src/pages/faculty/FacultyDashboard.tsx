import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { RatingStars } from '@/components/ui/RatingStars';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import {
  useFacultyByUserId,
  useSubmissionsByFaculty,
  useQuestions,
  useFacultyMemberStats,
  useAllFacultyStats,
} from '@/hooks/useCollegeData';
import { facultyAllocationsApi, FacultyAllocation, feedbackSessionsApi, FeedbackSession } from '@/lib/storage';
import { TrendingUp, MessageSquare, Award, Download, Users, BarChart3, Filter, BookOpen } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Button } from '@/components/ui/button';
import { format, subMonths } from 'date-fns';
import { FacultyExcelReport } from '@/components/reports/FacultyExcelReport';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Get current section from URL
  const currentSection = location.pathname.split('/').pop() || 'dashboard';

  // React Query hooks for optimized data fetching
  const { data: facultyProfile, isLoading: facultyLoading } = useFacultyByUserId(user?.id);
  const { data: submissions = [], isLoading: submissionsLoading } = useSubmissionsByFaculty(facultyProfile?.id);
  const { data: questions = [], isLoading: questionsLoading } = useQuestions(user?.collegeId);
  const { data: facultyStats } = useFacultyMemberStats(facultyProfile?.id);
  const { data: allFacultyStats = [] } = useAllFacultyStats(user?.collegeId);

  const isLoading = facultyLoading || submissionsLoading || questionsLoading;

  // State declarations
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 6;
  const [allocations, setAllocations] = useState<FacultyAllocation[]>([]);
  const [sessions, setSessions] = useState<FeedbackSession[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  useEffect(() => {
    if (facultyProfile?.id) {
      facultyAllocationsApi.getByFaculty(facultyProfile.id).then(setAllocations);
      feedbackSessionsApi.getByFaculty(facultyProfile.id).then(setSessions);
    }
  }, [facultyProfile?.id]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSubject]);

  // Extract unique subjects from sessions
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    sessions.forEach(session => {
      if (session.subject) {
        subjects.add(session.subject);
      }
    });
    return Array.from(subjects).sort();
  }, [sessions]);

  // Filter submissions based on selected subject
  const filteredSubmissions = useMemo(() => {
    if (selectedSubject === 'all') {
      return submissions;
    }
    // Get session IDs for the selected subject
    const sessionIdsForSubject = sessions
      .filter(s => s.subject === selectedSubject)
      .map(s => s.id);
    // Filter submissions by session ID
    return submissions.filter(sub => sessionIdsForSubject.includes(sub.sessionId));
  }, [submissions, sessions, selectedSubject]);

  // Calculate stats based on filtered submissions
  const filteredStats = useMemo(() => {
    if (selectedSubject === 'all' || filteredSubmissions.length === 0) {
      return {
        currentScore: facultyStats?.averageRating || 0,
        categoryData: facultyStats?.categoryScores
          ? Object.entries(facultyStats.categoryScores).map(([category, score]) => ({
              category,
              score: parseFloat(score.average.toFixed(2)),
              fullMark: 5,
            }))
          : [],
        trendData: facultyStats?.monthly
          ? Object.entries(facultyStats.monthly)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([month, data]) => ({
                month: format(new Date(month), 'MMM'),
                score: data.averageRating.toFixed(2),
              }))
          : [],
      };
    }

    // Calculate stats from filtered submissions
    const totalRating = filteredSubmissions.reduce((sum, sub) => sum + (sub.metrics?.overallRating || 0), 0);
    const avgRating = filteredSubmissions.length > 0 ? totalRating / filteredSubmissions.length : 0;

    // Calculate category breakdown
    const categoryScores: Record<string, { total: number; count: number }> = {};
    filteredSubmissions.forEach(sub => {
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

    // Calculate monthly trend
    const monthlyData: Record<string, { total: number; count: number }> = {};
    filteredSubmissions.forEach(sub => {
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
  }, [filteredSubmissions, selectedSubject, facultyStats]);

  // Calculate current score from pre-computed stats
  const currentScore = filteredStats.currentScore;

  // Calculate peer ranking from pre-computed stats
  const allFacultyScores = allFacultyStats
    .map(stats => ({
      id: stats.facultyId,
      score: stats.averageRating
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score); // Sort descending (highest first)

  const currentUserRanking = allFacultyScores.findIndex(item => item.id === facultyProfile?.id) + 1;
  const totalFaculty = allFacultyScores.length;

  // Convert ranking to ordinal (1st, 2nd, 3rd, etc.)
  const getOrdinalSuffix = (num: number): string => {
    if (num === 0) return '0th';
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return num + 'st';
    if (j === 2 && k !== 12) return num + 'nd';
    if (j === 3 && k !== 13) return num + 'rd';
    return num + 'th';
  };

  const ranking = currentUserRanking > 0 ? getOrdinalSuffix(currentUserRanking) : 'Unranked';

  // Category breakdown from filtered stats
  const categoryData = filteredStats.categoryData;

  // Historical trend from filtered stats
  const trendData = filteredStats.trendData;

  // Recent comments from filtered submissions
  const comments = filteredSubmissions
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

  // Top 10 comments for the summary section
  const topComments = comments.slice(0, 10);

  // All comments sorted by date (most recent first) for pagination
  const allCommentsSortedByDate = filteredSubmissions
    .filter(s => s.responses && s.responses.length > 0)
    .flatMap(s => s.responses
      .filter(r => r.comment && r.comment.trim())
      .map(r => ({
        text: r.comment!,
        rating: s.metrics?.overallRating || 0,
        submittedAt: s.submittedAt!
      }))
    )
    .sort((a, b) => b.submittedAt.toDate().getTime() - a.submittedAt.toDate().getTime());

  // Pagination for all comments
  const totalPages = Math.ceil(allCommentsSortedByDate.length / commentsPerPage);
  const paginatedComments = allCommentsSortedByDate.slice((currentPage - 1) * commentsPerPage, currentPage * commentsPerPage);

  const renderContent = () => {
    switch (currentSection) {
      case 'reports':
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title="Performance Reports"
              subtitle="Generate and download detailed performance reports"
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
                        {allocations.length > 0
                          ? allocations.flatMap(a => a.subjects.map(s => s.name)).join(', ')
                          : 'No subjects assigned'
                        }
                      </p>
                    </div>
                  </div>
                  {/* <FacultyExcelReport
                    facultyId={facultyProfile?.id || ''}
                    facultyName={user?.name || 'Faculty Member'}
                    stats={facultyStats}
                    comments={comments}
                  /> */}
                </div>
              </div>

              {/* Report Preview */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">Report Preview</h3>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <h4 className="font-medium text-foreground mb-2">Performance Overview</h4>
                      <p className="text-sm text-muted-foreground">Current Score: {currentScore.toFixed(1)}/5.0</p>
                      <p className="text-sm text-muted-foreground">Peer Ranking: {ranking}</p>
                      <p className="text-sm text-muted-foreground">Total Responses: {submissions.length}</p>
                    </div>
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <h4 className="font-medium text-foreground mb-2">Feedback Summary</h4>
                      <p className="text-sm text-muted-foreground">Comments: {comments.length}</p>
                      <p className="text-sm text-muted-foreground">Categories: {categoryData.length}</p>
                      <p className="text-sm text-muted-foreground">Trend Data: {trendData.length} months</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Charts */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Historical Trend */}
                <div className="glass-card rounded-xl p-6">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-4">Performance Trend</h3>
                  <div className="h-64">
                    {trendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
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

                {/* Category Radar */}
                <div className="glass-card rounded-xl p-6">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-4">Category Breakdown</h3>
                  <div className="h-64">
                    {categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={categoryData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis
                            dataKey="category"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontFamily: "Inter" }}
                          />
                          <PolarRadiusAxis
                            domain={[0, 5]}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontFamily: "Inter" }}
                          />
                          <Radar
                            name="Score"
                            dataKey="score"
                            stroke="hsl(213, 96%, 16%)"
                            fill="hsl(213, 96%, 16%)"
                            fillOpacity={0.3}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
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
              </div>
            </div>
          </div>
        );

      default: // dashboard
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title="My Performance"
              subtitle="View your feedback scores and student comments"
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
                        {allocations.length > 0
                          ? allocations.flatMap(a => a.subjects.map(s => s.name)).join(', ')
                          : 'No subjects assigned'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Subject:</span>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {uniqueSubjects.map((subject) => {
                          const subjectSessionIds = sessions
                            .filter(s => s.subject === subject)
                            .map(s => s.id);
                          const subjectResponseCount = submissions.filter(sub =>
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

              {/* Stats Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="Current Score"
                  value={currentScore.toFixed(1)}
                  subtitle="Overall rating"
                  icon={TrendingUp}
                />
                <StatsCard
                  title="Peer Ranking"
                  value={ranking}
                  subtitle={`Out of ${totalFaculty} faculty`}
                  icon={Award}
                />
                <StatsCard
                  title="Total Responses"
                  value={filteredSubmissions.length}
                  subtitle={selectedSubject === 'all' ? "Student evaluations" : `For ${selectedSubject}`}
                  icon={Users}
                />
                <StatsCard
                  title="Comments"
                  value={comments.length}
                  subtitle="Student feedback"
                  icon={MessageSquare}
                />
              </div>

              {/* Subject-wise Performance Summary (only when "All Subjects" selected) */}
              {selectedSubject === 'all' && uniqueSubjects.length > 0 && (
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
                        {uniqueSubjects.length} subjects
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {uniqueSubjects.map((subject) => {
                        const subjectSessionIds = sessions
                          .filter(s => s.subject === subject)
                          .map(s => s.id);
                        const subjectSubmissions = submissions.filter(sub =>
                          subjectSessionIds.includes(sub.sessionId)
                        );
                        const avgRating = subjectSubmissions.length > 0
                          ? subjectSubmissions.reduce((sum, sub) => sum + (sub.metrics?.overallRating || 0), 0) / subjectSubmissions.length
                          : 0;

                        return (
                          <div
                            key={subject}
                            className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer group"
                            onClick={() => setSelectedSubject(subject)}
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
                    {categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={categoryData}>
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
                    {trendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
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
                    {categoryData.map((cat, index) => (
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
                    {topComments.map((c, index) => (
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
                    {topComments.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No comments yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* All Student Comments Section */}
              <div className="glass-card rounded-xl p-6">
                <div className="mb-4">
                  <h3 className="font-display text-lg font-semibold text-foreground">All Student Comments</h3>
                  <p className="text-sm text-muted-foreground">Showing all {allCommentsSortedByDate.length} comments</p>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {paginatedComments.map((c, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-secondary/50 animate-fade-up border-l-4 border-primary/20"
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
                  {paginatedComments.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No comments yet</p>
                  )}
                </div>
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return renderContent();
};
