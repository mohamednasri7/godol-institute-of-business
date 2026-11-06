import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { Search, X, Users, BookOpen, CreditCard, ChevronRight } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      Promise.allSettled([
        apiFetch('/api/admin/students'),
        apiFetch('/api/courses'),
        apiFetch('/api/admin/payments')
      ]).then(([stRes, coRes, paRes]) => {
        setStudents(stRes.status === 'fulfilled' && Array.isArray(stRes.value) ? stRes.value : []);
        setCourses(coRes.status === 'fulfilled' && Array.isArray(coRes.value) ? coRes.value : []);
        setPayments(paRes.status === 'fulfilled' && Array.isArray(paRes.value) ? paRes.value : []);
      }).finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { students: [], courses: [], payments: [] };

    return {
      students: students.filter(s => (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q)).slice(0, 4),
      courses: courses.filter(c => (c.title || '').toLowerCase().includes(q) || (c.categoryName || '').toLowerCase().includes(q)).slice(0, 4),
      payments: payments.filter(p => (p.transactionRef || '').toLowerCase().includes(q) || (p.studentName || '').toLowerCase().includes(q)).slice(0, 4)
    };
  }, [query, students, courses, payments]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center p-4 sm:pt-20">
      <div className="bg-white dark:bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search students, courses, or transaction references..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground font-medium"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-foreground hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Type to search globally across registered students, published courses, and verified payments.
            </div>
          ) : (
            <>
              {/* Students */}
              {searchResults.students.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Students</span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.students.map(s => (
                      <Link
                        key={s.id || s.email}
                        href="/admin/students"
                        onClick={onClose}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-muted text-xs transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{s.name}</p>
                          <p className="text-[11px] text-muted-foreground">{s.email}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Courses */}
              {searchResults.courses.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                    <span>Courses</span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.courses.map(c => (
                      <Link
                        key={c.id}
                        href="/admin/courses"
                        onClick={onClose}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-muted text-xs transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{c.title}</p>
                          <p className="text-[11px] text-muted-foreground">{c.categoryName || 'Business'} • ${c.price || 0}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Payments */}
              {searchResults.payments.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Payments</span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.payments.map(p => (
                      <Link
                        key={p.id}
                        href="/admin/payments"
                        onClick={onClose}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-muted text-xs transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-foreground font-mono">{p.transactionRef}</p>
                          <p className="text-[11px] text-muted-foreground">{p.studentName} • ${p.claimedAmount} ({p.provider})</p>
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          {p.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.students.length === 0 && searchResults.courses.length === 0 && searchResults.payments.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No records matching "{query}" found.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

