import React, { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Download, Edit, Trash2, User, ChevronLeft, ChevronRight, Search, Check, ChevronsUpDown, RefreshCw } from 'lucide-react';
import { Faculty, FacultyAllocation, College, usersApi } from '@/lib/storage';
import { useFacultyPaginated, useFaculty } from '@/hooks/useCollegeData';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from "@/lib/utils";
import { CacheRefreshButton } from '@/components/ui/CacheRefreshButton';

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
  // Cache refresh props
  onRefresh?: () => Promise<boolean>;
  hasStaleData?: boolean;
  isRefreshing?: boolean;
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
  onRefresh,
  hasStaleData = false,
  isRefreshing = false,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [lastDoc, setLastDoc] = useState<string | undefined>();
  const [adminEmailSet, setAdminEmailSet] = useState<Set<string>>(new Set());
  const [userEmailSet, setUserEmailSet] = useState<Set<string>>(new Set());
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedSearchId, setSelectedSearchId] = useState<string | null>(null);
  const pageSize = 20;

  const { data: paginatedData, isLoading } = useFacultyPaginated(college?.id, pageSize, lastDoc);

  // Fetch admin users to check if faculty members are also admins
  useEffect(() => {
    if (!college?.id) return;
    
    const fetchUsers = async () => {
      try {
        const users = await usersApi.getByCollege(college.id);
        const adminEmails = new Set(
          users
            .filter(u => u.roles && u.roles.includes('admin'))
            .map(u => u.email)
        );
        const allUserEmails = new Set(users.map(u => u.email));
        setAdminEmailSet(adminEmails);
        setUserEmailSet(allUserEmails);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
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
  
  // 1. Get the base list
  let baseList = isGlobalRoleFilter
    ? fullFilteredList
    : (paginatedData?.data || []).filter(roleMatches);

  // 2. Sort the base list (moved from JSX to here for cleaner logic)
  baseList = [...baseList].sort((a, b) => a.employeeId.localeCompare(b.employeeId));

  // 3. Apply selectedSearchId reordering
  let displayList = baseList;
  if (selectedSearchId) {
    const highlightedMember = allFaculty.find(f => f.id === selectedSearchId);
    if (highlightedMember && roleMatches(highlightedMember)) {
      // Remove from current position (if present) and put at top
      const otherMembers = baseList.filter(f => f.id !== selectedSearchId);
      displayList = [highlightedMember, ...otherMembers];
    }
  }

  const visibleList = isGlobalRoleFilter
    ? displayList.slice(pageStart, pageStart + pageSize)
    : displayList;

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
            <div className="flex flex-col gap-4">
              <div className="flex items-baseline gap-3">
                <h3 className="font-display text-lg font-semibold text-foreground">Faculty Members</h3>
                <span className="text-sm font-medium text-muted-foreground">{totalFacultyCount} total</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={searchOpen}
                      className="w-[320px] justify-between border-border/60 bg-background/50 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground group transition-all duration-200"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Search className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary-foreground" />
                        <span className={cn(
                          "truncate font-medium",
                          selectedSearchId 
                            ? "text-foreground group-hover:text-primary-foreground" 
                            : "text-muted-foreground group-hover:text-primary-foreground/80"
                        )}>
                          {selectedSearchId
                            ? allFaculty.find((f) => f.id === selectedSearchId)?.name
                            : "Search by Name or ID..."}
                        </span>
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:text-primary-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0 shadow-2xl border-primary/20" align="start">
                    <Command className="rounded-lg outline-none border-none">
                      <CommandInput 
                        placeholder="Type name or Employee ID..." 
                        className="h-12 border-none focus:ring-0"
                      />
                      <CommandList className="max-h-[300px] border-t border-border/50">
                        <CommandEmpty className="py-6 text-muted-foreground">No faculty found.</CommandEmpty>
                        <CommandGroup heading="Faculty List">
                          {allFaculty.map((member) => (
                            <CommandItem
                              key={member.id}
                              value={`${member.name} ${member.employeeId}`}
                              className="group flex items-center gap-3 p-3 cursor-pointer transition-colors data-[selected='true']:bg-primary data-[selected='true']:text-primary-foreground"
                              onSelect={() => {
                                setSelectedSearchId(member.id);
                                setSearchOpen(false);
                                if (facultyRoleFilter !== 'all' && !roleMatches(member)) {
                                  setFacultyRoleFilter('all');
                                }
                                setCurrentPage(0);
                              }}
                            >
                              <div className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 transition-colors group-data-[selected='true']:bg-primary-foreground/20",
                                selectedSearchId === member.id ? "bg-primary-foreground/20" : ""
                              )}>
                                {selectedSearchId === member.id ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <User className="h-4 w-4 text-primary group-data-[selected='true']:text-primary-foreground" />
                                )}
                              </div>
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="font-semibold truncate group-data-[selected='true']:text-primary-foreground">{member.name}</span>
                                <span className="text-xs text-muted-foreground truncate group-data-[selected='true']:text-primary-foreground/80">
                                  ID: {member.employeeId}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedSearchId && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedSearchId(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </div>

            <div className="flex gap-2 flex-wrap justify-end">
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
              {onRefresh && (
                <CacheRefreshButton
                  onRefresh={onRefresh}
                  hasStaleData={hasStaleData}
                  isRefreshing={isRefreshing}
                  compact={true}
                  label="Refresh"
                />
              )}
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
            {visibleList.map((member) => (
              <div 
                key={member.id} 
                className={cn(
                  "grid grid-cols-12 gap-4 items-center p-4 border rounded-lg transition-colors",
                  selectedSearchId === member.id 
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                    : "border-border"
                )}
              >
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
                  <Badge 
                    variant={userEmailSet.has(member.email) ? "secondary" : "destructive"}
                  >
                    {userEmailSet.has(member.email) ? "Active" : "Inactive"}
                  </Badge>
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
