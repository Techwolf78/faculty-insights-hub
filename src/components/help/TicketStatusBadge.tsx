import { Badge } from '@/components/ui/badge';
import { HelpTicket } from '@/lib/storage';
import {
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getCategoryColor,
} from '@/lib/ticketColors';

interface TicketStatusBadgeProps {
  status: HelpTicket['status'];
}

export const TicketStatusBadge: React.FC<TicketStatusBadgeProps> = ({ status }) => {
  return (
    <Badge variant={getStatusColor(status)}>
      {getStatusLabel(status)}
    </Badge>
  );
};

interface TicketPriorityBadgeProps {
  priority: HelpTicket['priority'];
}

export const TicketPriorityBadge: React.FC<TicketPriorityBadgeProps> = ({ priority }) => {
  return (
    <Badge variant={getPriorityColor(priority)}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
};

interface TicketCategoryBadgeProps {
  category: HelpTicket['category'];
}

export const TicketCategoryBadge: React.FC<TicketCategoryBadgeProps> = ({ category }) => {
  return (
    <Badge variant={getCategoryColor(category)}>
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </Badge>
  );
};
