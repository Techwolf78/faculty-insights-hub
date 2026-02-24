import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const IGSBLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginTimeoutReached, setLoginTimeoutReached] = useState(false);

  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Handle navigation when user data becomes available after login
  useEffect(() => {
    if (user && !isLoading) {
      console.log('User logged in successfully:', user.name || user.email, 'Role:', user.activeRole || user.role);
      const roleToNavigate = user.activeRole || user.role;
      switch (roleToNavigate) {
        case 'superAdmin':
          console.log('Navigating to super-admin');
          navigate('/super-admin');
          break;
        case 'admin':
          console.log('Navigating to admin dashboard');
          navigate('/admin/dashboard');
          break;
        case 'hod':
          console.log('Navigating to HOD dashboard');
          navigate('/hod/dashboard');
          break;
        case 'faculty':
          console.log('Navigating to faculty dashboard');
          navigate('/faculty/dashboard');
          break;
        default:
          console.error('Invalid user role:', roleToNavigate);
          setError('Invalid user role assigned. Please contact your administrator.');
          break;
      }
    } else if (!user && !isLoading && isSubmitting) {
      // If we're not loading, not logged in, but were submitting, something went wrong
      console.error('Login completed but user state not updated');
      setError('Login completed but failed to load user data. Please try logging in again.');
      setIsSubmitting(false);
    }
  }, [user, isLoading, navigate, isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Starting login attempt for email:', email);
    setError('');
    setLoginTimeoutReached(false);
    setIsSubmitting(true);

    try {
      // Client-side validation
      if (!email.trim()) {
        setError('Email address is required');
        setIsSubmitting(false);
        return;
      }

      if (!password.trim()) {
        setError('Password is required');
        setIsSubmitting(false);
        return;
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setIsSubmitting(false);
        return;
      }

      // Set a timeout for the login process
      const loginTimeout = setTimeout(() => {
        setLoginTimeoutReached(true);
        setError('Login is taking longer than expected. This might be due to network issues or server problems. Please try again.');
        setIsSubmitting(false);
      }, 30000); // 30 seconds timeout

      try {
        const result = await login(email, password);

        clearTimeout(loginTimeout);

        if (!result.success) {
          setError(result.error || 'Login failed. Please try again.');
        }
        // Success case is handled by useEffect watching user state
      } catch (error: unknown) {
        clearTimeout(loginTimeout);
        console.error('Unexpected login error:', error);
        setError('An unexpected error occurred. Please try again or contact support.');
      } finally {
        setIsSubmitting(false);
      }
    } catch (validationError: unknown) {
      console.error('Validation error:', validationError);
      setError('Form validation failed. Please check your input and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - IGSB Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />

        <div className="relative z-10 flex flex-col justify-center items-center px-12 xl:px-20 text-center">
          <div className="flex flex-col items-center gap-6 mb-8">
            <img
              src="https://indiraigsb.edu.in/Home/Logo.webp"
              alt="IGSB College Logo"
              className="h-28 w-auto object-contain rounded-lg"
            />
            <div>
              <h1 className="font-display text-4xl font-black text-primary-foreground mb-2">INSYT - FACULTY FEEDBACK</h1>
            </div>
          </div>

          <h2 className="font-display text-3xl font-bold text-primary-foreground leading-tight mb-6">
            Transforming Education Through Feedback
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-md mb-8">
            Access your personalized dashboard to view feedback analytics, manage cycles, and drive continuous improvement in teaching excellence.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
            <img
              src="https://indiraigsb.edu.in/assets/images/igsb-logo.png"
              alt="IGSB College Logo"
              className="h-20 w-auto object-contain rounded-lg p-2"
              style={{ backgroundColor: '#072F61' }}
            />
            <span className="font-display text-2xl font-bold text-foreground">IGSB</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">Sign in to access your IGSB dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border-2 border-red-200 text-red-800 animate-scale-in shadow-lg">
                <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5 text-red-600" />
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1 text-red-900">Login Failed</p>
                  <p className="text-sm leading-relaxed">{error}</p>
                  {loginTimeoutReached && (
                    <p className="text-xs mt-2 text-red-700">
                      If this persists, please check your internet connection or contact support.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 gradient-hero text-primary-foreground hover:opacity-90"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};