import React from 'react';
import { Link } from 'wouter';
import { FileText, Award, CreditCard, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <section className="bg-[hsl(215,72%,18%)] pt-36 pb-16 text-white text-center">
        <div className="container mx-auto px-4 md:px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 text-white/90 text-xs font-semibold uppercase tracking-wider mb-4">
            <FileText className="w-4 h-4 text-accent" />
            <span>Academic Guidelines</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-3">Terms of Service</h1>
          <p className="text-white/70 text-sm max-w-xl mx-auto">
            Governing admissions, course enrollment, mobile money transactions, and academic certificates.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 max-w-4xl py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mb-8 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>

        <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-sm space-y-8 text-foreground/80 leading-relaxed text-sm">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing the website, registering an account, enrolling in programs, or attending live workshops organized by Godol Institute of Business ("Godol Institute", "the Institute"), you agree to abide by these Terms of Service and all applicable laws and regulations of the Federal Republic of Somalia.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-3">2. Admissions & Course Enrollment</h2>
            <p className="mb-3">
              Enrollment in Godol Institute programs is granted on an individual basis. Students must provide authentic contact credentials. Course access is non-transferable and may not be resold, shared, or redistributed without written approval from the Institute.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-3">3. Tuition & Mobile Money Payment Verification</h2>
            <p className="mb-2">
              Course fees are denominated in United States Dollars (USD) or equivalent Somali Shillings. Because electronic card processing is not ubiquitous across the region:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Tuition payments are accepted via EVC Plus, Telesom Zaad, Sahal, or Premier Wallet to the designated official accounts published on our portal.</li>
              <li>Students must submit a valid transaction reference code and the originating phone number on the checkout verification form.</li>
              <li>Course activation occurs following verification by our accounting team, typically within 2 to 24 hours of submission.</li>
              <li>Providing false transaction numbers constitutes a breach of the Student Code of Conduct and will result in permanent suspension.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-3">4. Intellectual Property & Course Materials</h2>
            <p>
              All video lectures, syllabus materials, financial models, case studies, downloadable slides, and trademarks are the exclusive property of Godol Institute of Business or its licensed faculty. Recording, downloading for unauthorized distribution, or re-publishing course content is strictly prohibited.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-3">5. Certificate Issuance & Verification</h2>
            <p>
              Certificates of Completion are granted solely to students who fulfill all curriculum lessons and submit required practical assignments. All credentials carry a permanent registry identifier verifiable on our online portal. Any alteration of physical or digital certificates will result in immediate revocation.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-3">6. Governing Law & Jurisdiction</h2>
            <p>
              These Terms shall be governed and interpreted in accordance with the commercial and civil laws of Somalia. Any disputes arising in connection with these terms shall be subject to the jurisdiction of the competent courts in Bosaso, Somalia.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

