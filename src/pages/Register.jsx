import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff, CheckCircle, ArrowRight, Award } from 'lucide-react';
import { auth } from '../lib/auth';
import { apiFetch } from '../lib/api';
import { SignUp } from '@clerk/clerk-react';

const hasClerk = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

const benefits = [
  'Access 40+ business courses taught by industry experts',
  'Attend live workshops in Mogadishu',
  'Earn certificates recognised across East Africa',
  'Join a network of 500+ business professionals',
  'Learn in Somali and English'
];

export default function Register() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const nextUrl = searchParams.get('next') || '/dashboard';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDirectRegister, setShowDirectRegister] = useState(!hasClerk);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    if (!fullName.trim() || !email.includes('@') || password.length < 6) {
      setErrorMessage('Please fill out all required fields with a valid password.');
      setIsLoading(false);
      return;
    }

    try {
      // Save student record to database
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: fullName, email, phone, whatsapp: phone })
      });
    } catch {
      // Non-fatal: still allow login if server has issues
    }

    // Save user session
    auth.setUser(email, fullName);
    setLocation(nextUrl);
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
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
            style={{ background: 'hsl(42 92% 52% / 0.2)', color: 'hsl(42 92% 62%)' }}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Enroll Today</span>
          </div>

          <h2 className="font-serif text-4xl font-bold text-white mb-4 leading-tight">
            Start your business education at Somalia's top institute
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Everything you need to grow your career or build your business in East Africa.
          </p>

          <div className="space-y-3.5">
            {benefits.map((b) => (
              <div key={b} className="flex items-start gap-3 text-white/80 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/30 text-xs">
          © {new Date().getFullYear()} Godol Institute of Business
        </div>
      </div>

      {/* Right register form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-background overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="lg:hidden mb-8 flex justify-center">
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
              Create your account
            </h1>
            <p className="text-muted-foreground text-sm">
              Join Godol Institute and begin your business learning journey.
            </p>
          </div>

          {hasClerk && !showDirectRegister ? (
            <div className="flex flex-col items-center">
              <SignUp routing="hash" />
              <button
                type="button"
                onClick={() => setShowDirectRegister(true)}
                className="mt-6 text-xs text-muted-foreground hover:text-primary transition-colors underline"
              >
                Or register directly without Clerk
              </button>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Faadumo Omar"
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="faadumo@example.com"
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Phone Number <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+252 61 000 0000"
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
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
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {hasClerk && (
                  <button
                    type="button"
                    onClick={() => setShowDirectRegister(false)}
                    className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors underline pt-2 block"
                  >
                    ← Back to Clerk Sign Up
                  </button>
                )}

                <p className="text-xs text-center text-muted-foreground pt-2 leading-relaxed">
                  By enrolling, you agree to our{' '}
                  <a href="#" className="text-primary hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                  .
                </p>
              </form>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

