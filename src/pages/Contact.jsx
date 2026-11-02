import React, { useState } from 'react';
import { Link } from 'wouter';
import {
  MapPin, Phone, Mail, Clock, MessageSquare, ArrowRight,
  CheckCircle, AlertCircle, HelpCircle, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { apiFetch } from '../lib/api';

const faqs = [
  {
    q: 'How does enrollment and payment verification work?',
    a: 'When you enroll in a course or workshop, you can pay via Somali mobile money (EVC Plus, Zaad, Sahal, Premier Wallet). After transferring, submit your transaction ID on the checkout page. Our admissions office verifies the transaction within a few hours and activates your student dashboard access.'
  },
  {
    q: 'Are certificates accredited by Godol Institute?',
    a: 'Yes. Every student who fulfills the course requirements and completes all modules receives a verifiable Certificate of Completion with a unique credential ID (e.g., GDL-2026-XXXX) that can be verified online by employers on our Certificate Verification page.'
  },
  {
    q: 'Are classes online, in-person, or hybrid?',
    a: 'We offer self-paced online video masterclasses accessible anywhere with internet, as well as intensive in-person executive workshops hosted at our Mogadishu campus.'
  },
  {
    q: 'Can corporate teams and organizations enroll employees?',
    a: 'Yes. We offer customized corporate executive training in financial management, strategy, leadership, and digital operations. Contact our corporate relations team via this form or WhatsApp.'
  }
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setSubmitted(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError(err.message || 'Unable to submit your message. Please reach out via WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 md:px-6">
      {/* Hero Header */}
      <section className="bg-[hsl(215,72%,18%)] pt-36 pb-20 text-white relative overflow-hidden text-center">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 text-white/90 text-xs font-semibold uppercase tracking-wider mb-5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Admissions & Inquiries</span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            Contact Godol Institute
          </h1>
          <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Our admissions counselors, student support staff, and corporate liaisons are here to guide your professional development journey.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 items-start">
            {/* Contact Details & WhatsApp */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                <h3 className="font-serif text-xl font-bold text-foreground mb-6">
                  Campus & Admissions Office
                </h3>

                <div className="space-y-5 text-sm">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-0.5">Campus Location</p>
                      <p className="font-medium text-foreground">Makka Al-Mukarama Road</p>
                      <p className="text-muted-foreground text-xs">Mogadishu, Somalia</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-0.5">Telephone Support</p>
                      <a href="tel:+252610000000" className="font-medium text-foreground hover:text-primary transition-colors">
                        +252 61 000 0000
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-0.5">Official Email</p>
                      <a href="mailto:info@godolinstitute.so" className="font-medium text-foreground hover:text-primary transition-colors">
                        info@godolinstitute.so
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-0.5">Office Hours</p>
                      <p className="font-medium text-foreground">Saturday – Thursday</p>
                      <p className="text-muted-foreground text-xs">8:00 AM – 5:00 PM (EAT)</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border">
                  <a
                    href="https://wa.me/252610000000?text=Hello%20Godol%20Institute%20Admissions,%20I%20would%20like%20to%20inquire%20about%20your%20programs."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs text-center flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Direct Chat on WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Credential verification teaser */}
              <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 text-center">
                <h4 className="font-bold text-sm text-foreground mb-1">Employer or Graduate?</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Verify the authenticity of any Godol Institute certificate with our instant credential registry.
                </p>
                <Link
                  href="/verify"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  Go to Certificate Verification →
                </Link>
              </div>
            </div>

            {/* Inbound Message Form */}
            <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-8 md:p-10 shadow-sm">
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">
                Send Us an Inquiry
              </h2>
              <p className="text-muted-foreground text-sm mb-8">
                Fill in the details below and an admissions officer will respond to your email and phone number within 24 hours.
              </p>

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-3xl p-10 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold">Inquiry Received</h3>
                  <p className="text-sm text-emerald-700 max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out to Godol Institute of Business. A copy of your request has been routed to our admissions team.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 px-6 py-2.5 rounded-full bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
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
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Mohamed Ali"
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
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="e.g. mohamed@example.com"
                        className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Phone / WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+252 61 234 5678"
                        className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Subject / Program of Interest
                      </label>
                      <input
                        type="text"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        placeholder="e.g. Executive Strategy, Financial Modeling"
                        className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Your Message *
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us about your educational background, current professional role, or questions you have..."
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <span>{isSubmitting ? 'Sending Your Message...' : 'Submit Inquiry'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="mt-24 max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h3 className="font-serif text-3xl font-bold text-foreground mb-2">
                Frequently Asked Questions
              </h3>
              <p className="text-muted-foreground text-sm">
                Quick answers regarding admissions, certifications, and payment verification.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-5 text-left flex items-center justify-between font-semibold text-sm text-foreground hover:bg-muted/30 transition-colors"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/50">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

