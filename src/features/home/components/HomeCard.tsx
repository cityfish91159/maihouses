import React from 'react';
import { cn } from '../../../lib/utils';

interface HomeCardProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'hero' | 'ai';
  children: React.ReactNode;
}

export const HomeCard = React.forwardRef<HTMLElement, HomeCardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const baseStyles = "transition-all duration-200 bg-white border border-border-light";
    
    const variants = {
      default: "mh-card p-4 md:p-6",
      hero: "mh-card mh-card--hero p-6 md:p-10 bg-gradient-to-br from-white to-brand-50",
      ai: "mh-ai-card"
    };

    return (
      <section
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </section>
    );
  }
);

HomeCard.displayName = 'HomeCard';
