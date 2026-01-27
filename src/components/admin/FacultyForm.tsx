import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { facultyApi, departmentsApi, Faculty, Department } from '@/lib/storage';
import { getAcademicConfig } from '@/lib/academicConfig';
import { toast } from 'sonner';

interface FacultyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingFaculty?: Faculty | null;
}

const FacultyForm: React.FC<FacultyFormProps> = ({ open, onOpenChange, onSuccess, editingFaculty }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [courseData, setCourseData] = useState<Record<string, { years: string[]; yearDepartments: Record<string, string[]> }>>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    designation: '',
    specialization: '',
    experience: '',
    qualifications: '',
    researchInterests: '',
    publications: '',
    teachingSubjects: '',
    achievements: '',
    department: '',
    subjects: '',
    course: '',
    academicYear: '',
  });

  const loadData = useCallback(async () => {
    try {
      const config = await getAcademicConfig(user!.collegeId!);
      setCourseData(config.courseData);

      // Load departments
      const depts = await departmentsApi.getByCollege(user!.collegeId!);
      setDepartments(depts);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [user]);

  useEffect(() => {
    if (open && user?.collegeId) {
      loadData();
    }
  }, [open, user?.collegeId, loadData]);

  useEffect(() => {
    if (editingFaculty && open) {
      // Populate form with existing faculty data
      const dept = departments.find(d => d.id === editingFaculty.departmentId);
      setFormData({
        employeeId: editingFaculty.employeeId,
        name: editingFaculty.name,
        email: editingFaculty.email,
        designation: editingFaculty.designation,
        specialization: editingFaculty.specialization,
        experience: editingFaculty.experience.toString(),
        qualifications: editingFaculty.qualifications,
        researchInterests: editingFaculty.researchInterests.join(', '),
        publications: editingFaculty.publications.toString(),
        teachingSubjects: editingFaculty.teachingSubjects.join(', '),
        achievements: editingFaculty.achievements.join(', '),
        department: dept?.name || editingFaculty.departmentId, // Use department name for form display
        subjects: editingFaculty.subjects.join(', '),
        course: editingFaculty.course,
        academicYear: editingFaculty.academicYear,
      });
    } else if (!editingFaculty && open) {
      // Reset form for new faculty
      setFormData({
        employeeId: '',
        name: '',
        email: '',
        designation: '',
        specialization: '',
        experience: '',
        qualifications: '',
        researchInterests: '',
        publications: '',
        teachingSubjects: '',
        achievements: '',
        department: '',
        subjects: '',
        course: '',
        academicYear: '',
      });
    }
  }, [editingFaculty, open, departments]);

  const availableYears = formData.course ? courseData[formData.course]?.years || [] : [];
  const availableDepartmentsFromConfig = (formData.course && formData.academicYear)
    ? courseData[formData.course]?.yearDepartments?.[formData.academicYear] || [] : [];
  
  // Show departments from academic config (no filtering needed)
  const availableDepartments = availableDepartmentsFromConfig;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.employeeId.trim() || !formData.department || !formData.course || !formData.academicYear) {
      toast.error('Please fill in all required fields');
      return;
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
        qualifications: formData.qualifications.trim(),
        researchInterests: formData.researchInterests.split(',').map(s => s.trim()).filter(s => s),
        publications: parseInt(formData.publications) || 0,
        teachingSubjects: formData.teachingSubjects.split(',').map(s => s.trim()).filter(s => s),
        achievements: formData.achievements.split(',').map(s => s.trim()).filter(s => s),
        departmentId: selectedDept.id, // Use the actual department document ID
        collegeId: user.collegeId,
        subjects: formData.subjects.split(',').map(s => s.trim()).filter(s => s),
        course: formData.course,
        academicYear: formData.academicYear,
        isActive: true,
      };

      if (editingFaculty) {
        await facultyApi.update(editingFaculty.id, facultyData);
        toast.success('Faculty member updated successfully');
      } else {
        await facultyApi.create(facultyData);
        toast.success('Faculty member added successfully');
        setFormData({
          employeeId: '',
          name: '',
          email: '',
          designation: '',
          specialization: '',
          experience: '',
          qualifications: '',
          researchInterests: '',
          publications: '',
          teachingSubjects: '',
          achievements: '',
          department: '',
          subjects: '',
          course: '',
          academicYear: '',
        });
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
    setFormData({
      employeeId: '',
      name: '',
      email: '',
      designation: '',
      specialization: '',
      experience: '',
      qualifications: '',
      researchInterests: '',
      publications: '',
      teachingSubjects: '',
      achievements: '',
      department: '',
      subjects: '',
      course: '',
      academicYear: '',
    });
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
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="employeeId" className="text-right">
                Employee ID *
              </Label>
              <Input
                id="employeeId"
                value={formData.employeeId}
                onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., FAC001"
                required
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
                  department: ''
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
                  department: '' // Reset dependent field
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
                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
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
              <Label htmlFor="qualifications" className="text-right">
                Qualifications
              </Label>
              <Input
                id="qualifications"
                value={formData.qualifications}
                onChange={(e) => setFormData(prev => ({ ...prev, qualifications: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., PhD in Computer Science"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="publications" className="text-right">
                Publications
              </Label>
              <Input
                id="publications"
                type="number"
                value={formData.publications}
                onChange={(e) => setFormData(prev => ({ ...prev, publications: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., 15"
                min="0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teachingSubjects" className="text-right">
                Teaching Subjects
              </Label>
              <Input
                id="teachingSubjects"
                value={formData.teachingSubjects}
                onChange={(e) => setFormData(prev => ({ ...prev, teachingSubjects: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., Data Structures, Algorithms, AI (comma-separated)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subjects" className="text-right">
                Current Subjects
              </Label>
              <Input
                id="subjects"
                value={formData.subjects}
                onChange={(e) => setFormData(prev => ({ ...prev, subjects: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., CS101, CS201 (comma-separated)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="researchInterests" className="text-right">
                Research Interests
              </Label>
              <Input
                id="researchInterests"
                value={formData.researchInterests}
                onChange={(e) => setFormData(prev => ({ ...prev, researchInterests: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., Machine Learning, IoT, Cybersecurity (comma-separated)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="achievements" className="text-right">
                Achievements
              </Label>
              <Input
                id="achievements"
                value={formData.achievements}
                onChange={(e) => setFormData(prev => ({ ...prev, achievements: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., Best Teacher Award, Research Excellence (comma-separated)"
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
      </DialogContent>
    </Dialog>
  );
};

export default FacultyForm;