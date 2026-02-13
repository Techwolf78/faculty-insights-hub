import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { facultyApi, facultyAllocationsApi, Faculty, type FacultyAllocation, College, collegesApi } from '@/lib/storage';
import { getAcademicConfig } from '@/lib/academicConfig';
import { toast } from 'sonner';
import { X, Plus, Users, BookOpen, GraduationCap, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const FacultyAllocation: React.FC = () => {
  const { user } = useAuth();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [allocations, setAllocations] = useState<FacultyAllocation[]>([]);
  const [courseData, setCourseData] = useState<Record<string, { years: string[]; yearDepartments: Record<string, string[]> }>>({});
  const [subjectsData, setSubjectsData] = useState<Record<string, Record<string, Record<string, Record<string, { code: string; type: string; batches: string[] }>>>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [yearSubjects, setYearSubjects] = useState<Record<string, { department: string; subjects: { name: string; code: string; type: 'Theory' | 'Practical' }[] }[]>>({});
  const [college, setCollege] = useState<College | null>(null);
  const [deletingAllocation, setDeletingAllocation] = useState<FacultyAllocation | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<{ allocation: FacultyAllocation; subjectIndex: number } | null>(null);
  const [subjectConflicts, setSubjectConflicts] = useState<Record<string, { subjectName: string; facultyName: string; facultyId: string }[]>>({});

  const loadData = useCallback(async () => {
    if (!user?.collegeId) return;

    try {
      const [facultyList, config, existingAllocations, collegeData] = await Promise.all([
        facultyApi.getActiveByCollege(user.collegeId),
        getAcademicConfig(user.collegeId),
        facultyAllocationsApi.getByCollege(user.collegeId),
        collegesApi.getById(user.collegeId)
      ]);

      setFaculty(facultyList);
      setCourseData(config.courseData);
      setSubjectsData(config.subjectsData);
      setAllocations(existingAllocations);
      setCollege(collegeData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    }
  }, [user]);

  const checkConflicts = useCallback(async () => {
    if (!user?.collegeId || !selectedCourse || selectedYears.length === 0) return;

    const newConflicts: Record<string, { subjectName: string; facultyName: string; facultyId: string }[]> = {};

    for (const year of selectedYears) {
      const yearData = yearSubjects[year] || [];
      for (const deptData of yearData) {
        const key = `${year}-${deptData.department}`;
        const conflicts = await facultyAllocationsApi.checkSubjectConflicts(
          user.collegeId,
          selectedCourse,
          deptData.department,
          year,
          deptData.subjects,
          selectedFaculty
        );
        newConflicts[key] = conflicts;
      }
    }

    setSubjectConflicts(newConflicts);
  }, [user?.collegeId, selectedCourse, selectedYears, yearSubjects, selectedFaculty]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    checkConflicts();
  }, [checkConflicts]);

  const availableYears = selectedCourse ? courseData[selectedCourse]?.years || [] : [];

  const handleYearToggle = (year: string) => {
    setSelectedYears(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  const handleDepartmentToggle = (year: string, department: string) => {
    setYearSubjects(prev => {
      const current = prev[year] || [];
      const existing = current.find(d => d.department === department);
      if (existing) {
        return {
          ...prev,
          [year]: current.filter(d => d.department !== department)
        };
      } else {
        return {
          ...prev,
          [year]: [...current, { department, subjects: [] }]
        };
      }
    });
  };

  const handleSubjectToggle = (year: string, department: string, subject: { name: string; code: string; type: 'Theory' | 'Practical' }) => {
    setYearSubjects(prev => {
      const current = prev[year] || [];
      return {
        ...prev,
        [year]: current.map(d =>
          d.department === department
            ? {
                ...d,
                subjects: d.subjects.some(s => s.name === subject.name)
                  ? d.subjects.filter(s => s.name !== subject.name)
                  : [...d.subjects, subject]
              }
            : d
        )
      };
    });
  };

  const handleSave = async () => {
    if (!selectedFaculty || !selectedCourse || selectedYears.length === 0) {
      toast.error('Please select faculty, course, and at least one year');
      return;
    }

    // Validate that at least one new subject is selected per department
    for (const year of selectedYears) {
      const yearData = yearSubjects[year] || [];
      for (const deptData of yearData) {
        const newSubjects = deptData.subjects.filter(subject => {
          const isAlreadyAllocated = allocations.some(alloc =>
            alloc.facultyId === selectedFaculty &&
            alloc.course === selectedCourse &&
            alloc.department === deptData.department &&
            alloc.years.includes(year) &&
            alloc.subjects.some(s => s.name === subject.name)
          );
          return !isAlreadyAllocated;
        });

        if (newSubjects.length === 0) {
          toast.error(`Please select at least one new subject for ${deptData.department} in ${year} (subjects already allocated are not counted)`);
          return;
        }
      }
    }

    setIsLoading(true);
    try {
      // Process allocations - update existing or create new
      const allocationPromises: Promise<FacultyAllocation | null>[] = [];

      for (const year of selectedYears) {
        const yearData = yearSubjects[year] || [];
        for (const deptData of yearData) {
          // Filter out subjects that are already allocated to this faculty
          const newSubjects = deptData.subjects.filter(subject => {
            const isAlreadyAllocated = allocations.some(alloc =>
              alloc.facultyId === selectedFaculty &&
              alloc.course === selectedCourse &&
              alloc.department === deptData.department &&
              alloc.years.includes(year) &&
              alloc.subjects.some(s => s.name === subject.name)
            );
            return !isAlreadyAllocated;
          });

          if (newSubjects.length > 0) {
            // Check if allocation already exists for this faculty/course/department/year
            const existingAllocation = allocations.find(alloc =>
              alloc.facultyId === selectedFaculty &&
              alloc.course === selectedCourse &&
              alloc.department === deptData.department &&
              alloc.years.includes(year)
            );

            if (existingAllocation) {
              // Update existing allocation by adding new subjects
              const updatedSubjects = [...existingAllocation.subjects, ...newSubjects];
              allocationPromises.push(
                facultyAllocationsApi.update(existingAllocation.id, { subjects: updatedSubjects })
              );
            } else {
              // Create new allocation
              const newAllocation: Omit<FacultyAllocation, 'id' | 'createdAt' | 'updatedAt'> = {
                facultyId: selectedFaculty,
                collegeId: user!.collegeId!,
                course: selectedCourse,
                department: deptData.department,
                years: [year],
                subjects: newSubjects,
                isActive: true,
              };
              allocationPromises.push(facultyAllocationsApi.create(newAllocation));
            }
          }
        }
      }

      if (allocationPromises.length === 0) {
        toast.error('No new subjects to allocate');
        setIsLoading(false);
        return;
      }

      await Promise.all(allocationPromises);

      toast.success('Faculty allocation saved successfully');
      loadData(); // Refresh data
      resetForm();
    } catch (error) {
      console.error('Error saving allocation:', error);
      toast.error('Failed to save allocation');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedFaculty('');
    setSelectedCourse('');
    setSelectedYears([]);
    setYearSubjects({});
  };

  const getAvailableDepartments = (year: string) => {
    return selectedCourse ? courseData[selectedCourse]?.yearDepartments?.[year] || [] : [];
  };

  const getAvailableSubjects = (year: string, department: string) => {
    return subjectsData[selectedCourse]?.[year]?.[department] || {};
  };

  const selectedFacultyData = faculty.find(f => f.id === selectedFaculty);

  const handleDeleteAllocation = async (allocation: FacultyAllocation) => {
    try {
      await facultyAllocationsApi.delete(allocation.id);
      toast.success('Allocation deleted successfully');
      loadData();
      setDeletingAllocation(null);
    } catch (error) {
      console.error('Error deleting allocation:', error);
      toast.error('Failed to delete allocation');
    }
  };

  const handleDeleteSubject = async ({ allocation, subjectIndex }: { allocation: FacultyAllocation; subjectIndex: number }) => {
    try {
      const updatedSubjects = allocation.subjects.filter((_, idx) => idx !== subjectIndex);

      if (updatedSubjects.length === 0) {
        // If no subjects left, delete the entire allocation
        await facultyAllocationsApi.delete(allocation.id);
        toast.success('Allocation deleted successfully (no subjects remaining)');
      } else {
        // Update the allocation with remaining subjects
        await facultyAllocationsApi.update(allocation.id, { subjects: updatedSubjects });
        toast.success('Subject removed from allocation successfully');
      }

      loadData();
      setDeletingSubject(null);
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error('Failed to delete subject');
    }
  };

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Faculty Allocation"
        subtitle="Allocate courses, years, and subjects to faculty members"
        college={college}
      />

      <div className="p-6 space-y-6">

        {/* Allocation Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Create New Allocation</CardTitle>
                <CardDescription>Select a faculty member and allocate their teaching responsibilities</CardDescription>
              </div>
            </div>
          </CardHeader>
        <CardContent className="space-y-6">
          {/* Faculty Selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Faculty *</Label>
            <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select faculty member" />
              </SelectTrigger>
              <SelectContent>
                {faculty.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} ({f.employeeId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Course Selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Course *</Label>
            <Select value={selectedCourse} onValueChange={(value) => {
              setSelectedCourse(value);
              setSelectedYears([]);
              setYearSubjects({});
            }}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(courseData).map((course) => (
                  <SelectItem key={course} value={course}>
                    {course}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Selection */}
          {selectedCourse && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Years *</Label>
              <div className="col-span-3 space-y-2">
                {availableYears.map((year) => (
                  <div key={year} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`year-${year}`}
                      checked={selectedYears.includes(year)}
                      onChange={() => handleYearToggle(year)}
                      className="rounded"
                    />
                    <Label htmlFor={`year-${year}`}>{year}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Department and Subject Selection per Year */}
          {selectedYears.map((year) => (
            <Card key={year} className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="text-lg">{year} - Department & Subject Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Departments */}
                <div>
                  <Label className="text-sm font-medium">Departments</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getAvailableDepartments(year).map((dept) => (
                      <Badge
                        key={dept}
                        variant={(yearSubjects[year] || []).some(d => d.department === dept) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleDepartmentToggle(year, dept)}
                      >
                        {dept}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Subjects per Department */}
                {(yearSubjects[year] || []).map((deptData) => (
                  <div key={deptData.department} className="space-y-2">
                    <Label className="text-sm font-medium">{deptData.department} - Subjects</Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(getAvailableSubjects(year, deptData.department)).map(([subjectKey, subjectData]) => {
                        const subject = { name: subjectKey.replace(/\s*\((Theory|Practical)\)$/, ''), code: subjectData.code, type: subjectData.type as 'Theory' | 'Practical' };
                        const isSelected = deptData.subjects.some(s => s.name === subject.name);

                        // Check if this subject is already allocated to the selected faculty
                        const isAlreadyAllocated = allocations.some(alloc =>
                          alloc.facultyId === selectedFaculty &&
                          alloc.course === selectedCourse &&
                          alloc.department === deptData.department &&
                          alloc.years.includes(year) &&
                          alloc.subjects.some(s => s.name === subject.name)
                        );

                        return (
                          <Badge
                            key={subjectKey}
                            variant={isAlreadyAllocated ? "secondary" : isSelected ? "default" : "outline"}
                            className={isAlreadyAllocated ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
                            onClick={() => !isAlreadyAllocated && handleSubjectToggle(year, deptData.department, subject)}
                          >
                            {subject.name} ({subject.code} - {subject.type})
                            {isAlreadyAllocated && " ✓"}
                          </Badge>
                        );
                      })}
                    </div>
                    {subjectConflicts[`${year}-${deptData.department}`]?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {subjectConflicts[`${year}-${deptData.department}`].map((conflict, idx) => (
                          <div key={idx} className="text-sm text-yellow-600 flex items-center gap-2 mt-1">
                            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            First remove <span className="text-red-600 font-medium">{conflict.subjectName}</span> from <span className="text-red-600 font-medium">{conflict.facultyName}</span>.
                            <span className="text-yellow-700 text-xs">
                              Subject path: {selectedCourse}/{deptData.department}/{year}/{conflict.subjectName}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={resetForm}>
              Reset
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Allocation'}
            </Button>
          </div>
        </CardContent>
        </Card>

        {/* All Allocations Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>All Faculty Allocations</CardTitle>
                <CardDescription>View and manage all teaching allocations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {allocations.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No allocations found</p>
                <p className="text-sm text-muted-foreground">Create your first allocation using the form above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Group allocations by faculty */}
                {faculty.filter(f => allocations.some(a => a.facultyId === f.id)).map((facultyMember) => {
                  const facultyAllocations = allocations.filter(a => a.facultyId === facultyMember.id);
                  return (
                    <Card key={facultyMember.id} className="overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex items-center gap-4">
                              <h3 className="font-semibold text-base">{facultyMember.name}</h3>
                              <Badge variant="outline" className="text-xs">{facultyMember.employeeId}</Badge>
                              <Badge variant="secondary" className="text-xs">{facultyMember.designation}</Badge>
                              <span className="text-sm text-muted-foreground font-medium">
                                {facultyAllocations.length} allocation{facultyAllocations.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          {facultyAllocations.map((allocation) => (
                            <div key={allocation.id} className="border rounded-lg p-3 bg-card hover:bg-accent/5 transition-colors">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <BookOpen className="h-4 w-4 text-primary" />
                                      <span className="text-sm font-medium">Course:</span>
                                      <Badge variant="default">{allocation.course}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <GraduationCap className="h-4 w-4 text-primary" />
                                      <span className="text-sm font-medium">Department:</span>
                                      <Badge variant="secondary">{allocation.department}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-primary" />
                                      <span className="text-sm font-medium">Years:</span>
                                      {allocation.years.map(year => (
                                        <Badge key={year} variant="outline" className="text-xs">{year}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-muted-foreground mb-2 block">Subjects:</span>
                                    <div className="flex flex-wrap gap-2">
                                      {allocation.subjects.map((subject, idx) => (
                                        <div key={idx} className="flex items-center gap-1">
                                          <Badge variant="default" className="text-xs">
                                            {subject.name} ({subject.code}) - {subject.type}
                                          </Badge>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-5 w-5 p-0"
                                            onClick={() => setDeletingSubject({ allocation, subjectIndex: idx })}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
                                  onClick={() => setDeletingAllocation(allocation)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingAllocation} onOpenChange={() => setDeletingAllocation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Allocation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this allocation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingAllocation && handleDeleteAllocation(deletingAllocation)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Subject Confirmation Dialog */}
      <AlertDialog open={!!deletingSubject} onOpenChange={() => setDeletingSubject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this subject from the allocation?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-3 p-3 bg-muted rounded-md">
            <div className="text-sm space-y-1">
              <div><strong>Course:</strong> {deletingSubject?.allocation.course}</div>
              <div><strong>Department:</strong> {deletingSubject?.allocation.department}</div>
              <div><strong>Years:</strong> {deletingSubject?.allocation.years.join(', ')}</div>
              <div><strong>Subject:</strong> {deletingSubject?.allocation.subjects[deletingSubject.subjectIndex]?.name} ({deletingSubject?.allocation.subjects[deletingSubject.subjectIndex]?.code}) - {deletingSubject?.allocation.subjects[deletingSubject.subjectIndex]?.type}</div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingSubject && handleDeleteSubject(deletingSubject)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Subject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FacultyAllocation;