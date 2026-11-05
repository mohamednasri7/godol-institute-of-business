import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff, Laptop, Target, Users, ArrowRight } from 'lucide-react';
import { auth } from '../lib/auth';
import { SignIn } from '@clerk/clerk-react';

const hasClerk = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

export default function Login() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const nextUrl = searchParams.get('next') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDirectLogin, setShowDirectLogin] = useState(!hasClerk);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    setTimeout(() => {
      if (!email.includes('@') || password.length < 4) {
        setErrorMessage('Please enter a valid email and password.');
        setIsLoading(false);
        return;
      }

      // Check if Admin login
      const isAdmin = email.toLowerCase() === 'admin@godolinstitute.so' || email.toLowerCase().startsWith('admin@');

      if (isAdmin) {
        auth.setAdmin('godol_admin_mock_token_2026', email);
        auth.setUser(email, 'Godol Administrator');
        setLocation('/admin/dashboard');
        return;
      }

      // Save student user session
      const name = email.split('@')[0].replace('.', ' ');
      const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
      auth.setUser(email, capitalized);

      setLocation(nextUrl);
    }, 600);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left hero banner (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />

        <div className="relative z-10">
          <Link href="/">
            <img
              src="/godol-logo.png"
              alt="Godol Institute"
              className="h-12 w-auto object-contain brightness-0 invert"
            />
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="font-serif text-4xl font-bold text-white mb-4 leading-tight">
            Welcome to your learning journey
          </h2>
          <p className="text-white/70 text-lg mb-12">
            Practical business education tailored for ambitious leaders across East Africa.
          </p>

          <div className="space-y-4">
            {[
              {
                icon: Laptop,
                title: 'Flexible Online Learning',
                desc: 'Self-paced modules with live interactive workshops'
              },
              {
                icon: Target,
                title: 'Practical, Market-Driven Skills',
                desc: 'Curriculum built for immediate real-world impact'
              },
              {
                icon: Users,
                title: 'Direct Mentorship',
                desc: 'Guided feedback from experienced business professionals'
              }
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-4 p-4 rounded-2xl border border-white/10 backdrop-blur-md shadow-sm transition-all hover:border-white/20"
                style={{ background: 'rgba(255,255,255,0.07)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'hsl(42 92% 52% / 0.2)' }}
                >
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm leading-snug">{title}</div>
                  <div className="text-white/60 text-xs mt-1 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/30 text-xs">
          © {new Date().getFullYear()} Godol Institute of Business
        </div>
      </div>

      {/* Right sign in form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10 flex justify-center">
            <Link href="/">
              <img
                src="/godol-logo.png"
                alt="Godol Institute"
                className="h-12 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
              Sign in to your account
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          {hasClerk && !showDirectLogin ? (
            <div className="flex flex-col items-center">
              <SignIn routing="hash" />
              <button
                type="button"
                onClick={() => setShowDirectLogin(true)}
                className="mt-6 text-xs text-muted-foreground hover:text-primary transition-colors underline"
              >
                Sign in with Admin / Direct Student Portal
              </button>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-foreground">Password</label>
                    <a href="#" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full h-11 pl-4 pr-11 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md mt-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {hasClerk && (
                  <button
                    type="button"
                    onClick={() => setShowDirectLogin(false)}
                    className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors underline pt-2 block"
                  >
                    ← Back to Clerk Sign In
                  </button>
                )}
              </form>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground space-y-2">
            <div>
              Don't have an account?{' '}
              <Link href="/register" className="text-primary font-bold hover:underline">
                Enroll at Godol Institute
              </Link>
            </div>
            <div>
              Are you a faculty member?{' '}
              <Link href="/instructor/login" className="text-amber-600 font-bold hover:underline">
                Instructor Portal Login →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

