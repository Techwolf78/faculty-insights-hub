import React from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Filter, X } from 'lucide-react';
import { SessionTable } from '@/components/admin/SessionTable';
import { Department, Faculty, FeedbackSession, College } from '@/lib/storage';

interface SessionManagementProps {
  college: College | null;
  sessions: FeedbackSession[];
  sessionDepartmentFilter: string;
  setSessionDepartmentFilter: (value: string) => void;
  currentSessionTab: string;
  setCurrentSessionTab: (value: string) => void;
  departments: Department[];
  faculty: Faculty[];
  getTotalSessionCount: () => number;
  getDepartmentSessionCount: (deptId: string) => number;
  setSessionFormOpen: (open: boolean) => void;
  refreshSessions: () => void;
  handleOptimisticSessionUpdate: (sessionId: string, updates: Partial<FeedbackSession>) => void;
}

export const SessionManagement: React.FC<SessionManagementProps> = React.memo(({
  college,
  sessions,
  sessionDepartmentFilter,
  setSessionDepartmentFilter,
  currentSessionTab,
  setCurrentSessionTab,
  departments,
  faculty,
  getTotalSessionCount,
  getDepartmentSessionCount,
  setSessionFormOpen,
  refreshSessions,
  handleOptimisticSessionUpdate,
}) => {
  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Feedback Sessions"
        subtitle="Manage feedback collection sessions"
        college={college}
      />

      <div className="p-6">
        <div className="grid grid-cols-3 items-center mb-6">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">Session Overview</h3>
            <p className="text-sm text-muted-foreground">Monitor and organize feedback sessions</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-1">
              <Filter className="h-3 w-3 text-muted-foreground" />
              <Select value={sessionDepartmentFilter} onValueChange={setSessionDepartmentFilter}>
                <SelectTrigger className="w-36 h-8 text-xs bg-background/80 backdrop-blur-sm border-primary/20 focus:border-primary">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Departments ({getTotalSessionCount()})
                  </SelectItem>
                  {departments
                    .map((dept) => ({
                      dept,
                      count: getDepartmentSessionCount(dept.id)
                    }))
                    .filter(({ count }) => count > 0)
                    .map(({ dept, count }) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name} ({count})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {sessionDepartmentFilter !== 'all' && (
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0.5" onClick={() => setSessionDepartmentFilter('all')}>
                  <X className="h-2.5 w-2.5" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <Button className="bg-primary hover:bg-primary/90" onClick={() => setSessionFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Session
            </Button>
          </div>
        </div>

        <Tabs value={currentSessionTab} onValueChange={setCurrentSessionTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Sessions ({sessions.filter(s => sessionDepartmentFilter === 'all' || s.departmentId === sessionDepartmentFilter).length})</TabsTrigger>
            <TabsTrigger value="active">Active Sessions ({sessions.filter(s => s.isActive && (sessionDepartmentFilter === 'all' || s.departmentId === sessionDepartmentFilter)).length})</TabsTrigger>
            <TabsTrigger value="inactive">Inactive Sessions ({sessions.filter(s => !s.isActive && (sessionDepartmentFilter === 'all' || s.departmentId === sessionDepartmentFilter)).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <SessionTable
              sessions={sessions.filter(s => sessionDepartmentFilter === 'all' || s.departmentId === sessionDepartmentFilter)}
              faculty={faculty}
              departments={departments}
              onRefresh={refreshSessions}
              onOptimisticUpdate={handleOptimisticSessionUpdate}
            />
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <SessionTable
              sessions={sessions.filter(s => s.isActive && (sessionDepartmentFilter === 'all' || s.departmentId === sessionDepartmentFilter))}
              faculty={faculty}
              departments={departments}
              onRefresh={refreshSessions}
              onOptimisticUpdate={handleOptimisticSessionUpdate}
            />
          </TabsContent>

          <TabsContent value="inactive" className="mt-6">
            <SessionTable
              sessions={sessions.filter(s => !s.isActive && (sessionDepartmentFilter === 'all' || s.departmentId === sessionDepartmentFilter))}
              faculty={faculty}
              departments={departments}
              onRefresh={refreshSessions}
              onOptimisticUpdate={handleOptimisticSessionUpdate}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
});
