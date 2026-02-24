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
import { FirebaseError } from 'firebase/app';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { facultyAllocationsApi, feedbackSessionsApi, FacultyAllocation, FeedbackSession } from '@/lib/storage';

const FacultyProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const { data: facultyProfile, isLoading: isProfileLoading } = useFacultyByUserId(user?.uid || user?.id);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [allocations, setAllocations] = useState<FacultyAllocation[]>([]);
  const [sessions, setSessions] = useState<FeedbackSession[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Loading progress effect
  useEffect(() => {
    if (isProfileLoading) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev;
          const increment = Math.random() * 15 + 5;
          return Math.min(prev + increment, 90);
        });
      }, 400);
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
      const timeout = setTimeout(() => setLoadingProgress(0), 500);
      return () => clearTimeout(timeout);
    }
  }, [isProfileLoading]);

  useEffect(() => {
    if (facultyProfile?.id) {
      facultyAllocationsApi.getByFaculty(facultyProfile.id).then(setAllocations);
      feedbackSessionsApi.getByFaculty(facultyProfile.id).then(setSessions);
    }
  }, [facultyProfile?.id]);

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
      if (error instanceof Error && 'code' in error && error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
      } else if (error instanceof Error && 'code' in error && error.code === 'auth/weak-password') {
        toast.error('New password is too weak');
      } else {
        toast.error('Failed to change password');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-background relative">
        {/* Skeleton Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="h-16 border-b border-border p-4">
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="flex-1 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
        {/* Loading Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <div className="w-full space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Loading profile...</span>
                <span>{Math.round(loadingProgress)}%</span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300" 
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!facultyProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              We couldn't find a faculty profile associated with your account.
              Please contact your college administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
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
                Your basic profile information. Contact your college admin to update your password or other details. For support, email feedback.support@indiraicem.ac.in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Full Name</Label>
                  <p className="text-sm text-muted-foreground mt-1">{facultyProfile.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Faculty ID</Label>
                  <p className="text-sm text-muted-foreground mt-1">{facultyProfile.employeeId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">{facultyProfile.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {facultyProfile.phone || 'Not provided'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Designation</Label>
                  <p className="text-sm text-muted-foreground mt-1">{facultyProfile.designation}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Role
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1 capitalize">{facultyProfile.role}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Course
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">{allocations[0]?.course || 'Not assigned'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Academic Year</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {sessions[0]?.academicYear || 
                     (allocations.length > 0 && allocations[0].years && allocations[0].years[0]) || 
                     'Not assigned'}
                  </p>
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

export default FacultyProfileSettings;