import React, { useState } from 'react';
import { Link } from 'wouter';
import { MapPin, Phone, Mail, ArrowRight, Facebook, Twitter, Linkedin, Instagram, CheckCircle } from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setIsSubscribing(true);
    try {
      await apiFetch('/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email: newsletterEmail })
      });
      setSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    } catch {
      alert('Thank you for subscribing to Godol Institute announcements!');
      setSubscribed(true);
    } finally {
      setIsSubscribing(false);
    }
  };

  const programs = [
    'Business Strategy',
    'Financial Management',
    'Entrepreneurship',
    'Digital Marketing',
    'Leadership & HR',
    'Live Workshops'
  ];

  const institutionLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'Instructors', href: '/instructors' },
    { label: 'Executive Workshops', href: '/categories' },
    { label: 'Verify Certificate', href: '/verify' },
    { label: 'Contact & Admissions', href: '/contact' },
    { label: 'Student Portal', href: '/dashboard' },
    { label: 'Admin Portal', href: '/admin' }
  ];

  const socialIcons = [
    { icon: Facebook, href: 'https://facebook.com/godolinstitute' },
    { icon: Twitter, href: 'https://twitter.com/godolinstitute' },
    { icon: Linkedin, href: 'https://linkedin.com/company/godolinstitute' },
    { icon: Instagram, href: 'https://instagram.com/godolinstitute' }
  ];

  return (
    <footer className="section-dark pt-20 pb-10 text-white/70">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-16">
          {/* Brand info */}
          <div className="lg:col-span-2">
            <Link href="/" onClick={() => window.scrollTo(0, 0)} className="inline-flex mb-6">
              <img
                src="/godol-logo.png"
                alt="Godol Institute of Business"
                className="h-14 w-auto object-contain brightness-0 invert opacity-90"
              />
            </Link>
            <p className="text-white/60 mb-6 max-w-sm leading-relaxed text-sm">
              Godol Institute of Business is Somalia's leading business education institution, empowering professionals and entrepreneurs across East Africa with practical, world-class Business training.
            </p>
            <div className="flex flex-col gap-2.5 text-sm text-white/60 mb-8">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-white/40 flex-shrink-0" />
                <span>Bosaso, Somalia</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-white/40 flex-shrink-0" />
                <span>+252 905139816</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-white/40 flex-shrink-0" />
                <span>info@godolinstitute.so</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {socialIcons.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <a
                    key={idx}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Programs */}
          <div>
            <h4 className="font-semibold text-white text-sm uppercase tracking-wider mb-6">
              Programs
            </h4>
            <ul className="space-y-3 text-sm">
              {programs.map((program) => (
                <li key={program}>
                  <Link
                    href={`/courses?category=${encodeURIComponent(program)}`}
                    onClick={() => window.scrollTo(0, 0)}
                    className="hover:text-white transition-colors text-white/60"
                  >
                    {program}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Institution */}
          <div>
            <h4 className="font-semibold text-white text-sm uppercase tracking-wider mb-6">
              Institution
            </h4>
            <ul className="space-y-3 text-sm">
              {institutionLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => window.scrollTo(0, 0)}
                    className="hover:text-white transition-colors text-white/60"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Stay Updated */}
          <div>
            <h4 className="font-semibold text-white text-sm uppercase tracking-wider mb-6">
              Stay Updated
            </h4>
            <p className="text-white/60 mb-4 text-sm leading-relaxed">
              Get course announcements, executive workshop schedules, and East African business insights.
            </p>
            {subscribed ? (
              <div className="bg-white/10 border border-emerald-400/40 rounded-xl p-3 text-center text-xs text-emerald-300 flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Thank you for subscribing!</span>
              </div>
            ) : (
              <form className="flex flex-col gap-3" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="bg-white/10 border border-white/20 px-4 py-2.5 text-sm text-white placeholder:text-white/40 rounded-lg outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={isSubscribing}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg font-semibold px-4 py-2.5 text-sm transition-all shadow-md hover:brightness-105 disabled:opacity-60"
                  style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}
                >
                  <span>{isSubscribing ? 'Subscribing...' : 'Subscribe'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        <div
          className="h-px w-full mb-8"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <p>
            © {currentYear} Godol Institute of Business. All rights reserved. Mogadishu, Somalia.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" onClick={() => window.scrollTo(0, 0)} className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" onClick={() => window.scrollTo(0, 0)} className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

