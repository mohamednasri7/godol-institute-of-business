import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X } from 'lucide-react';
import { auth } from '../lib/auth';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';

const hasClerk = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

export default function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.getUser());
  const [currentAdmin, setCurrentAdmin] = useState(auth.getAdmin());

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
          : 'bg-white/95 backdrop-blur-md border-b border-border shadow-sm py-3'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/" onClick={() => window.scrollTo(0, 0)} className="flex items-center group">
          <img
            src="/godol-logo.png"
            alt="Godol Institute of Business"
            className={`h-12 w-auto object-contain transition-all duration-300 ${
              isTransparent ? 'brightness-0 invert' : ''
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

          <div className="flex items-center gap-3">
            {currentAdmin && (
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all shadow-sm"
              >
                Admin Panel
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

        {/* Mobile Hamburger Button */}
        <button
          className={`lg:hidden p-2 -mr-2 transition-colors ${
            isTransparent ? 'text-white' : 'text-foreground'
          }`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-border shadow-xl py-5 px-6 flex flex-col gap-2">
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

