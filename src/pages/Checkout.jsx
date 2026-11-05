import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import {
  ShieldCheck, CreditCard, Copy, CheckCircle, Phone,
  Upload, AlertTriangle, ArrowLeft, Clock, BookOpen, X
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { auth } from '../lib/auth';

export default function Checkout() {
  const { enrollmentId } = useParams();
  const [, setLocation] = useLocation();

  const [enrollment, setEnrollment] = useState(null);
  const [course, setCourse] = useState(null);
  const [providers, setProviders] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState('instructions'); // 'instructions' | 'submit' | 'success'

  // Form state
  const [provider, setProvider] = useState('EVC Plus');
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [claimedAmount, setClaimedAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    const user = auth.getUser();
    if (!user) { setLocation('/login'); return; }

    Promise.all([
      apiFetch(`/api/enrollments?email=${encodeURIComponent(user.email)}`),
      apiFetch('/api/payment-providers')
    ]).then(([enrollments, prov]) => {
      const enr = enrollments.find(e => e.id === Number(enrollmentId));
      if (!enr) { setLocation('/dashboard'); return; }
      if (enr.accessGranted) { setLocation('/dashboard'); return; }
      setEnrollment(enr);
      setClaimedAmount(String(enr.coursePrice || ''));
      setProviders(prov);
      if (enr.courseId) {
        apiFetch(`/api/courses/${enr.courseId}`).then(setCourse).catch(() => {});
      }
    }).catch(() => setLocation('/dashboard'))
      .finally(() => setIsLoading(false));
  }, [enrollmentId]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const getProviderDetails = () => {
    switch (provider) {
      case 'EVC Plus':
        return {
          phone: providers.evc_phone || '252610000000',
          name: providers.evc_name || 'Godol Institute of Business',
          instructions: `Dial *712*${providers.evc_phone || '610000000'}*${enrollment?.coursePrice || '0'}# on your Hormuud SIM`,
          dialCode: `*712*${(providers.evc_phone || '610000000').replace(/^252/, '')}*${enrollment?.coursePrice}#`
        };
      case 'Zaad':
        return {
          phone: providers.zaad_phone || '252630000000',
          name: providers.zaad_name || 'Godol Institute of Business',
          instructions: `Dial *120*${providers.zaad_phone || '630000000'}*${enrollment?.coursePrice || '0'}# on your Telesom SIM`,
          dialCode: `*120*${(providers.zaad_phone || '630000000').replace(/^252/, '')}*${enrollment?.coursePrice}#`
        };
      case 'Sahal':
        return {
          phone: providers.sahal_phone || '252905139816',
          name: providers.sahal_name || 'Godol Institute of Business',
          instructions: `Transfer to number ${providers.sahal_phone || '252905139816'} on Golis Sahal`,
          dialCode: providers.sahal_phone || '252905139816'
        };
      case 'Premier Wallet':
        return {
          phone: providers.premier_merchant_id || '100294819',
          name: providers.premier_name || 'Godol Institute of Business',
          instructions: `Send to Merchant ID ${providers.premier_merchant_id || '100294819'} on Premier Bank app`,
          dialCode: providers.premier_merchant_id || '100294819'
        };
      default:
        return { phone: '', name: '', instructions: '', dialCode: '' };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!transactionRef.trim()) { setError('Transaction reference is required.'); return; }
    if (!senderPhone.trim()) { setError('Sender phone number is required.'); return; }
    if (!claimedAmount || isNaN(claimedAmount) || Number(claimedAmount) <= 0) {
      setError('Please enter the amount you transferred.'); return;
    }

    setIsSubmitting(true);
    try {
      const user = auth.getUser();
      await apiFetch('/api/payments/submit', {
        method: 'POST',
        body: JSON.stringify({
          enrollmentId: enrollment.id,
          studentEmail: user.email,
          provider,
          senderPhone: senderPhone.trim(),
          transactionRef: transactionRef.trim(),
          claimedAmount: Number(claimedAmount),
          paymentDate,
          adminNotes: notes
        })
      });
      setStep('success');
    } catch (err) {
      setError(err.message || 'Could not submit payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!enrollment) return null;

  const prov = getProviderDetails();
  const refCode = `GDL-${enrollment.id}-${enrollment.courseId}`;

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Payment Submitted!</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Your payment details have been received. Our team will verify your transaction and grant you course access — typically within a few hours.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">What happens next?</p>
            <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
              <li>Admin reviews your submitted reference</li>
              <li>Payment is verified via mobile money records</li>
              <li>Course access is granted automatically</li>
              <li>You'll see the course in your dashboard</li>
            </ul>
          </div>
          <Link href="/dashboard" className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm block text-center hover:bg-primary/90 transition-colors">
            Go to My Dashboard
          </Link>
          <Link href="/courses" className="mt-3 text-xs text-muted-foreground hover:text-foreground block">
            Browse more courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <Link href={`/courses/${enrollment.courseId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to course
        </Link>

        {/* Header card */}
        <div className="bg-[hsl(215,72%,18%)] text-white rounded-3xl p-6 mb-6 flex items-center gap-4">
          {course?.thumbnail && (
            <img src={course.thumbnail} alt={enrollment.courseTitle} className="w-20 h-14 object-cover rounded-xl flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-xs mb-0.5">Enrolling in</p>
            <h1 className="font-bold text-base leading-tight line-clamp-2">{enrollment.courseTitle}</h1>
            <div className="flex items-center gap-4 mt-2 text-xs text-white/70">
              {course?.durationHours && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.durationHours}h</span>}
              {course?.lessonCount && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.lessonCount} lessons</span>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-white/60 text-xs">Total</p>
            <p className="text-2xl font-extrabold">${enrollment.coursePrice}</p>
            <p className="text-white/50 text-[10px]">USD</p>
          </div>
        </div>

        {step === 'instructions' && (
          <div className="space-y-4">
            {/* Reference code */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Enrollment Reference</p>
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <span className="font-mono font-bold text-primary text-lg tracking-widest">{refCode}</span>
                <button onClick={() => copyToClipboard(refCode, 'ref')} className="ml-auto text-gray-400 hover:text-primary transition-colors" title="Copy">
                  {copied === 'ref' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Include this reference when asked by our team.</p>
            </div>

            {/* Choose provider */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm font-bold text-gray-900 mb-3">1. Choose payment method</p>
              <div className="grid grid-cols-2 gap-2">
                {['EVC Plus', 'Zaad', 'Sahal', 'Premier Wallet'].map(m => (
                  <button
                    key={m}
                    onClick={() => setProvider(m)}
                    className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all text-left ${
                      provider === m ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment instructions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm font-bold text-gray-900 mb-4">2. Transfer the exact amount</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                  <span className="text-xs text-gray-500">Provider</span>
                  <span className="text-sm font-bold text-gray-900">{provider}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                  <span className="text-xs text-gray-500">Recipient Name</span>
                  <span className="text-sm font-semibold text-gray-900">{prov.name}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                  <span className="text-xs text-gray-500">
                    {provider === 'Premier Wallet' ? 'Merchant ID' : 'Phone Number'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">{prov.phone}</span>
                    <button onClick={() => copyToClipboard(prov.phone, 'phone')} className="text-gray-400 hover:text-primary">
                      {copied === 'phone' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                  <span className="text-xs text-gray-500">Amount to Pay</span>
                  <span className="text-xl font-extrabold text-emerald-600">${enrollment.coursePrice} USD</span>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-blue-800">Dial Code</p>
                    <p className="font-mono text-blue-700 text-sm font-bold mt-0.5">{prov.dialCode}</p>
                    <p className="text-[11px] text-blue-600 mt-1">{prov.instructions}</p>
                  </div>
                </div>
              </div>
              {providers.payment_instructions_extra && (
                <p className="mt-3 text-xs text-gray-500 leading-relaxed">{providers.payment_instructions_extra}</p>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800">Important</p>
                <p className="text-xs text-amber-700 mt-0.5">Transfer the <strong>exact amount of ${enrollment.coursePrice}</strong>. After sending, click the button below to submit your transaction reference for verification.</p>
              </div>
            </div>

            <button
              onClick={() => setStep('submit')}
              className="w-full py-4 rounded-2xl font-bold text-sm shadow-lg transition-all hover:scale-[1.01] flex items-center justify-center gap-2 text-white"
              style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}
            >
              <CreditCard className="w-5 h-5" />
              I've Sent the Money — Submit Payment Details
            </button>
          </div>
        )}

        {step === 'submit' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900">Submit Payment Details</h2>
                <button type="button" onClick={() => setStep('instructions')} className="text-gray-400 hover:text-gray-600">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Payment Provider *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['EVC Plus', 'Zaad', 'Sahal', 'Premier Wallet'].map(m => (
                      <button type="button" key={m} onClick={() => setProvider(m)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${provider === m ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Transaction ID / Reference Number *</label>
                  <input type="text" required value={transactionRef} onChange={e => setTransactionRef(e.target.value)}
                    placeholder="e.g. EVC-TX-9948201 or SMS code"
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" />
                  <p className="text-xs text-gray-400 mt-1">Find this in the confirmation SMS after your transfer.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Your Sender Phone Number *</label>
                  <input type="tel" required value={senderPhone} onChange={e => setSenderPhone(e.target.value)}
                    placeholder="e.g. +252 61 234 5678"
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary" />
                  <p className="text-xs text-gray-400 mt-1">The mobile money number you sent from.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Amount Transferred (USD) *</label>
                  <input type="number" required min="1" step="0.01" value={claimedAmount} onChange={e => setClaimedAmount(e.target.value)}
                    placeholder={`${enrollment.coursePrice}`}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary" />
                  <p className="text-xs text-gray-400 mt-1">Enter the exact amount as shown in your transaction receipt.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date & Time of Payment</label>
                  <input type="datetime-local" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Additional Notes (Optional)</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    placeholder="Any additional information for the admin..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Upload Receipt Screenshot (Optional)</label>
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500 truncate">{proofFile ? proofFile.name : 'Choose screenshot image'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => setProofFile(e.target.files?.[0] || null)} />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">Optional — helps with faster verification.</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2.5">
                <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-bold text-blue-800">Important Notice</p>
              </div>
              <p className="text-xs text-blue-700">Submitting this form does <strong>not</strong> automatically grant course access. Our team will verify your payment manually and activate your enrollment within a few hours.</p>
            </div>

            <button type="submit" disabled={isSubmitting}
              className="w-full py-4 rounded-2xl font-bold text-sm bg-primary text-white hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {isSubmitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</> : <><CheckCircle className="w-5 h-5" /> Submit Payment for Verification</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

