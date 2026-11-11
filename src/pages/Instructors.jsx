import React, { useState, useEffect } from 'react';
import { Sparkles, X, CheckCircle, Send, Users, ShieldCheck, ArrowRight } from 'lucide-react';
import InstructorCard from '../components/InstructorCard';
import { apiFetch } from '../lib/api';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

export default function Instructors() {
  const [instructors, setInstructors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Application Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    expertise: 'Business Strategy & Leadership',
    bio: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadInstructors = (source) => {
    if (!source) setIsLoading(true);
    apiFetch('/api/instructors')
      .then(setInstructors)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadInstructors();
  }, []);

  // Instant Realtime sync: updates public faculty roster automatically
  useRealtimeSync(['instructors'], loadInstructors);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiFetch('/api/instructors/apply', {
        method: 'POST',
        body: JSON.stringify(applyForm)
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setIsApplyModalOpen(false);
        setSubmitSuccess(false);
        setApplyForm({
          name: '',
          email: '',
          phone: '',
          title: '',
          expertise: 'Business Strategy & Leadership',
          bio: ''
        });
      }, 3500);
    } catch (err) {
      alert(err.message || 'Error submitting application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <div
              className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
              style={{ background: 'hsl(42 92% 52% / 0.15)', color: 'hsl(42 92% 40%)' }}
            >
              Expert Instructors
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-4 text-foreground">
              Our Instructors
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Learn from industry practitioners, executives, and founders who have led real companies and managed real budgets in East Africa.
            </p>
          </div>

          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="self-start md:self-auto px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-md inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Apply to Teach with Us</span>
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-64 bg-muted/40 animate-pulse rounded-2xl" />
              ))}
          </div>
        ) : instructors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {instructors.map((instructor) => (
              <InstructorCard key={instructor.id} instructor={instructor} />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-md mx-auto my-12">
            <h3 className="text-lg font-bold text-foreground mb-2">Instructor Profiles Coming Soon</h3>
            <p className="text-sm text-muted-foreground">
              Distinguished instructors and guest executives will be listed here as courses are uploaded.
            </p>
          </div>
        )}

        {/* Apply CTA Banner at Bottom */}
        <div className="mt-20 bg-gradient-to-r from-slate-900 to-[hsl(215,72%,18%)] rounded-3xl p-8 md:p-12 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3">
              Faculty Admissions
            </div>
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2">
              Are you an experienced industry leader or executive?
            </h3>
            <p className="text-xs md:text-sm text-white/70 leading-relaxed">
              Share your business knowledge and lead high-impact cohorts for entrepreneurs and corporate professionals across Somalia and East Africa.
            </p>
          </div>

          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-full shadow-lg transition-all self-start md:self-auto inline-flex items-center gap-2"
          >
            <span>Submit Instructor Application</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Prospective Instructor Application Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsApplyModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-gray-900">Application Submitted!</h3>
                <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                  Thank you for applying. The Godol Institute Academic Directorate will review your application, verify your profile, and send your portal login credentials via WhatsApp or email.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2 text-primary">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">Join Godol Faculty</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-gray-900 mb-1">
                  Apply to Become an Instructor
                </h3>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                  Fill in your details below. Once approved by the administration, you will receive your official dashboard login.
                </p>

                <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Ahmed Hassan"
                      value={applyForm.name}
                      onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={applyForm.email}
                        onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700">WhatsApp / Phone *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+252 61 000 0000"
                        value={applyForm.phone}
                        onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700">Current Role / Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Financial Analyst"
                        value={applyForm.title}
                        onChange={(e) => setApplyForm({ ...applyForm, title: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700">Primary Expertise</label>
                      <select
                        value={applyForm.expertise}
                        onChange={(e) => setApplyForm({ ...applyForm, expertise: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary bg-white"
                      >
                        <option value="Business Strategy & Leadership">Business Strategy & Leadership</option>
                        <option value="Finance, Banking & Accounting">Finance, Banking & Accounting</option>
                        <option value="Digital Marketing & Growth">Digital Marketing & Growth</option>
                        <option value="Entrepreneurship & Trade">Entrepreneurship & Trade</option>
                        <option value="Human Resources & Management">Human Resources & Management</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">
                      Brief Experience & Background *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Outline your background, companies led, or subjects you would like to teach..."
                      value={applyForm.bio}
                      onChange={(e) => setApplyForm({ ...applyForm, bio: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2 mt-4"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Faculty Application</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
