import React from 'react';
import { College } from '@/lib/storage';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  college?: College;
  rightElement?: React.ReactNode;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, subtitle, college, rightElement }) => {
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
                  src="https://indiraigsb.edu.in/assets/images/igsb-logo.png"
                  alt={`${college.name} Logo`}
                  className="h-20 w-auto object-contain rounded-sm p-1"
                  style={{ backgroundColor: '#072F61' }}
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
