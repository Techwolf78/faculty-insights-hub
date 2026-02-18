import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    useAllHelpTickets,
    useHelpTicketsByStatus,
    useUpdateHelpTicketStatus,
    useAddHelpTicketRemark,
} from '@/hooks/useCollegeData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { TicketDetailModal } from '@/components/help/TicketDetailModal';
import {
    TicketStatusBadge,
    TicketPriorityBadge,
    TicketCategoryBadge,
} from '@/components/help/TicketStatusBadge';
import { HelpTicket } from '@/lib/storage';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_TABS = [
    { value: 'all', label: 'All Tickets', status: null },
    { value: 'open', label: 'Open', status: 'open' },
    { value: 'in-progress', label: 'In Progress', status: 'in-progress' },
    { value: 'pending-info', label: 'Pending Info', status: 'pending-info' },
    { value: 'on-hold', label: 'On Hold', status: 'on-hold' },
    { value: 'resolved', label: 'Resolved', status: 'resolved' },
    { value: 'rejected', label: 'Rejected', status: 'rejected' },
    { value: 'closed', label: 'Closed', status: 'closed' },
] as const;

export default function SuperAdminHelpPortal() {
    const { user } = useAuth();
    const [selectedTicket, setSelectedTicket] = useState<HelpTicket | null>(null);
    const [currentTab, setCurrentTab] = useState<'all' | 'open' | 'in-progress' | 'pending-info' | 'on-hold' | 'resolved' | 'rejected' | 'closed'>('all');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isAddingRemark, setIsAddingRemark] = useState(false);

    // Fetch all tickets (SuperAdmin sees all colleges)
    const { data: allTickets = [], isLoading: isLoadingAll, error: allError } = useAllHelpTickets();

    // Debug logging
    useEffect(() => {
        console.log('SuperAdmin HelpPortal - Debug Info:', {
            userRole: user?.role,
            allTicketsCount: allTickets.length,
            isLoadingAll,
            error: allError,
            allTickets: allTickets,
        });
    }, [user?.role, allTickets, isLoadingAll, allError]);

    // Get current tab status for filtering
    const tabStatus = STATUS_TABS.find(t => t.value === currentTab)?.status;

    // Filter tickets based on current tab
    const tickets = currentTab === 'all' 
        ? allTickets 
        : allTickets.filter(ticket => ticket.status === tabStatus);
    
    const isLoading = isLoadingAll;

    const updateStatusMutation = useUpdateHelpTicketStatus();
    const addRemarkMutation = useAddHelpTicketRemark();

    const handleStatusChange = async (ticketId: string, newStatus: HelpTicket['status']) => {
        try {
            setIsUpdatingStatus(true);
            const updated = await updateStatusMutation.mutateAsync({
                id: ticketId,
                status: newStatus,
            });
            if (updated) {
                setSelectedTicket(updated);
                toast.success('Status updated successfully');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleAddRemark = async (ticketId: string, remarkText: string) => {
        if (!user?.id) {
            toast.error('User information not available');
            return;
        }

        try {
            setIsAddingRemark(true);
            const updated = await addRemarkMutation.mutateAsync({
                id: ticketId,
                remark: {
                    text: remarkText,
                    adminId: user.id,
                },
            });
            if (updated) {
                setSelectedTicket(updated);
                toast.success('Remark added successfully');
            }
        } catch (error) {
            console.error('Error adding remark:', error);
            toast.error('Failed to add remark');
        } finally {
            setIsAddingRemark(false);
        }
    };

    const getStatusIcon = (status: HelpTicket['status']) => {
        if (status === 'open') return <AlertCircle className="h-4 w-4 text-red-500" />;
        if (status === 'in-progress') return <Clock className="h-4 w-4 text-blue-500" />;
        if (status === 'resolved' || status === 'closed') return <CheckCircle className="h-4 w-4 text-green-500" />;
        return null;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="w-full">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Help Tickets Portal</h1>
                    <p className="text-slate-600">
                        Manage all support tickets from users, HODs, and admins
                    </p>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total Tickets', count: allTickets.length, color: 'bg-blue-50' },
                        { label: 'Open', count: allTickets.filter(t => t.status === 'open').length, color: 'bg-red-50' },
                        { label: 'In Progress', count: allTickets.filter(t => t.status === 'in-progress').length, color: 'bg-yellow-50' },
                        { label: 'Resolved', count: allTickets.filter(t => ['resolved', 'closed'].includes(t.status)).length, color: 'bg-green-50' },
                    ].map((stat) => (
                        <Card key={stat.label} className={`border-0 shadow-sm ${stat.color}`}>
                            <CardContent className="pt-6">
                                <p className="text-2xl font-bold text-slate-900">{stat.count}</p>
                                <p className="text-xs text-slate-600 mt-1">{stat.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Tabs */}
                <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as typeof currentTab)} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1 h-auto mb-6 bg-slate-100 p-1">
                        {STATUS_TABS.map((tab) => (
                            <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {STATUS_TABS.map((tab) => (
                        <TabsContent key={tab.value} value={tab.value}>
                            {isLoading ? (
                                <Card className="border-0 shadow-lg">
                                    <CardContent className="pt-8">
                                        <div className="flex justify-center items-center py-12">
                                            <div className="animate-pulse">
                                                <div className="h-4 bg-slate-200 rounded w-48 mb-2"></div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : tickets.length === 0 ? (
                                <Card className="border-0 shadow-lg">
                                    <CardContent className="pt-8">
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <AlertCircle className="h-12 w-12 text-slate-300 mb-3" />
                                            <p className="text-slate-500 font-medium">
                                                No tickets found
                                            </p>
                                            <p className="text-slate-400 text-sm">
                                                There are no {tab.label.toLowerCase()} tickets at this time
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="border-0 shadow-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-slate-100">
                                                <TableRow className="hover:bg-slate-100">
                                                    <TableHead className="font-semibold">Title</TableHead>
                                                    <TableHead className="font-semibold">User</TableHead>
                                                    <TableHead className="font-semibold">Category</TableHead>
                                                    <TableHead className="font-semibold">Priority</TableHead>
                                                    <TableHead className="font-semibold">Status</TableHead>
                                                    <TableHead className="font-semibold">Created</TableHead>
                                                    <TableHead className="font-semibold">Remarks</TableHead>
                                                    <TableHead className="font-semibold text-right">
                                                        Action
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {tickets.map((ticket) => (
                                                    <TableRow
                                                        key={ticket.id}
                                                        className="hover:bg-slate-50 cursor-pointer"
                                                    >
                                                        <TableCell className="font-medium max-w-xs truncate">
                                                            {ticket.title}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-slate-600">
                                                            {ticket.createdBy.slice(0, 8)}...
                                                        </TableCell>
                                                        <TableCell>
                                                            <TicketCategoryBadge
                                                                category={ticket.category}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <TicketPriorityBadge priority={ticket.priority} />
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                {getStatusIcon(ticket.status)}
                                                                <TicketStatusBadge status={ticket.status} />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-slate-500">
                                                            {formatDistanceToNow(
                                                                new Date(ticket.createdAt.toDate()),
                                                                { addSuffix: true }
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="text-sm font-medium bg-slate-100 px-2 py-1 rounded">
                                                                {ticket.remarks.length}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setSelectedTicket(ticket)}
                                                                className="hover:bg-slate-50 hover:border-slate-400 hover:text-slate-700"
                                                            >
                                                                Manage
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </Card>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            </div>

            {/* Detail Modal */}
            <TicketDetailModal
                ticket={selectedTicket}
                onClose={() => setSelectedTicket(null)}
                onStatusChange={handleStatusChange}
                onAddRemark={handleAddRemark}
                isSuperAdmin={true}
                isSubmitting={isUpdatingStatus || isAddingRemark}
            />
        </div>
    );
}
