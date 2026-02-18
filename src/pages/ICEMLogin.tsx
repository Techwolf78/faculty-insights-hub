import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const ICEMLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Handle navigation when user data becomes available after login
  useEffect(() => {
    if (user && !isLoading) {
      const roleToNavigate = user.activeRole || user.role;
      switch (roleToNavigate) {
        case 'superAdmin':
          navigate('/super-admin');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'hod':
          navigate('/hod/dashboard');
          break;
        case 'faculty':
          navigate('/faculty/dashboard');
          break;
        default:
          navigate('/');
      }
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(email, password);

    if (!result.success) {
      setError(result.error || 'Login failed');
      setIsSubmitting(false);
    } else {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        {/* decorative SVG removed to eliminate stray punctuation in top-left */}

        <div className="relative z-10 flex flex-col justify-center items-center px-12 xl:px-20 text-center">
          <div className="flex flex-col items-center gap-6 mb-8">
            <img
              src="https://indiraicem.ac.in/Logo.png"
              alt="ICEM College Logo"
              className="h-28 w-auto object-contain bg-white rounded-lg"
            />
            <div>
              <h1 className="font-display text-4xl font-bold text-primary-foreground">Faculty Feedback System</h1>
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

      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
            <img
              src="https://indiraicem.ac.in/Logo.png"
              alt="ICEM College Logo"
              className="h-20 w-auto object-contain bg-white rounded-lg"
            />
            <span className="font-display text-2xl font-bold text-foreground">ICEM</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">Sign in to access your ICEM dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-scale-in">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
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