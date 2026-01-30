import React, { useEffect, useState } from 'react';
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
} from '@/hooks/useCollegeData';
import { Users, TrendingUp, MessageSquare, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

  const isLoading = deptLoading || facultyLoading || questionsLoading;

  // Department stats from pre-computed data
  const deptAverage = departmentStats?.averageRating || 0;
  const totalResponses = departmentStats?.totalSubmissions || 0;

  // Faculty performance from pre-computed stats
  const facultyPerformance = faculty
    .map(f => {
      const facultyStats = allFacultyStats.find(stats => stats.facultyId === f.id);
      return {
        id: f.id,
        name: f.name,
        score: facultyStats?.averageRating || 0,
        responses: facultyStats?.totalSubmissions || 0,
        subjects: f.subjects,
      };
    })
    .sort((a, b) => b.score - a.score);

  // Category breakdown from pre-computed stats
  const categoryData = departmentStats?.categoryScores
    ? Object.entries(departmentStats.categoryScores).map(([category, score]) => ({
        category: category.replace(/\s+/g, '\n'),
        score: parseFloat(score.average.toFixed(2)),
      }))
    : [];

  // Recent comments from pre-computed stats
  const recentComments = departmentStats?.recentComments || [];

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
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Subjects</th>
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
                            <div className="flex flex-wrap gap-1">
                              {f.subjects.slice(0, 3).map((sub, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground"
                                >
                                  {sub}
                                </span>
                              ))}
                              {f.subjects.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{f.subjects.length - 3} more</span>
                              )}
                            </div>
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
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">Department Category Breakdown</h3>
                <div className="h-64">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <YAxis 
                          dataKey="category" 
                          type="category" 
                          tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} 
                          width={80}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="score" fill="hsl(213, 96%, 16%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
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
        );

      case 'reports':
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title="Department Reports"
              subtitle="Generate and download comprehensive reports"
            />

            <div className="p-6 space-y-6">
              {/* Report Export Section */}
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
                  subtitle="This cycle"
                  icon={BarChart3}
                />
                <StatsCard
                  title="Comments Received"
                  value={recentComments.length}
                  subtitle="Recent feedback"
                  icon={MessageSquare}
                />
              </div>

              {/* Report Export Section */}
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
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Subjects</th>
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
                              <div className="flex flex-wrap gap-1">
                                {f.subjects.slice(0, 2).map((sub, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground"
                                  >
                                    {sub}
                                  </span>
                                ))}
                                {f.subjects.length > 2 && (
                                  <span className="text-xs text-muted-foreground">+{f.subjects.length - 2}</span>
                                )}
                              </div>
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
                  <h3 className="font-display text-lg font-semibold text-foreground mb-4">Category Breakdown</h3>
                  <div className="h-64">
                    {categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                          <XAxis type="number" domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                          <YAxis 
                            dataKey="category" 
                            type="category" 
                            tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} 
                            width={80}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Bar dataKey="score" fill="hsl(213, 96%, 16%)" radius={[0, 4, 4, 0]} />
                        </BarChart>
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

              {/* Recent Comments */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">Recent Student Comments</h3>
                <div className="space-y-4">
                  {recentComments.map((c, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-secondary/50 animate-fade-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-muted-foreground">
                          Department Feedback
                        </span>
                        {c.rating && (
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                            {c.rating}/5
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
