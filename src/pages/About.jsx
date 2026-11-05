import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { apiFetch } from '../lib/api';
import {
  Sparkles,
  CheckCircle,
  GraduationCap,
  BookOpen,
  Award,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Target,
  ShieldCheck,
  Globe,
  Star
} from 'lucide-react';

const coreValues = [
  {
    icon: Target,
    title: 'Relevance',
    desc: 'Every course is built around real Somali and East African business challenges — not generic case studies from other continents.'
  },
  {
    icon: ShieldCheck,
    title: 'Excellence',
    desc: 'We hold our faculty and curriculum to the highest standards, continuously updating content to reflect the evolving business landscape.'
  },
  {
    icon: Globe,
    title: 'Accessibility',
    desc: 'World-class education should be available to every ambitious professional in Somalia, regardless of where they are or their schedule.'
  },
  {
    icon: TrendingUp,
    title: 'Impact',
    desc: 'We measure success not by enrollment numbers but by the businesses launched, careers advanced, and communities strengthened by our graduates.'
  }
];

const timeline = [
  { year: 'June 2025', event: 'Godol Institute founded in Bosaso with core business courses and professional cohorts' },
  { year: 'Late 2025', event: 'Launched online learning platform — expanding practical business education across East Africa' },
  { year: 'Early 2026', event: 'Introduced executive live workshops in Bosaso; expanded faculty of industry practitioners' },
  { year: '2026', event: 'Introducing MBA-equivalent Executive Programs for emerging Somali entrepreneurs' }
];



const alumniReviews = [
  {
    name: 'Practical Frameworks',
    role: 'Market-Tested Curriculum',
    initials: 'PF',
    quote:
      'Every concept taught inside our programs is grounded in practical case studies and modern market tools. You study real financial, management, and operational frameworks you can apply directly to your enterprise on day one.',
    rating: 5
  },
  {
    name: 'Active Problem Solving',
    role: 'Collaborative & Project-Based',
    initials: 'AP',
    quote:
      'We reject pure theoretical lectures. Our learning model combines structured self-study with live, scenario-based workshops where students break down real regional business challenges in collaborative sprints.',
    rating: 5
  },
  {
    name: 'Regional Relevance',
    role: 'Localized Strategy & Direct Feedback',
    initials: 'RR',
    quote:
      'Global business principles adapted to local realities. Our programs connect learners with seasoned mentors who understand the regulatory, operational, and commercial landscape of Somalia and East Africa.',
    rating: 5
  }
];

export default function About() {
  const [faculty, setFaculty] = useState([]);
  const [settings, setSettings] = useState({});
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    apiFetch('/api/instructors').then(setFaculty).catch(() => {});
    apiFetch('/api/settings').then(res => setSettings(res.map || {})).catch(() => {});
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setSendError('');
    try {
      await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(contactForm)
      });
      setSentSuccess(true);
      setContactForm({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSentSuccess(false), 5000);
    } catch (err) {
      setSendError(err.message || 'Failed to send message. Please try again or chat via WhatsApp.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="hero-gradient pt-36 pb-20 relative overflow-hidden text-white text-center">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '80px 80px'
          }}
        />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 text-white/90 text-sm font-medium mb-6 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>{settings.home_badge_text || 'Bosaso, Somalia — Est. 2025'}</span>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6">
            {settings.about_hero_title || 'About Godol Institute'}
          </h1>
          <p className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            {settings.about_hero_subtitle || "Somalia's premier business education institution — built to empower a new generation of East African business leaders."}
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div
                className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-5"
                style={{ background: 'hsl(42 92% 52% / 0.15)', color: 'hsl(42 92% 40%)' }}
              >
                Our Mission
              </div>
              <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6 text-foreground leading-tight">
                {settings.about_mission_title || 'Business education built for East Africa, by East Africa'}
              </h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-6">
                {settings.about_mission_text || 'Godol Institute was founded in June 2025 on a simple but powerful belief: Somalia and East Africa deserve world-class business education that understands their unique context, challenges, and opportunities.'}
              </p>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8">
                {settings.about_mission_text_secondary || 'Too much business education imported from the West fails to account for our markets, our legal environments, our financing realities, and our cultural business practices. We built Godol to fix that.'}
              </p>
              <div className="flex flex-col gap-3.5">
                {[
                  'Curriculum designed for Somali and East African business realities',
                  'Faculty drawn from successful local practitioners',
                  'Bilingual delivery in Somali and English'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground font-medium text-sm md:text-base">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: GraduationCap, val: '500+', label: 'Graduates' },
                { icon: BookOpen, val: '40+', label: 'Courses' },
                { icon: Award, val: '20+', label: 'Expert Faculty' },
                { icon: TrendingUp, val: '5+', label: 'Years of Impact' }
              ].map(({ icon: Icon, val, label }) => (
                <div
                  key={label}
                  className="bg-card border border-border rounded-2xl p-6 text-center hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="font-serif text-3xl font-bold text-foreground mb-1">{val}</div>
                  <p className="text-xs text-muted-foreground font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-serif text-4xl font-bold mb-4 text-foreground">
              Our Core Values
            </h2>
            <p className="text-muted-foreground text-lg">
              The principles that guide every course, every workshop, and every graduate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-card border border-border rounded-2xl p-6 h-full hover:border-primary/30 hover:shadow-lg transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="font-serif text-4xl font-bold mb-4 text-foreground">Our Story</h2>
            <p className="text-muted-foreground text-lg">
              From our founding campus in Bosaso to East Africa's leading business institute.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="relative pl-8 border-l-2 border-primary/30 space-y-8">
              {timeline.map((item) => (
                <div key={item.year} className="relative">
                  <div className="absolute -left-[2.55rem] top-1 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full w-fit">
                      {item.year}
                    </span>
                    <p className="text-foreground font-medium text-sm md:text-base">
                      {item.event}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Value Pillars / Institute Commitment Section */}
      <section id="testimonials" className="py-20 section-dark relative overflow-hidden text-white">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Built for Real-World Business Impact
            </h2>
            <p className="text-white/60 text-lg">
              Designed from the ground up to equip professionals and entrepreneurs across East Africa with immediate, actionable capability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {alumniReviews.map((item) => (
              <div
                key={item.name}
                className="rounded-2xl p-7 h-full flex flex-col backdrop-blur-sm"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <div className="flex gap-1 mb-4">
                  {Array(item.rating)
                    .fill(0)
                    .map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                </div>
                <p className="text-white/80 leading-relaxed flex-grow mb-5 italic text-sm">
                  "{item.quote}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                    style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}
                  >
                    {item.initials || item.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{item.name}</p>
                    <p className="text-white/50 text-xs">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Director & Leadership Message (Configurable in Dashboard) */}
      {(settings.about_director_message || settings.about_director_name) && (
        <section className="py-20 bg-card border-y border-border">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10">
              <img
                src={settings.about_director_image || '/instructor-1.png'}
                alt={settings.about_director_name || 'Academic Director'}
                className="w-36 h-36 md:w-44 md:h-44 rounded-3xl object-cover border-4 border-primary/20 shadow-xl flex-shrink-0"
              />
              <div className="space-y-4 text-center md:text-left">
                <div
                  className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold tracking-widest uppercase"
                  style={{ background: 'hsl(42 92% 52% / 0.15)', color: 'hsl(42 92% 40%)' }}
                >
                  Academic Leadership
                </div>
                <h3 className="font-serif text-3xl font-bold text-foreground">
                  Message from the Academic Director
                </h3>
                <blockquote className="text-muted-foreground text-base md:text-lg italic leading-relaxed">
                  "{settings.about_director_message || 'At Godol Institute, we do not teach abstract business theories from other continents. We teach practical frameworks tested in local markets, financing realities, and fast-growing regional economies.'}"
                </blockquote>
                <div>
                  <p className="font-bold text-foreground text-base">
                    {settings.about_director_name || 'Dr. Mohamed Godol'}
                  </p>
                  <p className="text-xs text-primary font-semibold">
                    {settings.about_director_title || 'Founder & Academic Director'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Leadership */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="font-serif text-4xl font-bold mb-4 text-foreground">
              Instructors & Leadership
            </h2>
            <p className="text-muted-foreground text-lg">
              Experienced practitioners and executive educators at Godol Institute of Business.
            </p>
          </div>

          {faculty.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {faculty.map((member) => (
                <div
                  key={member.id}
                  className="bg-card border border-border rounded-2xl p-6 h-full hover:shadow-md hover:border-primary/20 transition-all"
                >
                  <img
                    src={member.avatar || '/instructor-1.png'}
                    alt={member.name}
                    className="w-16 h-16 rounded-2xl object-cover mb-4 border border-border"
                  />
                  <h3 className="font-bold text-base mb-1 text-foreground">{member.name}</h3>
                  <p className="text-primary text-xs font-semibold mb-2">{member.title}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{member.bio}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-10 text-center max-w-lg mx-auto">
              <h3 className="font-bold text-base text-foreground mb-2">Instructor & Leadership Profiles</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Instructors and department heads will be officially listed here as new academic sessions launch.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
            <div>
              <div
                className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-5"
                style={{ background: 'hsl(42 92% 52% / 0.15)', color: 'hsl(42 92% 40%)' }}
              >
                Get in Touch
              </div>
              <h2 className="font-serif text-4xl font-bold mb-5 text-foreground">
                Contact Godol Institute
              </h2>
              <p className="text-muted-foreground text-base md:text-lg mb-8 leading-relaxed">
                Have questions about our programs, admissions, or partnerships? Our team is ready to help.
              </p>

              <div className="space-y-5">
                {[
                  {
                    icon: MapPin,
                    label: 'Address',
                    value: 'Bosaso, Somalia'
                  },
                  { icon: Phone, label: 'Phone', value: '+252 905139816' },
                  { icon: Mail, label: 'Email', value: 'info@godolinstitute.so' }
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
                        {label}
                      </p>
                      <p className="text-foreground font-medium text-sm">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <a
                  href="https://wa.me/252905139816"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm shadow-md transition-transform hover:scale-105"
                  style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}
                >
                  <span>Chat on WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
              <h3 className="font-serif text-2xl font-bold mb-6 text-foreground">
                Send Us a Message
              </h3>
              {sentSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-6 text-center space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-bold text-base">Message Sent Successfully!</p>
                  <p className="text-xs text-emerald-700">Thank you for reaching out. Our admissions team in Bosaso will review your enquiry and respond promptly.</p>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleContactSubmit}>
                  {sendError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                      {sendError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="Your full name"
                        className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="you@example.com"
                        className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      placeholder="Course inquiry, cohort dates, corporate training..."
                      className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Message *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Tell us how we can assist your educational goals..."
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <span>{isSending ? 'Sending Message...' : 'Send Message'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

