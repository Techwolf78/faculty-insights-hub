import React, { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useFacultyByUserId } from '@/hooks/useCollegeData';
import { User, Mail, Phone, GraduationCap, Building, Lock, Eye, EyeOff } from 'lucide-react';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

const HodProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const { data: hodProfile } = useFacultyByUserId(user?.id);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        toast.error('User not authenticated');
        return;
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);

      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      console.error('Password change error:', error);
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
      } else if (firebaseError.code === 'auth/weak-password') {
        toast.error('New password is too weak');
      } else {
        toast.error('Failed to change password');
      }
// ...existing code...
    } finally {
      setIsChangingPassword(false);
    }
  };

  const [loadingProgress, setLoadingProgress] = useState(0);

  // Loading progress effect
  useEffect(() => {
    if (!hodProfile) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev; // Stop at 90% until actual loading completes
          const increment = Math.random() * 15 + 5; // Random increment between 5-20%
          const newProgress = prev + increment;
          return Math.min(newProgress, 90); // Ensure it never goes over 90%
        });
      }, 300 + Math.random() * 400); // Random interval between 300-700ms

      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100); // Complete when loading finishes
      // Reset progress after a short delay
      setTimeout(() => setLoadingProgress(0), 500);
    }
  }, [hodProfile]);

  if (!hodProfile) {
    return (
      <div className="min-h-screen bg-background relative">
        {/* Skeleton Main Content Only */}
        <div className="flex-1 flex flex-col p-6 space-y-6">
          <Skeleton className="h-10 w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
        {/* Loading Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6 max-w-sm mx-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <div className="w-full space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-muted-foreground text-sm">Loading profile...</p>
                <span className="text-primary font-medium text-sm">{Math.round(loadingProgress)}%</span>
              </div>
              <Progress value={loadingProgress} className="w-full h-2" />
            </div>
            <p className="text-muted-foreground text-sm text-center">
              {loadingProgress < 30 ? "Initializing..." :
               loadingProgress < 60 ? "Loading data..." :
               loadingProgress < 90 ? "Processing analytics..." :
               "Almost ready..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Profile Information"
        subtitle="View your account details"
        college={null}
      />

      <div className="p-6 max-w-4xl mx-auto">
        <div className="grid gap-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your basic profile information. Contact your college admin to update your details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Full Name</Label>
                  <p className="text-sm text-muted-foreground mt-1">{hodProfile.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Faculty ID</Label>
                  <p className="text-sm text-muted-foreground mt-1">{hodProfile.employeeId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">{hodProfile.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {hodProfile.phone || 'Not provided'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Designation</Label>
                  <p className="text-sm text-muted-foreground mt-1">{hodProfile.designation}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Department
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">{hodProfile.departmentId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Course
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">{hodProfile.course}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Academic Year</Label>
                  <p className="text-sm text-muted-foreground mt-1">{hodProfile.academicYear}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your account password. You need to enter your current password for security.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="w-full"
              >
                {isChangingPassword ? 'Changing Password...' : 'Change Password'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HodProfileSettings;