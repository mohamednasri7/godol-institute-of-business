import React from 'react';
import { Link } from 'wouter';
import { Plus, CreditCard, Users, BookOpen, FileText, Sparkles } from 'lucide-react';

export default function QuickActionsToolbar() {
  const actions = [
    { label: 'Add Course', href: '/admin/courses', icon: BookOpen, color: 'hover:border-purple-300 text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
    { label: 'Add Student', href: '/admin/students', icon: Users, color: 'hover:border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
    { label: 'Add Instructor', href: '/admin/instructors', icon: Plus, color: 'hover:border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'Verify Payment', href: '/admin/payments', icon: CreditCard, color: 'hover:border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
    { label: 'Publish Article', href: '/admin/blog', icon: FileText, color: 'hover:border-indigo-300 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' }
  ];

  return (
    <div className="liquid-glass liquid-glass-squircle p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <h4 className="font-bold text-gray-900 dark:text-foreground text-xs sm:text-sm uppercase tracking-wider">
          Quick Actions
        </h4>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.label}
              href={act.href}
              className={`p-3 rounded-2xl border border-white/20 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-2 group liquid-glass-interactive ${act.color}`}
            >
              <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="text-xs font-bold text-gray-800 dark:text-foreground truncate w-full">
                {act.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

