import React from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Calendar, Building2, FileText, Users, Download, Edit } from 'lucide-react';
import { College } from '@/lib/storage';

interface DepartmentManagementProps {
  college: College | null;
  courseData: Record<string, { years: string[]; yearDepartments?: Record<string, string[]> }>;
  subjectsData: Record<string, Record<string, Record<string, Record<string, { batches: string[] }>>>>;
  setLoadTemplateOpen: (open: boolean) => void;
  setAcademicConfigOpen: (open: boolean) => void;
}

export const DepartmentManagement: React.FC<DepartmentManagementProps> = React.memo(({
  college,
  courseData,
  subjectsData,
  setLoadTemplateOpen,
  setAcademicConfigOpen,
}) => {
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
                {Object.entries(courseData).map(([courseName, courseInfo]) => {
                  const course = courseInfo as { years: string[]; yearDepartments?: Record<string, string[]> };
                  return (
                    <div key={courseName} className="border border-border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        <h5 className="font-medium text-foreground">{courseName}</h5>
                      </div>
                      <div className="ml-7 space-y-3">
                        {course.years.map((yearName: string) => (
                          <div key={yearName} className="border-l-2 border-primary/20 pl-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-700">{yearName}</span>
                            </div>
                            <div className="ml-6 space-y-2">
                              {(course.yearDepartments?.[yearName] || []).map((deptName: string) => (
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
                                          {Object.entries(subjectsData[courseName][yearName][deptName]).map(([subject, subjectData]) => {
                                            const subject_data = subjectData as { batches: string[] };
                                            return (
                                              <div key={subject} className="flex flex-col gap-1">
                                                <Badge variant="outline" className="text-xs">
                                                  <FileText className="h-3 w-3 mr-1" />
                                                  {subject}
                                                </Badge>
                                                {subject_data.batches && subject_data.batches.length > 0 && (
                                                  <div className="flex flex-wrap gap-1 ml-2">
                                                    {subject_data.batches.map((batch: string) => (
                                                      <Badge key={batch} variant="secondary" className="text-xs">
                                                        <Users className="h-3 w-3 mr-1" />
                                                        {batch}
                                                      </Badge>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
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
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
