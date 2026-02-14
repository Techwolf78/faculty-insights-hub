import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { facultyApi } from '@/lib/storage';

// Interface for bulk faculty creation data
interface BulkCreateFacultyData {
  name: string;
  email: string;
  password: string;
  role: 'faculty' | 'hod';
  designation?: string;
  specialization?: string;
  highestQualification?: string;
  experience?: number;
  phone?: string;
}

interface BulkCreateFacultyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collegeId: string;
  onSuccess: () => void;
}

const BulkCreateFaculty: React.FC<BulkCreateFacultyProps> = ({
  open,
  onOpenChange,
  collegeId,
  onSuccess,
}) => {
  const [jsonData, setJsonData] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleLoadDummyData = () => {
    const dummyData = [
      {
        "name": "Dr. John Smith",
        "email": "john.smith@college.edu",
        "password": "John@123",
        "role": "faculty",
        "designation": "Assistant Professor",
        "specialization": "Machine Learning",
        "highestQualification": "PhD in Computer Science",
        "experience": 5,
        "phone": "+91-9876543210"
      },
      {
        "name": "Dr. Sarah Johnson",
        "email": "sarah.johnson@college.edu",
        "password": "Sarah@123",
        "role": "hod",
        "designation": "Professor",
        "specialization": "Data Structures",
        "highestQualification": "PhD in Computer Science",
        "experience": 12,
        "phone": "+91-9876543211"
      },
      {
        "name": "Prof. Michael Chen",
        "email": "michael.chen@college.edu",
        "password": "Michael@123",
        "role": "faculty",
        "designation": "Associate Professor",
        "specialization": "Artificial Intelligence",
        "highestQualification": "PhD in Artificial Intelligence",
        "experience": 8,
        "phone": "+91-9876543212"
      },
      {
        "name": "Dr. Emily Davis",
        "email": "emily.davis@college.edu",
        "password": "Emily@123",
        "role": "faculty",
        "designation": "Assistant Professor",
        "specialization": "Database Systems",
        "highestQualification": "PhD in Database Management",
        "experience": 3,
        "phone": "+91-9876543213"
      },
      {
        "name": "Dr. Robert Wilson",
        "email": "robert.wilson@college.edu",
        "password": "Robert@123",
        "role": "hod",
        "designation": "Professor",
        "specialization": "Computer Networks",
        "highestQualification": "PhD in Computer Networks",
        "experience": 15,
        "phone": "+91-9876543214"
      },
      {
        "name": "Ms. Lisa Anderson",
        "email": "lisa.anderson@college.edu",
        "password": "Lisa@123",
        "role": "faculty",
        "designation": "Lecturer",
        "specialization": "Web Development",
        "highestQualification": "M.Tech in Computer Science",
        "experience": 2,
        "phone": "+91-9876543215"
      },
      {
        "name": "Dr. David Brown",
        "email": "david.brown@college.edu",
        "password": "David@123",
        "role": "faculty",
        "designation": "Assistant Professor",
        "specialization": "Cybersecurity",
        "highestQualification": "PhD in Cybersecurity",
        "experience": 6,
        "phone": "+91-9876543216"
      },
      {
        "name": "Prof. Jennifer Lee",
        "email": "jennifer.lee@college.edu",
        "password": "Jennifer@123",
        "role": "faculty",
        "designation": "Associate Professor",
        "specialization": "Software Engineering",
        "highestQualification": "PhD in Software Engineering",
        "experience": 10,
        "phone": "+91-9876543217"
      }
    ];
    setJsonData(JSON.stringify(dummyData, null, 2));
    setValidationErrors([]);
  };

  const handleCreateFaculty = async () => {
    if (!jsonData.trim()) {
      setValidationErrors(['Please enter JSON data']);
      return;
    }

    try {
      const parsedData = JSON.parse(jsonData);

      if (!Array.isArray(parsedData)) {
        setValidationErrors(['JSON data must be an array of faculty objects']);
        return;
      }

      if (parsedData.length === 0) {
        setValidationErrors(['JSON array cannot be empty']);
        return;
      }

      // Validate each faculty object comprehensively
      const errors: string[] = [];
      const emails = new Set<string>();

      for (let i = 0; i < parsedData.length; i++) {
        const faculty = parsedData[i];

        // Basic field validations
        if (!faculty.name || typeof faculty.name !== 'string' || !faculty.name.trim()) {
          errors.push(`Faculty ${i + 1}: Name is required`);
        }
        if (!faculty.email || typeof faculty.email !== 'string' || !faculty.email.trim()) {
          errors.push(`Faculty ${i + 1}: Email is required`);
        } else {
          // Check for duplicate emails within the batch
          const email = faculty.email.toLowerCase().trim();
          if (emails.has(email)) {
            errors.push(`Faculty ${i + 1}: Email "${faculty.email}" is duplicated in the batch`);
          } else {
            emails.add(email);
          }
        }
        if (!faculty.password || typeof faculty.password !== 'string' || !faculty.password.trim()) {
          errors.push(`Faculty ${i + 1}: Password is required`);
        }
        if (!faculty.role || !['faculty', 'hod'].includes(faculty.role)) {
          errors.push(`Faculty ${i + 1}: Role must be "faculty" or "hod"`);
        }
      }

      // If any validation errors found, stop here and don't proceed
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      // Clear validation errors
      setValidationErrors([]);

      // Show loading state
      toast.loading('Validating and creating faculty members...', { id: 'bulk-create' });

      // Additional backend validation - check for existing emails
      try {
        const existingFaculty = await facultyApi.getByCollege(collegeId);
        const existingEmails = new Set(existingFaculty.map(f => f.email.toLowerCase()));

        const duplicateErrors: string[] = [];
        parsedData.forEach((faculty: BulkCreateFacultyData, index: number) => {
          if (existingEmails.has(faculty.email.toLowerCase().trim())) {
            duplicateErrors.push(`Faculty ${index + 1}: Email "${faculty.email}" already exists in the system`);
          }
        });

        if (duplicateErrors.length > 0) {
          setValidationErrors(duplicateErrors);
          toast.dismiss('bulk-create');
          return;
        }
      } catch (error) {
        console.error('Error checking existing faculty:', error);
        toast.error('Failed to validate existing faculty data', { id: 'bulk-create' });
        return;
      }

      // All validations passed - proceed with bulk creation
      // Since we validated everything upfront, this should succeed completely or fail completely
      const result = await facultyApi.bulkCreate(parsedData, collegeId);

      if (result.success.length === parsedData.length) {
        // All faculty members created successfully
        toast.success(`Successfully created ${result.success.length} faculty member(s)`, { id: 'bulk-create' });

        // Close dialog and reset
        onOpenChange(false);
        setJsonData('');
        onSuccess();
      } else {
        // This should not happen with our validation, but handle it just in case
        const errorMessages = result.errors.map(err =>
          `Faculty ${err.index + 1}: ${err.error}`
        );
        setValidationErrors(errorMessages);
        toast.error(`Failed to create faculty members. No faculty were created.`, { id: 'bulk-create' });
      }

    } catch (error: unknown) {
      console.error('JSON parsing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setValidationErrors([`Invalid JSON format: ${errorMessage}`]);
      toast.dismiss('bulk-create');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setJsonData('');
    setValidationErrors([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Create Faculty</DialogTitle>
          <DialogDescription>
            Paste JSON data to create multiple faculty members at once. <strong>All faculty data must be valid - if any faculty member has errors, none will be created.</strong> The system will auto-generate faculty IDs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="json-input" className="text-sm font-medium">
              Faculty Data (JSON)
            </Label>
            <Textarea
              id="json-input"
              placeholder={`[
  {
    "name": "Dr. John Smith",
    "email": "john.smith@college.edu",
    "password": "John@123",
    "role": "faculty",
    "designation": "Assistant Professor",
    "specialization": "Machine Learning",
    "highestQualification": "PhD in Computer Science",
    "experience": 5,
    "phone": "+91-9876543210"
  },
  {
    "name": "Dr. Sarah Johnson",
    "email": "sarah.johnson@college.edu",
    "password": "Sarah@123",
    "role": "hod",
    "designation": "Professor",
    "specialization": "Data Structures",
    "highestQualification": "PhD in Computer Science",
    "experience": 12
  }
]`}
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          {validationErrors.length > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <h4 className="text-sm font-medium text-destructive mb-2">Validation Errors:</h4>
              <ul className="text-sm text-destructive space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p><strong>Required fields:</strong> name, email, password, role</p>
            <p><strong>Role options:</strong> "faculty" or "hod"</p>
            <p><strong>Auto-generated:</strong> Faculty ID (FAC001, FAC002, etc.)</p>
            <p><strong>Important:</strong> All faculty data must be valid. If any faculty member has errors, none will be created.</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleLoadDummyData}
          >
            Load Dummy Data
          </Button>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateFaculty}
            disabled={!jsonData.trim()}
          >
            Create Faculty
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkCreateFaculty;