import React, { useState, useEffect } from 'react';
import {
  Search, CheckCircle, XCircle, RefreshCw, Eye, MessageCircle,
  Copy, Phone, BookOpen, User, Filter, X, ChevronDown,
  AlertTriangle, Clock, ShieldCheck, ShieldX, Clipboard, FileText,
  Download
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../../lib/api';
import { exportToCSV } from '../../lib/exportUtils';

const STATUS_CONFIG = {
  pending_verification: { label: 'Pending Verification', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  verified: { label: 'Verified', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200' },
  awaiting_payment: { label: 'Awaiting Payment', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  partially_paid: { label: 'Partially Paid', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  refunded: { label: 'Refunded', color: 'bg-purple-100 text-purple-700 border-purple-200' }
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-600 border-gray-200' };
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>{cfg.label}</span>;
}

function WhatsAppButton({ phone, studentName, courseTitle, amount, reference }) {
  const openWhatsApp = () => {
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Salaan ${studentName},\n\nWe received your payment submission for "${courseTitle}" (Amount: $${amount} USD, Reference: ${reference}).\n\nWe are reviewing your transaction. Please confirm:\n1. Did you send the transfer?\n2. Is the reference number ${reference} correct?\n\nThank you,\nGodol Institute of Business`
    );
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${msg}`, '_blank');
    }
  };
  return (
    <button onClick={openWhatsApp}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 transition-colors"
      title="Contact via WhatsApp">
      <MessageCircle className="w-3.5 h-3.5" />
      WhatsApp
    </button>
  );
}

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending_verification');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [verifiedAmount, setVerifiedAmount] = useState('');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isActing, setIsActing] = useState(false);
  const [copied, setCopied] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPayments = () => {
    setIsLoading(true);
    apiFetch(`/api/admin/payments${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`)
      .then(setPayments)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchPayments(); }, [statusFilter]);

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const openVerify = (payment) => {
    setSelectedPayment(payment);
    setVerifiedAmount(String(payment.claimedAmount || ''));
    setVerifyNotes('');
    setShowVerifyModal(true);
  };

  const openReject = (payment) => {
    setSelectedPayment(payment);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleVerify = async () => {
    if (!selectedPayment) return;
    setIsActing(true);
    try {
      await apiFetch(`/api/admin/payments/${selectedPayment.id}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ verifiedAmount: Number(verifiedAmount), adminNotes: verifyNotes })
      });
      setShowVerifyModal(false);
      showToast(`✅ Payment verified! Course access granted to ${selectedPayment.studentName}.`);
      fetchPayments();
    } catch (err) {
      showToast(err.message || 'Failed to verify payment', 'error');
    } finally {
      setIsActing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment || !rejectReason.trim()) {
      showToast('Please provide a rejection reason.', 'error');
      return;
    }
    setIsActing(true);
    try {
      await apiFetch(`/api/admin/payments/${selectedPayment.id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason: rejectReason })
      });
      setShowRejectModal(false);
      showToast(`Payment rejected. Student notified.`);
      fetchPayments();
    } catch (err) {
      showToast(err.message || 'Failed to reject payment', 'error');
    } finally {
      setIsActing(false);
    }
  };

  const filtered = payments.filter(p => {
    const q = searchTerm.toLowerCase();
    return !q || (p.studentName || '').toLowerCase().includes(q) ||
      (p.transactionRef || '').toLowerCase().includes(q) ||
      (p.courseTitle || '').toLowerCase().includes(q) ||
      (p.studentEmail || '').toLowerCase().includes(q);
  });

  const tabs = [
    { key: 'pending_verification', label: 'Pending', icon: Clock },
    { key: 'verified', label: 'Verified', icon: CheckCircle },
    { key: 'rejected', label: 'Rejected', icon: XCircle },
    { key: 'all', label: 'All', icon: Filter }
  ];

  return (
    <AdminLayout title="Payment Verification" subtitle="Review mobile money submissions and grant course access">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold transition-all ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-5">
        {/* Filter tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setStatusFilter(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === key ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search student, reference, course..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-primary" />
          </div>
          <button onClick={fetchPayments} className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-primary transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => exportToCSV(filtered, 'godol_payments', [
              { key: 'transactionRef', label: 'Reference' },
              { key: 'studentName', label: 'Student' },
              { key: 'studentEmail', label: 'Email' },
              { key: 'studentPhone', label: 'Phone' },
              { key: 'courseTitle', label: 'Course' },
              { key: 'claimedAmount', label: 'Claimed ($)' },
              { key: 'verifiedAmount', label: 'Verified ($)' },
              { key: 'provider', label: 'Provider' },
              { key: 'status', label: 'Status' },
              { key: 'submittedAt', label: 'Submitted Date' }
            ])}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
            title="Export table to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <ShieldCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-5">Student</th>
                    <th className="py-3.5 px-5">Course & Amount</th>
                    <th className="py-3.5 px-5">Provider & Reference</th>
                    <th className="py-3.5 px-5">Submitted</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filtered.map(pay => (
                    <tr key={pay.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-semibold text-gray-900">{pay.studentName}</div>
                        <div className="text-[11px] text-gray-400">{pay.studentEmail}</div>
                        {pay.studentPhone && <div className="text-[11px] text-gray-400">{pay.studentPhone}</div>}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-medium text-gray-800 max-w-[180px] truncate">{pay.courseTitle}</div>
                        <div className="font-bold text-gray-900 mt-0.5">${pay.claimedAmount} USD</div>
                        {pay.verifiedAmount && pay.status === 'verified' && (
                          <div className="text-[11px] text-emerald-600 font-semibold">Verified: ${pay.verifiedAmount}</div>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-semibold text-gray-800">{pay.provider}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[11px] text-gray-500 max-w-[120px] truncate">{pay.transactionRef}</span>
                          <button onClick={() => copyText(pay.transactionRef, pay.id)} className="text-gray-300 hover:text-primary transition-colors" title="Copy reference">
                            {copied === pay.id ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        {pay.senderPhone && <div className="text-[11px] text-gray-400 mt-0.5">From: {pay.senderPhone}</div>}
                        {pay.receiptUrl && (
                          <a href={pay.receiptUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold mt-1 bg-primary/5 px-2 py-0.5 rounded-md border border-primary/20">
                            <FileText className="w-3 h-3" /> View Receipt
                          </a>
                        )}
                      </td>
                      <td className="py-4 px-5 text-gray-500">
                        {new Date(pay.submittedAt).toLocaleDateString()}<br />
                        <span className="text-[10px]">{new Date(pay.submittedAt).toLocaleTimeString()}</span>
                      </td>
                      <td className="py-4 px-5">
                        <StatusBadge status={pay.status} />
                        {pay.status === 'rejected' && pay.rejectionReason && (
                          <div className="text-[10px] text-red-500 mt-1 max-w-[120px]">{pay.rejectionReason}</div>
                        )}
                        {pay.status === 'verified' && pay.verifiedBy && (
                          <div className="text-[10px] text-gray-400 mt-1">by {pay.verifiedBy.split('@')[0]}</div>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button onClick={() => { setSelectedPayment(pay); setShowDetailModal(true); }}
                            className="p-1.5 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-100" title="View details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <WhatsAppButton
                            phone={pay.studentWhatsapp || pay.studentPhone}
                            studentName={pay.studentName}
                            courseTitle={pay.courseTitle}
                            amount={pay.claimedAmount}
                            reference={pay.transactionRef}
                          />
                          {pay.status === 'pending_verification' && (
                            <>
                              <button onClick={() => openVerify(pay)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700 transition-colors">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Verify
                              </button>
                              <button onClick={() => openReject(pay)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 text-white rounded-lg text-[11px] font-bold hover:bg-red-600 transition-colors">
                                <ShieldX className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg">Payment Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <StatusBadge status={selectedPayment.status} />
              {[
                ['Student', selectedPayment.studentName],
                ['Email', selectedPayment.studentEmail],
                ['Phone', selectedPayment.studentPhone],
                ['WhatsApp', selectedPayment.studentWhatsapp],
                ['Course', selectedPayment.courseTitle],
                ['Course Price', `$${selectedPayment.coursePrice} USD`],
                ['Claimed Amount', `$${selectedPayment.claimedAmount} USD`],
                ['Verified Amount', selectedPayment.verifiedAmount ? `$${selectedPayment.verifiedAmount} USD` : '—'],
                ['Provider', selectedPayment.provider],
                ['Sender Phone', selectedPayment.senderPhone],
                ['Transaction Ref', selectedPayment.transactionRef],
                ['Submitted At', new Date(selectedPayment.submittedAt).toLocaleString()],
                ['Verified At', selectedPayment.verifiedAt ? new Date(selectedPayment.verifiedAt).toLocaleString() : '—'],
                ['Verified By', selectedPayment.verifiedBy || '—'],
                ['Rejection Reason', selectedPayment.rejectionReason || '—'],
                ['Admin Notes', selectedPayment.adminNotes || '—'],
              ].map(([k, v]) => v && v !== '—' ? (
                <div key={k} className="flex justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-500 font-medium">{k}</span>
                  <span className="text-gray-900 font-semibold text-right max-w-[55%] break-all">{v}</span>
                </div>
              ) : null)}

              {selectedPayment.receiptUrl && (
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">Student's Uploaded Receipt</span>
                  <a href={selectedPayment.receiptUrl} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-1">
                    <img src={selectedPayment.receiptUrl} alt="Receipt Screenshot" className="max-h-72 w-full object-contain mx-auto group-hover:scale-[1.02] transition-transform rounded-xl" />
                    <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/80 text-white text-[10px] font-semibold rounded-lg shadow-sm">
                      Click to open full size
                    </span>
                  </a>
                </div>
              )}
            </div>
            <div className="mt-5 flex gap-3">
              <WhatsAppButton phone={selectedPayment.studentWhatsapp || selectedPayment.studentPhone}
                studentName={selectedPayment.studentName} courseTitle={selectedPayment.courseTitle}
                amount={selectedPayment.claimedAmount} reference={selectedPayment.transactionRef} />
              {selectedPayment.status === 'pending_verification' && (
                <>
                  <button onClick={() => { setShowDetailModal(false); openVerify(selectedPayment); }}
                    className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700">
                    Verify Payment
                  </button>
                  <button onClick={() => { setShowDetailModal(false); openReject(selectedPayment); }}
                    className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600">
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verify Modal */}
      {showVerifyModal && selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Verify Payment</h3>
              <button onClick={() => setShowVerifyModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
              <p className="text-sm font-semibold text-emerald-800">You are verifying:</p>
              <p className="text-sm text-emerald-700 mt-1"><strong>{selectedPayment.studentName}</strong> → "{selectedPayment.courseTitle}"</p>
              <p className="text-sm text-emerald-700 font-mono mt-0.5">Ref: {selectedPayment.transactionRef}</p>
              {selectedPayment.receiptUrl && (
                <div className="mt-3 pt-3 border-t border-emerald-200/60">
                  <a href={selectedPayment.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-bold hover:underline">
                    <Eye className="w-3.5 h-3.5" /> View Uploaded Receipt Screenshot
                  </a>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirmed Amount Received (USD) *</label>
                <input type="number" value={verifiedAmount} onChange={e => setVerifiedAmount(e.target.value)}
                  placeholder={String(selectedPayment.claimedAmount)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary" />
                <p className="text-xs text-gray-400 mt-1">Enter the amount you actually received. May differ from claimed amount.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Verification Notes</label>
                <textarea value={verifyNotes} onChange={e => setVerifyNotes(e.target.value)} rows={2}
                  placeholder="e.g. Confirmed via Hormuud transaction SMS #1234"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary resize-none" />
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 my-4">
              <p className="text-xs text-amber-700">⚠ This action will <strong>immediately grant course access</strong> to the student. Only click Verify if you have confirmed the payment via your mobile money provider account.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowVerifyModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={handleVerify} disabled={isActing || !verifiedAmount}
                className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {isActing ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying...</> : <><ShieldCheck className="w-4 h-4" /> Confirm & Verify</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Reject Payment</h3>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5">
              <p className="text-sm text-red-800 font-semibold">Rejecting payment for:</p>
              <p className="text-sm text-red-700 mt-1"><strong>{selectedPayment.studentName}</strong> → "{selectedPayment.courseTitle}"</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Reason for Rejection *</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} required
                placeholder="e.g. Transaction reference not found in our records. Please verify and resubmit."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-400 resize-none" />
              <p className="text-xs text-gray-400 mt-1">This reason will be shared with the student so they can correct and resubmit.</p>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={handleReject} disabled={isActing || !rejectReason.trim()}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {isActing ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Rejecting...</> : <><XCircle className="w-4 h-4" /> Reject Payment</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
