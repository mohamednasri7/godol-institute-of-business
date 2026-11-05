import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { auth } from '../lib/auth';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { useTheme } from '../context/ThemeContext';

const hasClerk = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

export default function Navbar() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.getUser());
  const [currentAdmin, setCurrentAdmin] = useState(auth.getAdmin());
  const [currentInstructor, setCurrentInstructor] = useState(auth.getInstructor());

  const isHome = location === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setCurrentUser(auth.getUser());
    setCurrentAdmin(auth.getAdmin());
    setCurrentInstructor(auth.getInstructor());
  }, [location]);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Courses', href: '/courses' },
    { label: 'Workshops', href: '/categories' },
    { label: 'Instructors', href: '/instructors' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' }
  ];

  // Transparent only on Home before scroll
  const isTransparent = isHome && !isScrolled && !isMobileMenuOpen;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isTransparent
          ? 'bg-transparent py-5'
          : 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-border shadow-sm py-3'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/" onClick={() => window.scrollTo(0, 0)} className="flex items-center group">
          <img
            src="/godol-logo.png"
            alt="Godol Institute of Business"
            className={`h-12 w-auto object-contain transition-all duration-300 ${
              isTransparent ? 'brightness-0 invert' : 'dark:brightness-0 dark:invert'
            }`}
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-7">
          <ul className="flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => {
                      window.scrollTo(0, 0);
                      if (document.documentElement) document.documentElement.scrollTop = 0;
                    }}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive
                        ? 'text-primary font-semibold'
                        : isTransparent
                        ? 'text-white/80 hover:text-white'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className={`h-5 w-px ${isTransparent ? 'bg-white/20' : 'bg-border'}`} />

          {/* Night Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to night mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to night mode'}
            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
              isTransparent
                ? 'text-white/80 hover:text-white hover:bg-white/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-90 duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-foreground/80 transition-transform hover:-rotate-12 duration-300" />
            )}
          </button>

          <div className="flex items-center gap-3">
            {currentAdmin && (
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all shadow-sm"
              >
                Admin Panel
              </Link>
            )}

            {currentInstructor && (
              <Link
                href="/instructor/dashboard"
                className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm border border-slate-700"
              >
                Instructor Portal
              </Link>
            )}

            {hasClerk ? (
              <>
                <SignedIn>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-sm"
                  >
                    My Dashboard
                  </Link>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
                <SignedOut>
                  <Link
                    href="/login"
                    className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                      isTransparent
                        ? 'text-white/90 hover:text-white hover:bg-white/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                  >
                    Enroll Now
                  </Link>
                </SignedOut>
              </>
            ) : currentUser ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-sm"
              >
                My Dashboard
              </Link>
            ) : !currentAdmin ? (
              <>
                <Link
                  href="/login"
                  className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                    isTransparent
                      ? 'text-white/90 hover:text-white hover:bg-white/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                >
                  Enroll Now
                </Link>
              </>
            ) : null}
          </div>
        </div>

        {/* Mobile Action Controls */}
        <div className="lg:hidden flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to night mode'}
            className={`p-2 rounded-full transition-colors ${
              isTransparent ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-muted'
            }`}
          >
            {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-foreground/80" />}
          </button>
          <button
            className={`p-2 -mr-2 transition-colors ${
              isTransparent ? 'text-white' : 'text-foreground'
            }`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b border-border shadow-xl py-5 px-6 flex flex-col gap-2">
          {/* Night Mode Switch in Drawer */}
          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/40 mb-1">
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              {isDark ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>Night Mode</span>
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                isDark ? 'bg-primary justify-end' : 'bg-muted-foreground/30 justify-start'
              }`}
              aria-label="Toggle Night Mode"
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-base font-medium py-2.5 px-3 rounded-lg transition-colors ${
                location === link.href
                  ? 'text-primary bg-primary/5 font-semibold'
                  : 'text-foreground hover:bg-muted'
              }`}
              onClick={() => {
                setIsMobileMenuOpen(false);
                window.scrollTo(0, 0);
              }}
            >
              {link.label}
            </Link>
          ))}

          <div className="h-px w-full bg-border my-2" />

          {currentInstructor && (
            <Link
              href="/instructor/dashboard"
              className="w-full text-center py-2.5 rounded-full bg-slate-900 text-white font-semibold text-sm mb-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Instructor Portal
            </Link>
          )}

          {hasClerk ? (
            <>
              <SignedIn>
                <div className="flex items-center justify-between py-2 px-1">
                  <span className="text-sm font-medium text-foreground">Signed in</span>
                  <UserButton afterSignOutUrl="/" />
                </div>
                <Link
                  href="/dashboard"
                  className="w-full text-center py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Dashboard
                </Link>
              </SignedIn>
              <SignedOut>
                <div className="flex flex-col gap-2.5">
                  <Link
                    href="/login"
                    className="w-full text-center py-2.5 rounded-full border border-border text-foreground font-semibold text-sm hover:bg-muted"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="w-full text-center py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Enroll Now
                  </Link>
                </div>
              </SignedOut>
            </>
          ) : currentUser ? (
            <Link
              href="/dashboard"
              className="w-full text-center py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              My Dashboard
            </Link>
          ) : (
            <div className="flex flex-col gap-2.5">
              <Link
                href="/login"
                className="w-full text-center py-2.5 rounded-full border border-border text-foreground font-semibold text-sm hover:bg-muted"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="w-full text-center py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Enroll Now
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

