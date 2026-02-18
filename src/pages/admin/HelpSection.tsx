import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    useAllHelpTickets,
    useCreateHelpTicket,
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TicketForm } from '@/components/help/TicketForm';
import { TicketDetailModal } from '@/components/help/TicketDetailModal';
import {
    TicketStatusBadge,
    TicketPriorityBadge,
    TicketCategoryBadge,
} from '@/components/help/TicketStatusBadge';
import { HelpTicket } from '@/lib/storage';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TicketFormData {
  title: string;
  description: string;
  category: HelpTicket['category'];
  priority: HelpTicket['priority'];
}

export default function AdminHelpSection() {
    const { user } = useAuth();
    const [selectedTicket, setSelectedTicket] = useState<HelpTicket | null>(null);
    const [isCreatingTicket, setIsCreatingTicket] = useState(false);
    const [isAddingRemark, setIsAddingRemark] = useState(false);

    const { data: allTickets = [], isLoading, error: ticketsError, refetch } = useAllHelpTickets();
    
    // Filter tickets to show only user's own tickets
    const tickets = allTickets.filter(ticket => ticket.createdBy === user?.id);

    // Debug logging
    useEffect(() => {
        console.log('Admin HelpSection - Debug Info:', {
            userId: user?.id,
            allTicketsCount: allTickets.length,
            filteredTicketsCount: tickets.length,
            isLoading,
            error: ticketsError,
            tickets: tickets,
        });
    }, [user?.id, allTickets, tickets, isLoading, ticketsError]);

    const createTicketMutation = useCreateHelpTicket();
    const addRemarkMutation = useAddHelpTicketRemark();

    const handleCreateTicket = async (ticketData: TicketFormData) => {
        if (!user?.id || !user?.collegeId) {
            toast.error('User information not available');
            return;
        }

        try {
            setIsCreatingTicket(true);
            await createTicketMutation.mutateAsync({
                title: ticketData.title,
                description: ticketData.description,
                category: ticketData.category,
                priority: ticketData.priority,
                status: 'open',
                createdBy: user.id,
                collegeId: user.collegeId,
            });
            // Wait a moment for the server to process, then refetch
            await new Promise(resolve => setTimeout(resolve, 500));
            await refetch();
            toast.success('Ticket created successfully!');
        } catch (error) {
            console.error('Error creating ticket:', error);
            toast.error('Failed to create ticket');
        } finally {
            setIsCreatingTicket(false);
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
            }
            refetch();
        } catch (error) {
            console.error('Error adding remark:', error);
            toast.error('Failed to add remark');
        } finally {
            setIsAddingRemark(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="w-full">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Help & Support</h1>
                    <p className="text-slate-600">
                        Raise a support ticket or view your existing tickets
                    </p>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="raise" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="raise">Raise New Ticket</TabsTrigger>
                        <TabsTrigger value="my-tickets">
                            My Tickets {tickets.length > 0 && `(${tickets.length})`}
                        </TabsTrigger>
                    </TabsList>

                    {/* Raise Ticket Tab */}
                    <TabsContent value="raise">
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
                                <CardTitle>Create a Support Ticket</CardTitle>
                                <CardDescription>
                                    Describe your issue in detail. Our support team will respond
                                    shortly.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <TicketForm
                                    onSubmit={handleCreateTicket}
                                    isSubmitting={isCreatingTicket}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* My Tickets Tab */}
                    <TabsContent value="my-tickets">
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
                                            No tickets yet
                                        </p>
                                        <p className="text-slate-400 text-sm">
                                            Create a ticket to get started with support
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
                                                <TableHead className="font-semibold">Category</TableHead>
                                                <TableHead className="font-semibold">Priority</TableHead>
                                                <TableHead className="font-semibold">Status</TableHead>
                                                <TableHead className="font-semibold">Created</TableHead>
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
                                                    <TableCell>
                                                        <TicketCategoryBadge
                                                            category={ticket.category}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TicketPriorityBadge priority={ticket.priority} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TicketStatusBadge status={ticket.status} />
                                                    </TableCell>
                                                    <TableCell className="text-sm text-slate-500">
                                                        {formatDistanceToNow(
                                                            new Date(ticket.createdAt.toDate()),
                                                            { addSuffix: true }
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setSelectedTicket(ticket)}
                                                            className="hover:bg-slate-100 hover:text-slate-700"
                                                        >
                                                            {ticket.remarks.length > 0 && (
                                                                <MessageCircle className="h-4 w-4 text-slate-500 mr-2" />
                                                            )}
                                                            View
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
                </Tabs>
            </div>

            {/* Detail Modal */}
            <TicketDetailModal
                ticket={selectedTicket}
                onClose={() => setSelectedTicket(null)}
                onAddRemark={handleAddRemark}
                isSuperAdmin={false}
                isSubmitting={isAddingRemark}
            />
        </div>
    );
}
