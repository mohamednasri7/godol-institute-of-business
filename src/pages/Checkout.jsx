import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import {
  ShieldCheck, CreditCard, Copy, CheckCircle, Phone,
  Upload, AlertTriangle, ArrowLeft, Clock, BookOpen, X,
  MessageCircle, FileText, Check, ExternalLink, RefreshCw,
  Sparkles, AlertCircle, Image as ImageIcon
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { auth } from '../lib/auth';

const WHATSAPP_ADMISSIONS_PHONE = '252905139816';

export default function Checkout() {
  const { enrollmentId } = useParams();
  const [, setLocation] = useLocation();

  const [enrollment, setEnrollment] = useState(null);
  const [payment, setPayment] = useState(null);
  const [course, setCourse] = useState(null);
  const [providers, setProviders] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Form state
  const [provider, setProvider] = useState('Sahal');
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [receiptImage, setReceiptImage] = useState(null);
  const [receiptFileName, setReceiptFileName] = useState('');
  const [receiptFileSize, setReceiptFileSize] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [showFullReceiptModal, setShowFullReceiptModal] = useState(false);

  // Load enrollment and payment details
  useEffect(() => {
    const user = auth.getUser();
    if (!user) {
      setLocation('/login');
      return;
    }

    setIsLoading(true);
    setLoadError('');

    // Fetch enrollment and providers in parallel
    Promise.all([
      apiFetch(`/api/enrollments/${enrollmentId}?email=${encodeURIComponent(user.email)}`).catch(async () => {
        // Fallback: search by user email
        const list = await apiFetch(`/api/enrollments?email=${encodeURIComponent(user.email)}`);
        const found = list.find(e => e.id === Number(enrollmentId)) || list.find(e => e.courseId === Number(enrollmentId)) || list[0];
        if (found) return { enrollment: found, payment: null };
        throw new Error('Enrollment not found');
      }),
      apiFetch('/api/payment-providers').catch(() => ({}))
    ])
      .then(([enrData, prov]) => {
        const enr = enrData.enrollment || enrData;
        const pay = enrData.payment || null;
        setEnrollment(enr);
        if (pay) setPayment(pay);
        setProviders(prov || {});

        // Fetch course info for thumbnail and duration
        if (enr.courseId) {
          apiFetch(`/api/courses/${enr.courseId}`)
            .then(setCourse)
            .catch(() => {});
        }
      })
      .catch((err) => {
        console.error('Checkout load error:', err);
        setLoadError(err.message || 'Could not load enrollment record. Please return to the course page.');
      })
      .finally(() => setIsLoading(false));
  }, [enrollmentId, setLocation]);

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  // Image compressor & reader for receipt screenshot
  const handleReceiptFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, JPEG, or WEBP).');
      return;
    }

    setError('');
    setReceiptFileName(file.name);
    setReceiptFileSize((file.size / 1024).toFixed(0) + ' KB');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 1200;
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setReceiptImage(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => setReceiptImage(event.target.result);
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removeReceipt = () => {
    setReceiptImage(null);
    setReceiptFileName('');
    setReceiptFileSize('');
  };

  const getProviderDetails = () => {
    switch (provider) {
      case 'EVC Plus':
        return {
          phone: providers.evc_phone || '252610000000',
          name: providers.evc_name || 'Godol Institute of Business',
          instructions: `Dial *712*${(providers.evc_phone || '610000000').replace(/^252/, '')}*${enrollment?.coursePrice || '0'}# on your Hormuud SIM`,
          dialCode: `*712*${(providers.evc_phone || '610000000').replace(/^252/, '')}*${enrollment?.coursePrice || '0'}#`
        };
      case 'Zaad':
        return {
          phone: providers.zaad_phone || '252630000000',
          name: providers.zaad_name || 'Godol Institute of Business',
          instructions: `Dial *120*${(providers.zaad_phone || '630000000').replace(/^252/, '')}*${enrollment?.coursePrice || '0'}# on your Telesom SIM`,
          dialCode: `*120*${(providers.zaad_phone || '630000000').replace(/^252/, '')}*${enrollment?.coursePrice || '0'}#`
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
        return {
          phone: providers.sahal_phone || '252905139816',
          name: 'Godol Institute of Business',
          instructions: `Transfer to number ${providers.sahal_phone || '252905139816'}`,
          dialCode: providers.sahal_phone || '252905139816'
        };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!receiptImage && !senderPhone.trim() && !transactionRef.trim()) {
      setError('Please attach your receipt screenshot or enter your sender phone number.');
      return;
    }

    if (!senderPhone.trim() && !transactionRef.trim()) {
      setError('Please provide your sender phone number or transaction ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = auth.getUser();
      const res = await apiFetch('/api/payments/submit', {
        method: 'POST',
        body: JSON.stringify({
          enrollmentId: enrollment.id,
          courseId: enrollment.courseId,
          studentName: user?.name || enrollment.studentName,
          studentEmail: user?.email || enrollment.studentEmail,
          provider,
          senderPhone: senderPhone.trim(),
          transactionRef: transactionRef.trim() || `TXN-${provider.replace(/\s+/g, '')}-${Date.now().toString().slice(-6)}`,
          claimedAmount: enrollment.coursePrice,
          receiptUrl: receiptImage
        })
      });

      if (res.enrollment) {
        setEnrollment(res.enrollment);
      } else {
        setEnrollment(prev => ({
          ...prev,
          enrollmentStatus: 'pending_verification',
          paymentStatus: 'pending_verification'
        }));
      }

      if (res.payment) {
        setPayment(res.payment);
      } else {
        setPayment({
          provider,
          senderPhone: senderPhone.trim(),
          transactionRef: transactionRef.trim() || `TXN-${provider.replace(/\s+/g, '')}-${Date.now().toString().slice(-6)}`,
          claimedAmount: enrollment.coursePrice,
          submittedAt: new Date().toISOString(),
          status: 'pending_verification',
          receiptUrl: receiptImage
        });
      }
    } catch (err) {
      console.error('Submit payment error:', err);
      setError(err.message || 'Could not submit payment. Please try again or contact admissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp click handler
  const openWhatsAppVerification = () => {
    const refCode = payment?.transactionRef || `GDL-${enrollment?.id}-${enrollment?.courseId}`;
    const amount = enrollment?.coursePrice || 0;
    const title = enrollment?.courseTitle || 'Course';
    const message = encodeURIComponent(
      `Assalamu Alaikum Godol Admissions,\n\nI have submitted my payment of $${amount} USD for "${title}".\n\n• Reference: ${refCode}\n• Provider: ${payment?.provider || provider}\n• Phone: ${payment?.senderPhone || senderPhone || 'Provided'}\n\nPlease verify my payment and activate my course enrollment. Thank you!`
    );
    window.open(`https://wa.me/${WHATSAPP_ADMISSIONS_PHONE}?text=${message}`, '_blank');
  };

  // 1. Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-white/70">Loading payment details...</p>
        </div>
      </div>
    );
  }

  // 2. Error state (enrollment not found)
  if (loadError || !enrollment) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-500/20">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Enrollment Not Found</h2>
          <p className="text-sm text-white/60 mb-6">
            {loadError || 'We could not locate this enrollment. Please return to the course page and click Enroll.'}
          </p>
          <div className="space-y-3">
            <Link href="/courses" className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm block text-center hover:opacity-90 transition-opacity">
              Browse Courses
            </Link>
            <Link href="/dashboard" className="w-full py-3 px-4 rounded-xl bg-white/5 text-white/80 font-semibold text-xs block text-center hover:bg-white/10 transition-colors">
              Go to My Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const prov = getProviderDetails();
  const refCode = `GDL-${enrollment.id}-${enrollment.courseId}`;
  const isAwaitingVerification =
    enrollment.enrollmentStatus === 'pending_verification' ||
    enrollment.paymentStatus === 'pending_verification' ||
    Boolean(payment);
  const isAccessGranted =
    enrollment.accessGranted === true ||
    enrollment.enrollmentStatus === 'approved' ||
    enrollment.enrollmentStatus === 'completed';

  // 3. Course Already Active / Approved
  if (isAccessGranted) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="bg-slate-800/80 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
            <CheckCircle className="w-10 h-10" />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
            Active Enrollment
          </span>
          <h1 className="text-2xl font-bold mt-4 mb-2">Payment Verified!</h1>
          <p className="text-white/70 text-sm mb-6">
            Your enrollment in <strong>{enrollment.courseTitle}</strong> is active and fully unlocked.
          </p>
          <div className="space-y-3">
            <Link
              href={`/courses/${course?.slug || course?.id || enrollment.courseId}/learn`}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm block text-center shadow-lg transition-transform hover:scale-[1.02]"
              style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}
            >
              Start Learning Now
            </Link>
            <Link
              href="/dashboard"
              className="w-full py-3 px-4 rounded-xl bg-white/10 text-white font-semibold text-xs block text-center hover:bg-white/15 transition-colors"
            >
              Go to Student Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. DONE / AWAITING ADMIN VERIFICATION SCREEN
  // (Once submitted or if the student revisits the page while pending)
  if (isAwaitingVerification) {
    const activeReceipt = payment?.receiptUrl || receiptImage;
    return (
      <div className="min-h-screen bg-slate-950 text-white py-10 px-4">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Back link */}
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          {/* Status Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start sm:items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0 text-amber-400">
                <Clock className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  Awaiting Admin Verification
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">Payment Received!</h1>
              </div>
            </div>

            <p className="text-sm text-white/80 leading-relaxed">
              Your payment receipt and details have been submitted. Our admissions team is reviewing your transaction and will activate your course access within a few hours.
            </p>

            {/* Fast-Track WhatsApp CTA */}
            <div className="mt-6 pt-5 border-t border-white/10">
              <p className="text-xs text-white/70 mb-2 font-medium">Want instant activation? Message our admissions office directly:</p>
              <button
                onClick={openWhatsAppVerification}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all hover:scale-[1.01]"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Verify Instantly on WhatsApp (+252 905139816)</span>
              </button>
            </div>
          </div>

          {/* Submission Details Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white/90 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Submission Summary
            </h2>

            <div className="space-y-3 text-xs sm:text-sm divide-y divide-white/5">
              <div className="flex justify-between items-center py-2">
                <span className="text-white/50">Course</span>
                <span className="font-semibold text-white text-right max-w-[60%] truncate">{enrollment.courseTitle}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-white/50">Amount</span>
                <span className="font-bold text-emerald-400 text-base">${enrollment.coursePrice} USD</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-white/50">Payment Method</span>
                <span className="font-medium text-white">{payment?.provider || provider}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-white/50">Reference Code</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-amber-300 font-bold">{payment?.transactionRef || refCode}</span>
                  <button
                    onClick={() => copyToClipboard(payment?.transactionRef || refCode, 'summary-ref')}
                    className="text-white/40 hover:text-white"
                    title="Copy"
                  >
                    {copied === 'summary-ref' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              {(payment?.senderPhone || senderPhone) && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/50">Sender Phone</span>
                  <span className="font-mono text-white">{payment?.senderPhone || senderPhone}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2">
                <span className="text-white/50">Status</span>
                <span className="inline-flex items-center gap-1 text-amber-300 font-bold text-xs">
                  <Clock className="w-3 h-3" /> Verification in progress
                </span>
              </div>
            </div>

            {/* Uploaded Receipt Preview */}
            {activeReceipt && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs font-semibold text-white/70 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5 text-emerald-400" /> Attached Receipt Screenshot</span>
                  <button
                    onClick={() => setShowFullReceiptModal(true)}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    View Full Image
                  </button>
                </p>
                <div
                  onClick={() => setShowFullReceiptModal(true)}
                  className="cursor-pointer group relative overflow-hidden rounded-2xl border border-white/15 bg-slate-950/60 max-h-52 flex items-center justify-center p-2"
                >
                  <img
                    src={activeReceipt}
                    alt="Receipt Screenshot"
                    className="max-h-48 w-auto object-contain rounded-xl group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3 py-1.5 bg-black/80 rounded-lg text-xs font-semibold text-white">
                      Click to expand
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation options */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/dashboard"
              className="flex-1 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs text-center transition-colors"
            >
              Go to My Dashboard
            </Link>
            <Link
              href="/courses"
              className="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/80 font-semibold text-xs text-center transition-colors"
            >
              Browse More Courses
            </Link>
          </div>
        </div>

        {/* Full Image Modal */}
        {showFullReceiptModal && activeReceipt && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowFullReceiptModal(false)}
          >
            <div className="relative max-w-2xl w-full max-h-[90vh] bg-slate-900 border border-white/20 rounded-3xl p-4 overflow-hidden flex flex-col items-center">
              <button
                onClick={() => setShowFullReceiptModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-bold text-white mb-3">Submitted Receipt Screenshot</h3>
              <div className="overflow-auto max-h-[78vh] w-full flex items-center justify-center">
                <img src={activeReceipt} alt="Receipt Full" className="max-h-[75vh] w-auto object-contain rounded-xl" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 5. STREAMLINED CHECKOUT / PAYMENT FORM
  // Clean single card: Provider selection → Receipt upload → Submit
  return (
    <div className="min-h-screen bg-slate-950 text-white py-10 px-4">
      <div className="max-w-xl mx-auto">
        {/* Back link */}
        <Link href={`/courses/${enrollment.courseId}`} className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to course
        </Link>

        {/* Course Summary Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-[hsl(215,72%,16%)] border border-white/10 text-white rounded-3xl p-5 mb-5 flex items-center gap-4 shadow-xl">
          {course?.thumbnail && (
            <img src={course.thumbnail} alt={enrollment.courseTitle} className="w-16 h-12 object-cover rounded-xl flex-shrink-0 border border-white/10" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-[11px] mb-0.5">Enrolling in</p>
            <h1 className="font-bold text-sm sm:text-base leading-snug truncate">{enrollment.courseTitle}</h1>
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/60">
              {Number(course?.durationHours) > 0 ? (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {course.durationHours}h
                </span>
              ) : null}
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-amber-400" />
                {Number(course?.lessonCount) || 0} {Number(course?.lessonCount) === 1 ? 'lesson' : 'lessons'}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0 pl-2">
            <p className="text-white/50 text-[10px] uppercase tracking-wider font-semibold">Total Price</p>
            <p className="text-xl sm:text-2xl font-extrabold text-amber-400">${enrollment.coursePrice}</p>
            <p className="text-white/40 text-[10px]">USD</p>
          </div>
        </div>

        {/* Unified Payment Card */}
        <form onSubmit={handleSubmit} className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              Pay via Mobile Money
            </h2>
            <p className="text-xs text-white/60 mt-1">
              Select your provider, transfer the exact amount, and attach your receipt screenshot below.
            </p>
          </div>

          {/* 1. Payment Provider Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider">
              1. Choose Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Sahal', 'EVC Plus', 'Zaad', 'Premier Wallet'].map(m => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setProvider(m)}
                  className={`py-3 px-3.5 rounded-2xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                    provider === m
                      ? 'border-amber-400 bg-amber-400/10 text-amber-300 shadow-md shadow-amber-400/5'
                      : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <span>{m}</span>
                  {provider === m && <Check className="w-4 h-4 text-amber-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Provider Transfer Instructions Box */}
          <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
              <span className="text-white/50">Recipient Name</span>
              <span className="font-semibold text-white">{prov.name}</span>
            </div>

            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
              <span className="text-white/50">{provider === 'Premier Wallet' ? 'Merchant ID' : 'Account / Phone'}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-amber-300 text-sm">{prov.phone}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(prov.phone, 'phone')}
                  className="p-1 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                  title="Copy number"
                >
                  {copied === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
              <span className="text-white/50">Amount to Transfer</span>
              <span className="font-extrabold text-emerald-400 text-base">${enrollment.coursePrice} USD</span>
            </div>

            {prov.dialCode && (
              <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-amber-300">Quick Dial Code</p>
                  <p className="font-mono text-xs font-bold text-white mt-0.5 truncate">{prov.dialCode}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(prov.dialCode, 'dial')}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-[11px] flex-shrink-0 flex items-center gap-1 hover:bg-amber-300 transition-colors"
                >
                  {copied === 'dial' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. Attach Receipt Screenshot */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider">
                2. Attach Receipt Screenshot *
              </label>
              <span className="text-[11px] text-amber-400/90 font-medium">Recommended for instant verification</span>
            </div>

            {!receiptImage ? (
              <label className="group relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/20 hover:border-amber-400/60 rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                  Click or drag screenshot of confirmation SMS
                </p>
                <p className="text-[11px] text-white/40 mt-1">
                  Supports PNG, JPG, JPEG, WEBP
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-3.5 flex items-center gap-3">
                <img
                  src={receiptImage}
                  alt="Receipt Preview"
                  className="w-16 h-16 object-cover rounded-xl border border-white/10 flex-shrink-0"
                />
                <div className="flex-1 min-w-0 text-xs">
                  <p className="font-bold text-white truncate">{receiptFileName || 'Receipt screenshot'}</p>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">✅ Ready to submit ({receiptFileSize})</p>
                  <label className="text-[11px] text-amber-400 hover:underline cursor-pointer mt-1 inline-block">
                    Change image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={removeReceipt}
                  className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* 3. Sender Phone & Reference */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                3. Your Sender Phone Number *
              </label>
              <input
                type="tel"
                required
                value={senderPhone}
                onChange={e => setSenderPhone(e.target.value)}
                placeholder="e.g. 061XXXXXXX or 090XXXXXXX"
                className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-white/15 text-sm text-white placeholder-white/30 outline-none focus:border-amber-400 transition-colors"
              />
              <p className="text-[11px] text-white/40 mt-1">The mobile money number you sent the money from.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                Transaction ID / SMS Reference <span className="text-white/40 lowercase font-normal">(optional if receipt is attached)</span>
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={e => setTransactionRef(e.target.value)}
                placeholder="e.g. EVC-9948201 or SMS reference code"
                className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-white/15 text-sm text-white placeholder-white/30 outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Notice */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-blue-200">
            <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p>
              Once submitted, our admissions team will review your receipt and grant course access. No duplicate submission is needed!
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl font-bold text-sm shadow-xl transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Submitting for Verification...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Submit Payment for Admin Verification</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
