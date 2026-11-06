import React from 'react';
import { CreditCard, GraduationCap, Award, BookOpen, Clock, CheckCircle } from 'lucide-react';

export default function RecentActivityFeed({ payments = [], enrollments = [] }) {
  // Combine payments and enrollments into a chronological timeline
  const activities = [
    ...(payments || []).map(p => ({
      id: `pay-${p.id}`,
      type: p.status === 'verified' ? 'payment_verified' : 'payment_submitted',
      title: p.status === 'verified' ? `Payment Verified: $${p.verifiedAmount || p.claimedAmount}` : `Payment Submitted: $${p.claimedAmount}`,
      description: `${p.studentName} paid via ${p.provider} (${p.transactionRef}) for "${p.courseTitle}"`,
      timestamp: p.verifiedAt || p.submittedAt || new Date().toISOString(),
      icon: CreditCard,
      badgeColor: p.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
    })),
    ...(enrollments || []).map(e => ({
      id: `enr-${e.id}`,
      type: 'enrollment',
      title: `Student Enrolled: ${e.studentName}`,
      description: `Registered for "${e.courseTitle}" — Status: ${e.enrollmentStatus || 'pending'}`,
      timestamp: e.enrolledAt || new Date().toISOString(),
      icon: GraduationCap,
      badgeColor: 'bg-blue-100 text-blue-700'
    }))
  ]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 7);

  const formatTime = (ts) => {
    if (!ts) return 'just now';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return 'recently';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-gray-900 dark:text-foreground text-sm sm:text-base">
            Live Platform Activity
          </h3>
        </div>
        <span className="text-[11px] text-muted-foreground font-mono">Real-time Stream</span>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-xs">
          No recent platform activity recorded yet
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-gray-700 dark:text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-gray-900 dark:text-foreground truncate">{item.title}</p>
                    <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">{formatTime(item.timestamp)}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

