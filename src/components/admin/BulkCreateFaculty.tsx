import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { facultyApi, type BulkCreateFacultyData, type BulkStatus } from '@/lib/storage';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Info, ChevronRight, RefreshCcw } from 'lucide-react';
import { cn } from "@/lib/utils";

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
  const [step, setStep] = useState<'input' | 'processing' | 'report'>('input');
  const [batchResults, setBatchResults] = useState<BulkStatus[]>([]);
  const [summary, setSummary] = useState({ total: 0, success: 0, failed: 0 });
  const [isRetrying, setIsRetrying] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the log
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [batchResults]);

  const handleLoadDummyData = () => {
    const dummyData = [
      {
        "name": "Dr. John Smith",
        "email": "john.smith@college.edu",
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
        "role": "hod",
        "designation": "Professor",
        "specialization": "Data Structures",
        "highestQualification": "PhD in Computer Science",
        "experience": 12,
        "phone": "+91-9876543211"
      }
    ];
    setJsonData(JSON.stringify(dummyData, null, 2));
    setValidationErrors([]);
  };

  const validateJson = (data: BulkCreateFacultyData[]): string[] => {
    if (!Array.isArray(data)) return ['JSON data must be an array of faculty objects'];
    if (data.length === 0) return ['JSON array cannot be empty'];

    const errors: string[] = [];
    const emails = new Set<string>();

    data.forEach((faculty, i) => {
      if (!faculty.name?.trim()) errors.push(`Faculty ${i + 1}: Name is required`);
      if (!faculty.email?.trim()) {
        errors.push(`Faculty ${i + 1}: Email is required`);
      } else {
        const email = faculty.email.toLowerCase().trim();
        if (emails.has(email)) {
          errors.push(`Faculty ${i + 1}: Email "${faculty.email}" is duplicated in the batch`);
        } else {
          emails.add(email);
        }
      }
      if (!faculty.role || !['faculty', 'hod'].includes(faculty.role)) {
        errors.push(`Faculty ${i + 1}: Role must be "faculty" or "hod"`);
      }
    });

    return errors;
  };

  const handleCreateFaculty = async (customData?: BulkCreateFacultyData[]) => {
    let parsedData: BulkCreateFacultyData[] = [];
    
    if (customData) {
      parsedData = customData;
    } else {
      if (!jsonData.trim()) {
        setValidationErrors(['Please enter JSON data']);
        return;
      }
      try {
        parsedData = JSON.parse(jsonData);
        const errors = validateJson(parsedData);
        if (errors.length > 0) {
          setValidationErrors(errors);
          return;
        }
      } catch (error: unknown) {
        setValidationErrors([`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`]);
        return;
      }
    }

    setValidationErrors([]);
    setStep('processing');
    setBatchResults([]);
    setSummary({ total: parsedData.length, success: 0, failed: 0 });

    try {
      const result = await facultyApi.bulkCreate(
        parsedData, 
        collegeId,
        (status: BulkStatus) => {
          setBatchResults(prev => {
            const index = prev.findIndex(item => item.index === status.index);
            if (index >= 0) {
              const newResults = [...prev];
              newResults[index] = status;
              return newResults;
            }
            return [...prev, status];
          });
        }
      );

      setSummary(result.summary);
      setStep('report');
      if (result.summary.success > 0) onSuccess();
      
      if (result.summary.failed === 0) {
        toast.success(`Successfully created ${result.summary.success} faculty members`);
      } else {
        toast.error(`Completed with ${result.summary.failed} errors`);
      }
    } catch (error: unknown) {
      console.error('Bulk creation failed:', error);
      setStep('report');
      toast.error('Bulk creation process failed');
    }
  };

  const handleRetryFailures = async () => {
    const failedItems = batchResults.filter(r => 
      r.authStatus === 'failed' || 
      r.firestoreUserStatus === 'failed' || 
      r.firestoreFacultyStatus === 'failed'
    );

    if (failedItems.length === 0) return;

    // Map results back to request data, including userId if auth succeeded but firestore failed
    const originalRequestData: BulkCreateFacultyData[] = JSON.parse(jsonData);
    const retryData: BulkCreateFacultyData[] = failedItems.map(item => {
      const original = originalRequestData.find(o => o.email.toLowerCase() === item.email.toLowerCase());
      return {
        ...original!,
        userId: (item.authStatus === 'success' || item.authStatus === 'skipped') ? item.userId : undefined
      };
    });

    setIsRetrying(true);
    await handleCreateFaculty(retryData);
    setIsRetrying(false);
  };

  const handleClose = () => {
    if (step === 'processing') return; // Don't close while processing
    onOpenChange(false);
    setJsonData('');
    setValidationErrors([]);
    setStep('input');
    setBatchResults([]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'failed': return <XCircle className="h-3 w-3 text-destructive" />;
      case 'pending': return <Loader2 className="h-3 w-3 animate-spin text-primary" />;
      case 'skipped': return <Info className="h-3 w-3 text-muted-foreground" />;
      case 'exists': return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "transition-all duration-300",
        step === 'input' ? "max-w-4xl" : "max-w-2xl"
      )}>
        <DialogHeader>
          <DialogTitle>
            {step === 'input' && "Bulk Create Faculty"}
            {step === 'processing' && "Creating Faculty Members..."}
            {step === 'report' && "Bulk Creation Report"}
          </DialogTitle>
          <DialogDescription>
            {step === 'input' && "Paste JSON data to create multiple faculty members at once."}
            {step === 'processing' && `Processing ${batchResults.length} of ${summary.total} faculty members.`}
            {step === 'report' && "Summary of the bulk creation process. You can retry failed items if needed."}
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="json-input" className="text-sm font-medium">
                Faculty Data (JSON Array)
              </Label>
              <Textarea
                id="json-input"
                placeholder={`[`}
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                className="min-h-[300px] font-mono text-xs"
              />
            </div>

            {validationErrors.length > 0 && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <h4 className="text-sm font-medium text-destructive mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Validation Errors:
                </h4>
                <ScrollArea className="h-20">
                  <ul className="text-xs text-destructive space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-[10px] text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
              <div>
                <p className="font-semibold text-foreground mb-1">Required Schema:</p>
                <p>• name: Full Name (string)</p>
                <p>• email: Official Email (string)</p>
                <p>• role: "faculty" or "hod"</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Optional Fields:</p>
                <p>• designation, specialization</p>
                <p>• highestQualification, experience</p>
                <p>• phone</p>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Progress</span>
                <span>{summary.total > 0 ? Math.round((batchResults.length / summary.total) * 100) : 0}%</span>
              </div>
              <Progress value={summary.total > 0 ? (batchResults.length / summary.total) * 100 : 0} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                Currently processing: {batchResults[batchResults.length - 1]?.name || 'Starting...'}
              </p>
            </div>

            <div className="border rounded-lg bg-black/5 dark:bg-white/5 p-4">
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {batchResults.map((res, i) => (
                    <div key={i} className="flex flex-col gap-1 text-xs border-b border-border/20 pb-2 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate max-w-[200px]">{res.name}</span>
                        <div className="flex gap-3">
                          <span className="flex items-center gap-1">
                            {getStatusIcon(res.authStatus)}
                            <span className="opacity-70">Auth</span>
                          </span>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(res.firestoreUserStatus)}
                            <span className="opacity-70">UserDoc</span>
                          </span>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(res.firestoreFacultyStatus)}
                            <span className="opacity-70">FacDoc</span>
                          </span>
                        </div>
                      </div>
                      {res.error && (
                        <p className="text-[10px] text-destructive italic">{res.error}</p>
                      )}
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {step === 'report' && (
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl text-center">
                <p className="text-2xl font-bold text-primary">{summary.total}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
              </div>
              <div className="bg-green-500/5 border border-green-500/20 p-4 rounded-xl text-center">
                <p className="text-2xl font-bold text-green-600">{summary.success}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Success</p>
              </div>
              <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-xl text-center">
                <p className="text-2xl font-bold text-destructive">{summary.failed}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Failed</p>
              </div>
            </div>

            <div className="border rounded-xl p-0 overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b text-xs font-semibold flex justify-between">
                <span>FACULTY STATUS</span>
                <span>AUTH | USER | FAC</span>
              </div>
              <ScrollArea className="h-[250px]">
                <div className="divide-y">
                  {batchResults.map((res, i) => (
                    <div key={i} className="px-4 py-3 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{res.name}</span>
                          <span className="text-[10px] text-muted-foreground">{res.email}</span>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={res.authStatus === 'success' || res.authStatus === 'exists' ? "secondary" : "destructive"} className="h-5 text-[10px]">
                            {res.authStatus === 'success' ? 'Auth ✓' : res.authStatus === 'exists' ? 'Exists ✓' : 'Auth ✗'}
                          </Badge>
                          <Badge variant={res.firestoreFacultyStatus === 'success' ? "secondary" : "destructive"} className="h-5 text-[10px]">
                            {res.firestoreFacultyStatus === 'success' ? 'Firestore ✓' : 'Firestore ✗'}
                          </Badge>
                        </div>
                      </div>
                      {res.error && (
                        <div className="flex items-start gap-1 p-2 bg-destructive/5 rounded border border-destructive/10 mt-1">
                          <AlertCircle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                          <p className="text-[10px] text-destructive leading-tight">{res.error}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 'input' && (
            <>
              <Button variant="ghost" className="mr-auto text-xs" onClick={handleLoadDummyData}>
                Load Dummy Data
              </Button>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={() => handleCreateFaculty()}>
                Start Bulk Creation
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}

          {step === 'processing' && (
            <Button disabled className="w-full">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </Button>
          )}

          {step === 'report' && (
            <>
              <Button variant="outline" onClick={() => setStep('input')}>
                Back to Editor
              </Button>
              {summary.failed > 0 && (
                <Button 
                  className="bg-primary hover:bg-primary/90" 
                  onClick={handleRetryFailures}
                  disabled={isRetrying}
                >
                  {isRetrying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
                  Retry Failures
                </Button>
              )}
              <Button onClick={handleClose}>
                Done
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkCreateFaculty;
