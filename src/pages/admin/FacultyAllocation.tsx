import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { facultyApi, facultyAllocationsApi, Faculty, type FacultyAllocation, College, collegesApi } from '@/lib/storage';
import { getAcademicConfig } from '@/lib/academicConfig';
import { toast } from 'sonner';
import { X, Plus, Users, BookOpen, GraduationCap, Trash2, Calendar, AlertTriangle, Upload, Check, ChevronsUpDown } from 'lucide-react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import BulkImportAllocations from '@/components/admin/BulkImportAllocations';

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
  const [yearSubjects, setYearSubjects] = useState<Record<string, { department: string; subjects: { name: string; code: string; type: 'Theory' | 'Practical' | 'Tutorial' }[] }[]>>({});
  const [college, setCollege] = useState<College | null>(null);
  const [deletingAllocation, setDeletingAllocation] = useState<FacultyAllocation | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<{ allocation: FacultyAllocation; subjectIndex: number } | null>(null);
  const [subjectConflicts, setSubjectConflicts] = useState<Record<string, { subjectName: string; facultyName: string; facultyId: string }[]>>({});
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [facultyComboboxOpen, setFacultyComboboxOpen] = useState(false);

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

  const handleSubjectToggle = (year: string, department: string, subject: { name: string; code: string; type: 'Theory' | 'Practical' | 'Tutorial' }) => {
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

      <div className="p-2 space-y-6">

        {/* Allocation Form */}
        <Card className="border-0 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Plus className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Create Allocation</CardTitle>
                  <CardDescription className="text-sm">Select faculty and subjects</CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkImport(true)}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Bulk Import
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Faculty, Course, and Years Selection in same row */}
            <div className="grid grid-cols-1 md:grid-cols-[40%_20%_40%] gap-4">
              {/* Faculty Selection */}
              <div className="space-y-1">
                <Label className="text-sm font-medium">Faculty *</Label>
                <Popover open={facultyComboboxOpen} onOpenChange={setFacultyComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={facultyComboboxOpen}
                      className="w-full justify-between h-9"
                    >
                      {selectedFaculty
                        ? faculty.find((f) => f.id === selectedFaculty)?.name + " (" + faculty.find((f) => f.id === selectedFaculty)?.employeeId + ")"
                        : "Select faculty"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search faculty..." />
                      <CommandList>
                        <CommandEmpty>No faculty found.</CommandEmpty>
                        <CommandGroup>
                          {faculty.map((f) => (
                            <CommandItem
                              key={f.id}
                              value={f.name + " " + f.employeeId}
                              onSelect={() => {
                                setSelectedFaculty(f.id);
                                setSelectedCourse('');
                                setSelectedYears([]);
                                setYearSubjects({});
                                setFacultyComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedFaculty === f.id ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              {f.name} ({f.employeeId})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Course Selection */}
              <div className="space-y-1">
                <Label className="text-sm font-medium">Course *</Label>
                <Select value={selectedCourse} disabled={!selectedFaculty} onValueChange={(value) => {
                  setSelectedCourse(value);
                  setSelectedYears([]);
                  setYearSubjects({});
                }}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={selectedFaculty ? "Select course" : "Select faculty first"} />
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
              <div className="space-y-1">
                <Label className="text-sm font-medium">Years *</Label>
                {selectedCourse ? (
                  <div className="flex flex-wrap gap-1">
                    {availableYears.map((year) => (
                      <Badge
                        key={year}
                        variant={selectedYears.includes(year) ? "default" : "outline"}
                        className="cursor-pointer text-xs px-2 py-1"
                        onClick={() => handleYearToggle(year)}
                      >
                        {year}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Select course first</div>
                )}
              </div>
            </div>

          {/* Department and Subject Selection per Year */}
          {selectedYears.map((year) => (
            <Card key={year} className="border-l-4 border-l-primary bg-card/50">
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-base">{year} - Subjects</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-0 space-y-2">
                {/* Departments */}
                <div>
                  <Label className="text-xs font-medium text-gray-600">Departments</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {getAvailableDepartments(year).map((dept) => (
                      <Badge
                        key={dept}
                        variant={(yearSubjects[year] || []).some(d => d.department === dept) ? "default" : "outline"}
                        className="cursor-pointer text-xs px-2 py-0.5"
                        onClick={() => handleDepartmentToggle(year, dept)}
                      >
                        {dept}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Subjects per Department */}
                {(yearSubjects[year] || []).map((deptData) => (
                  <div key={deptData.department} className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600">{deptData.department}</Label>
                    <div className="flex flex-wrap gap-1">
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
                            className={isAlreadyAllocated ? "cursor-not-allowed opacity-60 text-xs px-2 py-0.5" : "cursor-pointer text-xs px-2 py-0.5"}
                            onClick={() => !isAlreadyAllocated && handleSubjectToggle(year, deptData.department, subject)}
                          >
                            {subject.name} ({subject.code || 'N/A'}) - {subject.type || 'N/A'}
                            {isAlreadyAllocated && " ✓"}
                          </Badge>
                        );
                      })}
                    </div>
                    {subjectConflicts[`${year}-${deptData.department}`]?.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {subjectConflicts[`${year}-${deptData.department}`].map((conflict, idx) => (
                          <div key={idx} className="text-xs text-yellow-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
                            <span>Remove <strong>{conflict.subjectName}</strong> from <strong>{conflict.facultyName}</strong> • Path: {selectedCourse}/{deptData.department}/{year}/{conflict.subjectName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end gap-1.5 pt-1.5 border-t">
            <Button variant="outline" onClick={resetForm} className="px-2.5 py-1 h-7 text-xs">
              Reset
            </Button>
              <Button onClick={handleSave} disabled={isLoading} className="px-2.5 py-1 h-7 bg-primary hover:bg-primary/90 text-primary-foreground text-xs">
              {isLoading ? 'Saving...' : 'Save'}
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
                                            {subject.name} ({subject.code || 'N/A'}) - {subject.type || 'N/A'}
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
              <div><strong>Subject:</strong> {deletingSubject?.allocation.subjects[deletingSubject.subjectIndex]?.name} ({deletingSubject?.allocation.subjects[deletingSubject.subjectIndex]?.code || 'N/A'}) - {deletingSubject?.allocation.subjects[deletingSubject.subjectIndex]?.type || 'N/A'}</div>
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

      {/* Bulk Import Dialog */}
      <BulkImportAllocations
        open={showBulkImport}
        onOpenChange={setShowBulkImport}
        collegeId={user?.collegeId || ''}
        onSuccess={loadData}
      />
    </div>
  );
};

export default FacultyAllocation;