import React, { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Download, Edit, Trash2, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Faculty, FacultyAllocation, College, usersApi } from '@/lib/storage';
import { useFacultyPaginated, useFaculty } from '@/hooks/useCollegeData';

interface FacultyManagementProps {
  college: College | null;
  facultyRoleFilter: 'all' | 'faculty' | 'hod' | 'admin';
  setFacultyRoleFilter: (value: 'all' | 'faculty' | 'hod' | 'admin') => void;
  allocations: FacultyAllocation[];
  handleExportFaculty: () => void;
  setFacultyFormOpen: (open: boolean) => void;
  setBulkCreateOpen: (open: boolean) => void;
  handleEditFaculty: (member: Faculty) => void;
  handleDeleteFaculty: (member: Faculty) => void;
} 

export const FacultyManagement: React.FC<FacultyManagementProps> = React.memo(({
  college,
  facultyRoleFilter,
  setFacultyRoleFilter,
  allocations,
  handleExportFaculty,
  setFacultyFormOpen,
  setBulkCreateOpen,
  handleEditFaculty,
  handleDeleteFaculty,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [lastDoc, setLastDoc] = useState<string | undefined>();
  const [adminEmailSet, setAdminEmailSet] = useState<Set<string>>(new Set());
  const pageSize = 20;

  const { data: paginatedData, isLoading } = useFacultyPaginated(college?.id, pageSize, lastDoc);

  // Fetch admin users to check if faculty members are also admins
  useEffect(() => {
    if (!college?.id) return;
    
    const fetchAdminUsers = async () => {
      try {
        const users = await usersApi.getByCollege(college.id);
        const adminEmails = new Set(
          users
            .filter(u => u.roles && u.roles.includes('admin'))
            .map(u => u.email)
        );
        setAdminEmailSet(adminEmails);
      } catch (error) {
        console.error('Error fetching admin users:', error);
      }
    };

    fetchAdminUsers();
  }, [college?.id]);

  const faculty = paginatedData?.data || [];
  const hasMore = paginatedData?.hasMore || false;

  // Total faculty count (use full list) — displayed in header
  const { data: allFaculty = [] } = useFaculty(college?.id);
  const totalFacultyCount = allFaculty.length;

  // Admin count (derived from users list) — used to disable the Admin filter if none exist
  const adminCount = adminEmailSet.size;

  // If the Admin filter is active but there are no admin users, reset the filter to 'all'
  React.useEffect(() => {
    if (facultyRoleFilter === 'admin' && adminCount === 0) {
      setFacultyRoleFilter('all');
    }
  }, [facultyRoleFilter, adminCount, setFacultyRoleFilter]);

  // If a role filter is active, apply it across the entire `allFaculty` list
  const isGlobalRoleFilter = facultyRoleFilter !== 'all';

  const roleMatches = (member: Faculty) => {
    if (facultyRoleFilter === 'all') return true;
    if (facultyRoleFilter === 'admin') return adminEmailSet.has(member.email);
    return member.role === facultyRoleFilter;
  };

  // Full filtered list when a global filter is active
  const fullFilteredList = isGlobalRoleFilter ? allFaculty.filter(roleMatches) : [];
  const filteredTotalCount = isGlobalRoleFilter ? fullFilteredList.length : (paginatedData?.data || []).filter(roleMatches).length;

  // Visible items for the current page
  const pageStart = currentPage * pageSize;
  const visibleList = isGlobalRoleFilter
    ? fullFilteredList.slice(pageStart, pageStart + pageSize)
    : (paginatedData?.data || []).filter(roleMatches);

  // hasMore for pagination: when filtering globally, compute locally; otherwise use server value
  const hasMoreForPage = isGlobalRoleFilter ? pageStart + pageSize < filteredTotalCount : hasMore;

  // Reset pagination when role filter changes so users always start at page 1 of filtered results
  React.useEffect(() => {
    setLastDoc(undefined);
    setCurrentPage(0);
  }, [facultyRoleFilter]);

  const handleNextPage = () => {
    if (isGlobalRoleFilter) {
      if (pageStart + pageSize < filteredTotalCount) setCurrentPage(prev => prev + 1);
      return;
    }

    if (hasMore && paginatedData?.lastDoc) {
      setLastDoc(paginatedData.lastDoc.id);
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (isGlobalRoleFilter) {
      setCurrentPage(prev => Math.max(0, prev - 1));
      return;
    }

    // For simplicity, reset to first page. In a full implementation, you'd track previous docs.
    setLastDoc(undefined);
    setCurrentPage(0);
  };
  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Faculty Management"
        subtitle="Manage faculty members and their departments"
        college={college}
      />

      <div className="p-6">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-baseline gap-3">
                <h3 className="font-display text-lg font-semibold text-foreground">Faculty Members</h3>
                <span className="text-sm font-medium text-muted-foreground">{totalFacultyCount} total</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={facultyRoleFilter} onValueChange={(value: 'all' | 'faculty' | 'hod' | 'admin') => setFacultyRoleFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="admin" disabled={adminCount === 0}>Admin</SelectItem>
                  <SelectItem value="hod">HOD</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExportFaculty}>
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => setFacultyFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Faculty
              </Button>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => setBulkCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Bulk Create Faculty
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {visibleList
              .sort((a, b) => a.employeeId.localeCompare(b.employeeId))
              .map((member) => (
              <div key={member.id} className="grid grid-cols-12 gap-4 items-center p-4 border border-border rounded-lg">
                <div className="col-span-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-foreground truncate">{member.name}</h4>
                    <p className="text-sm text-muted-foreground truncate">{member.employeeId}</p>
                    <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {(() => {
                        const memberAllocations = allocations.filter(a => a.facultyId === member.id);
                        const uniqueDepartments = [...new Set(memberAllocations.map(a => a.department))];
                        return uniqueDepartments.length > 0
                          ? uniqueDepartments.slice(0, 2).join(', ') + (uniqueDepartments.length > 2 ? '...' : '')
                          : 'No Allocations';
                      })()}
                    </p>
                  </div>
                </div>
                <div className="col-span-2 flex justify-center">
                  <Badge 
                    variant={adminEmailSet.has(member.email) ? 'default' : member.role === 'hod' ? 'default' : 'secondary'} 
                    className="text-center"
                  >
                    {adminEmailSet.has(member.email) ? 'College Admin' : member.role === 'hod' ? 'Head of Department' : 'Faculty Member'}
                  </Badge>
                </div>
                <div className="col-span-2 flex justify-center">
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditFaculty(member)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Faculty Member</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {member.name}? This action cannot be undone and will remove all associated feedback data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteFaculty(member)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Page {currentPage + 1} • {isGlobalRoleFilter ? filteredTotalCount : visibleList.length} faculty shown
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!hasMoreForPage}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
