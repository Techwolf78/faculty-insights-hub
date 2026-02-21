import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { feedbackSessionsApi, facultyApi, departmentsApi, FeedbackSession, Faculty, Department, isSessionActive, isSessionExpired } from '@/lib/storage';
import { Edit, ExternalLink, Copy, Trash2, Eye, Share, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { QRCodeCanvas } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageCircle } from 'lucide-react';

interface SessionTableProps {
  sessions: FeedbackSession[];
  faculty: Faculty[];
  departments: Department[];
  onEdit?: (session: FeedbackSession) => void;
  onRefresh?: () => void;
  onOptimisticUpdate?: (sessionId: string, updates: Partial<FeedbackSession>) => void;
}

export const SessionTable: React.FC<SessionTableProps> = ({
  sessions,
  faculty,
  departments,
  onEdit,
  onRefresh,
  onOptimisticUpdate
}) => {
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [shareSession, setShareSession] = useState<FeedbackSession | null>(null);

  const handleToggleActive = async (session: FeedbackSession) => {
    const newActiveState = !session.isActive;

    // Check if trying to activate an expired session
    if (newActiveState && isSessionExpired(session)) {
      toast.error('Cannot activate session: expiry date has already passed');
      return;
    }

    // Optimistic update - immediately update UI
    onOptimisticUpdate?.(session.id, { isActive: newActiveState });

    setUpdatingIds(prev => new Set(prev).add(session.id));
    try {
      await feedbackSessionsApi.update(session.id, { isActive: newActiveState });
      toast.success(`Session ${newActiveState ? 'activated' : 'deactivated'}`);
      // Only refresh if optimistic update might have been wrong
      onRefresh?.();
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update session');
      // Revert optimistic update on error
      onOptimisticUpdate?.(session.id, { isActive: session.isActive });
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(session.id);
        return newSet;
      });
    }
  };

  const handleCopyUrl = (session: FeedbackSession) => {
    const url = `${window.location.origin}/feedback/anonymous/${session.uniqueUrl}`;
    navigator.clipboard.writeText(url);
    toast.success('Feedback URL copied to clipboard');
  };

  const handleDelete = async (session: FeedbackSession) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      await feedbackSessionsApi.delete(session.id);
      toast.success('Session deleted successfully');
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const getFacultyName = (facultyId: string) => {
    const fac = faculty.find(f => f.id === facultyId);
    return fac ? `${fac.name} (${fac.designation})` : 'Unknown Faculty';
  };

  const getDepartmentName = (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || 'Unknown Department';
  };

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No Sessions Found</h3>
            <p className="text-sm text-muted-foreground">
              Create your first feedback session to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Card key={session.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {session.course} - {session.subject}
                  {session.subjectCode && <span className="font-sans"> ({session.subjectCode})</span>}
                  {session.subjectType && ` - ${session.subjectType}`}
                  <Badge variant={isSessionActive(session) ? 'default' : 'secondary'}>
                    {isSessionActive(session) ? 'Active' : 'Inactive'}
                  </Badge>
                </CardTitle>
                <div className="text-sm text-muted-foreground mt-1 space-y-1">
                  <p><strong>Academic Year:</strong> {session.academicYear}</p>
                  <p><strong>Department:</strong> {getDepartmentName(session.departmentId)}</p>
      <p><strong>Session URL:</strong> <a href={`/feedback/anonymous/${session.uniqueUrl}`} target="_blank" rel="noopener noreferrer">{`/feedback/anonymous/${session.uniqueUrl}`}</a></p>
                  <p><strong>Faculty:</strong> {getFacultyName(session.facultyId)}</p>
                  <p><strong>Expires:</strong> {format(session.expiresAt.toDate(), 'MMM d, yyyy HH:mm')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant={session.isActive ? "destructive" : "default"}
                  size="sm"
                  onClick={() => handleToggleActive(session)}
                  disabled={updatingIds.has(session.id)}
                >
                  {updatingIds.has(session.id) ? 'Updating...' : session.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyUrl(session)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy URL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/feedback/anonymous/${session.uniqueUrl}`, '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/admin/sessions/${session.id}/responses`, '_blank')}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Responses
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShareSession(session)}
                  className="flex items-center gap-2"
                >
                  <Share className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <Dialog open={!!shareSession} onOpenChange={() => setShareSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Feedback Form</DialogTitle>
          </DialogHeader>
          {shareSession && (
            <div className="flex flex-col items-center gap-4">
              <QRCodeCanvas 
                id="qr-code-canvas"
                value={`${window.location.origin}/feedback/anonymous/${shareSession.uniqueUrl}`} 
                size={128}
                level="H"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
                    if (canvas) {
                      const url = canvas.toDataURL('image/png');
                      const link = document.createElement('a');
                      link.download = `qr-code-${shareSession.subject}.png`;
                      link.href = url;
                      link.click();
                      toast.success('QR Code downloaded successfully');
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download QR Code
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Check out this feedback form: ${window.location.origin}/feedback/anonymous/${shareSession.uniqueUrl}`)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="flex items-center gap-2 text-[#25D366] border-[#25D366] hover:bg-green-500 hover:text-white"
                >
                  <MessageCircle className="h-4 w-4" />
                  Share to WhatsApp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};