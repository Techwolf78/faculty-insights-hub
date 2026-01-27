import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { departmentsApi, facultyApi, feedbackSessionsApi, Department, Faculty, questionGroupsApi, QuestionGroup } from '@/lib/storage';
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
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [courseData, setCourseData] = useState<Record<string, { years: string[]; yearDepartments: Record<string, string[]> }>>({});

  // Refs for dropdowns
  const courseSelectRef = React.useRef<HTMLButtonElement>(null);
  const yearSelectRef = React.useRef<HTMLButtonElement>(null);
  const departmentSelectRef = React.useRef<HTMLButtonElement>(null);
  const questionGroupSelectRef = React.useRef<HTMLButtonElement>(null);
  const facultySelectRef = React.useRef<HTMLButtonElement>(null);

  // Form state
  const [course, setCourse] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [department, setDepartment] = useState('');
  const [questionGroup, setQuestionGroup] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [depts, fac, groups, config] = await Promise.all([
        departmentsApi.getByCollege(user!.collegeId!),
        facultyApi.getByCollege(user!.collegeId!),
        questionGroupsApi.getByCollege(user!.collegeId!),
        getAcademicConfig(user!.collegeId!)
      ]);

      setDepartments(depts);
      setFaculty(fac);
      setQuestionGroups(groups);
      setCourseData(config.courseData);

      // Build department data - no longer needed with new structure
      // Departments are now accessed directly from courseData.yearDepartments
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
    setQuestionGroup('');
    setSelectedFaculty('');
    setExpiresAt('');
  };

  const availableYears = course ? courseData[course as keyof typeof courseData]?.years || [] : [];
  const availableDepartments = (course && academicYear) 
    ? courseData[course as keyof typeof courseData]?.yearDepartments?.[academicYear] || [] 
    : [];
  const availableFaculty = faculty.filter(f =>
    f.departmentId === departments.find(d => d.name === department)?.id
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.collegeId) return;

    setIsLoading(true);
    try {
      const selectedDept = departments.find(d => d.name === department);
      if (!selectedDept) throw new Error('Department not found');

      const uniqueUrl = `session-${crypto.randomUUID().slice(0, 8)}`;

      await feedbackSessionsApi.create({
        collegeId: user.collegeId,
        departmentId: selectedDept.id,
        facultyId: selectedFaculty,
        questionGroupId: questionGroup,
        course,
        academicYear,
        subject: '', // Not used anymore
        batch: '', // Not used anymore
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course">Course/Program</Label>
              <Select value={course} onValueChange={(value) => {
                setCourse(value);
                setAcademicYear(''); // Reset dependent fields
                setDepartment('');
                setSubject('');
                setBatch('');
                // Close the dropdown after selection
                setTimeout(() => {
                  courseSelectRef.current?.click();
                }, 100);
              }}>
                <SelectTrigger ref={courseSelectRef}>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(courseData).map((c) => (
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
                setQuestionGroup('');
                setSelectedFaculty('');
                // Close the dropdown after selection
                setTimeout(() => {
                  yearSelectRef.current?.click();
                }, 100);
              }} disabled={!course}>
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
                setQuestionGroup(''); // Reset dependent field
                setSelectedFaculty('');
                // Close the dropdown after selection
                setTimeout(() => {
                  departmentSelectRef.current?.click();
                }, 100);
              }} disabled={!course || !academicYear}>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="questionGroup">Question Group</Label>
            <Select value={questionGroup} onValueChange={(value) => {
              setQuestionGroup(value);
              // Close the dropdown after selection
              setTimeout(() => {
                questionGroupSelectRef.current?.click();
              }, 100);
            }} disabled={!course || !academicYear || !department}>
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

          <div className="space-y-2">
            <Label htmlFor="faculty">Faculty</Label>
            <Select value={selectedFaculty} onValueChange={(value) => {
              setSelectedFaculty(value);
              // Close the dropdown after selection
              setTimeout(() => {
                facultySelectRef.current?.click();
              }, 100);
            }} disabled={!department}>
              <SelectTrigger ref={facultySelectRef}>
                <SelectValue placeholder="Select faculty" />
              </SelectTrigger>
              <SelectContent>
                {availableFaculty.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} - {f.designation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expires At (Optional)</Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for 30 days default expiry
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};