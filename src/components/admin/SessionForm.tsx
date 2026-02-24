import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { GraduationCap, Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { departmentsApi, facultyApi, feedbackSessionsApi, Department, Faculty, questionGroupsApi, QuestionGroup, facultyAllocationsApi, FacultyAllocation } from '@/lib/storage';
import { getAcademicConfig } from '@/lib/academicConfig';
import { toast } from 'sonner';
import { Timestamp } from 'firebase/firestore';

interface SessionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const SessionForm: React.FC<SessionFormProps> = ({ open, onOpenChange, onSuccess }) => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [allocations, setAllocations] = useState<FacultyAllocation[]>([]);
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [courseData, setCourseData] = useState<Record<string, { years: string[]; yearDepartments: Record<string, string[]> }>>({});
  const [subjectsData, setSubjectsData] = useState<Record<string, Record<string, Record<string, Record<string, Record<string, { code: string; type: string; batches: string[] }>>>>>>({});

  // Refs for dropdowns
  const courseSelectRef = React.useRef<HTMLButtonElement>(null);
  const yearSelectRef = React.useRef<HTMLButtonElement>(null);
  const semesterSelectRef = React.useRef<HTMLButtonElement>(null);
  const departmentSelectRef = React.useRef<HTMLButtonElement>(null);
  const subjectSelectRef = React.useRef<HTMLButtonElement>(null);
  const batchSelectRef = React.useRef<HTMLButtonElement>(null);
  const questionGroupSelectRef = React.useRef<HTMLButtonElement>(null);

  // Form state
  const [course, setCourse] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('');
  const [department, setDepartment] = useState('');
  const [subject, setSubject] = useState('');
  const [batch, setBatch] = useState('');
  const [questionGroup, setQuestionGroup] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [facultyOpen, setFacultyOpen] = useState(false);
  const [expiryOption, setExpiryOption] = useState('10'); // Default to 10 minutes
  const [expiresAt, setExpiresAt] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectType, setSubjectType] = useState<'Theory' | 'Practical' | 'Tutorial'>('Theory');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeRole = user?.activeRole || user?.role;
      const [depts, fac, groups, config, allocs] = await Promise.all([
        departmentsApi.getByCollege(user!.collegeId!),
        facultyApi.getByCollege(user!.collegeId!),
        questionGroupsApi.getByCollege(user!.collegeId!),
        getAcademicConfig(user!.collegeId!),
        facultyAllocationsApi.getByCollege(user!.collegeId!)
      ]);

      setDepartments(depts);
      setFaculty(fac);
      setQuestionGroups(groups);
      setCourseData(config.courseData);
      setSubjectsData(config.subjectsData);
      setAllocations(allocs);

      // Auto-select faculty if user is a faculty member or HOD
      if (activeRole === 'faculty' || activeRole === 'hod') {
        const currentFaculty = fac.find(f => f.userId === (user?.uid || user?.id));
        if (currentFaculty) {
          setSelectedFaculty(currentFaculty.id);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (open && user?.collegeId) {
      resetForm();
      loadData();
    }
  }, [open, user?.collegeId, loadData]);

  const resetForm = () => {
    const activeRole = user?.activeRole || user?.role;
    setCourse('');
    setAcademicYear('');
    setSemester('');
    setDepartment('');
    setSubject('');
    setBatch('');
    setQuestionGroup('');
    setSelectedFaculty('');
    setExpiryOption(activeRole === 'faculty' ? '10' : 'default');
    setExpiresAt('');
    setSubjectCode('');
    setSubjectType('Theory');
  };

  // Get faculty allocations
  const facultyAllocations = useMemo(() =>
    selectedFaculty ? allocations.filter(a => a.facultyId === selectedFaculty) : [],
    [selectedFaculty, allocations]
  );

  // Derive available options from faculty allocations
  const availableCourses = useMemo(() =>
    [...new Set(facultyAllocations.map(a => a.course))],
    [facultyAllocations]
  );

  const availableYears = useMemo(() => {
    if (course) {
      return [...new Set(facultyAllocations.filter(a => a.course === course).flatMap(a => a.years))];
    }
    return [...new Set(facultyAllocations.flatMap(a => a.years))];
  }, [facultyAllocations, course]);

  const availableSemesters = useMemo(() => {
    if (course && academicYear) {
      return [...new Set(facultyAllocations.filter(a => a.course === course && a.years.includes(academicYear)).map(a => a.semester))];
    }
    return [];
  }, [facultyAllocations, course, academicYear]);

  const availableDepartments = useMemo(() => {
    if (course && academicYear && semester) {
      return [...new Set(facultyAllocations.filter(a => a.course === course && a.years.includes(academicYear) && a.semester === semester).map(a => a.department))];
    }
    return [];
  }, [facultyAllocations, course, academicYear, semester]);

  const availableSubjects = useMemo(() => {
    if (course && academicYear && semester && department) {
      return facultyAllocations
        .filter(a => a.course === course && a.years.includes(academicYear) && a.semester === semester && a.department === department)
        .flatMap(a => a.subjects.map(s => s.name));
    }
    return [];
  }, [facultyAllocations, course, academicYear, semester, department]);

  const availableBatches = useMemo(() => {
    if (course && academicYear && semester && department && subject) {
      return subjectsData[course]?.[academicYear]?.[semester]?.[department]?.[subject]?.batches || [];
    }
    return [];
  }, [subjectsData, course, academicYear, semester, department, subject]);

  // Auto-set batch to empty when no batches are available
  useEffect(() => {
    if (subject && availableBatches.length === 0 && batch !== '') {
      setBatch('');
    }
  }, [subject, availableBatches, batch]);

  // Auto-select single options
  useEffect(() => {
    if (availableCourses.length === 1 && !course) {
      setCourse(availableCourses[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableCourses]);

  useEffect(() => {
    if (availableYears.length === 1 && !academicYear) {
      setAcademicYear(availableYears[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableYears]);

  useEffect(() => {
    if (availableSemesters.length === 1 && !semester) {
      setSemester(availableSemesters[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableSemesters]);

  useEffect(() => {
    if (availableDepartments.length === 1 && !department) {
      setDepartment(availableDepartments[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableDepartments]);

  useEffect(() => {
    if (availableSubjects.length === 1 && !subject) {
      setSubject(availableSubjects[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableSubjects]);

  // Auto-populate subject code and type when subject changes
  useEffect(() => {
    if (subject && facultyAllocations.length > 0) {
      const matchingAllocation = facultyAllocations.find(a =>
        a.course === course &&
        a.years.includes(academicYear) &&
        a.semester === semester &&
        a.department === department &&
        a.subjects.some(s => s.name === subject)
      );
      if (matchingAllocation) {
        const subjectData = matchingAllocation.subjects.find(s => s.name === subject);
        if (subjectData) {
          setSubjectCode(subjectData.code);
          setSubjectType(subjectData.type);
        }
      }
    } else {
      setSubjectCode('');
      setSubjectType('Theory');
    }
  }, [subject, course, department, academicYear, semester, facultyAllocations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.collegeId) return;

    setIsLoading(true);
    try {
      // Find or create department
      let selectedDept = departments.find(d => d.name === department);
      
      // If department doesn't exist, create it automatically
      if (!selectedDept) {
        console.log(`Department "${department}" not found, creating it automatically...`);
        const deptCode = department.split(' ').map(word => word[0]).join('').toUpperCase();
        selectedDept = await departmentsApi.create({
          collegeId: user.collegeId,
          name: department,
          code: deptCode,
          isActive: true,
        });
        // Refresh departments list
        setDepartments([...departments, selectedDept]);
        toast.success(`Department "${department}" created automatically`);
      }

      const uniqueUrl = `session-${crypto.randomUUID().slice(0, 8)}`;

      let expirationDate: Date;
      if (expiryOption === 'custom' && expiresAt) {
        expirationDate = new Date(expiresAt);
      } else if (expiryOption === '5') {
        expirationDate = new Date(Date.now() + 5 * 60 * 1000);
      } else if (expiryOption === '10') {
        expirationDate = new Date(Date.now() + 10 * 60 * 1000);
      } else if (expiryOption === '30') {
        expirationDate = new Date(Date.now() + 30 * 60 * 1000);
      } else if (expiryOption === '60') {
        expirationDate = new Date(Date.now() + 60 * 60 * 1000);
      } else {
        // Default 30 days
        expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }

      await feedbackSessionsApi.create({
        collegeId: user.collegeId,
        departmentId: selectedDept.id,
        facultyId: selectedFaculty,
        questionGroupId: questionGroup,
        course,
        academicYear,
        semester,
        subject,
        subjectCode,
        subjectType,
        batch,
        accessMode: 'anonymous',
        uniqueUrl,
        isActive: true,
        status: 'active',
        startDate: Timestamp.now(),
        createdBy: user.id,
        expiresAt: Timestamp.fromDate(expirationDate),
      });

      toast.success('Feedback session created successfully!');
      onOpenChange(false);
      onSuccess?.();

      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Feedback Session</DialogTitle>
          <DialogDescription>
            Set up a new feedback session for a specific academic context.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(user?.activeRole || user?.role) !== 'faculty' && (
            <div className="space-y-2">
              <Label htmlFor="faculty">Faculty Member</Label>
              <Popover open={facultyOpen} onOpenChange={setFacultyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={facultyOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedFaculty
                      ? faculty.find((f) => f.id === selectedFaculty)?.name
                      : "Select faculty member"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Search faculty member..." />
                    <CommandList>
                      <CommandEmpty>No faculty found.</CommandEmpty>
                      <CommandGroup>
                        {faculty.map((f) => (
                          <CommandItem
                            key={f.id}
                            value={`${f.name} ${f.employeeId} ${f.designation || ''}`}
                            onSelect={() => {
                              setSelectedFaculty(f.id);
                              setCourse(''); // Reset all dependent fields
                              setAcademicYear('');
                              setSemester('');
                              setDepartment('');
                              setSubject('');
                              setBatch('');
                              setQuestionGroup('');
                              setFacultyOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedFaculty === f.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {f.name} ({f.employeeId}){f.designation ? ` - ${f.designation}` : ''}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* If faculty, show current faculty name as read-only but keep it hidden if possible to same space */}
          {(user?.activeRole || user?.role) === 'faculty' && selectedFaculty && (
            <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {faculty.find(f => f.id === selectedFaculty)?.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Faculty Member</p>
                <p className="font-semibold text-foreground">{faculty.find(f => f.id === selectedFaculty)?.name}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course">Course/Program</Label>
              <Select value={course} onValueChange={(value) => {
                setCourse(value);
                setAcademicYear(''); // Reset dependent fields
                setSemester('');
                setDepartment('');
                setSubject('');
                setBatch('');
                setQuestionGroup('');
                // Close the dropdown after selection
                setTimeout(() => {
                  courseSelectRef.current?.click();
                }, 100);
              }} disabled={!selectedFaculty}>
                <SelectTrigger ref={courseSelectRef}>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {availableCourses.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="academicYear">Academic Year</Label>
              <Select value={academicYear} onValueChange={(value) => {
                setAcademicYear(value);
                setSemester('');
                setDepartment(''); // Reset dependent fields
                setSubject('');
                setBatch('');
                setQuestionGroup('');
                // Close the dropdown after selection
                setTimeout(() => {
                  yearSelectRef.current?.click();
                }, 100);
              }} disabled={!selectedFaculty || !course}>
                <SelectTrigger ref={yearSelectRef}>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Select value={semester} onValueChange={(value) => {
                setSemester(value);
                setDepartment(''); // Reset dependent fields
                setSubject('');
                setBatch('');
                setQuestionGroup('');
                // Close the dropdown after selection
                setTimeout(() => {
                  semesterSelectRef.current?.click();
                }, 100);
              }} disabled={!selectedFaculty || !course || !academicYear}>
                <SelectTrigger ref={semesterSelectRef}>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {availableSemesters.map((sem) => (
                    <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={department} onValueChange={(value) => {
                setDepartment(value);
                setSubject(''); // Reset dependent fields
                setBatch('');
                setQuestionGroup('');
                // Close the dropdown after selection
                setTimeout(() => {
                  departmentSelectRef.current?.click();
                }, 100);
              }} disabled={!selectedFaculty || !course || !academicYear || !semester}>
                <SelectTrigger ref={departmentSelectRef}>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {availableDepartments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={subject} onValueChange={(value) => {
                setSubject(value);
                setBatch(''); // Reset dependent fields
                setQuestionGroup('');
                // Close the dropdown after selection
                setTimeout(() => {
                  subjectSelectRef.current?.click();
                }, 100);
              }} disabled={!selectedFaculty || !course || !academicYear || !semester || !department}>
                <SelectTrigger ref={subjectSelectRef}>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((subj) => (
                    <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {subject && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="subjectCode">Subject Code</Label>
                  <Input
                    id="subjectCode"
                    value={subjectCode}
                    readOnly
                    placeholder="Subject code will be auto-filled"
                    className="font-sans"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subjectType">Subject Type</Label>
                  <Input
                    id="subjectType"
                    value={subjectType}
                    readOnly
                    placeholder="Subject type will be auto-filled"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="batch">Batch {availableBatches.length === 0 && subject && <span className="text-xs text-muted-foreground">(Optional - No batches configured)</span>}</Label>
              <Select value={batch} onValueChange={(value) => {
                setBatch(value);
                setQuestionGroup(''); // Reset dependent fields
                // Close the dropdown after selection
                setTimeout(() => {
                  batchSelectRef.current?.click();
                }, 100);
              }} disabled={!selectedFaculty || !course || !academicYear || !department || !subject || availableBatches.length === 0}>
                <SelectTrigger ref={batchSelectRef}>
                  <SelectValue placeholder={availableBatches.length === 0 && subject ? "No batches" : "Select batch"} />
                </SelectTrigger>
                <SelectContent>
                  {availableBatches.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionGroup">Question Group</Label>
              <Select value={questionGroup} onValueChange={(value) => {
                setQuestionGroup(value);
                // Close the dropdown after selection
                setTimeout(() => {
                  questionGroupSelectRef.current?.click();
                }, 100);
              }} disabled={!selectedFaculty || !course || !academicYear || !department || !subject || (availableBatches.length > 0 && !batch)}>
                <SelectTrigger ref={questionGroupSelectRef}>
                  <SelectValue placeholder="Select question group" />
                </SelectTrigger>
                <SelectContent>
                  {questionGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-border/50">
            <div className="space-y-2">
              <Label htmlFor="expiryOption">Session Duration</Label>
              <Select value={expiryOption} onValueChange={setExpiryOption}>
                <SelectTrigger id="expiryOption">
                  <SelectValue placeholder="Select session duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Minutes</SelectItem>
                  <SelectItem value="10">10 Minutes</SelectItem>
                  <SelectItem value="30">30 Minutes</SelectItem>
                  <SelectItem value="60">60 Minutes</SelectItem>
                  <SelectItem value="default">30 Days (Standard)</SelectItem>
                  <SelectItem value="custom">Custom Date & Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {expiryOption === 'custom' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                <Label htmlFor="expiresAt">Expires At</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="max-w-md"
                  required={expiryOption === 'custom'}
                />
                <p className="text-xs text-muted-foreground">
                  Session will automatically close at this time.
                </p>
              </div>
            )}
            
            {expiryOption !== 'custom' && expiryOption !== 'default' && (
              <p className="text-xs text-primary font-medium flex items-center gap-1.5 px-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Session will expire in {expiryOption} minutes after creation.
              </p>
            )}
          </div>

          <DialogFooter className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Create Session
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};