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
import { TrendingUp, MessageSquare, Award, Download, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Button } from '@/components/ui/button';
import { format, subMonths } from 'date-fns';
import { FacultyExcelReport } from '@/components/reports/FacultyExcelReport';

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

  // Calculate current score from pre-computed stats
  const currentScore = facultyStats?.averageRating || 0;

  // Calculate peer percentile from pre-computed stats
  const allFacultyScores = allFacultyStats
    .map(stats => stats.averageRating)
    .filter(score => score > 0);

  const belowMe = allFacultyScores.filter(s => s < currentScore).length;
  const percentile = allFacultyScores.length > 0
    ? Math.round((belowMe / allFacultyScores.length) * 100)
    : 0;

  // Category breakdown from pre-computed stats
  const categoryData = facultyStats?.categoryScores
    ? Object.entries(facultyStats.categoryScores).map(([category, score]) => ({
        category,
        score: parseFloat(score.average.toFixed(2)),
        fullMark: 5,
      }))
    : [];

  // Historical trend from pre-computed stats
  const trendData = facultyStats?.monthly
    ? Object.entries(facultyStats.monthly)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
          month: format(new Date(month), 'MMM'),
          score: data.averageRating.toFixed(2),
        }))
    : [];

  // Recent comments from pre-computed stats
  const comments = facultyStats?.recentComments || [];

  const renderContent = () => {
    switch (currentSection) {
      case 'feedback':
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title="My Feedback"
              subtitle="Detailed view of all student feedback and comments"
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
                      <p className="text-muted-foreground">{facultyProfile?.subjects?.join(', ') || 'No subjects assigned'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback Stats */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="Total Responses"
                  value={submissions.length}
                  subtitle="Student evaluations"
                  icon={Users}
                />
                <StatsCard
                  title="Comments"
                  value={comments.length}
                  subtitle="Student feedback"
                  icon={MessageSquare}
                />
                <StatsCard
                  title="Average Rating"
                  value={currentScore.toFixed(1)}
                  subtitle="Out of 5.0"
                  icon={TrendingUp}
                />
                <StatsCard
                  title="Peer Percentile"
                  value={`${percentile}th`}
                  subtitle="Among all faculty"
                  icon={Award}
                />
              </div>

              {/* Detailed Comments Section */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">All Student Comments</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {comments.map((c, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-secondary/50 animate-fade-up border-l-4 border-primary/20"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-muted-foreground">
                          {format(c.submittedAt.toDate(), 'MMM d, yyyy')}
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
                  {comments.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No comments yet</p>
                  )}
                </div>
              </div>

              {/* Category Details */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">Detailed Category Scores</h3>
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
            </div>
          </div>
        );

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
                      <p className="text-muted-foreground">{facultyProfile?.subjects?.join(', ') || 'No subjects assigned'}</p>
                    </div>
                  </div>
                  <FacultyExcelReport
                    facultyId={facultyProfile?.id || ''}
                    facultyName={user?.name || 'Faculty Member'}
                    stats={facultyStats}
                    comments={comments}
                  />
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
                      <p className="text-sm text-muted-foreground">Peer Percentile: {percentile}th</p>
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
                          <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                          <YAxis domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
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
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                          />
                          <PolarRadiusAxis
                            domain={[0, 5]}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
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
                      <p className="text-muted-foreground">{facultyProfile?.subjects?.join(', ') || 'No subjects assigned'}</p>
                    </div>
                  </div>
                  <FacultyExcelReport
                    facultyId={facultyProfile?.id || ''}
                    facultyName={user?.name || 'Faculty Member'}
                    stats={facultyStats}
                    comments={comments}
                  />
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
                  title="Peer Percentile"
                  value={`${percentile}th`}
                  subtitle="Among all faculty"
                  icon={Award}
                />
                <StatsCard
                  title="Total Responses"
                  value={submissions.length}
                  subtitle="Student evaluations"
                  icon={Users}
                />
                <StatsCard
                  title="Comments"
                  value={comments.length}
                  subtitle="Student feedback"
                  icon={MessageSquare}
                />
              </div>

              {/* Charts Row */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Historical Trend */}
                <div className="glass-card rounded-xl p-6">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-4">Performance Trend</h3>
                  <div className="h-64">
                    {trendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                          <YAxis domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
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
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                          />
                          <PolarRadiusAxis
                            domain={[0, 5]}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
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
                  <h3 className="font-display text-lg font-semibold text-foreground mb-4">Student Comments</h3>
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {comments.map((c, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg bg-secondary/50 animate-fade-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs text-muted-foreground">
                            {format(c.submittedAt.toDate(), 'MMM d, yyyy')}
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
                    {comments.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No comments yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return renderContent();
};
