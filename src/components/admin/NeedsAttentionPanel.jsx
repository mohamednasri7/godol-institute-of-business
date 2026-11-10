import React from 'react';
import { Link } from 'wouter';
import { AlertCircle, CreditCard, ClipboardList, BookOpen, CheckCircle, ArrowRight } from 'lucide-react';

export default function NeedsAttentionPanel({ pendingPayments = [], pendingEnrollments = [], draftCourses = [] }) {
  const pendingPaymentsCount = pendingPayments.length;
  const pendingEnrollmentsCount = pendingEnrollments.length;
  const draftCoursesCount = draftCourses.length;

  const totalUrgent = pendingPaymentsCount + pendingEnrollmentsCount + draftCoursesCount;

  if (totalUrgent === 0) {
    return (
      <div className="liquid-glass liquid-glass-squircle border-emerald-300/50 dark:border-emerald-700/50 p-5 sm:p-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-sm text-gray-900 dark:text-foreground">All Clear — No Items Need Attention</h4>
          <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5">
            All submitted payments have been verified, enrollments are active, and courses are up to date.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="liquid-glass liquid-glass-squircle border-amber-300/50 dark:border-amber-700/50 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm sm:text-base">
            Needs Your Attention
          </h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-bold">
          {totalUrgent} Action{totalUrgent > 1 ? 's' : ''} Required
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Pending Payments */}
        <Link
          href="/admin/payments"
          className="bg-white dark:bg-card p-4 rounded-xl border border-amber-200/80 dark:border-border hover:shadow-md transition-shadow group flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 dark:text-foreground">Pending Payments</span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 font-mono">{pendingPaymentsCount}</span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-muted-foreground mt-0.5 truncate">
              {pendingPaymentsCount > 0 ? `${pendingPaymentsCount} transactions to review` : 'All payments reviewed'}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 group-hover:underline mt-2">
              Review Transactions <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </Link>

        {/* 2. New Enrollments */}
        <Link
          href="/admin/enrollments"
          className="bg-white dark:bg-card p-4 rounded-xl border border-amber-200/80 dark:border-border hover:shadow-md transition-shadow group flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 dark:text-foreground">Unverified Enrollments</span>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400 font-mono">{pendingEnrollmentsCount}</span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-muted-foreground mt-0.5 truncate">
              {pendingEnrollmentsCount > 0 ? `${pendingEnrollmentsCount} student registrations` : 'All enrollments active'}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-400 group-hover:underline mt-2">
              Manage Access <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </Link>

        {/* 3. Unpublished Courses */}
        <Link
          href="/admin/courses"
          className="bg-white dark:bg-card p-4 rounded-xl border border-amber-200/80 dark:border-border hover:shadow-md transition-shadow group flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 dark:text-foreground">Draft Courses</span>
              <span className="text-xs font-bold text-purple-700 dark:text-purple-400 font-mono">{draftCoursesCount}</span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-muted-foreground mt-0.5 truncate">
              {draftCoursesCount > 0 ? `${draftCoursesCount} unpublished syllabus drafts` : 'All curriculum live'}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 dark:text-purple-400 group-hover:underline mt-2">
              Curriculum Hub <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

