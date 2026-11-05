import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import {
  ShieldCheck, Search, Award, CheckCircle, AlertTriangle,
  Download, Printer, Share2, Sparkles, Building, Calendar, ArrowRight
} from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function VerifyCertificate() {
  const params = useParams();
  const initialCode = params.code || new URLSearchParams(window.location.search).get('code') || '';

  const [searchCode, setSearchCode] = useState(initialCode);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  const performVerification = async (codeToVerify) => {
    const code = (codeToVerify || searchCode).trim();
    if (!code) return;
    setIsLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const data = await apiFetch(`/api/certificates/verify/${encodeURIComponent(code)}`);
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err.message || 'No matching credential found for this ID.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      performVerification(initialCode);
    }
  }, [initialCode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    performVerification();
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Banner */}
      <section className="bg-[hsl(215,72%,18%)] pt-36 pb-20 text-white text-center relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 text-white/90 text-xs font-semibold uppercase tracking-wider mb-5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Official Credential Registry</span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            Verify Certificate of Completion
          </h1>
          <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Validate the academic authenticity and graduation status of Godol Institute of Business credentials.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto mt-8 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                placeholder="Enter Certificate ID (e.g. GDL-2026-1049)"
                className="w-full h-13 pl-12 pr-4 rounded-2xl bg-white text-gray-900 font-mono text-sm shadow-lg outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="h-13 px-8 rounded-2xl font-bold text-sm shadow-lg transition-transform hover:scale-105 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}
            >
              <span>{isLoading ? 'Verifying...' : 'Verify Credential'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>

      {/* Verification Result */}
      <section className="container mx-auto px-4 md:px-6 -mt-8 relative z-20">
        <div className="max-w-3xl mx-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center shadow-lg space-y-3">
              <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-red-900">Credential Not Found</h3>
              <p className="text-sm text-red-700 max-w-md mx-auto leading-relaxed">
                The identifier <code className="font-mono font-bold bg-red-100 px-2 py-0.5 rounded">{searchCode}</code> does not match any authenticated graduation record in our registry. Please check the ID or contact admissions.
              </p>
            </div>
          )}

          {result && (
            <div className="bg-card border-2 border-emerald-500/30 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
              {/* Verified Ribbon */}
              <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-border gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-emerald-600">
                      Authentic Credential Verified
                    </span>
                    <h2 className="font-mono text-xl font-bold text-foreground">
                      {result.certificateNumber}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Record</span>
                  </button>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="py-8 space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                    Certified Graduate
                  </p>
                  <h3 className="font-serif text-3xl font-bold text-foreground">
                    {result.studentName}
                  </h3>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                    Completed Program
                  </p>
                  <p className="text-xl font-serif font-bold text-primary">
                    {result.courseTitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                      Date of Issue
                    </p>
                    <p className="font-semibold text-foreground text-sm">{result.issueDate}</p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                      Faculty Lead
                    </p>
                    <p className="font-semibold text-foreground text-sm">{result.instructorName}</p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                      Awarding Institution
                    </p>
                    <p className="font-semibold text-foreground text-sm">{result.institution}</p>
                  </div>
                </div>
              </div>

              {/* Institutional Seal Footnote */}
              <div className="bg-muted/30 rounded-2xl p-4 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-primary" />
                  <span>Permanent registry record maintained in Bosaso, Somalia</span>
                </div>
                <span className="text-emerald-600 font-bold">Status: Active</span>
              </div>
            </div>
          )}

          {!hasSearched && (
            <div className="bg-card border border-border rounded-3xl p-8 md:p-12 text-center shadow-sm space-y-4">
              <Award className="w-12 h-12 text-primary mx-auto" />
              <h3 className="font-serif text-2xl font-bold text-foreground">
                How Verification Works
              </h3>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Every certificate issued by Godol Institute carries a permanent registry identifier (format: <code>GDL-2026-XXXX</code>). Enter the full ID code above to instantly verify graduate name, completion date, and course accreditation.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

