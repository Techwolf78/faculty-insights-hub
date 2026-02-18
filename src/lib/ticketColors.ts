import { HelpTicket } from '@/lib/storage';

export const getStatusColor = (status: HelpTicket['status']): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'open':
      return 'destructive';
    case 'in-progress':
      return 'default';
    case 'on-hold':
      return 'secondary';
    case 'pending-info':
      return 'secondary';
    case 'resolved':
      return 'destructive'; // Use success-like color
    case 'rejected':
      return 'destructive';
    case 'closed':
      return 'outline';
    default:
      return 'default';
  }
};

export const getStatusLabel = (status: HelpTicket['status']): string => {
  const labels: Record<HelpTicket['status'], string> = {
    'open': 'Open',
    'in-progress': 'In Progress',
    'on-hold': 'On Hold',
    'pending-info': 'Pending Info',
    'resolved': 'Resolved',
    'rejected': 'Rejected',
    'closed': 'Closed',
  };
  return labels[status];
};

export const getPriorityColor = (priority: HelpTicket['priority']): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (priority) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'default';
  }
};

export const getCategoryColor = (category: HelpTicket['category']): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (category) {
    case 'bug':
      return 'destructive';
    case 'feature':
      return 'default';
    case 'help':
      return 'secondary';
    case 'general':
      return 'outline';
    default:
      return 'default';
  }
};
