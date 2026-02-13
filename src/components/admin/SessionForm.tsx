import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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
  const [subjectsData, setSubjectsData] = useState<Record<string, Record<string, Record<string, Record<string, { code: string; type: string; batches: string[] }>>>>>({});

  // Refs for dropdowns
  const courseSelectRef = React.useRef<HTMLButtonElement>(null);
  const yearSelectRef = React.useRef<HTMLButtonElement>(null);
  const departmentSelectRef = React.useRef<HTMLButtonElement>(null);
  const subjectSelectRef = React.useRef<HTMLButtonElement>(null);
  const batchSelectRef = React.useRef<HTMLButtonElement>(null);
  const questionGroupSelectRef = React.useRef<HTMLButtonElement>(null);
  const facultySelectRef = React.useRef<HTMLButtonElement>(null);

  // Form state
  const [course, setCourse] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [department, setDepartment] = useState('');
  const [subject, setSubject] = useState('');
  const [batch, setBatch] = useState('');
  const [questionGroup, setQuestionGroup] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectType, setSubjectType] = useState<'Theory' | 'Practical'>('Theory');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
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
    setCourse('');
    setAcademicYear('');
    setDepartment('');
    setSubject('');
    setBatch('');
    setQuestionGroup('');
    setSelectedFaculty('');
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

  const availableDepartments = useMemo(() => {
    if (course && academicYear) {
      return [...new Set(facultyAllocations.filter(a => a.course === course && a.years.includes(academicYear)).map(a => a.department))];
    }
    return [];
  }, [facultyAllocations, course, academicYear]);

  const availableSubjects = useMemo(() => {
    if (course && academicYear && department) {
      return facultyAllocations
        .filter(a => a.course === course && a.years.includes(academicYear) && a.department === department)
        .flatMap(a => a.subjects.map(s => s.name));
    }
    return [];
  }, [facultyAllocations, course, academicYear, department]);

  const availableBatches = useMemo(() => {
    if (course && academicYear && department && subject) {
      return subjectsData[course as keyof typeof subjectsData]?.[academicYear]?.[department]?.[subject]?.batches || [];
    }
    return [];
  }, [subjectsData, course, academicYear, department, subject]);

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
  }, [subject, course, department, academicYear, facultyAllocations]);

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

      await feedbackSessionsApi.create({
        collegeId: user.collegeId,
        departmentId: selectedDept.id,
        facultyId: selectedFaculty,
        questionGroupId: questionGroup,
        course,
        academicYear,
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
        expiresAt: expiresAt ? Timestamp.fromDate(new Date(expiresAt)) : Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      });

      toast.success('Feedback session created successfully!');
      onOpenChange(false);
      onSuccess?.();

      // Reset form
      setCourse('');
      setAcademicYear('');
      setDepartment('');
      setSubject('');
      setBatch('');
      setQuestionGroup('');
      setSelectedFaculty('');
      setExpiresAt('');
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
          <div className="space-y-2">
            <Label htmlFor="faculty">Faculty Member</Label>
            <Select value={selectedFaculty} onValueChange={(value) => {
              setSelectedFaculty(value);
              setCourse(''); // Reset all dependent fields
              setAcademicYear('');
              setDepartment('');
              setSubject('');
              setBatch('');
              setQuestionGroup('');
              // Close the dropdown after selection
              setTimeout(() => {
                facultySelectRef.current?.click();
              }, 100);
            }}>
              <SelectTrigger ref={facultySelectRef}>
                <SelectValue placeholder="Select faculty member" />
              </SelectTrigger>
              <SelectContent>
                {faculty.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}{f.designation ? ` - ${f.designation}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course">Course/Program</Label>
              <Select value={course} onValueChange={(value) => {
                setCourse(value);
                setAcademicYear(''); // Reset dependent fields
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
              }} disabled={!selectedFaculty || !course || !academicYear}>
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
              }} disabled={!selectedFaculty || !course || !academicYear || !department}>
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

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expires At (Optional)</Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for 30 days default expiry
            </p>
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