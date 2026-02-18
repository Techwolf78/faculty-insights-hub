import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { HelpTicket } from '@/lib/storage';
import { TicketStatusBadge, TicketPriorityBadge, TicketCategoryBadge } from './TicketStatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, User } from 'lucide-react';
import { toast } from 'sonner';

interface TicketDetailModalProps {
  ticket: HelpTicket | null;
  onClose: () => void;
  onStatusChange?: (ticketId: string, status: HelpTicket['status']) => Promise<void>;
  onAddRemark?: (ticketId: string, remark: string) => Promise<void>;
  isSuperAdmin?: boolean;
  isSubmitting?: boolean;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  onClose,
  onStatusChange,
  onAddRemark,
  isSuperAdmin = false,
  isSubmitting = false,
}) => {
  const [remarkText, setRemarkText] = useState('');
  const [isAddingRemark, setIsAddingRemark] = useState(false);

  const handleAddRemark = async () => {
    if (!ticket || !onAddRemark) return;

    if (!remarkText.trim()) {
      toast.error('Please enter a remark');
      return;
    }

    try {
      setIsAddingRemark(true);
      await onAddRemark(ticket.id, remarkText);
      setRemarkText('');
      // Toast is handled by parent component
    } catch (error) {
      toast.error('Failed to add remark');
      console.error(error);
    } finally {
      setIsAddingRemark(false);
    }
  };

  const handleStatusChange = async (newStatus: HelpTicket['status']) => {
    if (!ticket || !onStatusChange) return;

    try {
      await onStatusChange(ticket.id, newStatus);
      // Toast is handled by parent component
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={!!ticket} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{ticket.title}</DialogTitle>
          <DialogDescription>
            Ticket ID: {ticket.id.slice(0, 8)}... • Created{' '}
            {formatDistanceToNow(new Date(ticket.createdAt.toDate()), { addSuffix: true })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status, Priority, Category Row */}
          <div className="flex gap-4 items-center flex-wrap">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              {isSuperAdmin ? (
                <Select
                  value={ticket.status}
                  onValueChange={(value) =>
                    handleStatusChange(value as HelpTicket['status'])
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="pending-info">Pending Info</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <TicketStatusBadge status={ticket.status} />
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Priority</p>
              <TicketPriorityBadge priority={ticket.priority} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Category</p>
              <TicketCategoryBadge category={ticket.category} />
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Description</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          <Separator />

          {/* Remarks Timeline */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="h-5 w-5" />
              <h4 className="font-semibold text-sm">Admin Remarks ({ticket.remarks.length})</h4>
            </div>

            {ticket.remarks.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No remarks yet. Admin will respond to your ticket here.
              </p>
            ) : (
              <div className="space-y-4 max-h-48 overflow-y-auto">
                {ticket.remarks.map((remark, index) => (
                  <div key={index} className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4" />
                      <span className="text-xs font-semibold">Admin</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(remark.timestamp.toDate()), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{remark.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Remark Section (Super Admin Only) */}
          {isSuperAdmin && (
            <>
              <Separator />
              <div>
                <Label htmlFor="remark" className="block text-sm font-semibold mb-2">
                  Add Remark
                </Label>
                <Textarea
                  id="remark"
                  placeholder="Type your response here..."
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="resize-none"
                  disabled={isAddingRemark}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {remarkText.length}/500 characters
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex gap-2 justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {isSuperAdmin && (
            <Button
              onClick={handleAddRemark}
              disabled={isAddingRemark || !remarkText.trim()}
            >
              {isAddingRemark ? 'Adding Remark...' : 'Add Remark'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
