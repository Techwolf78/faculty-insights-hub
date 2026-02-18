import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { HelpTicket } from '@/lib/storage';

interface TicketFormData {
  title: string;
  description: string;
  category: HelpTicket['category'];
  priority: HelpTicket['priority'];
}

interface TicketFormProps {
  onSubmit: (ticket: TicketFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export const TicketForm: React.FC<TicketFormProps> = ({ onSubmit, isSubmitting = false }) => {
  const [formData, setFormData] = useState<TicketFormData>({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    try {
      await onSubmit(formData);
      setFormData({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium',
      });
      toast.success('Ticket created successfully');
    } catch (error) {
      toast.error('Failed to create ticket');
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title Field */}
      <div>
        <Label htmlFor="title" className="text-base font-semibold">
          Ticket Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Brief description of your issue"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          maxLength={100}
          className="mt-2"
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {formData.title.length}/100 characters
        </p>
      </div>

      {/* Description Field */}
      <div>
        <Label htmlFor="description" className="text-base font-semibold">
          Detailed Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Provide detailed information about your issue, including steps to reproduce if applicable"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          maxLength={1000}
          rows={6}
          className="mt-2 resize-none"
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {formData.description.length}/1000 characters
        </p>
      </div>

      {/* Category and Priority Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Category Field */}
        <div>
          <Label htmlFor="category" className="text-base font-semibold">
            Category <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData({ ...formData, category: value as HelpTicket['category'] })
            }
            disabled={isSubmitting}
          >
            <SelectTrigger id="category" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bug">Bug Report</SelectItem>
              <SelectItem value="feature">Feature Request</SelectItem>
              <SelectItem value="help">Help/Support</SelectItem>
              <SelectItem value="general">General Inquiry</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Priority Field */}
        <div>
          <Label htmlFor="priority" className="text-base font-semibold">
            Priority <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.priority}
            onValueChange={(value) =>
              setFormData({ ...formData, priority: value as HelpTicket['priority'] })
            }
            disabled={isSubmitting}
          >
            <SelectTrigger id="priority" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating Ticket...' : 'Create Support Ticket'}
      </Button>
    </form>
  );
};
