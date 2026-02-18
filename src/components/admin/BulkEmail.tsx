import React, { useState } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Users, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Faculty, College } from '@/lib/storage';
import { useFaculty } from '@/hooks/useCollegeData';
import emailjs from '@emailjs/browser';
import { useToast } from '@/hooks/use-toast';
import { EMAILJS_CONFIG } from '@/lib/emailjs';

interface BulkEmailProps {
  college: College | null;
}

export const BulkEmail: React.FC<BulkEmailProps> = ({ college }) => {
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResults, setSendResults] = useState<{success: number, failed: number, total: number} | null>(null);
  const { toast } = useToast();

  const { data: faculty = [], isLoading } = useFaculty(college?.id);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedFaculty(new Set(faculty.map(f => f.id)));
    } else {
      setSelectedFaculty(new Set());
    }
  };

  const handleSelectFaculty = (facultyId: string, checked: boolean) => {
    const newSelected = new Set(selectedFaculty);
    if (checked) {
      newSelected.add(facultyId);
    } else {
      newSelected.delete(facultyId);
      setSelectAll(false);
    }
    setSelectedFaculty(newSelected);
  };

  const generatePassword = (employeeId: string) => {
    const formatted = employeeId.charAt(0).toUpperCase() + employeeId.slice(1).toLowerCase();
    return `${formatted}@`;
  };

  const handleSendBulkEmail = async () => {
    if (selectedFaculty.size === 0) return;

    setIsSending(true);
    setSendResults(null);

    // EmailJS configuration
    const { SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY } = EMAILJS_CONFIG;

    let successCount = 0;
    let failedCount = 0;

    // Get selected faculty data
    const selectedFacultyData = faculty.filter(f => selectedFaculty.has(f.id));

    try {
      // Send email to each selected faculty member
      for (const member of selectedFacultyData) {
        try {
          const templateParams = {
            employeeId: member.employeeId,
            name: member.name,
            email: member.email,
            password: generatePassword(member.employeeId)
          };

          await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
          successCount++;
        } catch (error) {
          console.error(`Failed to send email to ${member.email}:`, error);
          failedCount++;
        }
      }

      setSendResults({ success: successCount, failed: failedCount, total: selectedFacultyData.length });

      if (successCount > 0) {
        toast({
          title: "Emails Sent Successfully",
          description: `${successCount} out of ${selectedFacultyData.length} emails sent successfully.`,
          variant: successCount === selectedFacultyData.length ? "default" : "destructive",
        });
      }

      if (failedCount > 0) {
        toast({
          title: "Some Emails Failed",
          description: `${failedCount} emails failed to send. Check console for details.`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('EmailJS initialization error:', error);
      toast({
        title: "Email Service Error",
        description: "Failed to initialize email service. Please check your configuration.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      if (successCount > 0) {
        setBulkEmailOpen(false);
        setSelectedFaculty(new Set());
        setSelectAll(false);
      }
    }
  };

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Bulk Email"
        subtitle="Send welcome emails to faculty members"
        college={college}
      />

      <div className="p-6">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-lg font-semibold text-foreground">Faculty Members</h3>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => setBulkEmailOpen(true)}
              disabled={selectedFaculty.size === 0}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Bulk Email ({selectedFaculty.size})
            </Button>
          </div>

          <div className="space-y-4">
            {faculty.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No faculty members found</p>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="select-all-main"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all-main" className="text-sm font-medium">
                    Select All
                  </label>
                </div>
                {/* Headers */}
                <div className="grid grid-cols-12 gap-4 items-center p-4 border-b border-border font-medium text-muted-foreground text-sm">
                  <div className="col-span-1"></div>
                  <div className="col-span-2">Faculty ID</div>
                  <div className="col-span-3">Full Name</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-3">Password</div>
                </div>
                {faculty
                  .sort((a, b) => a.employeeId.localeCompare(b.employeeId))
                  .map((member) => (
                    <div key={member.id} className="grid grid-cols-12 gap-4 items-center p-4 border border-border rounded-lg">
                      <div className="col-span-1">
                        <Checkbox
                          checked={selectedFaculty.has(member.id)}
                          onCheckedChange={(checked) => handleSelectFaculty(member.id, checked as boolean)}
                        />
                      </div>
                      <div className="col-span-2">
                        <p className="font-medium text-foreground">{member.employeeId}</p>
                      </div>
                      <div className="col-span-3">
                        <p className="text-foreground">{member.name}</p>
                      </div>
                      <div className="col-span-3">
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                      <div className="col-span-3">
                        <p className="text-sm text-muted-foreground font-mono">{generatePassword(member.employeeId)}</p>
                      </div>
                    </div>
                  ))}
              </>
            )}
          </div>

          {faculty.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                {selectedFaculty.size} of {faculty.length} faculty selected
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Email Modal */}
      <Dialog open={bulkEmailOpen} onOpenChange={setBulkEmailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Bulk Welcome Email</DialogTitle>
            <DialogDescription>
              Send welcome emails to selected faculty members with their login credentials.
              <br />
              <span className="text-green-600 text-sm mt-2 block">
                ✅ EmailJS is configured and ready to send emails!
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all-modal"
                checked={selectAll}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all-modal" className="text-sm font-medium">
                Select All Faculty ({faculty.length})
              </label>
            </div>

            <div className="border rounded-lg max-h-96 overflow-y-auto">
              <div className="p-4">
                {/* Modal Headers */}
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground border-b pb-2 mb-2">
                  <span>Faculty ID</span>
                  <span>Full Name</span>
                  <span>Email</span>
                  <span>Password</span>
                </div>
                <div className="space-y-2">
                  {faculty.map((member) => (
                    <div key={member.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded">
                      <Checkbox
                        checked={selectedFaculty.has(member.id)}
                        onCheckedChange={(checked) => handleSelectFaculty(member.id, checked as boolean)}
                      />
                      <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                        <span className="font-medium">{member.employeeId}</span>
                        <span>{member.name}</span>
                        <span className="text-muted-foreground">{member.email}</span>
                        <span className="font-mono text-muted-foreground">{generatePassword(member.employeeId)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Welcome Email Template</h4>
              <div className="text-sm space-y-2">
                <p><strong>Subject:</strong> Welcome to INSYT, {'{'}name{'}'}!</p>
                <div className="bg-background p-3 rounded border text-sm">
                  <p><strong>Gryphon Academy</strong></p>
                  <p><em>INSYT • Turn Feedback into Insight</em></p>
                  <br />
                  <p>Dear <strong>{'{'}name{'}'}</strong>,</p>
                  <br />
                  <p>Welcome to INSYT — your private space for feedback and performance analytics. Your account is ready, and we've kept everything simple and secure.</p>
                  <br />
                  <p><strong>🔐 One-time Login</strong></p>
                  <p>Faculty ID: {'{'}employeeId{'}'}</p>
                  <p>Full Name: {'{'}name{'}'}</p>
                  <p>Email: {'{'}email{'}'}</p>
                  <p>Password: {'{'}password{'}'}</p>
                  <br />
                  <p><strong>🛡️ Security Note:</strong> This temporary password is for immediate access only. After signing in, you'll be prompted to set a new one. Please don't share it — we never ask for your password.</p>
                  <br />
                  <p><strong>Open INSYT →</strong></p>
                  <br />
                  <p>If you have any questions, contact us at feedback.support@indiraicem.ac.in</p>
                  <br />
                  <p>Best regards,</p>
                  <p><strong>The Gryphon Academy Team</strong></p>
                  <br />
                  <p><em>Gryphon Academy • INSYT – Turn Feedback into Insight</em></p>
                  <p><em>© 2025 · secure academic platform</em></p>
                  <p><em>This is an automated message from an unmonitored address. Please do not reply directly.</em></p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            {sendResults && (
              <div className="flex items-center gap-4 mr-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">{sendResults.success} sent</span>
                </div>
                {sendResults.failed > 0 && (
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">{sendResults.failed} failed</span>
                  </div>
                )}
              </div>
            )}
            <Button variant="outline" onClick={() => setBulkEmailOpen(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button
              onClick={handleSendBulkEmail}
              disabled={selectedFaculty.size === 0 || isSending}
              className="bg-primary hover:bg-primary/90"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending... ({selectedFaculty.size})
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email ({selectedFaculty.size})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};