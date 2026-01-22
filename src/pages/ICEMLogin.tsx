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
      switch (user.role) {
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
    }
    // On success, navigation will be handled by the useEffect above
  };

  const demoCredentials = [
    { role: 'ICEM Admin', email: 'admin@icem.edu', password: 'password123' },
    { role: 'ICEM HOD (CS)', email: 'hod.cs@icem.edu', password: 'password123' },
    { role: 'ICEM HOD (EE)', email: 'hod.ee@icem.edu', password: 'password123' },
    { role: 'ICEM Faculty 1', email: 'faculty1@icem.edu', password: 'password123' },
    { role: 'ICEM Faculty 2', email: 'faculty2@icem.edu', password: 'password123' },
  ];

  const fillCredentials = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
    setError('');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - ICEM Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />

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

          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-10 w-10 rounded-full bg-white/20 border-2 border-primary flex items-center justify-center text-xs font-medium text-primary-foreground"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p className="text-sm text-primary-foreground/70">
              Join 500+ faculty members already using our platform
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
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

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Demo Credentials</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {demoCredentials.map((cred) => (
                <button
                  key={cred.role}
                  type="button"
                  onClick={() => fillCredentials(cred.email, cred.password)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary transition-colors text-sm"
                >
                  <span className="font-medium text-foreground">{cred.role}</span>
                  <span className="text-muted-foreground">{cred.email}</span>
                </button>
              ))}
            </div>
          </div>

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