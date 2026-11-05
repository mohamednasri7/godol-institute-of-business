import React from 'react';
import { Link } from 'wouter';
import { ShieldCheck, Lock, Eye, Database, FileText, ArrowLeft } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <section className="bg-[hsl(215,72%,18%)] pt-36 pb-16 text-white text-center">
        <div className="container mx-auto px-4 md:px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 text-white/90 text-xs font-semibold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Institutional Governance</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-white/70 text-sm max-w-xl mx-auto">
            Effective Date: January 1, 2026 • Godol Institute of Business, Bosaso, Somalia
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 max-w-4xl py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mb-8 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>

        <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-sm space-y-8 text-foreground/80 leading-relaxed text-sm">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-3">1. Introduction</h2>
            <p>
              Godol Institute of Business ("Godol Institute", "we", "our", or "the Institute") is committed to protecting the privacy, confidentiality, and data sovereignty of all students, faculty members, workshop attendees, and portal visitors. This Privacy Policy details how we collect, process, and protect your information when utilizing our educational platform, courses, mobile money verification workflows, and campus facilities in Bosaso, Somalia.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect information strictly necessary to provide academic instruction, process admissions, and issue verifiable credentials:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Student Registration Details:</strong> Full legal name, email address, telephone/WhatsApp number, and academic/professional background.</li>
              <li><strong>Transaction & Payment Information:</strong> Mobile money transaction reference numbers (EVC Plus, Telesom Zaad, Sahal, Premier Wallet), sender phone numbers, payment amounts, and verification receipts. <em>We do not store banking credentials or private mobile money PIN codes.</em></li>
              <li><strong>Learning Progress & Records:</strong> Course completion timestamps, syllabus module progress, attendance in executive workshops, and accredited certificate issuance IDs.</li>
              <li><strong>Communications:</strong> Inquiries, admissions submissions, and messages exchanged via our portal or official WhatsApp advisory line.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-3">3. How Your Information Is Used</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To create and administer student and faculty accounts on the Godol Institute platform.</li>
              <li>To manually verify mobile payment transfers and grant authorized access to digital courseware.</li>
              <li>To issue verifiable, cryptographic or permanent certificate numbers (format: <code>GDL-2026-XXXX</code>) accessible via our public credential verification registry.</li>
              <li>To communicate cohort updates, campus announcements, and academic scheduling.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-3">4. Data Security & Storage</h2>
            <p>
              All academic databases and user profiles are safeguarded using industry-standard transport layer security (TLS/SSL) encryption and secure PostgreSQL infrastructure with Row Level Security (RLS). Access to administrative tools is restricted to authorized academic personnel through role-based access control.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-3">5. Third-Party Sharing</h2>
            <p>
              Godol Institute does not sell, rent, or trade student personal information to commercial data brokers. Information is shared only with verified institutional partners (such as academic credit transfer universities) with explicit student consent, or when required by Somali national regulatory authorities.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-3">6. Contact Data Protection Officer</h2>
            <p>
              If you have inquiries regarding your personal data, wish to update your records, or request account closure, contact our administrative office:
            </p>
            <div className="mt-3 p-4 bg-muted/40 rounded-2xl">
              <p className="font-bold text-foreground">Godol Institute of Business — Registrar & Data Compliance</p>
              <p className="text-xs text-muted-foreground mt-0.5">Bosaso, Somalia</p>
              <p className="text-xs text-primary font-medium mt-1">Email: info@godolinstitute.so • Phone: +252 905139816</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

