import React from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Calendar, Building2, FileText, Users, Download, Edit } from 'lucide-react';
import { College } from '@/lib/storage';

interface DepartmentManagementProps {
  college: College | null;
  courseData: Record<string, { years: string[]; yearDepartments?: Record<string, string[]> }>;
  subjectsData: Record<string, Record<string, Record<string, Record<string, Record<string, { code: string; type: string; batches: string[] }>>>>>;
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
                          <div key={yearName} className="border-l-2 border-primary/20 pl-4 mb-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Calendar className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-700">{yearName}</span>
                            </div>
                            <div className="ml-6 space-y-4">
                              {/* Semesters Loop */}
                              {subjectsData[courseName]?.[yearName] && Object.entries(subjectsData[courseName][yearName]).sort().map(([semesterName, departments]) => (
                                <div key={semesterName} className="border-l-2 border-orange-200 pl-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="h-2 w-2 rounded-full bg-orange-400" />
                                    <span className="text-sm font-semibold text-orange-700 uppercase tracking-wider">{semesterName} SEMESTER</span>
                                  </div>
                                  <div className="ml-4 space-y-3">
                                    {Object.entries(departments).map(([deptName, subjects]) => (
                                      <div key={deptName} className="border-l-2 border-blue-200 pl-4">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Building2 className="h-4 w-4 text-blue-600" />
                                          <span className="font-medium text-blue-700">{deptName}</span>
                                        </div>
                                        <div className="ml-6 space-y-1">
                                          {/* Subjects Loop */}
                                          {subjects && Object.keys(subjects).length > 0 && (
                                            <div>
                                              <span className="text-xs font-medium text-muted-foreground mr-2">Subjects:</span>
                                              <div className="flex flex-wrap gap-2 mt-1">
                                                {Object.entries(subjects).map(([subject, subjectInfo]) => (
                                                  <div key={subject} className="flex flex-wrap items-center gap-1">
                                                    <Badge variant="outline" className="text-xs py-0.5 px-2 bg-blue-50/50 border-blue-200">
                                                      <FileText className="h-3 w-3 mr-1 text-blue-600" />
                                                      {subject}
                                                      {subjectInfo.code && <span className="ml-1 opacity-60">({subjectInfo.code})</span>}
                                                    </Badge>
                                                    {subjectInfo.batches && subjectInfo.batches.length > 0 && (
                                                      <div className="flex gap-1 ml-1">
                                                        {subjectInfo.batches.map(batch => (
                                                          <Badge key={batch} variant="secondary" className="text-[10px] h-4 px-1">
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
