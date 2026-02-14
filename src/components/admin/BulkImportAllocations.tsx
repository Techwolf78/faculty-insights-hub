import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { facultyAllocationsApi } from '@/lib/storage';
import { Upload, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface AllocationData {
  'Full Name *': string;
  'Program *': string;
  'Year *': string;
  'Department *': string;
  'Subjects *': string;
  'Subject Code*': string;
  'Subject Type*': string;
  'Specialization'?: string;
}

interface BulkImportAllocationsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collegeId: string;
  onSuccess: () => void;
}

interface ImportResult {
  success: number;
  errors: string[];
}

const BulkImportAllocations: React.FC<BulkImportAllocationsProps> = ({
  open,
  onOpenChange,
  collegeId,
  onSuccess,
}) => {
  const [jsonData, setJsonData] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleLoadSampleData = () => {
    const sampleData = [
      {
        "Full Name *": "Dr. Priyanka Pawar",
        "Program *": "MBA",
        "Year *": "1",
        "Department *": "Marketing Management",
        "Subjects *": "Marketing Management",
        "Subject Code*": "GC–09",
        "Subject Type*": "Theory",
        "Specialization": "Marketing Management"
      },
      {
        "Full Name *": "Dr. Priyanka Pawar",
        "Program *": "MBA",
        "Year *": "",  // This will cause an error
        "Department *": "Marketing Management",
        "Subjects *": "Digital Marketing-I",
        "Subject Code*": "",  // This will cause an error
        "Subject Type*": "Theory",
        "Specialization": "Marketing Management"
      },
      {
        "Full Name *": "Dr. Priyanka Pawar",
        "Program *": "MBA",
        "Year *": "2",
        "Department *": "Computer Engineering",
        "Subjects *": "Audit Course (Social Responsibility)",
        "Subject Code*": "AUDIT-001",
        "Subject Type*": "Tutorial",
        "Specialization": "Marketing Management"
      }
    ];
    setJsonData(JSON.stringify(sampleData, null, 2));
    setValidationErrors([]);
    setImportResult(null);
  };

  const validateData = (data: AllocationData[]): string[] => {
    const errors: string[] = [];

    if (!Array.isArray(data)) {
      errors.push('Data must be an array of allocation objects');
      return errors;
    }

    data.forEach((item, index) => {
      const itemNumber = index + 1;
      if (typeof item !== 'object' || item === null) {
        errors.push(`Item ${itemNumber}: Must be an object`);
        return;
      }

      const requiredFields = [
        'Full Name *',
        'Program *',
        'Year *',
        'Department *',
        'Subjects *',
        'Subject Code*',
        'Subject Type*'
      ];

      for (const field of requiredFields) {
        if (!item[field] || typeof item[field] !== 'string' || item[field].trim() === '') {
          errors.push(`Item ${itemNumber} (${field}): Missing or invalid value`);
        }
      }

      if (item['Subject Type*'] && !['Theory', 'Practical', 'Tutorial'].includes(item['Subject Type*'])) {
        errors.push(`Item ${itemNumber} (Subject Type*): Must be 'Theory', 'Practical', or 'Tutorial' (found: "${item['Subject Type*']}")`);
      }
    });

    return errors;
  };

  const handleImport = async () => {
    if (!jsonData.trim()) {
      toast.error('Please provide JSON data');
      return;
    }

    try {
      const data = JSON.parse(jsonData);
      const errors = validateData(data);

      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      setValidationErrors([]);
      setIsImporting(true);

      // Transform data to match API expectations
      const transformedData = data.map((item: AllocationData) => ({
        facultyName: item['Full Name *'],
        course: item['Program *'],
        year: item['Year *'],
        department: item['Department *'],
        subjectName: item['Subjects *'],
        subjectCode: item['Subject Code*'],
        subjectType: item['Subject Type*'] as 'Theory' | 'Practical' | 'Tutorial'
      }));

      const result = await facultyAllocationsApi.bulkImportAllocations(collegeId, transformedData);
      setImportResult(result);

      if (result.success > 0) {
        toast.success(`Successfully imported ${result.success} allocations`);
        onSuccess();
      }

      if (result.errors.length > 0) {
        toast.error(`Import completed with ${result.errors.length} errors`);
      }

    } catch (error) {
      console.error('Import error:', error);
      toast.error('Invalid JSON format');
      setValidationErrors(['Invalid JSON format']);
    } finally {
      setIsImporting(false);
    }
  };

  const scrollToError = (itemIndex: number) => {
    const textarea = document.getElementById('jsonData') as HTMLTextAreaElement;
    if (!textarea) return;

    try {
      // Find all positions of "Full Name *" in the JSON
      const searchTerm = '"Full Name *"';
      const positions: number[] = [];
      let pos = jsonData.indexOf(searchTerm);

      while (pos !== -1) {
        positions.push(pos);
        pos = jsonData.indexOf(searchTerm, pos + 1);
      }

      if (positions[itemIndex] !== undefined) {
        const targetPosition = positions[itemIndex];

        // Find the line number for this position
        const lines = jsonData.substring(0, targetPosition).split('\n');
        const lineNumber = lines.length - 1;

        // Scroll to this line
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
        const scrollTop = lineNumber * lineHeight;

        textarea.scrollTop = Math.max(0, scrollTop - 100); // Scroll a bit above
        textarea.focus();

        // Highlight the textarea
        textarea.style.boxShadow = '0 0 0 2px #ef4444';
        setTimeout(() => {
          textarea.style.boxShadow = '';
        }, 3000);

        // Set cursor position
        textarea.setSelectionRange(targetPosition, targetPosition + searchTerm.length);
      }

    } catch (error) {
      console.error('Error scrolling to item:', error);
      textarea.focus();
    }
  };

  const resetForm = () => {
    setJsonData('');
    setValidationErrors([]);
    setImportResult(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Import Faculty Allocations
          </DialogTitle>
          <DialogDescription>
            Import faculty allocations from JSON data. Each allocation should include faculty name, course, year, department, and subject details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="jsonData">JSON Data</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadSampleData}
              >
                Load Sample Data
              </Button>
            </div>
            <Textarea
              id="jsonData"
              placeholder="Paste your JSON data here..."
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Validation Errors ({validationErrors.length}):</div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Scroll to first error
                        const firstError = validationErrors[0];
                        const match = firstError.match(/Item (\d+)/);
                        if (match) {
                          scrollToError(parseInt(match[1]) - 1);
                        }
                      }}
                      className="text-xs"
                    >
                      Go to First Error
                    </Button>
                    <span className="text-xs text-muted-foreground">Click errors to jump to location</span>
                  </div>
                </div>
                <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                  {validationErrors.map((error, index) => {
                    const match = error.match(/Item (\d+)/);
                    const itemIndex = match ? parseInt(match[1]) - 1 : -1;

                    return (
                      <li key={index} className="text-sm">
                        {itemIndex >= 0 ? (
                          <button
                            type="button"
                            onClick={() => scrollToError(itemIndex)}
                            className="text-left hover:underline hover:text-red-300 transition-colors cursor-pointer w-full text-wrap"
                            title="Click to jump to this error in the JSON data"
                          >
                            {error}
                          </button>
                        ) : (
                          error
                        )}
                      </li>
                    );
                  })}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {importResult && (
            <Alert variant={importResult.errors.length > 0 ? "destructive" : "default"}>
              {importResult.errors.length > 0 ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="font-medium mb-2">Import Results:</div>
                <div className="text-sm space-y-1">
                  <div>✅ Successfully imported: {importResult.success} allocations</div>
                  {importResult.errors.length > 0 && (
                    <div>
                      <div className="font-medium text-red-600">Errors ({importResult.errors.length}):</div>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {importResult.errors.map((error, index) => (
                          <li key={index} className="text-red-600">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={isImporting || !jsonData.trim()}
          >
            {isImporting ? 'Importing...' : 'Import Allocations'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportAllocations;