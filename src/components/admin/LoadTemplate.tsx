import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Building2, BookOpen, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { saveAcademicConfig } from '@/lib/academicConfig';
import { icemDefaultCourseData, icemDefaultSubjectsData, igsbDefaultCourseData, igsbDefaultSubjectsData } from '@/lib/academicConfig';

interface LoadTemplateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const LoadTemplate: React.FC<LoadTemplateProps> = ({ open, onOpenChange, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const templates = [
    {
      id: 'icem',
      name: 'ICEM Template',
      description: 'Engineering-focused academic structure with B.E, M.Tech, MCA, MBA programs',
      icon: <GraduationCap className="h-8 w-8 text-blue-600" />,
      courseData: icemDefaultCourseData,
      subjectsData: icemDefaultSubjectsData,
      stats: {
        courses: Object.keys(icemDefaultCourseData).length,
        departments: 5,
        subjects: '150+'
      }
    },
    {
      id: 'igsb',
      name: 'IGSB Template',
      description: 'Business-focused academic structure with MBA, BBA programs',
      icon: <Building2 className="h-8 w-8 text-green-600" />,
      courseData: igsbDefaultCourseData,
      subjectsData: igsbDefaultSubjectsData,
      stats: {
        courses: Object.keys(igsbDefaultCourseData).length,
        departments: 5,
        subjects: '80+'
      }
    }
  ];

  const handleLoadTemplate = async () => {
    if (!user?.collegeId || !selectedTemplate) return;

    setLoading(true);
    try {
      const template = templates.find(t => t.id === selectedTemplate);
      if (!template) {
        toast.error('Template not found');
        return;
      }

      const success = await saveAcademicConfig(
        user.collegeId,
        template.courseData,
        template.subjectsData
      );

      if (success) {
        toast.success(`${template.name} loaded successfully! You can now edit and customize the structure.`);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error('Failed to load template');
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Load Academic Template
          </DialogTitle>
          <DialogDescription>
            Choose a pre-configured academic template to quickly set up your institution's structure.
            You can customize it after loading.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTemplate === template.id
                  ? 'ring-2 ring-primary border-primary'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {template.icon}
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                  </div>
                  {selectedTemplate === template.id && (
                    <Badge variant="default" className="bg-primary">
                      Selected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-primary">{template.stats.courses}</div>
                    <div className="text-xs text-muted-foreground">Courses</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-primary">{template.stats.departments}</div>
                    <div className="text-xs text-muted-foreground">Departments</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-primary">{template.stats.subjects}</div>
                    <div className="text-xs text-muted-foreground">Subjects</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium text-sm mb-2">What happens when you load a template?</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Pre-configured courses, years, departments, and subjects are added</li>
            <li>• You can edit, add, or remove any part of the structure</li>
            <li>• Existing academic configuration will be replaced</li>
            <li>• Template serves as a starting point for customization</li>
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleLoadTemplate}
            disabled={!selectedTemplate || loading}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? 'Loading...' : 'Load Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoadTemplate;