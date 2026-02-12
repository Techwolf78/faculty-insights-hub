import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { facultyApi, departmentsApi, usersApi, Faculty, Department } from '@/lib/storage';
import { getAcademicConfig } from '@/lib/academicConfig';
import { toast } from 'sonner';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db, secondaryAuth } from '@/lib/firebase';
import { doc, collection, Timestamp } from 'firebase/firestore';
import { Eye, EyeOff } from 'lucide-react';

interface FacultyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingFaculty?: Faculty | null;
}

const FacultyForm: React.FC<FacultyFormProps> = ({ open, onOpenChange, onSuccess, editingFaculty }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFacultyDetails, setIsLoadingFacultyDetails] = useState(false);
  const [isFormReady, setIsFormReady] = useState(false);
  const [courseData, setCourseData] = useState<Record<string, { years: string[]; yearDepartments: Record<string, string[]> }>>({});
  const [subjectsData, setSubjectsData] = useState<Record<string, Record<string, Record<string, Record<string, { code: string; type: string; batches: string[] }>>>>>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  // Default form data structure - used for both add and edit operations
  const defaultFormData = useMemo(() => ({
    employeeId: '',
    name: '',
    email: '',
    password: '', // For new faculty accounts only
    designation: '',
    specialization: '',
    experience: '',
    highestQualification: '',
    department: '',
    subjects: '',
    subjectCode: '',
    subjectType: 'Theory' as 'Theory' | 'Practical',
    course: '',
    academicYear: '',
    role: 'faculty', // Default to faculty
  }), []);

  const [formData, setFormData] = useState(defaultFormData);

  const loadData = useCallback(async () => {
    try {
      setIsLoadingFacultyDetails(true);
      const config = await getAcademicConfig(user!.collegeId!);
      setCourseData(config.courseData);
      setSubjectsData(config.subjectsData);

      // Load departments
      const depts = await departmentsApi.getByCollege(user!.collegeId!);
      setDepartments(depts);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoadingFacultyDetails(false);
    }
  }, [user]);

  const generateFacultyId = useCallback(async () => {
    try {
      const allFaculty = await facultyApi.getByCollege(user!.collegeId!);
      const existingIds = allFaculty.map(f => f.employeeId).filter(id => id.startsWith('FAC'));
      if (existingIds.length === 0) {
        return 'FAC001';
      }
      const numbers = existingIds.map(id => parseInt(id.replace('FAC', ''))).filter(n => !isNaN(n));
      const maxNum = Math.max(...numbers);
      const nextNum = maxNum + 1;
      return `FAC${nextNum.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating faculty ID:', error);
      return 'FAC001';
    }
  }, [user]);

  useEffect(() => {
    if (open && user?.collegeId) {
      setIsFormReady(false); // Reset form ready state when dialog opens
      loadData();
    }
  }, [open, user?.collegeId, loadData]);

  useEffect(() => {
    if (editingFaculty && open) {
      // Wait for both departments and academic config to be loaded before populating form
      if (departments.length > 0 && Object.keys(courseData).length > 0) {
        // Populate form with existing faculty data
        const dept = departments.find(d => d.id === editingFaculty.departmentId);
        setFormData({
          employeeId: editingFaculty.employeeId,
          name: editingFaculty.name,
          email: editingFaculty.email,
          password: '', // Password not editable by admin
          designation: editingFaculty.designation,
          specialization: editingFaculty.specialization,
          experience: editingFaculty.experience.toString(),
          highestQualification: editingFaculty.highestQualification,
          department: dept?.name || editingFaculty.departmentId, // Use department name for form display
          subjects: editingFaculty.subjects.join(', '),
          subjectCode: editingFaculty.subjectCode,
          subjectType: editingFaculty.subjectType,
          course: editingFaculty.course,
          academicYear: editingFaculty.academicYear,
          role: editingFaculty.role || 'faculty', // Use existing role or default to faculty
        });
        setIsFormReady(true);
      }
    } else if (!editingFaculty && open) {
      // Reset form for new faculty and generate faculty ID
      const generateId = async () => {
        const newId = await generateFacultyId();
        const password = newId.replace('FAC', 'Fac') + '@';
        setFormData({ ...defaultFormData, employeeId: newId, password });
        setShowPassword(true); // Show password by default
        setIsFormReady(true);
      };
      generateId();
    }
  }, [editingFaculty, open, departments, courseData, defaultFormData, generateFacultyId]);

  const availableYears = formData.course ? courseData[formData.course]?.years || [] : [];
  const availableDepartmentsFromConfig = (formData.course && formData.academicYear)
    ? courseData[formData.course]?.yearDepartments?.[formData.academicYear] || [] : [];
  
  // Show departments from academic config (no filtering needed)
  const availableDepartments = availableDepartmentsFromConfig;

  // Get available subjects for the selected department
  const availableSubjects = (formData.course && formData.academicYear && formData.department)
    ? subjectsData[formData.course]?.[formData.academicYear]?.[formData.department] || {} : {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.employeeId.trim() || !formData.department || !formData.course || !formData.academicYear || !formData.subjects) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Password validation only for new faculty
    if (!editingFaculty) {
      if (!formData.password || formData.password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }
    }

    if (!user?.collegeId) {
      toast.error('College information not found');
      return;
    }

    setIsLoading(true);
    try {
      // Find or create the department
      let selectedDept = departments.find(d => d.name === formData.department);
      if (!selectedDept) {
        // Create the department if it doesn't exist
        selectedDept = await departmentsApi.create({
          name: formData.department,
          code: formData.department.substring(0, 3).toUpperCase(), // Generate a simple code
          collegeId: user.collegeId,
          isActive: true,
        });
        // Add to local state
        setDepartments(prev => [...prev, selectedDept!]);
        toast.success(`Department "${formData.department}" created successfully`);
      }

      const facultyData = {
        userId: editingFaculty?.userId || '', // Will be set when user account is created
        employeeId: formData.employeeId.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        designation: formData.designation.trim(),
        specialization: formData.specialization.trim(),
        experience: parseInt(formData.experience) || 0,
        highestQualification: formData.highestQualification.trim(),
        departmentId: selectedDept.id, // Use the actual department document ID
        collegeId: user.collegeId,
        subjects: formData.subjects.split(',').map(s => s.trim()).filter(s => s),
        subjectCode: formData.subjectCode.trim(),
        subjectType: formData.subjectType,
        course: formData.course,
        academicYear: formData.academicYear,
        role: formData.role as 'faculty' | 'hod',
        isActive: true,
      };

      if (editingFaculty) {
        // Update faculty document
        await facultyApi.update(editingFaculty.id, facultyData);

        // Update user document with new role if it changed
        if (editingFaculty.role !== formData.role) {
          await usersApi.update(editingFaculty.userId, { role: formData.role as 'faculty' | 'hod' });
        }
      } else {
        // Create new faculty account
        try {
          // 1. Create user in Firebase Auth using secondary app
          const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email.trim(), formData.password);
          const firebaseUser = userCredential.user;

          // Sign out from secondary auth to avoid session conflicts
          await signOut(secondaryAuth);

          // 2. Create user document in Firestore
          const userData = {
            email: formData.email.trim(),
            name: formData.name.trim(),
            role: formData.role as 'faculty' | 'hod',
            collegeId: user.collegeId,
            departmentId: selectedDept.id,
            isActive: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          };
          await usersApi.create(userData, firebaseUser.uid);

          // 3. Create faculty profile
          const facultyDataWithUserId = {
            ...facultyData,
            userId: firebaseUser.uid,
          };
          await facultyApi.create(facultyDataWithUserId);

          toast.success(`Faculty member added successfully! Login credentials: ${formData.email} / ${formData.password}`);
        } catch (authError: unknown) {
          console.error('Auth error:', authError);
          const error = authError as { code?: string; message?: string };
          if (error.code === 'auth/email-already-in-use') {
            toast.error('This email is already registered. Please use a different email.');
          } else if (error.code === 'auth/weak-password') {
            toast.error('Password is too weak. Please choose a stronger password.');
          } else {
            toast.error(`Failed to create faculty account: ${error.message || 'Unknown error'}`);
          }
          return;
        }
      }

      // Reset form and close dialog on success
      if (!editingFaculty) {
        setFormData(defaultFormData);
      }
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error saving faculty:', error);
      toast.error(`Failed to ${editingFaculty ? 'update' : 'add'} faculty member`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(defaultFormData);
    setIsFormReady(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingFaculty ? 'Edit Faculty Member' : 'Add New Faculty Member'}</DialogTitle>
          <DialogDescription>
            {editingFaculty ? 'Update faculty member information.' : 'Add a new faculty member to your college. Fill in the required information below.'}
          </DialogDescription>
        </DialogHeader>
        {editingFaculty && !isFormReady ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Fetching faculty details...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="employeeId" className="text-right">
                Faculty ID *
              </Label>
              <Input
                id="employeeId"
                value={formData.employeeId}
                onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                className="col-span-3"
                placeholder="Auto-generated"
                required
                readOnly
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Full Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., Dr. John Smith"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., john.smith@college.edu"
                required
              />
            </div>
            {!editingFaculty && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password *
                </Label>
                <div className="col-span-3 relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pr-10"
                    placeholder="Minimum 6 characters"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role *
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="faculty">Faculty Member</SelectItem>
                  <SelectItem value="hod">Head of Department (HOD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="course" className="text-right">
                Course/Program *
              </Label>
              <Select 
                value={formData.course} 
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  course: value,
                  academicYear: '', // Reset dependent fields
                  department: '',
                  subjects: ''
                }))}
              >
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="academicYear" className="text-right">
                Academic Year *
              </Label>
              <Select 
                value={formData.academicYear} 
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  academicYear: value,
                  department: '', // Reset dependent fields
                  subjects: ''
                }))}
                disabled={!formData.course}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department *
              </Label>
              <Select 
                value={formData.department} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value, subjects: '' }))}
                disabled={!formData.course || !formData.academicYear}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {availableDepartments.map((deptName) => (
                    <SelectItem key={deptName} value={deptName}>
                      {deptName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subjects" className="text-right">
                Subjects *
              </Label>
              <Select
                value={(() => {
                  // Find the subject key that matches the stored clean subject name
                  const matchingKey = Object.keys(availableSubjects).find(key =>
                    key.replace(/\s*\((Theory|Practical)\)$/, '') === formData.subjects
                  );
                  return matchingKey || '';
                })()}
                onValueChange={(value) => {
                  const selectedSubject = availableSubjects[value];
                  // Clean up the subject name by removing (Theory) and (Practical) suffixes for storage
                  const cleanSubjectName = value.replace(/\s*\((Theory|Practical)\)$/, '');
                  setFormData(prev => ({
                    ...prev,
                    subjects: cleanSubjectName,
                    subjectCode: selectedSubject?.code || '',
                    subjectType: (selectedSubject?.type as 'Theory' | 'Practical') || 'Theory'
                  }));
                }}
                disabled={!formData.course || !formData.academicYear || !formData.department}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select subjects" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(availableSubjects).map((subject) => {
                    const subjectData = availableSubjects[subject];
                    // Clean up the display name by removing (Theory) and (Practical) suffixes
                    const displayName = subject.replace(/\s*\((Theory|Practical)\)$/, '');
                    return (
                      <SelectItem key={subject} value={subject}>
                        {displayName} {subjectData?.code ? `(${subjectData.code} - ${subjectData.type})` : ''}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subjectCode" className="text-right">
                Subject Code
              </Label>
              <Input
                id="subjectCode"
                value={formData.subjectCode}
                onChange={(e) => setFormData(prev => ({ ...prev, subjectCode: e.target.value }))}
                className="col-span-3"
                placeholder="Auto-filled from selected subject"
                readOnly
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subjectType" className="text-right">
                Subject Type
              </Label>
              <Input
                id="subjectType"
                value={formData.subjectType}
                onChange={(e) => setFormData(prev => ({ ...prev, subjectType: e.target.value as 'Theory' | 'Practical' }))}
                className="col-span-3"
                placeholder="Auto-filled from selected subject"
                readOnly
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="designation" className="text-right">
                Designation
              </Label>
              <Input
                id="designation"
                value={formData.designation}
                onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., Assistant Professor"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="specialization" className="text-right">
                Specialization
              </Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., Machine Learning, Data Structures"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="experience" className="text-right">
                Experience (years)
              </Label>
              <Input
                id="experience"
                type="number"
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., 5"
                min="0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="highestQualification" className="text-right">
                Highest Qualification
              </Label>
              <Input
                id="highestQualification"
                value={formData.highestQualification}
                onChange={(e) => setFormData(prev => ({ ...prev, highestQualification: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., PhD in Computer Science"
              />
            </div>
          </div>
          <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (editingFaculty ? 'Updating...' : 'Adding...') : (editingFaculty ? 'Update Faculty Member' : 'Add Faculty Member')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FacultyForm;