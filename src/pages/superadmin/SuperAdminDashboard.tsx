import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  collegesApi,
  usersApi,
  feedbackSessionsApi,
  College,
  User,
  FeedbackSession,
  Timestamp,
  resetDemoData,
} from '@/lib/storage';
import {
  Building2,
  UserPlus,
  RefreshCw,
  LogOut,
  Plus,
  Trash2,
  Shield,
  GraduationCap,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export const SuperAdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [colleges, setColleges] = useState<College[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [feedbackSessions, setFeedbackSessions] = useState<FeedbackSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // College form state
  const [collegeDialogOpen, setCollegeDialogOpen] = useState(false);
  const [collegeName, setCollegeName] = useState('');
  const [collegeCode, setCollegeCode] = useState('');

  // Admin form state
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminCollegeId, setAdminCollegeId] = useState('');

  useEffect(() => {
    // Redirect non-superAdmin users
    if (user && user.role !== 'superAdmin') {
      navigate('/');
      return;
    }

    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const [collegeList, userList, sessionList] = await Promise.all([
        collegesApi.getAll(),
        usersApi.getAll(),
        feedbackSessionsApi.getAll(),
      ]);

      // Update expired sessions to inactive
      const updatedSessions = await Promise.all(
        sessionList.map(async (session) => {
          if (session.isActive && session.expiresAt.toDate() < new Date()) {
            await feedbackSessionsApi.update(session.id, { isActive: false });
            return { ...session, isActive: false };
          }
          return session;
        })
      );

      // For demo: activate the specific session and set future expiration
      const demoSession = updatedSessions.find(s => s.uniqueUrl === 'ds-ml-ai-1styear-A-10-2026');
      if (demoSession && !demoSession.isActive) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10); // 10 days from now
        await feedbackSessionsApi.update(demoSession.id, { 
          isActive: true, 
          expiresAt: Timestamp.fromDate(futureDate)
        });
        demoSession.isActive = true;
        demoSession.expiresAt = Timestamp.fromDate(futureDate);
      }

      setColleges(collegeList);
      setAdmins(userList.filter(u => u.role === 'admin'));
      setFeedbackSessions(updatedSessions);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCollege = async () => {
    if (!collegeName.trim() || !collegeCode.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await collegesApi.create({
        name: collegeName.trim(),
        code: collegeCode.trim().toUpperCase(),
      });

      toast.success('College created successfully');
      setCollegeDialogOpen(false);
      setCollegeName('');
      setCollegeCode('');
      loadData();
    } catch (error) {
      toast.error('Failed to create college');
    }
  };

  const handleCreateAdmin = async () => {
    if (!adminName.trim() || !adminEmail.trim() || !adminPassword.trim() || !adminCollegeId) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await usersApi.create({
        name: adminName.trim(),
        email: adminEmail.trim().toLowerCase(),
        role: 'admin',
        collegeId: adminCollegeId,
      });

      toast.success('College Admin created successfully');
      setAdminDialogOpen(false);
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
      setAdminCollegeId('');
      loadData();
    } catch (error) {
      toast.error('Failed to create admin');
    }
  };

  const handleResetData = () => {
    resetDemoData();
    toast.success('Demo data has been reset');
    loadData();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user || user.role !== 'superAdmin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar - Full height */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        {/* Sidebar Header with Title */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-hero">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display text-xl font-semibold text-foreground">Super Admin</span> <br />
              <span className="text-sm text-muted-foreground">Platform Management</span>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 p-4 overflow-y-auto">
          <nav className="space-y-1">
            <div className="grid w-full grid-rows-4 h-auto gap-1">
              <Button
                variant={activeTab === 'overview' ? 'default' : 'ghost'}
                className={`w-full justify-start gap-3 h-10 px-3 text-sm ${
                  activeTab === 'overview' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-primary/10'
                }`}
                onClick={() => setActiveTab('overview')}
              >
                <Building2 className="h-4 w-4" />
                Overview
              </Button>
              <Button
                variant={activeTab === 'colleges' ? 'default' : 'ghost'}
                className={`w-full justify-start gap-3 h-10 px-3 text-sm ${
                  activeTab === 'colleges' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-primary/10'
                }`}
                onClick={() => setActiveTab('colleges')}
              >
                <GraduationCap className="h-4 w-4" />
                Colleges ({colleges.length})
              </Button>
              <Button
                variant={activeTab === 'admins' ? 'default' : 'ghost'}
                className={`w-full justify-start gap-3 h-10 px-3 text-sm ${
                  activeTab === 'admins' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-primary/10'
                }`}
                onClick={() => setActiveTab('admins')}
              >
                <UserPlus className="h-4 w-4" />
                Admins ({admins.length})
              </Button>
              <Button
                variant={activeTab === 'sessions' ? 'default' : 'ghost'}
                className={`w-full justify-start gap-3 h-10 px-3 text-sm ${
                  activeTab === 'sessions' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-primary/10'
                }`}
                onClick={() => setActiveTab('sessions')}
              >
                <Shield className="h-4 w-4" />
                Sessions ({feedbackSessions.length})
              </Button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Right Side */}
      <div className="flex-1 flex flex-col">
        {/* Top Header with Buttons */}
        <header className="border-b border-border bg-card p-4 flex justify-end gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2 text-warning border-warning hover:bg-warning/10">
                <RefreshCw className="h-4 w-4" />
                Reset Demo Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Reset Demo Data?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete all existing data and recreate the demo dataset. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetData} className="bg-warning text-warning-foreground hover:bg-warning/90">
                  Reset Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button variant="ghost" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">Platform Overview</h1>
                  <p className="text-muted-foreground">Monitor and manage your educational platform</p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{colleges.length}</p>
                      <p className="text-sm text-muted-foreground">Colleges</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <UserPlus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{admins.length}</p>
                      <p className="text-sm text-muted-foreground">Admins</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{feedbackSessions.length}</p>
                      <p className="text-sm text-muted-foreground">Sessions</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{feedbackSessions.filter(s => s.isActive).length}</p>
                      <p className="text-sm text-muted-foreground">Active Sessions</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {colleges.slice(0, 3).map((college, index) => (
                    <div key={college.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">College created: {college.name}</p>
                        <p className="text-xs text-muted-foreground">Code: {college.code}</p>
                      </div>
                    </div>
                  ))}
                  {colleges.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Colleges Tab */}
          {activeTab === 'colleges' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">Colleges</h1>
                  <p className="text-muted-foreground">Manage educational institutions</p>
                </div>
                <Dialog open={collegeDialogOpen} onOpenChange={setCollegeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 gradient-hero text-primary-foreground hover:opacity-90">
                      <Plus className="h-4 w-4" />
                      Add College
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New College</DialogTitle>
                      <DialogDescription>
                        Add a new college to the platform. You'll be able to create admin users for this college.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="collegeName">College Name</Label>
                        <Input
                          id="collegeName"
                          placeholder="e.g., Gryphon Institute of Technology"
                          value={collegeName}
                          onChange={(e) => setCollegeName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="collegeCode">College Code</Label>
                        <Input
                          id="collegeCode"
                          placeholder="e.g., GIT"
                          value={collegeCode}
                          onChange={(e) => setCollegeCode(e.target.value.toUpperCase())}
                          maxLength={10}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCollegeDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateCollege} className="gradient-hero text-primary-foreground hover:opacity-90">
                        Create College
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {colleges.map((college, index) => (
                  <div
                    key={college.id}
                    className="glass-card rounded-xl p-6 animate-fade-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{college.name}</h3>
                        <p className="text-sm text-muted-foreground">Code: {college.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {admins.filter(a => a.collegeId === college.id).length} admin(s)
                      </span>
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                        Active
                      </span>
                    </div>
                  </div>
                ))}

                {colleges.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No colleges yet</h3>
                    <p className="text-muted-foreground">Create your first college to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admins Tab */}
          {activeTab === 'admins' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">College Administrators</h1>
                  <p className="text-muted-foreground">Manage admin users for each college</p>
                </div>
                <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="gap-2 gradient-hero text-primary-foreground hover:opacity-90"
                      disabled={colleges.length === 0}
                    >
                      <Plus className="h-4 w-4" />
                      Add Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create College Admin</DialogTitle>
                      <DialogDescription>
                        Create a new admin user for a college. They will have full control within their college scope.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="adminName">Full Name</Label>
                        <Input
                          id="adminName"
                          placeholder="e.g., Dr. Sarah Mitchell"
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminEmail">Email Address</Label>
                        <Input
                          id="adminEmail"
                          type="email"
                          placeholder="e.g., dean@college.edu"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminPassword">Password</Label>
                        <Input
                          id="adminPassword"
                          type="password"
                          placeholder="Secure password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminCollege">Assign to College</Label>
                        <select
                          id="adminCollege"
                          value={adminCollegeId}
                          onChange={(e) => setAdminCollegeId(e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                          <option value="">Select a college...</option>
                          {colleges.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAdminDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateAdmin} className="gradient-hero text-primary-foreground hover:opacity-90">
                        Create Admin
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {admins.map((admin, index) => {
                  const college = colleges.find(c => c.id === admin.collegeId);

                  return (
                    <div
                      key={admin.id}
                      className="glass-card rounded-xl p-6 animate-fade-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
                          <span className="text-sm font-medium text-accent-foreground">
                            {admin.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{admin.name}</h3>
                          <p className="text-sm text-muted-foreground">{admin.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                          {college?.code || 'N/A'}
                        </span>
                        <span className="text-xs text-muted-foreground">Admin</span>
                      </div>
                    </div>
                  );
                })}

                {admins.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No admin users yet</h3>
                    <p className="text-muted-foreground">Create a college first, then add admins</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">Feedback Sessions</h1>
                  <p className="text-muted-foreground">Monitor and manage all feedback sessions across colleges</p>
                </div>
              </div>

              {/* Session Stats */}
              <div className="grid gap-6 md:grid-cols-3">
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{feedbackSessions.length}</p>
                      <p className="text-sm text-muted-foreground">Total Sessions</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-green-100">
                      <Shield className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{feedbackSessions.filter(s => s.isActive).length}</p>
                      <p className="text-sm text-muted-foreground">Active Sessions</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-red-100">
                      <Shield className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{feedbackSessions.filter(s => !s.isActive).length}</p>
                      <p className="text-sm text-muted-foreground">Inactive Sessions</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Filters */}
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All Sessions</TabsTrigger>
                  <TabsTrigger value="active">Active Sessions</TabsTrigger>
                  <TabsTrigger value="past">Past Sessions</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    {colleges.map((college) => {
                      const collegeSessions = feedbackSessions.filter(s => s.collegeId === college.id);
                      if (collegeSessions.length === 0) return null;

                      return (
                        <div key={college.id} className="glass-card rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <GraduationCap className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground text-sm">{college.name}</h3>
                              <p className="text-xs text-muted-foreground">Code: {college.code} • {collegeSessions.length} sessions</p>
                            </div>
                          </div>

                          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {collegeSessions.map((session) => (
                              <div key={session.id} className="p-2 rounded-lg bg-secondary/50">
                                <div className="mb-2">
                                  <p className="font-medium text-xs text-foreground">{session.course} - {session.subject}</p>
                                  <p className="text-xs text-muted-foreground">{session.batch} • {session.academicYear}</p>
                                </div>
                                <div className="mb-2">
                                  <p className="text-xs text-muted-foreground mb-1">Session URL:</p>
                                  <div className="flex items-center gap-1">
                                    <code className="bg-background px-2 py-1 rounded text-xs font-mono break-all flex-1">
                                      /feedback/anonymous/{session.uniqueUrl}
                                    </code>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(`/feedback/anonymous/${session.uniqueUrl}`, '_blank')}
                                      className="h-6 w-6 p-0"
                                      title="Open in new tab"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className={`px-1 py-0.5 rounded-full text-xs ${
                                    session.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {session.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Expires: {session.expiresAt.toDate().toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {feedbackSessions.length === 0 && (
                      <div className="text-center py-12">
                        <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">No feedback sessions yet</h3>
                        <p className="text-muted-foreground">Sessions will appear here once colleges create them</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="active" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    {colleges.map((college) => {
                      const collegeSessions = feedbackSessions.filter(s => s.collegeId === college.id && s.isActive);
                      if (collegeSessions.length === 0) return null;

                      return (
                        <div key={college.id} className="glass-card rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <GraduationCap className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground text-sm">{college.name}</h3>
                              <p className="text-xs text-muted-foreground">Code: {college.code} • {collegeSessions.length} active sessions</p>
                            </div>
                          </div>

                          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {collegeSessions.map((session) => (
                              <div key={session.id} className="p-2 rounded-lg bg-green-50 border border-green-200">
                                <div className="mb-2">
                                  <p className="font-medium text-xs text-foreground">{session.course} - {session.subject}</p>
                                  <p className="text-xs text-muted-foreground">{session.batch} • {session.academicYear}</p>
                                </div>
                                <div className="mb-2">
                                  <p className="text-xs text-muted-foreground mb-1">Session URL:</p>
                                  <div className="flex items-center gap-1">
                                    <code className="bg-background px-2 py-1 rounded text-xs font-mono break-all flex-1">
                                      /feedback/anonymous/{session.uniqueUrl}
                                    </code>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(`/feedback/anonymous/${session.uniqueUrl}`, '_blank')}
                                      className="h-6 w-6 p-0"
                                      title="Open in new tab"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="px-1 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                                    Active
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Expires: {session.expiresAt.toDate().toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {feedbackSessions.filter(s => s.isActive).length === 0 && (
                      <div className="text-center py-12">
                        <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">No active sessions</h3>
                        <p className="text-muted-foreground">Active feedback sessions will appear here</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="past" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    {colleges.map((college) => {
                      const collegeSessions = feedbackSessions.filter(s => s.collegeId === college.id && !s.isActive);
                      if (collegeSessions.length === 0) return null;

                      return (
                        <div key={college.id} className="glass-card rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                              <GraduationCap className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground text-sm">{college.name}</h3>
                              <p className="text-xs text-muted-foreground">Code: {college.code} • {collegeSessions.length} past sessions</p>
                            </div>
                          </div>

                          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {collegeSessions.map((session) => (
                              <div key={session.id} className="p-2 rounded-lg bg-red-50 border border-red-200">
                                <div className="mb-2">
                                  <p className="font-medium text-xs text-foreground">{session.course} - {session.subject}</p>
                                  <p className="text-xs text-muted-foreground">{session.batch} • {session.academicYear}</p>
                                </div>
                                <div className="mb-2">
                                  <p className="text-xs text-muted-foreground mb-1">Session URL:</p>
                                  <div className="flex items-center gap-1">
                                    <code className="bg-background px-2 py-1 rounded text-xs font-mono break-all flex-1">
                                      /feedback/anonymous/{session.uniqueUrl}
                                    </code>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(`/feedback/anonymous/${session.uniqueUrl}`, '_blank')}
                                      className="h-6 w-6 p-0"
                                      title="Open in new tab"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="px-1 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
                                    Inactive
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Expired: {session.expiresAt.toDate().toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {feedbackSessions.filter(s => !s.isActive).length === 0 && (
                      <div className="text-center py-12">
                        <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">No past sessions</h3>
                        <p className="text-muted-foreground">Past feedback sessions will appear here</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
