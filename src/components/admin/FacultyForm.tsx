import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { facultyApi, usersApi, Faculty } from '@/lib/storage';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db, secondaryAuth } from '@/lib/firebase';
import { doc, collection, Timestamp } from 'firebase/firestore';
import { Eye, EyeOff } from 'lucide-react';
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

  // Default form data structure - used for both add and edit operations
  const defaultFormData = useMemo(() => ({
    employeeId: '',
    name: '',
    email: '',
    designation: '',
    specialization: '',
    experience: '',
    highestQualification: '',
    role: 'faculty', // Default to faculty
  }), []);

  const [formData, setFormData] = useState(defaultFormData);

  const loadData = useCallback(async () => {
    // No additional data needed for faculty form
  }, []);

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
      loadData();
    }
  }, [open, user?.collegeId, loadData]);

  useEffect(() => {
    if (editingFaculty && open) {
      // Populate form with existing faculty data
      setFormData({
        employeeId: editingFaculty.employeeId,
        name: editingFaculty.name,
        email: editingFaculty.email,
        designation: editingFaculty.designation,
        specialization: editingFaculty.specialization,
        experience: (editingFaculty.experience ?? 0).toString(),
        highestQualification: editingFaculty.highestQualification,
        role: editingFaculty.role || 'faculty', // Use existing role or default to faculty
      });
    } else if (!editingFaculty && open) {
      // Reset form for new faculty and generate faculty ID
      const generateId = async () => {
        const newId = await generateFacultyId();
        setFormData({ ...defaultFormData, employeeId: newId });
      };
      generateId();
    }
  }, [editingFaculty, open, defaultFormData, generateFacultyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.employeeId.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user?.collegeId) {
      toast.error('College information not found');
      return;
    }

    setIsLoading(true);
    try {
      const facultyData = {
        userId: editingFaculty?.userId || '', // Will be set when user account is created
        employeeId: formData.employeeId.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        designation: formData.designation.trim(),
        specialization: formData.specialization.trim(),
        experience: parseInt(formData.experience) || 0,
        highestQualification: formData.highestQualification.trim(),
        collegeId: user.collegeId,
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
          // Generate password based on employee ID
          const password = formData.employeeId.replace('FAC', 'Fac') + '@';

          // 1. Create user in Firebase Auth using secondary app
          const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email.trim(), password);
          const firebaseUser = userCredential.user;

          // Sign out from secondary auth to avoid session conflicts
          await signOut(secondaryAuth);

          // 2. Create user document in Firestore
          const userData = {
            email: formData.email.trim(),
            name: formData.name.trim(),
            role: formData.role as 'faculty' | 'hod',
            collegeId: user.collegeId,
            departmentId: null, // Department will be assigned through faculty allocations
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

          toast.success(`Faculty member added successfully! Login credentials: ${formData.email} / ${password}`);
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
        {
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
        }
      </DialogContent>
    </Dialog>
  );
};

export default FacultyForm;