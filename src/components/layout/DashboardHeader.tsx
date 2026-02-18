import React from 'react';
import { useNavigate } from 'react-router-dom';
import { College } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  college?: College;
  rightElement?: React.ReactNode;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, subtitle, college, rightElement }) => {
  const { user, setActiveRole } = useAuth();
  const navigate = useNavigate();

  // Check if user has multiple roles
  const hasMultipleRoles = user?.roles && user.roles.length > 1;
  const availableRoles = user?.roles || (user?.role ? [user.role as 'admin' | 'hod' | 'faculty'] : []);
  const activeRole = user?.activeRole || user?.role;

  const handleRoleChange = async (newRole: 'admin' | 'hod' | 'faculty') => {
    if (newRole === activeRole) return;
    
    await setActiveRole(newRole);
    
    // Redirect to appropriate dashboard for the new role
    switch (newRole) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'hod':
        navigate('/hod/dashboard');
        break;
      case 'faculty':
        navigate('/faculty/dashboard');
        break;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'College Admin';
      case 'hod':
        return 'Head of Department';
      case 'faculty':
        return 'Faculty Member';
      default:
        return role;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {rightElement}
          {hasMultipleRoles && (() => {
            const rolesList = (availableRoles as string[]) || [];

            // Binary on/off switch when exactly 2 roles — simple knob like the image
            if (rolesList.length === 2) {
              const leftRole = rolesList[0];
              const rightRole = rolesList[1];

              const shortLabel = (r: string) => (r === 'admin' ? 'Admin' : r === 'hod' ? 'HOD' : 'Faculty');

              return (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{shortLabel(leftRole)}</span>

                  <Switch
                    checked={activeRole === rightRole}
                    onCheckedChange={async (checked) => {
                      const newRole = checked ? rightRole : leftRole;
                      if (newRole !== activeRole) await handleRoleChange(newRole as 'admin' | 'hod' | 'faculty');
                    }}
                    aria-label={`Toggle role: ${getRoleLabel(leftRole)} / ${getRoleLabel(rightRole)}`}
                    title={`${getRoleLabel(activeRole || leftRole)}`}
                  />

                  <span className="text-sm text-muted-foreground">{shortLabel(rightRole)}</span>
                </div>
              );
            }

            // Fallback: segmented pill for 3+ roles (keeps previous behavior)
            const count = Math.max(1, rolesList.length);
            const activeIndex = Math.max(0, rolesList.indexOf(activeRole as string));

            return (
              <div className="">
                <ToggleGroup
                  type="single"
                  value={activeRole as string}
                  onValueChange={(val) => val && handleRoleChange(val as 'admin' | 'hod' | 'faculty')}
                  aria-label="Switch role"
                  size="sm"
                  className="relative flex rounded-full bg-muted/8 p-1 text-sm"
                >
                  {/* sliding indicator */}
                  <span
                    aria-hidden
                    className="absolute top-1 bottom-1 left-0 rounded-full bg-primary transition-all duration-200"
                    style={{
                      left: `${(activeIndex / count) * 100}%`,
                      width: `${100 / count}%`,
                    }}
                  />

                  {rolesList.map((role) => (
                    <ToggleGroupItem
                      key={role}
                      value={role}
                      variant="default"
                      size="sm"
                      title={getRoleLabel(role)}
                      aria-label={getRoleLabel(role)}
                      className="relative z-10 flex-1 px-3 py-1 text-center text-sm text-muted-foreground data-[state=on]:text-white data-[state=on]:font-semibold data-[state=on]:bg-transparent"
                    >
                      {role === 'admin' ? 'Admin' : role === 'hod' ? 'HOD' : 'Faculty'}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            );
          })()}
          {college && (
            <>
              {college.code === 'ICEM' ? (
                <img
                  src="https://indiraicem.ac.in/Logo.png"
                  alt={`${college.name} Logo`}
                  className="h-16 w-auto object-contain"
                />
              ) : college.code === 'IGSB' ? (
                <img
                  src="https://indiraigsb.edu.in/Home/Logo.webp"
                  alt={`${college.name} Logo`}
                  className="h-20 w-auto object-contain rounded-sm p-1"
                  style={{ backgroundColor: '#FFFFFF' }}
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{college.code}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
