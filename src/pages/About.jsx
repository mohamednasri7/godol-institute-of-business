import React from 'react';
import { Link } from 'wouter';
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
  { year: '2019', event: 'Godol Institute founded in Mogadishu with 3 courses and 40 students' },
  { year: '2020', event: 'Launched online learning platform — expanded reach to the diaspora' },
  { year: '2021', event: 'Introduced live workshops in Mogadishu; graduated first cohort of 80 students' },
  { year: '2022', event: 'Partnered with three East African universities for credit recognition' },
  { year: '2023', event: 'Expanded to 30+ courses across 8 business disciplines' },
  { year: '2024', event: 'Surpassed 500 graduates; opened a second Mogadishu campus location' },
  { year: '2025', event: 'Launched scholarship program for women in business' },
  { year: '2026', event: 'Introducing MBA-equivalent Executive Program for senior leaders' }
];

const leadershipTeam = [
  {
    name: 'Dr. Abdi Hassan',
    role: 'Founder & Executive Director',
    bio: 'Former Director of Finance at the Central Bank of Somalia with 20 years of experience in East African financial systems.'
  },
  {
    name: 'Maryam Warsame',
    role: 'Academic Dean',
    bio: 'MBA from London Business School. Led academic programs at three East African universities before joining Godol.'
  },
  {
    name: 'Faisal Ahmed',
    role: 'Head of Entrepreneurship',
    bio: 'Serial entrepreneur with 4 successful ventures across Somalia, Kenya, and Ethiopia. Angel investor and startup mentor.'
  },
  {
    name: 'Hodan Nur',
    role: 'Director of Industry Relations',
    bio: "Connected Godol's graduates with over 100 companies across East Africa. Former HR Director at SomTel."
  }
];

const alumniReviews = [
  {
    name: 'Faadumo Omar',
    role: 'Founder, Dalmar Foods Co.',
    quote:
      'Godol Institute gave me the business frameworks and confidence to scale my family recipe business into a company with 40 employees. The instructors understand the Somali market deeply.',
    rating: 5
  },
  {
    name: 'Abdirizak Mohamed',
    role: 'CFO, Amal Bank',
    quote:
      'The Financial Management program was exactly what I needed to advance my career. Rigorous content, practical case studies, and a network of genuinely serious professionals.',
    rating: 5
  },
  {
    name: 'Hodan Ali',
    role: 'Marketing Director, SomTel',
    quote:
      "After completing the Digital Marketing workshop, our online sales doubled within three months. These aren't just theories — they're tools that work in the Somali context.",
    rating: 5
  },
  {
    name: 'Yusuf Ibrahim',
    role: 'CEO, Horyaal Transport',
    quote:
      'The Leadership program transformed how I run my company. My team is more engaged, decisions are faster, and we grew 60% last year. I send every one of my managers here now.',
    rating: 5
  },
  {
    name: 'Safiya Hassan',
    role: 'Entrepreneur & Godol Scholar',
    quote:
      'As a scholarship recipient, Godol changed the trajectory of my life. I started a trading company three months after graduating. This institution believes in Somali women.',
    rating: 5
  },
  {
    name: 'Omar Farah',
    role: 'Finance Manager, Dahabshiil',
    quote:
      'The Accounting and Finance course is structured better than what I studied at university. Real-world, practical, and taught by people who actually work in finance in Somalia.',
    rating: 5
  }
];

export default function About() {
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
            <span>Mogadishu, Somalia — Est. 2019</span>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6">
            About Godol Institute
          </h1>
          <p className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Somalia's premier business education institution — built to empower a new generation of East African business leaders.
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
                Business education built for East Africa, by East Africa
              </h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-6">
                Godol Institute was founded in 2019 on a simple but powerful belief: Somalia and East Africa deserve world-class business education that understands their unique context, challenges, and opportunities.
              </p>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8">
                Too much business education imported from the West fails to account for our markets, our legal environments, our financing realities, and our cultural business practices. We built Godol to fix that.
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
              From a small classroom in Mogadishu to East Africa's leading business institute.
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

      {/* Testimonials */}
      <section id="testimonials" className="py-20 section-dark relative overflow-hidden text-white">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              What Our Alumni Say
            </h2>
            <p className="text-white/60 text-lg">
              Graduates who are now leading businesses and careers across East Africa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alumniReviews.map((item) => (
              <div
                key={item.name}
                className="rounded-2xl p-7 h-full flex flex-col"
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
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs"
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

      {/* Leadership */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="font-serif text-4xl font-bold mb-4 text-foreground">
              Leadership Team
            </h2>
            <p className="text-muted-foreground text-lg">
              The experienced professionals building the future of business education in Somalia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {leadershipTeam.map(({ name, role, bio }) => (
              <div
                key={name}
                className="bg-card border border-border rounded-2xl p-6 h-full hover:shadow-md hover:border-primary/20 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl hero-gradient flex items-center justify-center mb-4 font-serif font-bold text-xl text-white">
                  {name
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')}
                </div>
                <h3 className="font-bold text-base mb-1 text-foreground">{name}</h3>
                <p className="text-primary text-xs font-semibold mb-3">{role}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{bio}</p>
              </div>
            ))}
          </div>
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
                    value: 'Makka Al-Mukarama Road, Mogadishu, Somalia'
                  },
                  { icon: Phone, label: 'Phone', value: '+252 61 000 0000' },
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
                  href="https://wa.me/252610000000"
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
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Thank you! Your message has been sent to our admissions team.');
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Your name"
                      className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      required
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
                    required
                    placeholder="Course enquiry, admissions, etc."
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us how we can help..."
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  <span>Send Message</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

