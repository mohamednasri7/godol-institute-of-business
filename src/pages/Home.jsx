import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  MapPin,
  Search,
  CheckCircle,
  GraduationCap,
  BookOpen,
  Award,
  Star,
  ArrowRight,
  TrendingUp,
  BarChart2,
  PenTool,
  Tv,
  Users,
  Calendar,
  Sparkles
} from 'lucide-react';
import CourseCard from '../components/CourseCard';
import InstructorCard from '../components/InstructorCard';
import { apiFetch } from '../lib/api';

export default function Home() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState(null);
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  useEffect(() => {
    apiFetch('/api/stats').then(setStats).catch(() => {});
    apiFetch('/api/courses/featured').then(setFeaturedCourses).catch(() => {});
    apiFetch('/api/instructors').then(setInstructors).catch(() => {});
    apiFetch('/api/workshops').then(setWorkshops).catch(() => {});
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (selectedLevel) params.set('level', selectedLevel);
    setLocation(`/courses${params.toString() ? '?' + params.toString() : ''}`);
  };

  const programs = [
    {
      icon: TrendingUp,
      title: 'Business Strategy',
      desc: 'Master strategic planning, competitive analysis, and execution frameworks used by top African enterprises.'
    },
    {
      icon: BarChart2,
      title: 'Finance & Accounting',
      desc: 'Build financial literacy from budgeting and cash flow to investment analysis and corporate finance.'
    },
    {
      icon: PenTool,
      title: 'Entrepreneurship',
      desc: 'From idea validation to funding and scaling — everything you need to build a thriving business in Somalia.'
    },
    {
      icon: Tv,
      title: 'Digital Marketing',
      desc: 'Grow your brand online with proven marketing strategies, social media, SEO, and data-driven campaigns.'
    },
    {
      icon: Users,
      title: 'Leadership & HR',
      desc: 'Develop the leadership skills and people management practices that drive high-performing organizations.'
    },
    {
      icon: Calendar,
      title: 'Live Workshops',
      desc: 'Intensive in-person sessions in Mogadishu led by industry practitioners for hands-on, real-world learning.'
    }
  ];

  const testimonials = [
    {
      name: 'Faadumo Omar',
      role: 'Founder, Dalmar Foods',
      quote:
        "Godol Institute's Entrepreneurship program gave me the tools and confidence to turn my family recipe business into a company with 40 employees. The instructors understand the Somali market.",
      rating: 5
    },
    {
      name: 'Abdirizak Mohamed',
      role: 'CFO, Amal Bank',
      quote:
        'The Financial Management course was exactly what I needed to advance my career. Rigorous content, practical case studies, and a network of serious professionals.',
      rating: 5
    },
    {
      name: 'Hodan Ali',
      role: 'Marketing Director, SomTel',
      quote:
        'I enrolled in the Digital Marketing workshop and within three months our online sales doubled. The instructors bring real expertise — not just theory.',
      rating: 5
    }
  ];

  const defaultWorkshops = [
    {
      title: 'Strategic Business Planning Masterclass',
      date: 'June 14–15, 2026',
      location: 'Mogadishu, Somalia',
      seats: 18,
      tag: 'Limited Seats'
    },
    {
      title: 'Financial Modeling for Entrepreneurs',
      date: 'July 5, 2026',
      location: 'Mogadishu, Somalia',
      seats: 25,
      tag: 'New'
    },
    {
      title: 'Leadership & Team Management Workshop',
      date: 'July 19–20, 2026',
      location: 'Mogadishu, Somalia',
      seats: 20,
      tag: 'Popular'
    }
  ];

  const displayWorkshops = workshops.length > 0 ? workshops : defaultWorkshops;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient relative min-h-screen flex items-center overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, hsl(42 92% 60%), transparent)' }}
          />
          <div
            className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-5"
            style={{ background: 'radial-gradient(circle, white, transparent)' }}
          />
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '80px 80px'
            }}
          />
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10 pt-32 pb-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Tag badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 text-white/90 text-sm font-medium mb-8 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Mogadishu, Somalia — Est. 2019</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
              Shaping East Africa's
              <span className="block text-accent">Business Leaders</span>
            </h1>

            {/* Subtitle */}
            <p className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Godol Institute delivers world-class business education rooted in the realities of the Somali and East African market. Online courses, live workshops, and a network of professionals who are building the future of this region.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center rounded-full h-14 px-9 text-base font-bold shadow-xl transition-transform hover:scale-105"
                style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}
              >
                Browse All Courses
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center justify-center rounded-full h-14 px-9 text-base font-medium border border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
              >
                Upcoming Workshops <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>

            {/* Search Bar Form */}
            <div className="max-w-2xl mx-auto mb-12">
              <form
                onSubmit={handleSearchSubmit}
                className="flex flex-col sm:flex-row gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search courses, topics, skills…"
                    className="w-full bg-transparent pl-10 pr-3 py-2.5 text-white placeholder:text-white/40 text-sm outline-none"
                  />
                </div>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="bg-white/10 border border-white/20 text-white/80 text-sm rounded-xl px-3 py-2 outline-none cursor-pointer"
                >
                  <option value="" className="bg-[hsl(215,72%,16%)] text-white">All Levels</option>
                  <option value="beginner" className="bg-[hsl(215,72%,16%)] text-white">Beginner</option>
                  <option value="intermediate" className="bg-[hsl(215,72%,16%)] text-white">Intermediate</option>
                  <option value="advanced" className="bg-[hsl(215,72%,16%)] text-white">Advanced</option>
                </select>
                <button
                  type="submit"
                  className="rounded-xl px-6 py-2.5 font-bold text-sm shrink-0 transition-transform hover:brightness-105"
                  style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}
                >
                  Search
                </button>
              </form>

              {/* Popular tags */}
              <div className="flex flex-wrap gap-2 mt-3.5 justify-center">
                {['Entrepreneurship', 'Financial Management', 'Digital Marketing', 'Islamic Finance'].map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setLocation(`/courses?q=${encodeURIComponent(topic)}`)}
                    className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors border border-white/10"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Checklist */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 pt-8 border-t border-white/10 text-white/70 text-sm font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Accredited Curriculum</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Industry-Expert Faculty</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Lifetime Certificate Access</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Somali & English Content</span>
              </div>
            </div>
          </div>
        </div>

        {/* Curved bottom separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 60L1440 60L1440 30C1200 60 960 0 720 0C480 0 240 60 0 30L0 60Z"
              fill="hsl(40 20% 98%)"
            />
          </svg>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {[
              { label: 'Graduates', value: '12k+', icon: GraduationCap },
              { label: 'Business Courses', value: stats?.totalCourses || 48, icon: BookOpen },
              { label: 'Expert Instructors', value: stats?.totalInstructors || 24, icon: Award },
              { label: 'Average Rating', value: `${stats?.avgRating || 4.9}/5`, icon: Star }
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-3 mx-auto">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-foreground mb-1 font-serif">
                  {value}
                </div>
                <p className="text-sm text-muted-foreground font-medium tracking-wide">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-24 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div
              className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
              style={{ background: 'hsl(42 92% 52% / 0.15)', color: 'hsl(42 92% 40%)' }}
            >
              Our Programs
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Everything You Need to Lead
            </h2>
            <p className="text-muted-foreground text-lg">
              Six areas of business excellence, taught by practitioners who have built real companies and led real teams.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map(({ icon: Icon, title, desc }) => (
              <Link
                key={title}
                href={`/courses?category=${encodeURIComponent(title)}`}
                className="group h-full bg-card border border-border rounded-2xl p-7 hover:border-primary/40 hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground group-hover:text-primary transition-colors">
                  {title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-1">
                  {desc}
                </p>
                <div className="flex items-center text-primary text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ArrowRight className="ml-1 w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Live in Mogadishu Workshops Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div
                className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
                style={{ background: 'hsl(42 92% 52% / 0.15)', color: 'hsl(42 92% 40%)' }}
              >
                Live in Mogadishu
              </div>
              <h2 className="font-serif text-4xl font-bold mb-2 text-foreground">
                Upcoming Workshops
              </h2>
              <p className="text-muted-foreground">
                Intensive in-person sessions. Seats are limited.
              </p>
            </div>
            <Link
              href="/categories"
              className="rounded-full px-6 py-2.5 text-sm font-semibold border border-border hover:bg-muted self-start md:self-auto transition-colors"
            >
              View all workshops
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayWorkshops.slice(0, 3).map((w, idx) => (
              <div
                key={w.title || idx}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-primary/30 transition-all h-full flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <span
                    className="text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded-full"
                    style={
                      w.tag === 'Limited Seats'
                        ? { background: 'hsl(0 84% 60% / 0.1)', color: 'hsl(0 84% 50%)' }
                        : w.tag === 'New'
                        ? { background: 'hsl(42 92% 52% / 0.15)', color: 'hsl(42 92% 38%)' }
                        : { background: 'hsl(215 72% 24% / 0.1)', color: 'hsl(215 72% 30%)' }
                    }
                  >
                    {w.tag || 'Upcoming'}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {w.seats || 20} seats left
                  </span>
                </div>
                <h3 className="font-bold text-base mb-3 text-foreground flex-grow">
                  {w.title}
                </h3>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{w.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{w.location}</span>
                  </div>
                </div>
                <Link
                  href="/register"
                  className="w-full text-center py-2.5 rounded-full border border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold text-sm transition-colors"
                >
                  Reserve Your Seat
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="max-w-xl">
              <h2 className="font-serif text-4xl font-bold mb-2 text-foreground">
                Featured Courses
              </h2>
              <p className="text-muted-foreground text-lg">
                Our most impactful programs, built for the East African business landscape.
              </p>
            </div>
            <Link
              href="/courses"
              className="group inline-flex items-center gap-1 font-semibold text-primary hover:underline self-start md:self-auto"
            >
              All Courses <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCourses.length > 0
              ? featuredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))
              : Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="h-80 bg-muted/40 animate-pulse rounded-2xl" />
                  ))}
          </div>
        </div>
      </section>

      {/* Alumni Testimonials Section */}
      <section className="py-24 section-dark relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
              What Our Alumni Say
            </h2>
            <p className="text-white/60 text-lg">
              Graduates who are now leading businesses across East Africa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((item) => (
              <div
                key={item.name}
                className="rounded-2xl p-7 h-full flex flex-col"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <div className="flex gap-1 mb-5">
                  {Array(item.rating)
                    .fill(0)
                    .map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                </div>
                <p className="text-white/80 leading-relaxed flex-grow mb-6 italic text-sm">
                  "{item.quote}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}
                  >
                    {item.name
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

      {/* Faculty & Instructors Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Faculty & Experts
            </h2>
            <p className="text-muted-foreground text-lg">
              Practitioners who have built companies, led teams, and shaped industries — now sharing what they know.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {instructors.slice(0, 4).map((inst) => (
              <InstructorCard key={inst.id} instructor={inst} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Cohort Section */}
      <section className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient opacity-95" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '80px 80px'
          }}
        />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div
              className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
              style={{ background: 'hsl(42 92% 52% / 0.2)', color: 'hsl(42 92% 65%)' }}
            >
              Next Cohort — July 2026
            </div>
            <h2 className="font-serif text-4xl md:text-6xl font-bold text-white mb-6">
              Ready to Transform Your Career?
            </h2>
            <p className="text-white/75 text-xl mb-10 leading-relaxed">
              Join hundreds of professionals across Somalia and East Africa who have advanced their careers through Godol Institute.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full h-14 px-10 text-base font-bold shadow-xl transition-transform hover:scale-105"
                style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}
              >
                Apply for Next Cohort
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center rounded-full h-14 px-10 text-base font-medium border border-white/30 text-white bg-white/10 hover:bg-white/20 transition-all"
              >
                Explore Courses
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

