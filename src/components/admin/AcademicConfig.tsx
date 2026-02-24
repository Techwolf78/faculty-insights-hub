import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getAcademicConfig, saveAcademicConfig } from '@/lib/academicConfig';

interface Batch {
  name: string;
}

interface Subject {
  name: string;
  code: string;
  type: string;
  batches: string[];
}

interface Department {
  name: string;
  subjects: Subject[];
}

interface Semester {
  name: string;
  departments: Department[];
}

interface Year {
  name: string;
  semesters: Semester[];
}

interface Course {
  name: string;
  years: Year[];
}


interface CourseData {
  [courseName: string]: {
    years: string[];
    yearDepartments: {
      [yearName: string]: string[];
    };
    semesters?: string[];
    yearSemesters?: {
      [yearName: string]: string[];
    };
  };
}

interface SubjectsData {
  [courseName: string]: Record<string, Record<string, Record<string, Record<string, { code: string; type: string; batches: string[] }>>>>;
}


interface AcademicConfigData {
  courseData: CourseData;
  subjectsData: SubjectsData;
}

const buildCoursesFromConfig = (config: AcademicConfigData): Course[] => {
  const courses: Course[] = [];
  const courseData = config.courseData || {};
  const subjectsData = config.subjectsData || {};

  Object.keys(courseData).forEach((courseName) => {
    const courseInfo = courseData[courseName];
    const years: Year[] = [];

    (courseInfo.years || []).forEach((yearName: string) => {
      const semesters: Semester[] = [];

      // Determine semesters for this year (use yearSemesters override or course-level semesters or ['Odd','Even'])
      const yearSemesterNames =
        courseInfo.yearSemesters?.[yearName] ||
        courseInfo.semesters ||
        ['Odd', 'Even'];

      yearSemesterNames.forEach((semName: string) => {
        const departments: Department[] = [];

        // Get departments for this specific year
        const yearDepartments = courseInfo.yearDepartments?.[yearName] || [];

        yearDepartments.forEach((deptName: string) => {
          const subjects: Subject[] = [];
          
          // Get subjects for this semester (New format: course -> year -> semester -> department -> subject)
          let deptSubjectsData = subjectsData[courseName]?.[yearName]?.[semName]?.[deptName];
          
          // Legacy check: if subjectsData is missing the semester level but has it at the year level
          const yearLayout = subjectsData[courseName]?.[yearName] as unknown as Record<string, unknown>;
          const legacyDeptData = yearLayout?.[deptName];
          
          if (!deptSubjectsData && legacyDeptData) {
            // Migrating old layout to new layout on the fly
            // Only if this is the "main" semester or we're just handling it
            if (semName === 'Odd' || semName === 'Sem 1') {
               deptSubjectsData = legacyDeptData as Record<string, { code: string; type: string; batches: string[] }>;
            }
          }

          if (deptSubjectsData) {
            if (Array.isArray(deptSubjectsData)) {
              // Old format: array of subject names
              (deptSubjectsData as string[]).forEach((subj: string) => {
                subjects.push({
                  name: subj,
                  code: '',
                  type: 'Theory',
                  batches: ['A', 'B', 'C', 'D'],
                });
              });
            } else {
              // New format: object with subject: {code, type, batches}
              const subjectsObj = deptSubjectsData as Record<string, { code?: string; type?: string; batches?: string[] }>;
              Object.keys(subjectsObj).forEach((subj: string) => {
                const subjData = subjectsObj[subj];
                subjects.push({
                  name: subj,
                  code: subjData.code || '',
                  type: subjData.type || 'Theory',
                  batches: subjData.batches || [],
                });
              });
            }
          }

          departments.push({
            name: deptName,
            subjects,
          });
        });

        semesters.push({
          name: semName,
          departments,
        });
      });

      years.push({
        name: yearName,
        semesters,
      });
    });

    courses.push({
      name: courseName,
      years,
    });
  });

  return courses;
};

interface AcademicConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AcademicConfig: React.FC<AcademicConfigProps> = ({ open, onOpenChange, onSuccess }) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set()); // Start with all collapsed

  // Modal states
  const [addModal, setAddModal] = useState<{
    open: boolean;
    type: 'course' | 'year' | 'semester' | 'department' | 'subject' | 'batch';
    courseIndex?: number;
    yearIndex?: number;
    semIndex?: number;
    deptIndex?: number;
    subjIndex?: number;
    currentName?: string;
    currentCode?: string;
    currentType?: string;
    error?: string;
  }>({ open: false, type: 'course' });

  const [editModal, setEditModal] = useState<{
    open: boolean;
    type: 'course' | 'year' | 'semester' | 'department' | 'subject' | 'batch';
    courseIndex: number;
    yearIndex?: number;
    semIndex?: number;
    deptIndex?: number;
    subjIndex?: number;
    batchIndex?: number;
    currentName: string;
    currentCode?: string;
    currentType?: string;
    error?: string;
  }>({ open: false, type: 'course', courseIndex: 0, currentName: '' });

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    type: 'course' | 'year' | 'semester' | 'department';
    courseIndex: number;
    yearIndex?: number;
    semIndex?: number;
    deptIndex?: number;
  }>({ open: false, type: 'course', courseIndex: 0 });


  // Floating save button state
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const headerRef = useRef<HTMLDivElement>(null);
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Confirmation dialog for unsaved changes
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const loadConfig = useCallback(async () => {
    if (!user?.collegeId) return;
    
    setLoading(true);
    try {
      const { courseData, subjectsData } = await getAcademicConfig(user.collegeId);
      const loadedCourses = buildCoursesFromConfig({ courseData, subjectsData });
      setCourses(loadedCourses);
      // Expand all loaded courses by default
      setExpandedCourses(new Set(loadedCourses.map((_, index) => index)));
      setHasUnsavedChanges(false); // Reset unsaved changes when loading fresh data
    } catch (error) {
      console.error('Error loading config:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [user?.collegeId]);

  useEffect(() => {
    if (open) {
      loadConfig();
      setIsHeaderVisible(true); // Reset header visibility when modal opens
      setHasScrolled(false); // Reset scroll state when modal opens
    }
  }, [open, loadConfig]);

  // Intersection Observer for floating save button
  useEffect(() => {
    if (!open || !headerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Add small delay to prevent flickering
        setTimeout(() => {
          setIsHeaderVisible(entry.isIntersecting);
        }, 50);
      },
      {
        threshold: 0.1, // Use 10% visibility threshold for more reliable detection
        rootMargin: '0px 0px -60px 0px' // Trigger when header is 60px from top
      }
    );

    observer.observe(headerRef.current);

    return () => observer.disconnect();
  }, [open]);

  // Scroll-based fallback for floating button
  useEffect(() => {
    if (!open || !dialogContentRef.current) return;

    const handleScroll = () => {
      const scrollTop = dialogContentRef.current?.scrollTop || 0;
      const shouldShowFloating = scrollTop > 50; // Consider scrolled if more than 50px down
      setHasScrolled(shouldShowFloating);
    };

    const scrollElement = dialogContentRef.current;
    scrollElement.addEventListener('scroll', handleScroll, { passive: true });

    // Check initial scroll position
    handleScroll();

    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [open]);

  const saveConfig = async () => {
    if (!user?.collegeId) return;

    setLoading(true);
    const courseData: CourseData = {};
    const subjectsData: SubjectsData = {};

    courses.forEach((course) => {
      const yearDepartments: { [yearName: string]: string[] } = {};
      const yearSemesters: { [yearName: string]: string[] } = {};
      
      course.years.forEach((year) => {
        // Collect departments (from all semesters) - normally they are the same per year
        const depts = new Set<string>();
        year.semesters.forEach(sem => {
            sem.departments.forEach(dept => depts.add(dept.name));
        });
        yearDepartments[year.name] = Array.from(depts);
        yearSemesters[year.name] = year.semesters.map(s => s.name);
      });

      courseData[course.name] = {
        years: course.years.map((y) => y.name),
        yearDepartments,
        yearSemesters,
        semesters: course.years[0]?.semesters.map(s => s.name) || ['Odd', 'Even']
      };

      subjectsData[course.name] = {};
      course.years.forEach((year) => {
        subjectsData[course.name][year.name] = {};
        year.semesters.forEach((sem) => {
          subjectsData[course.name][year.name][sem.name] = {};
          sem.departments.forEach((dept) => {
            const semesterData = subjectsData[course.name][year.name][sem.name] as unknown as Record<string, Record<string, { code: string; type: string; batches: string[] }>>;
            semesterData[dept.name] = {};
            
            dept.subjects.forEach((subj) => {
              semesterData[dept.name][subj.name] = {
                code: subj.code,
                type: subj.type,
                batches: subj.batches,
              };
            });
          });
        });
      });
    });

    const success = await saveAcademicConfig(user.collegeId, courseData, subjectsData);
    if (success) {
      toast.success('Academic configuration saved successfully!');
      setHasUnsavedChanges(false); // Reset unsaved changes after successful save
      onSuccess?.();
      onOpenChange(false);
    } else {
      toast.error('Failed to save academic configuration');
    }
    setLoading(false);
  };

  // Handle modal close with unsaved changes confirmation
  const handleCloseAttempt = (newOpenState: boolean) => {
    if (!newOpenState && hasUnsavedChanges) {
      // User is trying to close and has unsaved changes
      setShowUnsavedDialog(true);
    } else {
      // No unsaved changes or user is opening, proceed normally
      onOpenChange(newOpenState);
    }
  };

  // Handle keep changes (save and close)
  const handleKeepChanges = async () => {
    setShowUnsavedDialog(false);
    await saveConfig(); // This will close the modal after saving
  };

  // Handle discard changes (close without saving)
  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    setHasUnsavedChanges(false);
    onOpenChange(false);
  };

  const addCourse = () => {
    setAddModal({ open: true, type: 'course', error: undefined });
  };

  const editCourse = (index: number) => {
    setEditModal({
      open: true,
      type: 'course',
      courseIndex: index,
      currentName: courses[index].name,
      error: undefined
    });
  };

  const deleteCourse = (index: number) => {
    setDeleteModal({
      open: true,
      type: 'course',
      courseIndex: index
    });
  };

  const addYear = (courseIndex: number) => {
    // Validate hierarchical dependency - course must exist
    if (!courses[courseIndex]) {
      toast.error("Invalid course selected.");
      return;
    }
    setAddModal({ open: true, type: 'year', courseIndex, error: undefined });
  };

  const editYear = (courseIndex: number, yearIndex: number) => {
    setEditModal({
      open: true,
      type: 'year',
      courseIndex,
      yearIndex,
      currentName: courses[courseIndex].years[yearIndex].name,
      error: undefined
    });
  };

  const deleteYear = (courseIndex: number, yearIndex: number) => {
    // Check if year has semesters
    const year = courses[courseIndex]?.years[yearIndex];
    if (!year) {
      toast.error("Invalid year selected.");
      return;
    }

    if (year.semesters.length > 0) {
      toast.error("Cannot delete year with existing semesters. Please delete all semesters first.");
      return;
    }

    setDeleteModal({
      open: true,
      type: 'year',
      courseIndex,
      yearIndex
    });
  };

  const addSemester = (courseIndex: number, yearIndex: number) => {
    if (!courses[courseIndex]?.years[yearIndex]) {
      toast.error("Invalid year selected.");
      return;
    }
    setAddModal({ open: true, type: 'semester', courseIndex, yearIndex, error: undefined });
  };

  const editSemester = (courseIndex: number, yearIndex: number, semIndex: number) => {
    setEditModal({
      open: true,
      type: 'semester',
      courseIndex,
      yearIndex,
      semIndex,
      currentName: courses[courseIndex].years[yearIndex].semesters[semIndex].name
    });
  };

  const deleteSemester = (courseIndex: number, yearIndex: number, semIndex: number) => {
    const sem = courses[courseIndex]?.years[yearIndex]?.semesters[semIndex];
    if (!sem) {
      toast.error("Invalid semester selected.");
      return;
    }

    if (sem.departments.length > 0) {
      toast.error("Cannot delete semester with existing departments. Please delete all departments first.");
      return;
    }

    setDeleteModal({
      open: true,
      type: 'semester',
      courseIndex,
      yearIndex,
      semIndex
    });
  };

  const addDepartment = (courseIndex: number, yearIndex: number, semIndex: number) => {
    // Validate hierarchical dependencies
    if (!courses[courseIndex]?.years[yearIndex]?.semesters[semIndex]) {
      toast.error("Invalid semester selected.");
      return;
    }
    setAddModal({ open: true, type: 'department', courseIndex, yearIndex, semIndex, error: undefined });
  };

  const editDepartment = (courseIndex: number, yearIndex: number, semIndex: number, deptIndex: number) => {
    setEditModal({
      open: true,
      type: 'department',
      courseIndex,
      yearIndex,
      semIndex,
      deptIndex,
      currentName: courses[courseIndex].years[yearIndex].semesters[semIndex].departments[deptIndex].name
    });
  };

  const deleteDepartment = (courseIndex: number, yearIndex: number, semIndex: number, deptIndex: number) => {
    // Check if department has subjects
    const dept = courses[courseIndex]?.years[yearIndex]?.semesters[semIndex]?.departments[deptIndex];
    if (!dept) {
      toast.error("Invalid department selected.");
      return;
    }

    if (dept.subjects.length > 0) {
      toast.error("Cannot delete department with existing subjects. Please delete all subjects first.");
      return;
    }

    setDeleteModal({
      open: true,
      type: 'department',
      courseIndex,
      yearIndex,
      semIndex,
      deptIndex
    });
  };

  const addSubject = (courseIndex: number, yearIndex: number, semIndex: number, deptIndex: number) => {
    // Validate hierarchical dependencies
    if (!courses[courseIndex]?.years[yearIndex]?.semesters[semIndex]?.departments[deptIndex]) {
      toast.error("Invalid department selected.");
      return;
    }
    setAddModal({ open: true, type: 'subject', courseIndex, yearIndex, semIndex, deptIndex, error: undefined });
  };

  const editSubject = (courseIndex: number, yearIndex: number, semIndex: number, deptIndex: number, subjIndex: number) => {
    const subj = courses[courseIndex].years[yearIndex].semesters[semIndex].departments[deptIndex].subjects[subjIndex];
    setEditModal({
      open: true,
      type: 'subject',
      courseIndex,
      yearIndex,
      semIndex,
      deptIndex,
      subjIndex,
      currentName: subj.name,
      currentCode: subj.code,
      currentType: subj.type
    });
  };

  const deleteSubject = (courseIndex: number, yearIndex: number, semIndex: number, deptIndex: number, subjIndex: number) => {
    const newCourses = [...courses];
    newCourses[courseIndex].years[yearIndex].semesters[semIndex].departments[deptIndex].subjects.splice(subjIndex, 1);
    setCourses(newCourses);
    setHasUnsavedChanges(true);
    toast.success('Subject deleted (unsaved)');
  };

  const addBatch = (courseIndex: number, yearIndex: number, semIndex: number, deptIndex: number, subjIndex: number) => {
    // Validate hierarchical dependencies
    if (!courses[courseIndex]?.years[yearIndex]?.semesters[semIndex]?.departments[deptIndex]?.subjects[subjIndex]) {
      toast.error("Invalid subject selected.");
      return;
    }
    setAddModal({ open: true, type: 'batch', courseIndex, yearIndex, semIndex, deptIndex, subjIndex, error: undefined });
  };

  const editBatch = (courseIndex: number, yearIndex: number, semIndex: number, deptIndex: number, subjIndex: number, batchIndex: number) => {
    setEditModal({
      open: true,
      type: 'batch',
      courseIndex,
      yearIndex,
      semIndex,
      deptIndex,
      subjIndex,
      batchIndex,
      currentName: courses[courseIndex].years[yearIndex].semesters[semIndex].departments[deptIndex].subjects[subjIndex].batches[batchIndex]
    });
  };

  const deleteBatch = (courseIndex: number, yearIndex: number, semIndex: number, deptIndex: number, subjIndex: number, batchIndex: number) => {
    const newCourses = [...courses];
    newCourses[courseIndex].years[yearIndex].semesters[semIndex].departments[deptIndex].subjects[subjIndex].batches.splice(batchIndex, 1);
    setCourses(newCourses);
    setHasUnsavedChanges(true);
    toast.success('Batch deleted (unsaved)');
  };

  const toggleCourseExpansion = (courseIndex: number) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseIndex)) {
      newExpanded.delete(courseIndex);
    } else {
      newExpanded.add(courseIndex);
    }
    setExpandedCourses(newExpanded);
  };

  // Validation function for year input
  const validateYearInput = (value: string, courseIndex?: number, excludeYearIndex?: number): string | null => {
    if (!value.trim()) return null; // Allow empty for now, will be caught by required validation

    // Only allow single digits 1, 2, 3, 4
    if (!/^[1-4]$/.test(value)) {
      return "Only numeric values 1, 2, 3, or 4 are allowed for years.";
    }

    // Check for duplicates in the same course
    if (courseIndex !== undefined && courses[courseIndex]) {
      const existingYears = courses[courseIndex].years;
      const isDuplicate = existingYears.some((year, index) =>
        year.name === value && index !== excludeYearIndex
      );
      if (isDuplicate) {
        return `Year ${value} already exists in this course.`;
      }
    }

    return null; // Valid
  };

  // Validation function for course input
  const validateCourseInput = (value: string, excludeCourseIndex?: number): string | null => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return "Course name cannot be empty.";
    }

    // Length validation
    if (trimmedValue.length < 2) {
      return "Course name must be at least 2 characters long.";
    }
    if (trimmedValue.length > 50) {
      return "Course name cannot exceed 50 characters.";
    }

    // Character validation - only alphanumeric, spaces, hyphens, underscores
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmedValue)) {
      return "Course name can only contain letters, numbers, spaces, hyphens, and underscores.";
    }

    // Check for duplicates (case-insensitive)
    const isDuplicate = courses.some((course, index) =>
      course.name.toLowerCase() === trimmedValue.toLowerCase() && index !== excludeCourseIndex
    );
    if (isDuplicate) {
      return "A course with this name already exists.";
    }

    // Reserved words check
    const reservedWords = ['admin', 'system', 'test', 'null', 'undefined'];
    if (reservedWords.includes(trimmedValue.toLowerCase())) {
      return "This course name is reserved and cannot be used.";
    }

    return null; // Valid
  };

  // Validation function for semester input
  const validateSemesterInput = (value: string, courseIndex?: number, yearIndex?: number, excludeSemIndex?: number): string | null => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return "Semester name cannot be empty.";
    }

    // Length validation
    if (trimmedValue.length < 2) {
      return "Semester name must be at least 2 characters long.";
    }
    if (trimmedValue.length > 50) {
      return "Semester name cannot exceed 50 characters.";
    }

    // Character validation
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmedValue)) {
      return "Semester name can only contain letters, numbers, spaces, hyphens, and underscores.";
    }

    // Check for duplicates within the same year
    if (courseIndex !== undefined && yearIndex !== undefined && courses[courseIndex]?.years[yearIndex]) {
      const existingSems = courses[courseIndex].years[yearIndex].semesters;
      const isDuplicate = existingSems.some((sem, index) =>
        sem.name.toLowerCase() === trimmedValue.toLowerCase() && index !== excludeSemIndex
      );
      if (isDuplicate) {
        return "A semester with this name already exists in this year.";
      }
    }

    return null; // Valid
  };

  // Validation function for department input

  // Validation function for department input
  const validateDepartmentInput = (value: string, courseIndex?: number, yearIndex?: number, semIndex?: number, excludeDeptIndex?: number): string | null => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return "Department name cannot be empty.";
    }

    // Length validation
    if (trimmedValue.length < 2) {
      return "Department name must be at least 2 characters long.";
    }
    if (trimmedValue.length > 50) {
      return "Department name cannot exceed 50 characters.";
    }

    // Character validation - allow alphanumeric, spaces, hyphens, underscores, ampersands
    if (!/^[a-zA-Z0-9\s\-_&]+$/.test(trimmedValue)) {
      return "Department name can only contain letters, numbers, spaces, hyphens, underscores, and ampersands (&).";
    }

    // Check for duplicates within the same semester
    if (courseIndex !== undefined && yearIndex !== undefined && semIndex !== undefined && 
        courses[courseIndex]?.years[yearIndex]?.semesters[semIndex]) {
      const existingDepts = courses[courseIndex].years[yearIndex].semesters[semIndex].departments;
      const isDuplicate = existingDepts.some((dept, index) =>
        dept.name.toLowerCase() === trimmedValue.toLowerCase() && index !== excludeDeptIndex
      );
      if (isDuplicate) {
        return "A department with this name already exists in this semester.";
      }
    }

    return null; // Valid
  };

  // Validation function for subject input
  const validateSubjectInput = (value: string, courseIndex?: number, yearIndex?: number, semIndex?: number, deptIndex?: number, excludeSubjIndex?: number): string | null => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return "Subject name cannot be empty.";
    }

    // Length validation
    if (trimmedValue.length < 2) {
      return "Subject name must be at least 2 characters long.";
    }
    if (trimmedValue.length > 100) {
      return "Subject name cannot exceed 100 characters.";
    }

    // Character validation - allow alphanumeric, spaces, hyphens, underscores, parentheses
    if (!/^[a-zA-Z0-9\s\-_()]+$/.test(trimmedValue)) {
      return "Subject name can only contain letters, numbers, spaces, hyphens, underscores, and parentheses.";
    }

    // Check for duplicates within the same department
    if (courseIndex !== undefined && yearIndex !== undefined && semIndex !== undefined && deptIndex !== undefined &&
        courses[courseIndex]?.years[yearIndex]?.semesters[semIndex]?.departments[deptIndex]) {
      const existingSubjects = courses[courseIndex].years[yearIndex].semesters[semIndex].departments[deptIndex].subjects;
      const isDuplicate = existingSubjects.some((subject, index) =>
        subject.name.toLowerCase() === trimmedValue.toLowerCase() && index !== excludeSubjIndex
      );
      if (isDuplicate) {
        return "A subject with this name already exists in this department.";
      }
    }

    return null; // Valid
  };

  // Validation function for batch input
  const validateBatchInput = (value: string, courseIndex?: number, yearIndex?: number, semIndex?: number, deptIndex?: number, subjIndex?: number, excludeBatchIndex?: number): string | null => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return "Batch name cannot be empty.";
    }

    // Length validation
    if (trimmedValue.length < 1) {
      return "Batch name must be at least 1 character long.";
    }
    if (trimmedValue.length > 10) {
      return "Batch name cannot exceed 10 characters.";
    }

    // Character validation - allow letters, numbers, spaces, hyphens, underscores
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmedValue)) {
      return "Batch name can only contain letters, numbers, spaces, hyphens, and underscores.";
    }

    // Check for duplicates within the same subject
    if (courseIndex !== undefined && yearIndex !== undefined && semIndex !== undefined && deptIndex !== undefined && subjIndex !== undefined &&
        courses[courseIndex]?.years[yearIndex]?.semesters[semIndex]?.departments[deptIndex]?.subjects[subjIndex]) {
      const existingBatches = courses[courseIndex].years[yearIndex].semesters[semIndex].departments[deptIndex].subjects[subjIndex].batches;
      const isDuplicate = existingBatches.some((batch, index) =>
        batch === trimmedValue && index !== excludeBatchIndex
      );
      if (isDuplicate) {
        return `Batch ${trimmedValue} already exists in this subject.`;
      }
    }

    return null; // Valid
  };

  // Modal handlers
  const handleAddConfirm = () => {
    const name = addModal.currentName?.trim();
    if (!name) return;

    let error: string | null = null;

    // Validate based on type
    switch (addModal.type) {
      case 'course':
        error = validateCourseInput(name);
        break;
      case 'year':
        error = validateYearInput(name, addModal.courseIndex);
        break;
      case 'semester':
        error = validateSemesterInput(name, addModal.courseIndex, addModal.yearIndex);
        break;
      case 'department':
        error = validateDepartmentInput(name, addModal.courseIndex, addModal.yearIndex, addModal.semIndex);
        break;
      case 'subject':
        error = validateSubjectInput(name, addModal.courseIndex, addModal.yearIndex, addModal.semIndex, addModal.deptIndex);
        break;
      case 'batch':
        error = validateBatchInput(name, addModal.courseIndex, addModal.yearIndex, addModal.semIndex, addModal.deptIndex, addModal.subjIndex);
        break;
    }

    if (error) {
      setAddModal(prev => ({ ...prev, error }));
      return;
    }

    const newCourses = [...courses];

    switch (addModal.type) {
      case 'course':
        newCourses.push({ name, years: [] });
        // Expand the newly added course
        setExpandedCourses(prev => new Set([...prev, newCourses.length - 1]));
        break;
      case 'year':
        if (addModal.courseIndex !== undefined) {
          newCourses[addModal.courseIndex].years.push({ name, semesters: [] });
        }
        break;
      case 'semester':
        if (addModal.courseIndex !== undefined && addModal.yearIndex !== undefined) {
          newCourses[addModal.courseIndex].years[addModal.yearIndex].semesters.push({ name, departments: [] });
        }
        break;
      case 'department':
        if (addModal.courseIndex !== undefined && addModal.yearIndex !== undefined && addModal.semIndex !== undefined) {
          newCourses[addModal.courseIndex].years[addModal.yearIndex].semesters[addModal.semIndex].departments.push({ name, subjects: [] });
        }
        break;
      case 'subject':
        if (addModal.courseIndex !== undefined && addModal.yearIndex !== undefined && addModal.semIndex !== undefined && addModal.deptIndex !== undefined) {
          newCourses[addModal.courseIndex].years[addModal.yearIndex].semesters[addModal.semIndex].departments[addModal.deptIndex].subjects.push({
            name,
            code: addModal.currentCode || '',
            type: addModal.currentType || 'Theory',
            batches: []
          });
        }
        break;
      case 'batch':
        if (addModal.courseIndex !== undefined && addModal.yearIndex !== undefined && addModal.semIndex !== undefined && addModal.deptIndex !== undefined && addModal.subjIndex !== undefined) {
          newCourses[addModal.courseIndex].years[addModal.yearIndex].semesters[addModal.semIndex].departments[addModal.deptIndex].subjects[addModal.subjIndex].batches.push(name);
        }
        break;
    }


    setCourses(newCourses);
    setHasUnsavedChanges(true);
    setAddModal({ open: false, type: 'course' });
  };

  const handleEditConfirm = () => {
    const name = editModal.currentName.trim();
    if (!name) return;

    let error: string | null = null;

    // Validate based on type
    switch (editModal.type) {
      case 'course':
        error = validateCourseInput(name, editModal.courseIndex);
        break;
      case 'year':
        error = validateYearInput(name, editModal.courseIndex, editModal.yearIndex);
        break;
      case 'semester':
        error = validateSemesterInput(name, editModal.courseIndex, editModal.yearIndex, editModal.semIndex);
        break;
      case 'department':
        error = validateDepartmentInput(name, editModal.courseIndex, editModal.yearIndex, editModal.semIndex, editModal.deptIndex);
        break;
      case 'subject':
        error = validateSubjectInput(name, editModal.courseIndex, editModal.yearIndex, editModal.semIndex, editModal.deptIndex, editModal.subjIndex);
        break;
      case 'batch':
        error = validateBatchInput(name, editModal.courseIndex, editModal.yearIndex, editModal.semIndex, editModal.deptIndex, editModal.subjIndex, editModal.batchIndex);
        break;
    }

    if (error) {
      setEditModal(prev => ({ ...prev, error }));
      return;
    }

    const newCourses = [...courses];

    switch (editModal.type) {
      case 'course':
        newCourses[editModal.courseIndex].name = name;
        break;
      case 'year':
        if (editModal.yearIndex !== undefined) {
          newCourses[editModal.courseIndex].years[editModal.yearIndex].name = name;
        }
        break;
      case 'semester':
        if (editModal.yearIndex !== undefined && editModal.semIndex !== undefined) {
          newCourses[editModal.courseIndex].years[editModal.yearIndex].semesters[editModal.semIndex].name = name;
        }
        break;
      case 'department':
        if (editModal.yearIndex !== undefined && editModal.semIndex !== undefined && editModal.deptIndex !== undefined) {
          newCourses[editModal.courseIndex].years[editModal.yearIndex].semesters[editModal.semIndex].departments[editModal.deptIndex].name = name;
        }
        break;
      case 'subject':
        if (editModal.yearIndex !== undefined && editModal.semIndex !== undefined && editModal.deptIndex !== undefined && editModal.subjIndex !== undefined) {
          newCourses[editModal.courseIndex].years[editModal.yearIndex].semesters[editModal.semIndex].departments[editModal.deptIndex].subjects[editModal.subjIndex].name = name;
          newCourses[editModal.courseIndex].years[editModal.yearIndex].semesters[editModal.semIndex].departments[editModal.deptIndex].subjects[editModal.subjIndex].code = editModal.currentCode || '';
          newCourses[editModal.courseIndex].years[editModal.yearIndex].semesters[editModal.semIndex].departments[editModal.deptIndex].subjects[editModal.subjIndex].type = editModal.currentType || 'Theory';
        }
        break;
      case 'batch':
        if (editModal.yearIndex !== undefined && editModal.semIndex !== undefined && editModal.deptIndex !== undefined && editModal.subjIndex !== undefined && editModal.batchIndex !== undefined) {
          newCourses[editModal.courseIndex].years[editModal.yearIndex].semesters[editModal.semIndex].departments[editModal.deptIndex].subjects[editModal.subjIndex].batches[editModal.batchIndex] = name;
        }
        break;
    }


    setCourses(newCourses);
    setHasUnsavedChanges(true);
    setEditModal({ open: false, type: 'course', courseIndex: 0, currentName: '' });
  };

  const handleDeleteConfirm = () => {
    const newCourses = [...courses];

    switch (deleteModal.type) {
      case 'course':
        newCourses.splice(deleteModal.courseIndex, 1);
        // Update expanded courses indices after deletion
        setExpandedCourses(prev => {
          const newExpanded = new Set<number>();
          prev.forEach(index => {
            if (index < deleteModal.courseIndex) {
              newExpanded.add(index);
            } else if (index > deleteModal.courseIndex) {
              newExpanded.add(index - 1);
            }
            // Skip the deleted course index
          });
          return newExpanded;
        });
        break;
      case 'year':
        if (deleteModal.yearIndex !== undefined) {
          newCourses[deleteModal.courseIndex].years.splice(deleteModal.yearIndex, 1);
        }
        break;
      case 'semester':
        if (deleteModal.yearIndex !== undefined && deleteModal.semIndex !== undefined) {
          newCourses[deleteModal.courseIndex].years[deleteModal.yearIndex].semesters.splice(deleteModal.semIndex, 1);
        }
        break;
      case 'department':
        if (deleteModal.yearIndex !== undefined && deleteModal.semIndex !== undefined && deleteModal.deptIndex !== undefined) {
          newCourses[deleteModal.courseIndex].years[deleteModal.yearIndex].semesters[deleteModal.semIndex].departments.splice(deleteModal.deptIndex, 1);
        }
        break;

    }

    setCourses(newCourses);
    setHasUnsavedChanges(true);
    setDeleteModal({ open: false, type: 'course', courseIndex: 0 });
  };

  const renderTree = () => {
    return (
      <div className="space-y-3">
        {courses.map((course, courseIndex) => (
          <div key={courseIndex} className="bg-white rounded-xl p-4 border border-primary shadow-sm">
            {/* Course Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCourseExpansion(courseIndex)}
                  className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                >
                  {expandedCourses.has(courseIndex) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🎓</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary">{course.name}</h3>
                  <p className="text-sm text-primary">{course.years.length} Years • {course.years.reduce((acc, year) => acc + year.semesters.reduce((semAcc, sem) => semAcc + sem.departments.length, 0), 0)} Departments</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => addYear(courseIndex)} className="bg-white hover:bg-primary/10">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Year
                </Button>
                <Button variant="ghost" size="sm" onClick={() => editCourse(courseIndex)} className="text-primary hover:bg-primary/10">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteCourse(courseIndex)} className="text-primary hover:bg-primary/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Course Content - conditionally rendered */}
            {expandedCourses.has(courseIndex) && (
              <>
                {/* Years as Tabs */}
                <Tabs defaultValue={`year-${courseIndex}-0`} className="w-full">
              <TabsList 
                className="grid w-full mb-3 bg-primary/10" 
                style={{ gridTemplateColumns: `repeat(${Math.min(course.years.length, 6)}, 1fr)` }}
              >
                {course.years.map((year, yearIndex) => (
                  <TabsTrigger
                    key={yearIndex}
                    value={`year-${courseIndex}-${yearIndex}`}
                    className="data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Year {year.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {course.years.map((year, yearIndex) => (
                <TabsContent key={yearIndex} value={`year-${courseIndex}-${yearIndex}`} className="space-y-3">
                  {/* Year Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">{year.name}</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-primary">Year {year.name}</h4>
                        <p className="text-sm text-primary">{year.semesters.length} Semesters </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => addSemester(courseIndex, yearIndex)} className="bg-white hover:bg-primary/10">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Semester
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => editYear(courseIndex, yearIndex)} className="text-primary hover:bg-primary/10">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteYear(courseIndex, yearIndex)} className="text-primary hover:bg-primary/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Semesters as Tabs */}
                  {year.semesters.length > 0 ? (
                    <Tabs defaultValue={`semester-${courseIndex}-${yearIndex}-0`} className="w-full">
                      <TabsList className="flex flex-wrap h-auto bg-primary/5 p-1 mb-2 gap-1 overflow-x-auto">
                        {year.semesters.map((sem, semIndex) => (
                          <TabsTrigger
                            key={semIndex}
                            value={`semester-${courseIndex}-${yearIndex}-${semIndex}`}
                            className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-1.5"
                          >
                            Sem {sem.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {year.semesters.map((sem, semIndex) => (
                        <TabsContent key={semIndex} value={`semester-${courseIndex}-${yearIndex}-${semIndex}`} className="space-y-3">
                          {/* Semester Header */}
                          <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md border border-dashed border-primary/20">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-primary/10 text-primary">Semester {sem.name}</Badge>
                              <span className="text-[10px] text-muted-foreground">{sem.departments.length} Departments</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="sm" onClick={() => addDepartment(courseIndex, yearIndex, semIndex)} className="h-7 text-xs bg-white">
                                <Plus className="h-3 w-3 mr-1" />
                                Add Dept
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => editSemester(courseIndex, yearIndex, semIndex)} className="h-7 w-7 p-0 text-primary hover:bg-primary/10">
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteSemester(courseIndex, yearIndex, semIndex)} className="h-7 w-7 p-0 text-primary hover:bg-primary/10">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Departments Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {sem.departments.map((dept, deptIndex) => (
                              <div key={deptIndex} className="bg-white rounded-lg border border-primary p-2 shadow-sm hover:shadow-md transition-shadow">
                                {/* Department Header */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-1">
                                    <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">🏢</span>
                                    </div>
                                    <h5 className="font-semibold text-primary truncate max-w-[120px]">{dept.name}</h5>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => editDepartment(courseIndex, yearIndex, semIndex, deptIndex)} className="h-6 w-6 p-0 text-primary hover:bg-primary/10">
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => deleteDepartment(courseIndex, yearIndex, semIndex, deptIndex)} className="h-6 w-6 p-0 text-primary hover:bg-primary/10">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Subjects */}
                                <div className="space-y-2 mb-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-600">Subjects ({dept.subjects.length})</span>
                                    <Button variant="outline" size="sm" onClick={() => addSubject(courseIndex, yearIndex, semIndex, deptIndex)} className="h-6 text-xs px-2">
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add
                                    </Button>
                                  </div>
                                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                    {dept.subjects.map((subj, subjIndex) => (
                                      <div key={subjIndex} className="bg-white rounded p-2 border border-primary">
                                        <div className="flex items-center justify-between mb-0.5">
                                          <div className="flex flex-col">
                                            <span className="text-sm font-medium text-primary truncate">{subj.name}</span>
                                            <div className="flex gap-2 text-[10px] text-gray-500">
                                              <span>Code: {subj.code}</span>
                                              <span>Type: {subj.type}</span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => editSubject(courseIndex, yearIndex, semIndex, deptIndex, subjIndex)} className="h-6 w-6 p-0 text-primary hover:bg-primary/20">
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => deleteSubject(courseIndex, yearIndex, semIndex, deptIndex, subjIndex)} className="h-6 w-6 p-0 text-primary hover:bg-primary/20">
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>

                                        {/* Batches */}
                                        <div className="flex flex-wrap gap-1.5 mb-1 mt-1">
                                          {subj.batches.map((batch, batchIndex) => (
                                            <div key={batchIndex} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/5 text-primary rounded text-[10px] font-medium border border-primary/20">
                                              <span>{batch}</span>
                                              <div className="flex items-center gap-1 border-l border-primary/20 pl-1 ml-1">
                                                <Button variant="ghost" size="sm" onClick={() => editBatch(courseIndex, yearIndex, semIndex, deptIndex, subjIndex, batchIndex)} className="h-4 w-4 p-0 text-primary hover:bg-primary/20">
                                                  <Edit className="h-2.5 w-2.5" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => deleteBatch(courseIndex, yearIndex, semIndex, deptIndex, subjIndex, batchIndex)} className="h-4 w-4 p-0 text-primary hover:bg-primary/20">
                                                  <Trash2 className="h-2.5 w-2.5" />
                                                </Button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>

                                        {/* Add Batch Button */}
                                        <Button variant="ghost" size="sm" onClick={() => addBatch(courseIndex, yearIndex, semIndex, deptIndex, subjIndex)} className="h-4 text-[10px] text-primary/70 hover:bg-primary/10 p-0 mt-1">
                                          <Plus className="h-2.5 w-2.5 mr-0.5" />
                                          Add Batch
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  ) : (
                    <div className="text-center py-6 border border-dashed rounded-lg bg-gray-50">
                      <p className="text-sm text-muted-foreground mb-2">No semesters added for this year.</p>
                      <Button variant="outline" size="sm" onClick={() => addSemester(courseIndex, yearIndex)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Semester
                      </Button>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseAttempt}>
      <DialogContent ref={dialogContentRef} className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Academic Configuration</DialogTitle>
          <DialogDescription>
            Configure the academic structure: Course - Year - Department - Subject - Batch
          </DialogDescription>
        </DialogHeader>

        {/* Floating Save Button */}
        {hasUnsavedChanges && (!isHeaderVisible || hasScrolled) && (
          <div className="sticky top-0 z-10 mb-4 -mx-6 -mt-6 px-6 py-3">
            <div className="flex justify-end">
              <Button onClick={saveConfig} disabled={loading} size="sm" variant="outline">
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div ref={headerRef} className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Academic Structure Tree</h3>
            <div className="flex gap-2">
              {hasUnsavedChanges && (
                <Button onClick={saveConfig} disabled={loading} size="sm" variant="outline">
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              )}
              <Button onClick={addCourse}>
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            </div>
          </div>
          <div className="border rounded-lg p-2 min-h-[400px]">
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Loading configuration...</p>
            ) : courses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No courses added yet. Click "Add Course" to start building the academic structure.</p>
            ) : (
              renderTree()
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleCloseAttempt(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={saveConfig} disabled={loading}>
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </DialogFooter>

        {/* Add Modal */}
        <AlertDialog open={addModal.open} onOpenChange={(open) => setAddModal(prev => ({ ...prev, open }))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Add {addModal.type.charAt(0).toUpperCase() + addModal.type.slice(1)}</AlertDialogTitle>
              <AlertDialogDescription>
                Enter the name for the new {addModal.type}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              {addModal.type === 'year' || addModal.type === 'batch' || addModal.type === 'semester' ? (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    Choose a {addModal.type} or enter a custom name:
                  </div>
                  <Tabs defaultValue="select" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="select">Quick Select</TabsTrigger>
                      <TabsTrigger value="custom">Custom</TabsTrigger>
                    </TabsList>
                    <TabsContent value="select" className="space-y-2">
                      <div className="grid grid-cols-4 gap-2">
                        {(addModal.type === 'year' ? ['1', '2', '3', '4'] : 
                          addModal.type === 'semester' ? ['I', 'II', 'Odd', 'Even'] : 
                          ['A', 'B', 'C', 'D']).map((item) => (
                          <Button
                            key={item}
                            variant={addModal.currentName === item ? "default" : "outline"}
                            size="sm"
                            onClick={() => setAddModal(prev => ({ ...prev, currentName: item, error: undefined }))}
                            className="h-10"
                          >
                            {addModal.type === 'year' ? `Year ${item}` : 
                             addModal.type === 'semester' ? `Sem ${item}` : item}
                          </Button>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="custom" className="space-y-2">
                      <Input
                        placeholder={`Enter custom ${addModal.type} name${
                          addModal.type === 'batch' ? ' (e.g., Call1, CS-1, ME_2, etc.)' : 
                          addModal.type === 'semester' ? ' (e.g., Semester 1, Sem-III, etc.)' :
                          ' (e.g., 1st Year, FY, etc.)'
                        }`}
                        value={addModal.currentName || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          let error: string | null = null;
                          if (addModal.type === 'year') error = validateYearInput(value, addModal.courseIndex);
                          else if (addModal.type === 'semester') error = validateSemesterInput(value, addModal.courseIndex, addModal.yearIndex);
                          else if (addModal.type === 'batch') error = validateBatchInput(value, addModal.courseIndex, addModal.yearIndex, addModal.semIndex, addModal.deptIndex, addModal.subjIndex);
                          setAddModal(prev => ({ ...prev, currentName: value, error }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !addModal.error) {
                            handleAddConfirm();
                          }
                        }}
                      />
                      {addModal.error && (
                        <p className="text-sm text-destructive">{addModal.error}</p>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              ) : addModal.type === 'subject' ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="add-subject-name">Subject Name</Label>
                    <Input
                      id="add-subject-name"
                      placeholder="Enter subject name"
                      value={addModal.currentName || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const error = validateSubjectInput(value, addModal.courseIndex, addModal.yearIndex, addModal.semIndex, addModal.deptIndex);
                        setAddModal(prev => ({ ...prev, currentName: value, error }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="add-subject-code">Subject Code</Label>
                    <Input
                      id="add-subject-code"
                      placeholder="Enter subject code"
                      value={addModal.currentCode || ''}
                      onChange={(e) => {
                        setAddModal(prev => ({ ...prev, currentCode: e.target.value }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="add-subject-type">Subject Type</Label>
                    <select
                      id="add-subject-type"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addModal.currentType || 'Theory'}
                      onChange={(e) => {
                        setAddModal(prev => ({ ...prev, currentType: e.target.value }));
                      }}
                    >
                      <option value="Theory">Theory</option>
                      <option value="Practical">Practical</option>
                    </select>
                  </div>
                  {addModal.error && (
                    <p className="text-sm text-destructive">{addModal.error}</p>
                  )}
                </div>
              ) : (
                <Input
                  placeholder={`Enter ${addModal.type} name`}
                  value={addModal.currentName || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    let error: string | null = null;

                    // Validate based on type
                    switch (addModal.type) {
                      case 'course':
                        error = validateCourseInput(value);
                        break;
                      case 'semester':
                        error = validateSemesterInput(value, addModal.courseIndex, addModal.yearIndex);
                        break;
                      case 'department':
                        error = validateDepartmentInput(value, addModal.courseIndex, addModal.yearIndex, addModal.semIndex);
                        break;
                      case 'batch':
                        error = validateBatchInput(value, addModal.courseIndex, addModal.yearIndex, addModal.semIndex, addModal.deptIndex, addModal.subjIndex);
                        break;
                    }

                    setAddModal(prev => ({ ...prev, currentName: value, error }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !addModal.error) {
                      handleAddConfirm();
                    }
                  }}
                />
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleAddConfirm} disabled={!(addModal.currentName?.trim()) || !!addModal.error}>
                Add
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Modal */}
        <AlertDialog open={editModal.open} onOpenChange={(open) => setEditModal(prev => ({ ...prev, open }))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit {editModal.type.charAt(0).toUpperCase() + editModal.type.slice(1)}</AlertDialogTitle>
              <AlertDialogDescription>
                Update the name for this {editModal.type}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              {editModal.type === 'year' || editModal.type === 'semester' ? (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    Choose a {editModal.type} or enter a custom name:
                  </div>
                  <Tabs 
                    defaultValue={(editModal.type === 'year' ? ['1', '2', '3', '4'] : ['I', 'II', 'Odd', 'Even']).includes(editModal.currentName) ? "select" : "custom"} 
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="select">Quick Select</TabsTrigger>
                      <TabsTrigger value="custom">Custom</TabsTrigger>
                    </TabsList>
                    <TabsContent value="select" className="space-y-2">
                      <div className="grid grid-cols-4 gap-2">
                        {(editModal.type === 'year' ? ['1', '2', '3', '4'] : ['I', 'II', 'Odd', 'Even']).map((item) => (
                          <Button
                            key={item}
                            variant={editModal.currentName === item ? "default" : "outline"}
                            size="sm"
                            onClick={() => setEditModal(prev => ({ ...prev, currentName: item, error: undefined }))}
                            className="h-10"
                          >
                            {editModal.type === 'year' ? `Year ${item}` : `Sem ${item}`}
                          </Button>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="custom" className="space-y-2">
                      <Input
                        placeholder={`Enter custom ${editModal.type} name`}
                        value={editModal.currentName}
                        onChange={(e) => {
                          const value = e.target.value;
                          let error: string | null = null;
                          if (editModal.type === 'year') error = validateYearInput(value, editModal.courseIndex, editModal.yearIndex);
                          else if (editModal.type === 'semester') error = validateSemesterInput(value, editModal.courseIndex, editModal.yearIndex, editModal.semIndex);
                          setEditModal(prev => ({ ...prev, currentName: value, error }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !editModal.error) {
                            handleEditConfirm();
                          }
                        }}
                      />
                      {editModal.error && (
                        <p className="text-sm text-destructive">{editModal.error}</p>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              ) : editModal.type === 'subject' ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subject-name">Subject Name</Label>
                    <Input
                      id="subject-name"
                      placeholder="Enter subject name"
                      value={editModal.currentName}
                      onChange={(e) => {
                        const value = e.target.value;
                        const error = validateSubjectInput(value, editModal.courseIndex, editModal.yearIndex, editModal.semIndex, editModal.deptIndex, editModal.subjIndex);
                        setEditModal(prev => ({ ...prev, currentName: value, error }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject-code">Subject Code</Label>
                    <Input
                      id="subject-code"
                      placeholder="Enter subject code"
                      value={editModal.currentCode || ''}
                      onChange={(e) => {
                        setEditModal(prev => ({ ...prev, currentCode: e.target.value }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject-type">Subject Type</Label>
                    <select
                      id="subject-type"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editModal.currentType || 'Theory'}
                      onChange={(e) => {
                        setEditModal(prev => ({ ...prev, currentType: e.target.value }));
                      }}
                    >
                      <option value="Theory">Theory</option>
                      <option value="Practical">Practical</option>
                    </select>
                  </div>
                  {editModal.error && (
                    <p className="text-sm text-destructive">{editModal.error}</p>
                  )}
                </div>
              ) : (
                <Input
                  placeholder={`Enter ${editModal.type} name`}
                  value={editModal.currentName}
                  onChange={(e) => {
                    const value = e.target.value;
                    let error: string | null = null;

                    // Validate based on type
                    switch (editModal.type) {
                      case 'course':
                        error = validateCourseInput(value, editModal.courseIndex);
                        break;
                      case 'department':
                        error = validateDepartmentInput(value, editModal.courseIndex, editModal.yearIndex, editModal.semIndex, editModal.deptIndex);
                        break;
                      case 'batch':
                        error = validateBatchInput(value, editModal.courseIndex, editModal.yearIndex, editModal.semIndex, editModal.deptIndex, editModal.subjIndex, editModal.batchIndex);
                        break;
                    }

                    setEditModal(prev => ({ ...prev, currentName: value, error }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !editModal.error) {
                      handleEditConfirm();
                    }
                  }}
                />
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleEditConfirm} disabled={!editModal.currentName.trim() || !!editModal.error}>
                Update
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Modal */}
        <AlertDialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal(prev => ({ ...prev, open }))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {deleteModal.type.charAt(0).toUpperCase() + deleteModal.type.slice(1)}</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this {deleteModal.type}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Your changes will be lost if you close this now. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardChanges}>
              Discard Changes
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleKeepChanges} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Keep Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export { AcademicConfig };
export default AcademicConfig;