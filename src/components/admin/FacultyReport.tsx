import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useFacultyMemberStats, useAcademicConfig } from '@/hooks/useCollegeData';
import { facultyApi, submissionsApi, questionsApi, Faculty, FeedbackSubmission, Question } from '@/lib/storage';
import { format } from 'date-fns';
import { Star, Users, MessageSquare, TrendingUp, Download, Calendar } from 'lucide-react';
import { FacultyExcelReport } from '@/components/reports/FacultyExcelReport';

interface FacultyReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FacultyReport: React.FC<FacultyReportProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const { data: academicConfig } = useAcademicConfig(user?.collegeId);

  const availableSemesters = React.useMemo(() => {
    if (!academicConfig) return [];
    const semesters = new Set<string>();
    
    // Collect all semesters defined in courseData
    Object.values(academicConfig.courseData).forEach(course => {
      if (course.semesters) {
        course.semesters.forEach(s => semesters.add(s));
      }
    });

    // Also check subjectsData for any specific semesters
    Object.values(academicConfig.subjectsData).forEach(years => {
      Object.values(years).forEach(sems => {
        Object.keys(sems).forEach(s => semesters.add(s));
      });
    });

    return Array.from(semesters).sort();
  }, [academicConfig]);

  // Use pre-computed stats
  const { data: facultyStats } = useFacultyMemberStats(
    selectedFacultyId, 
    selectedSemester === 'all' ? undefined : selectedSemester,
    user?.collegeId
  );

  const loadFaculty = useCallback(async () => {
    if (!user?.collegeId) return;
    try {
      const fac = await facultyApi.getByCollege(user.collegeId);
      setFaculty(fac);
    } catch (error) {
      console.error('Error loading faculty:', error);
    }
  }, [user?.collegeId]);

  useEffect(() => {
    if (open && user?.collegeId) {
      loadFaculty();
    }
  }, [open, user?.collegeId, loadFaculty]);

  const selectedFaculty = faculty.find(f => f.id === selectedFacultyId);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Faculty Performance Report</DialogTitle>
          <DialogDescription>
            Generate detailed performance reports for individual faculty members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Faculty Selection */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground ml-1">Faculty Member</label>
              <Select value={selectedFacultyId} onValueChange={setSelectedFacultyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select faculty member" />
                </SelectTrigger>
                <SelectContent>
                  {faculty.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}{member.designation ? ` - ${member.designation}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Academic Year Selection */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground ml-1">Academic Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="2023-24">2023-24</SelectItem>
                  <SelectItem value="2024-25">2024-25</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Semester Selection */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground ml-1">Semester</label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {availableSemesters.map((sem) => (
                    <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            {facultyStats && selectedFaculty && (
              <FacultyExcelReport
                facultyId={selectedFacultyId}
                facultyName={selectedFaculty.name}
                academicYear={selectedYear === 'all' ? undefined : selectedYear}
                semester={selectedSemester === 'all' ? undefined : selectedSemester}
                stats={facultyStats}
                comments={facultyStats.recentComments}
                loading={isLoading}
              />
            )}
          </div>

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Generating report...</p>
            </div>
          )}

          {facultyStats && selectedFaculty && (
            <>
              {/* Faculty Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {selectedFaculty.name}
                    </CardTitle>
                    <FacultyExcelReport
                      facultyId={selectedFacultyId}
                      facultyName={selectedFaculty.name}
                      semester={selectedSemester === 'all' ? undefined : selectedSemester}
                      stats={facultyStats}
                      comments={facultyStats?.recentComments || []}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Designation</p>
                      <p className="font-medium">{selectedFaculty.designation}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-medium">{selectedFaculty.specialization}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Experience</p>
                      <p className="font-medium">{selectedFaculty.experience} years</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Overall Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{facultyStats.averageRating.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">Average Rating</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      {renderStars(facultyStats.averageRating)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{facultyStats.totalSubmissions}</p>
                        <p className="text-xs text-muted-foreground">Total Responses</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{facultyStats.recentComments.length}</p>
                        <p className="text-xs text-muted-foreground">Recent Comments</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Rating Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Rating Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map(rating => (
                      <div key={rating} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 min-w-[60px]">
                          {rating}
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        </div>
                        <Progress
                          value={(facultyStats.ratingDistribution[rating] / facultyStats.totalSubmissions) * 100}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground min-w-[40px]">
                          {facultyStats.ratingDistribution[rating]}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Category-wise Analysis */}
              {facultyStats.categoryScores && Object.keys(facultyStats.categoryScores).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Category-wise Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(facultyStats.categoryScores)
                        .map(([category, score]) => (
                        <div key={category} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{category}</p>
                            <Badge variant="secondary">{score.count} responses</Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              {renderStars(score.average)}
                              <span className="text-sm font-medium ml-2">
                                {score.average.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Comments */}
              {facultyStats.recentComments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Comments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {facultyStats.recentComments.map((item, index) => (
                        <div key={index} className="border-l-2 border-primary/20 pl-4">
                          <p className="text-sm italic">"{item.text}"</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(item.submittedAt.toDate(), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FacultyReport;