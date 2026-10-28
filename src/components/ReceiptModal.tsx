import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, X, Printer, Copy, Check, Sparkles } from 'lucide-react';
import { EmailReceipt } from '../types.ts';
import { api } from '../services/api.ts';
import { CavendishLogo } from './CavendishLogo.tsx';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReceipt?: EmailReceipt | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, selectedReceipt }) => {
  const [receipts, setReceipts] = useState<EmailReceipt[]>([]);
  const [activeReceipt, setActiveReceipt] = useState<EmailReceipt | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (selectedReceipt) {
        setActiveReceipt(selectedReceipt);
      } else {
        fetchReceipts();
      }
    }
  }, [isOpen, selectedReceipt]);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const res = await api.getReceipts();
      setReceipts(res.receipts);
      if (res.receipts.length > 0 && !activeReceipt) {
        setActiveReceipt(res.receipts[0]);
      }
    } catch (err) {
      console.error('Failed to load receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#0C182E] rounded-3xl max-w-3xl w-full shadow-2xl border border-blue-100 dark:border-blue-900/60 overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        {/* Modal Header */}
        <div className="bg-[#00205B] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#0B1B3D]">
          <div className="flex items-center gap-3">
            <CavendishLogo size="sm" variant="crest" />
            <div>
              <h3 className="font-black text-base sm:text-lg tracking-tight flex items-center gap-2">
                <span>Cavendish Official Digital Receipts</span>
              </h3>
              <p className="text-xs text-blue-200">School of Science & Technology • Official Dispatches</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left: Receipts list (if multiple) */}
          {receipts.length > 1 && !selectedReceipt && (
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-blue-100 dark:border-blue-900/50 bg-blue-50/40 dark:bg-[#071329] p-3 overflow-y-auto max-h-48 md:max-h-full">
              <div className="text-xs font-black text-[#00205B] dark:text-amber-300 uppercase tracking-wider px-2 mb-2">
                Dispatched Receipts ({receipts.length})
              </div>
              <div className="space-y-1.5">
                {receipts.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setActiveReceipt(r)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all border ${
                      activeReceipt?.id === r.id
                        ? 'bg-[#00205B] text-white border-[#00205B] shadow-xs font-bold'
                        : 'bg-white dark:bg-[#0C182E] text-slate-700 dark:text-slate-200 border-blue-100 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-blue-950'
                    }`}
                  >
                    <div className="truncate font-semibold">{r.subject.replace('[CUZ Lab Receipt] ', '')}</div>
                    <div className={`text-[10px] mt-0.5 ${activeReceipt?.id === r.id ? 'text-amber-300' : 'text-slate-400'}`}>
                      {new Date(r.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Ref: {r.referenceNumber.slice(-8)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Right: Active Receipt Preview */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col justify-between bg-slate-50/50 dark:bg-[#071329]">
            {activeReceipt ? (
              <div>
                {/* Meta details bar */}
                <div className="bg-white dark:bg-[#0C182E] rounded-2xl p-3 mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-blue-200 border border-blue-100 dark:border-blue-900/60 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#00205B] dark:text-white">Recipient:</span>
                    <span className="font-medium text-slate-700 dark:text-blue-200">{activeReceipt.recipientEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 font-bold text-[#00205B] dark:text-amber-300">
                      {activeReceipt.referenceNumber}
                    </span>
                    <button
                      onClick={() => copyRef(activeReceipt.referenceNumber)}
                      className="text-slate-500 hover:text-[#00205B] dark:hover:text-white p-1"
                      title="Copy Reference"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* HTML Body preview (Styled as clean Cavendish electronic memo) */}
                <div
                  className="rounded-2xl border border-blue-100 dark:border-blue-900/60 overflow-hidden shadow-sm bg-white"
                  dangerouslySetInnerHTML={{ __html: activeReceipt.htmlBody }}
                />
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                <Mail className="w-12 h-12 mx-auto mb-2 text-blue-200 dark:text-blue-900" />
                <p>No dispatched receipts found yet.</p>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-blue-300">
                Official electronic receipt • Cavendish University Zambia
              </span>
              <div className="flex items-center gap-2">
                {activeReceipt && (
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900 text-xs font-bold text-[#00205B] dark:text-white hover:bg-white dark:hover:bg-[#0C182E] transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Receipt
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-xl bg-[#00205B] text-white text-xs font-bold hover:bg-[#0B1B3D] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
