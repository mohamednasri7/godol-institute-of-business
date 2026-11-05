import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, GraduationCap, Users } from 'lucide-react';
import { auth } from '../../lib/auth';
import { apiFetch } from '../../lib/api';

export default function InstructorLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await apiFetch('/api/instructor/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password })
      });

      if (res && res.instructor) {
        auth.setInstructor(res.instructor);
        setLocation('/instructor/dashboard');
      } else {
        setErrorMessage(res?.error || 'Invalid instructor login credentials.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('godol2026');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <img
              src="/godol-logo.png"
              alt="Godol Institute"
              className="h-10 sm:h-12 md:h-14 mx-auto object-contain brightness-0 invert w-auto"
            />
          </Link>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold tracking-wider uppercase border border-amber-500/30">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Faculty & Instructor Portal</span>
          </div>
          <h2 className="mt-3 text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
            Sign in to your Dashboard
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Access your assigned courses, manage students, and monitor academic progress.
          </p>
        </div>

        <div className="mt-8 bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          {errorMessage && (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-start gap-2.5">
              <span className="font-bold">Error:</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Instructor Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="faculty@godolinstitute.so"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Dashboard Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your instructor password"
                  className="w-full h-11 pl-10 pr-11 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all mt-6 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as Instructor</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Instructors hint */}
          <div className="mt-6 pt-6 border-t border-slate-700/60">
            <p className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider text-center">
              Active Instructor Accounts
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('ahmed@godolinstitute.so')}
                className="text-left p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 hover:border-primary/40 transition-all text-[11px] text-slate-300"
              >
                <div className="font-bold text-white truncate">Ahmed Mohamuud</div>
                <div className="text-[10px] text-slate-400 truncate">ahmed@godolinstitute.so</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('mohamuud@godolinstitute.so')}
                className="text-left p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 hover:border-primary/40 transition-all text-[11px] text-slate-300"
              >
                <div className="font-bold text-white truncate">Mohamuud Ahmed</div>
                <div className="text-[10px] text-slate-400 truncate">mohamuud@godolinstitute.so</div>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-2">
              Default password: <code className="text-amber-400 bg-slate-900 px-1 py-0.5 rounded">godol2026</code>
            </p>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            <Link href="/login" className="hover:text-white transition-colors">
              ← Student Sign In
            </Link>
            <span className="mx-2">•</span>
            <Link href="/admin" className="hover:text-amber-400 transition-colors">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

