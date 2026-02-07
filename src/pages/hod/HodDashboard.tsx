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
} from '@/hooks/useCollegeData';
import { Users, TrendingUp, MessageSquare, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { DepartmentExcelReport } from '@/components/reports/DepartmentExcelReport';

export const HodDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Get current section from URL
  const currentSection = location.pathname.split('/').pop() || 'dashboard';

  // React Query hooks for optimized data fetching
  const { data: department, isLoading: deptLoading } = useDepartment(user?.departmentId);
  const { data: faculty = [], isLoading: facultyLoading } = useFacultyByDepartment(user?.departmentId);
  const { data: departmentStats } = useDepartmentStats(user?.departmentId);
  const { data: allFacultyStats = [] } = useAllFacultyStats(user?.collegeId);
  const { data: questions = [], isLoading: questionsLoading } = useQuestions(user?.collegeId);
  const { data: sessions = [] } = useSessions(user?.collegeId);
  const { data: departmentSubmissions = [] } = useSubmissionsByDepartment(user?.departmentId);

  const isLoading = deptLoading || facultyLoading || questionsLoading;

  // Department stats - calculated dynamically from department submissions
  const { deptAverage, totalResponses } = useMemo(() => {
    if (departmentSubmissions.length === 0) {
      return { deptAverage: 0, totalResponses: 0 };
    }
    
    const totalRating = departmentSubmissions.reduce((sum, sub) => sum + (sub.metrics?.overallRating || 0), 0);
    const avg = totalRating / departmentSubmissions.length;
    
    return {
      deptAverage: Math.round(avg * 10) / 10,
      totalResponses: departmentSubmissions.length
    };
  }, [departmentSubmissions]);

  // Faculty performance - calculated dynamically from department submissions
  const facultyPerformance = useMemo(() => {
    const facultyMap = new Map<string, { totalRating: number; count: number; submissions: number }>();
    
    departmentSubmissions.forEach(sub => {
      const current = facultyMap.get(sub.facultyId) || { totalRating: 0, count: 0, submissions: 0 };
      facultyMap.set(sub.facultyId, {
        totalRating: current.totalRating + (sub.metrics?.overallRating || 0),
        count: current.count + 1,
        submissions: current.submissions + 1,
      });
    });

    return faculty
      .map(f => {
        const stats = facultyMap.get(f.id);
        return {
          id: f.id,
          name: f.name,
          score: stats ? stats.totalRating / stats.count : 0,
          responses: stats?.submissions || 0,
          subjects: f.subjects,
        };
      })
      .filter(f => f.responses > 0) // Only show faculty with responses
      .sort((a, b) => b.score - a.score);
  }, [faculty, departmentSubmissions]);

  // Category breakdown - calculated dynamically from department submissions
  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, { total: number; count: number }>();
    
    departmentSubmissions.forEach(sub => {
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
  }, [departmentSubmissions]);

  // Recent comments from department submissions
  const recentComments = useMemo(() => {
    const allComments = departmentSubmissions.flatMap(sub => {
      const facultyInfo = faculty.find(f => f.id === sub.facultyId);
      const sessionInfo = sessions.find(s => s.id === sub.sessionId);
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
  }, [departmentSubmissions, faculty, sessions]);

  const renderContent = () => {
    switch (currentSection) {
      case 'faculty':
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title="Faculty Performance"
              subtitle="Detailed performance analysis for all faculty in your department"
            />

            <div className="p-6 space-y-6">
              {/* Faculty Performance Table - Expanded View */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">Faculty Performance Details</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Faculty</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Subject</th>
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
                              {f.subjects.length > 0 ? f.subjects[0] : 'No subjects'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center text-sm text-muted-foreground">
                            {f.responses}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <RatingStars value={Math.round(f.score)} readonly size="sm" />
                              <span className="text-sm font-medium text-foreground">{f.score.toFixed(1)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {faculty.length === 0 && (
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

              {/* Category Breakdown for Faculty Performance */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground">Department Category Breakdown</h3>
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
                      <p className="text-sm text-muted-foreground">Active Sessions: {faculty.filter(f => f.subjects.length > 0).length}</p>
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
            />

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
                  value={faculty.length}
                  subtitle="In your department"
                  icon={Users}
                />
                <StatsCard
                  title="Total Responses"
                  value={totalResponses}
                  subtitle="All submissions"
                  icon={BarChart3}
                />
                <StatsCard
                  title="Comments Received"
                  value={recentComments.length}
                  subtitle="Recent feedback"
                  icon={MessageSquare}
                />
              </div>

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
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Subject</th>
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
                                {f.subjects.length > 0 ? f.subjects[0] : 'No subjects'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center text-sm text-muted-foreground">
                              {f.responses}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <RatingStars value={Math.round(f.score)} readonly size="sm" />
                                <span className="text-sm font-medium text-foreground">{f.score.toFixed(1)}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {faculty.length === 0 && (
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
