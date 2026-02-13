import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { questionsApi, questionGroupsApi, QuestionGroup } from '@/lib/storage';
import { toast } from 'sonner';

interface QuestionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ open, onOpenChange, onSuccess }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const [formData, setFormData] = useState({
    groupId: '',
    category: '',
    text: '',
    responseType: 'rating' as 'rating' | 'text' | 'both' | 'select' | 'boolean',
    required: true,
    order: '',
    options: '',
  });

  useEffect(() => {
    if (open && user?.collegeId) {
      questionGroupsApi.getByCollege(user.collegeId).then(setQuestionGroups).catch(console.error);
    }
  }, [open, user?.collegeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.groupId || !formData.category.trim() || !formData.text.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.responseType === 'select' && !formData.options.trim()) {
      toast.error('Please provide options for select type questions');
      return;
    }

    if (!user?.collegeId) {
      toast.error('College information not found');
      return;
    }

    setIsLoading(true);
    try {
      const options = formData.responseType === 'select'
        ? formData.options.split(',').map(s => s.trim()).filter(s => s)
        : undefined;

      await questionsApi.create({
        collegeId: user.collegeId,
        groupId: formData.groupId,
        category: formData.category.trim(),
        text: formData.text.trim(),
        responseType: formData.responseType,
        required: formData.required,
        order: parseInt(formData.order) || 0,
        categoryOrder: 0, // Default category order
        isActive: true, // Default to active
        options,
      });

      toast.success('Question added successfully');
      setFormData({
        groupId: '',
        category: '',
        text: '',
        responseType: 'rating',
        required: true,
        order: '',
        options: '',
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error('Failed to add question');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      groupId: '',
      category: '',
      text: '',
      responseType: 'rating',
      required: true,
      order: '',
      options: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Question</DialogTitle>
          <DialogDescription>
            Create a new feedback question for your college. Choose the appropriate response type and settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="groupId" className="text-right">
                Question Group *
              </Label>
              <Select 
                value={formData.groupId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, groupId: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select question group" />
                </SelectTrigger>
                <SelectContent>
                  {questionGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category *
              </Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., Teaching Effectiveness, Course Content"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="text" className="text-right">
                Question Text *
              </Label>
              <Input
                id="text"
                value={formData.text}
                onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., How would you rate the instructor's teaching effectiveness?"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="responseType" className="text-right">
                Response Type *
              </Label>
              <Select
                value={formData.responseType}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, responseType: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Rating Scale (1-5)</SelectItem>
                  <SelectItem value="text">Text Response</SelectItem>
                  <SelectItem value="both">Rating + Text</SelectItem>
                  <SelectItem value="select">Multiple Choice</SelectItem>
                  <SelectItem value="boolean">Yes/No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.responseType === 'select' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="options" className="text-right">
                  Options *
                </Label>
                <Input
                  id="options"
                  value={formData.options}
                  onChange={(e) => setFormData(prev => ({ ...prev, options: e.target.value }))}
                  className="col-span-3"
                  placeholder="e.g., Excellent, Good, Average, Poor (comma-separated)"
                  required
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="order" className="text-right">
                Order
              </Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., 1"
                min="0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Required
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="required"
                  checked={formData.required}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, required: checked as boolean }))}
                />
                <Label htmlFor="required" className="text-sm text-muted-foreground">
                  This question must be answered
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Question'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionForm;