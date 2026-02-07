import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GraduationCap, ChevronLeft, ChevronRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RatingStars } from '@/components/ui/RatingStars';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { db } from '@/lib/firebase';
import {
  facultyApi,
  submissionsApi,
  feedbackSessionsApi,
  questionsApi,
  FeedbackSession,
  Faculty,
  Question,
  FeedbackResponse,
} from '@/lib/storage';

type Step = 'feedback' | 'success';

interface CleanResponse {
  questionId: string;
  questionCategory: string;
  rating?: number;
  comment?: string;
  selectValue?: string;
  booleanValue?: boolean;
}

export const AnonymousFeedback: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [step, setStep] = useState<Step>('feedback'); // Start directly with feedback
  const [sessionError, setSessionError] = useState('');
  const [isValidating, setIsValidating] = useState(true); // Start validating immediately

  const [validatedSession, setValidatedSession] = useState<FeedbackSession | null>(null);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStickyProgress, setShowStickyProgress] = useState(false);
  const isValidatingRef = useRef(true);

  // Group questions by category and sort within categories
  const groupedQuestions = questions.reduce((acc, q) => {
    if (!acc[q.category]) {
      acc[q.category] = [];
    }
    acc[q.category].push(q);
    return acc;
  }, {} as Record<string, Question[]>);

  // Sort questions within each category by order
  Object.keys(groupedQuestions).forEach(category => {
    groupedQuestions[category].sort((a, b) => a.order - b.order);
  });

  // Sort categories by the minimum order of questions in each category
  const categories = Object.keys(groupedQuestions).sort((a, b) => {
    const minOrderA = Math.min(...groupedQuestions[a].map(q => q.order));
    const minOrderB = Math.min(...groupedQuestions[b].map(q => q.order));
    return minOrderA - minOrderB;
  });

  // Auto-save every 30 seconds
  useEffect(() => {
    if (step !== 'feedback' || responses.length === 0) return;

    const saveInterval = setInterval(() => {
      localStorage.setItem('ffs_draft_feedback', JSON.stringify({
        sessionId: validatedSession?.id,
        responses,
        timestamp: Date.now(),
      }));
    }, 30000);

    return () => clearInterval(saveInterval);
  }, [step, responses, validatedSession?.id]);

  // Restore draft on load
  useEffect(() => {
    const draft = localStorage.getItem('ffs_draft_feedback');
    if (draft) {
      const parsed = JSON.parse(draft);
      // Only restore if less than 1 hour old
      if (Date.now() - parsed.timestamp < 3600000) {
        setResponses(parsed.responses);
      } else {
        localStorage.removeItem('ffs_draft_feedback');
      }
    }
  }, []);

  // Validate session on mount
  useEffect(() => {
    const validateSession = async () => {
      if (!sessionId) {
        console.error('No sessionId provided');
        setSessionError('Invalid session URL. Please check the link and try again.');
        setIsValidating(false);
        isValidatingRef.current = false;
        return;
      }

      console.log('Validating session with ID:', sessionId);
      console.log('Firebase config check:', !!db);

      setIsValidating(true);
      isValidatingRef.current = true;
      setSessionError('');

      // Set timeout for 30 seconds (increased from 10)
      const timeoutId = setTimeout(() => {
        if (isValidatingRef.current) {
          console.error('Session validation timed out for sessionId:', sessionId);
          setSessionError('Session validation is taking longer than expected. Please check your internet connection and try again. If the problem persists, contact your administrator.');
          setIsValidating(false);
          isValidatingRef.current = false;
        }
      }, 30000);

      try {
        console.log('Starting session validation for:', sessionId);
        console.log('Calling feedbackSessionsApi.getByUrl...');
        const session = await feedbackSessionsApi.getByUrl(sessionId);
        console.log('Session fetched result:', session ? { id: session.id, uniqueUrl: session.uniqueUrl, isActive: session.isActive } : 'null');
        
        // If session not found, let's check what sessions exist
        if (!session) {
          console.log('Session not found, checking all sessions...');
          try {
            const allSessions = await feedbackSessionsApi.getAll?.() || [];
            console.log('All sessions in database:', allSessions.map(s => ({ id: s.id, uniqueUrl: s.uniqueUrl })));
          } catch (error) {
            console.error('Error fetching all sessions:', error);
          }
        }

        if (!session) {
          setSessionError('Invalid session. This feedback link may have expired or been removed.');
          setIsValidating(false);
          isValidatingRef.current = false;
          clearTimeout(timeoutId);
          return;
        }

        if (!session.isActive) {
          console.log('Session is not active');
          setSessionError('This feedback session is no longer active.');
          setIsValidating(false);
          isValidatingRef.current = false;
          clearTimeout(timeoutId);
          return;
        }

        if (session.expiresAt.toDate() < new Date()) {
          console.log('Session has expired');
          setSessionError('This feedback session has expired.');
          setIsValidating(false);
          isValidatingRef.current = false;
          clearTimeout(timeoutId);
          return;
        }

        // Get faculty and questions
        console.log('Fetching faculty and questions data...');
        const [allFaculty, qs] = await Promise.all([
          facultyApi.getByCollege(session.collegeId),
          questionsApi.getByCollege(session.collegeId),
        ]);
        console.log('Faculty count:', allFaculty.length, 'Questions count:', qs.length);

        // Sort questions by order field
        const sortedQuestions = qs.sort((a, b) => a.order - b.order);

        const facultyMember = allFaculty.find(f => f.id === session.facultyId);

        if (!facultyMember) {
          console.error('Faculty not found for session. Faculty ID:', session.facultyId, 'College ID:', session.collegeId);
          setSessionError(`Unable to find faculty information for this session. Faculty ID: ${session.facultyId}, College ID: ${session.collegeId}`);
          setIsValidating(false);
          isValidatingRef.current = false;
          clearTimeout(timeoutId);
          return;
        }

        if (sortedQuestions.length === 0) {
          console.error('No questions found for college:', session.collegeId);
          setSessionError('No questions found for this feedback session. Please contact your administrator.');
          setIsValidating(false);
          isValidatingRef.current = false;
          clearTimeout(timeoutId);
          return;
        }

        setValidatedSession(session);
        setFaculty(facultyMember);
        setQuestions(sortedQuestions);
        setResponses(sortedQuestions.map(q => ({ questionId: q.id, questionCategory: q.category })));

        // Check if already submitted
        if (localStorage.getItem(`ffs_submitted_${session.id}`) === 'true') {
          setStep('success');
          setIsValidating(false);
          isValidatingRef.current = false;
          clearTimeout(timeoutId);
          return;
        }

        setStep('feedback');
        clearTimeout(timeoutId);
      } catch (error) {
        console.error('Session validation error:', error);
        setSessionError(`An error occurred while loading the session: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again later.`);
        clearTimeout(timeoutId);
      } finally {
        setIsValidating(false);
        isValidatingRef.current = false;
      }
    };

    validateSession();
  }, [sessionId]);

  // Scroll detection for sticky progress bar
  const progressCardRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleScroll = () => {
      if (progressCardRef.current) {
        const rect = progressCardRef.current.getBoundingClientRect();
        const isOutOfView = rect.bottom < 20; // Show sticky when progress card is scrolled out of view
        setShowStickyProgress(isOutOfView);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const updateResponse = useCallback((questionId: string, rating?: number, comment?: string, selectValue?: string, booleanValue?: boolean) => {
    setResponses(prev =>
      prev.map(r =>
        r.questionId === questionId
          ? { 
              ...r, 
              rating: rating ?? r.rating, 
              comment: comment ?? r.comment,
              selectValue: selectValue ?? r.selectValue,
              booleanValue: booleanValue ?? r.booleanValue
            }
          : r
      )
    );
  }, []);

  const canProceed = () => {
    const requiredQuestions = questions.filter(q => q.required);
    return requiredQuestions.every(q => {
      const response = responses.find(r => r.questionId === q.id);
      if (!response) return false;
      
      switch (q.responseType) {
        case 'rating':
        case 'both':
          return response.rating !== undefined;
        case 'text':
          return response.comment && response.comment.trim() !== '';
        case 'select':
          return response.selectValue && response.selectValue.trim() !== '';
        case 'boolean':
          return response.booleanValue !== undefined;
        default:
          return false;
      }
    });
  };

  const handleSubmit = async () => {
    if (!validatedSession || !faculty) return;

    // Prevent resubmission
    if (localStorage.getItem(`ffs_submitted_${validatedSession.id}`) === 'true') {
      return;
    }

    setIsSubmitting(true);

    try {
      // Clean responses by removing undefined values
      const cleanResponses = responses
        .filter(r => r.rating !== undefined || r.selectValue || r.booleanValue !== undefined || (r.comment && r.comment.trim()))
        .map(r => {
          const cleanResponse: CleanResponse = { questionId: r.questionId, questionCategory: r.questionCategory! };
          if (r.rating !== undefined) cleanResponse.rating = r.rating;
          if (r.comment && r.comment.trim()) cleanResponse.comment = r.comment.trim();
          if (r.selectValue && r.selectValue.trim()) cleanResponse.selectValue = r.selectValue.trim();
          if (r.booleanValue !== undefined) cleanResponse.booleanValue = r.booleanValue;
          return cleanResponse;
        });

      await submissionsApi.create({
        sessionId: validatedSession.id,
        facultyId: faculty.id,
        collegeId: validatedSession.collegeId,
        departmentId: validatedSession.departmentId,
        responses: cleanResponses,
      });

      localStorage.removeItem('ffs_draft_feedback');
      localStorage.setItem(`ffs_submitted_${validatedSession.id}`, 'true');
      setStep('success');
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (responses.filter(r => r.rating !== undefined || r.selectValue || r.booleanValue !== undefined).length / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-2">
          <div className="flex items-center">
            <div className="flex h-auto w-auto items-center justify-center">
              <img
                src="https://res.cloudinary.com/dcjmaapvi/image/upload/v1749719287/juqqmxevqyys5fbavatm.png"
                alt="Gryphon Academy Logo"
                className="h-auto w-36"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-1 max-w-2xl">
        {/* Loading State */}
        {isValidating && (
          <div className="glass-card rounded-xl p-6 animate-fade-up text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-lg font-medium text-foreground">Validating session...</span>
            </div>
            <p className="text-muted-foreground">
              Please wait while we verify your feedback link.
            </p>
          </div>
        )}

        {/* Error State */}
        {sessionError && !isValidating && (
          <div className="glass-card rounded-xl p-6 animate-fade-up">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Session Error
              </h1>
              <p className="text-muted-foreground">
                {sessionError}
              </p>
            </div>
          </div>
        )}

        {/* Feedback Step */}
        {step === 'feedback' && faculty && !isValidating && (
          <div className="space-y-4 animate-fade-up">
            {/* Sticky Progress Bar - Compact version for scrolling */}
            {showStickyProgress && (
              <div className="sticky top-4 z-10 bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-sm border">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span>{responses.filter(r => r.rating !== undefined || r.selectValue || r.booleanValue !== undefined).length}/{questions.length}</span>
                  <ProgressBar value={progress} size="sm" />
                </div>
              </div>
            )}

            {/* Progress - Full version in normal flow */}
            <div ref={progressCardRef} className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">
                  Overall Progress
                </span>
                <span className="text-sm text-muted-foreground">
                  {responses.filter(r => r.rating !== undefined || r.selectValue || r.booleanValue !== undefined).length} of {questions.length} questions completed
                </span>
              </div>
              <ProgressBar value={progress} size="md" />
            </div>

            {/* Faculty Card */}
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {faculty.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h2 className="font-display text-base font-semibold text-foreground">{faculty.name}</h2>
                  <p className="text-sm text-muted-foreground">{faculty.subjects.join(', ')}</p>
                </div>
              </div>
            </div>

            {/* All Questions */}
            <div className="space-y-4">
              {categories.map((category, categoryIndex) => (
                <div key={category} className="glass-card rounded-xl p-4">
                  <h3 className="font-display text-base font-semibold text-foreground mb-6">
                    {category}
                  </h3>

                  <div className="space-y-4">
                    {groupedQuestions[category].map((question, questionIndex) => {
                      const response = responses.find(r => r.questionId === question.id);
                      const globalIndex = categories.slice(0, categoryIndex).reduce((acc, cat) => acc + groupedQuestions[cat].length, 0) + questionIndex + 1;

                      return (
                        <div
                          key={question.id}
                          className="space-y-2 animate-fade-up"
                          style={{ animationDelay: `${questionIndex * 0.05}s` }}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              {globalIndex}.
                            </span>
                            <div className="flex-1">
                              <p className="text-sm text-foreground">
                                {question.text}
                                {question.required && (
                                  <span className="text-destructive ml-1">*</span>
                                )}
                              </p>
                            </div>
                          </div>

                          {(question.responseType === 'rating' || question.responseType === 'both') && (
                            <div className="flex items-center gap-4 pl-6">
                              <span className="text-sm text-muted-foreground">Rating:</span>
                              <RatingStars
                                value={response?.rating || 0}
                                onChange={(rating) => updateResponse(question.id, rating)}
                                size="lg"
                              />
                            </div>
                          )}

                          {question.responseType === 'select' && (
                            <div className="pl-6">
                              <Select
                                value={response?.selectValue || ''}
                                onValueChange={(value) => updateResponse(question.id, undefined, undefined, value)}
                              >
                                <SelectTrigger className="w-full max-w-xs">
                                  <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                  {question.options?.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {question.responseType === 'boolean' && (
                            <div className="flex items-center gap-6 pl-6">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`boolean-${question.id}`}
                                  value="true"
                                  checked={response?.booleanValue === true}
                                  onChange={() => updateResponse(question.id, undefined, undefined, undefined, true)}
                                  className="w-4 h-4 text-primary"
                                />
                                <span className="text-sm">Yes</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`boolean-${question.id}`}
                                  value="false"
                                  checked={response?.booleanValue === false}
                                  onChange={() => updateResponse(question.id, undefined, undefined, undefined, false)}
                                  className="w-4 h-4 text-primary"
                                />
                                <span className="text-sm">No</span>
                              </label>
                            </div>
                          )}

                          {(question.responseType === 'text' || question.responseType === 'both') && (
                            <div className="pl-6">
                              <Textarea
                                placeholder="Add a comment (optional)"
                                value={response?.comment || ''}
                                onChange={(e) => updateResponse(question.id, undefined, e.target.value)}
                                className="resize-none"
                                rows={3}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="glass-card rounded-xl p-4">
              <div className="text-center">
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  size="lg"
                  className="gap-2 gradient-hero text-primary-foreground hover:opacity-90 px-6 py-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Submitting Feedback...
                    </>
                  ) : (
                    <>
                      Submit Feedback
                      <Check className="h-5 w-5" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Please complete all required questions before submitting
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="glass-card rounded-xl p-8 text-center animate-scale-in">
            <div className="mx-auto h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-6">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Thank You!
            </h1>
            <p className="text-muted-foreground">
              Your feedback has been submitted successfully. Your input helps improve teaching quality.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
