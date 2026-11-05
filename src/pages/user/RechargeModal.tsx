import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { PaymentMethod, formatCurrency } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { X, Upload, Check, CircleAlert as AlertCircle } from 'lucide-react';

export default function RechargeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { session } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [step, setStep] = useState<'amount' | 'payment' | 'proof'>('amount');
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [reference, setReference] = useState('');
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('payment_methods').select('*').eq('is_active', true).then(({ data }) => {
      setMethods((data as unknown as PaymentMethod[]) || []);
    });
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image of your payment receipt.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Payment proof must be smaller than 5 MB.');
      return;
    }

    setUploading(true);
    const extension = file.type.split('/')[1] || 'jpg';
    const fileName = `proofs/${session.user.id}/${Date.now()}.${extension}`;
    const { error: upErr } = await supabase.storage.from('recharge-proofs').upload(fileName, file, {
      contentType: file.type,
      cacheControl: '3600',
    });
    if (upErr) {
      console.error('recharge proof upload failed', upErr);
      setError('Could not upload the payment proof. Please try again.');
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('recharge-proofs').getPublicUrl(fileName);
    setProofUrl(data.publicUrl);
    setUploading(false);
  }

  async function handleSubmit() {
    if (!session || !selectedMethod) return;
    const amt = parseFloat(amount);
    if (amt <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (amt > 100000) {
      setError('Maximum recharge is ₱100,000 per request');
      return;
    }
    setSubmitting(true);
    setError(null);

    const { error: insErr } = await supabase.from('recharge_logs').insert({
      user_id: session.user.id,
      amount: amt,
      payment_method: selectedMethod.method_name,
      proof_image_url: proofUrl,
      reference_number: reference,
    });

    if (insErr) {
      console.error('recharge submission failed', insErr);
      setError('Could not submit the recharge right now. Please try again.');
      setSubmitting(false);
      return;
    }

    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'recharge_submitted',
      details: `Amount: ${amt}, Method: ${selectedMethod.method_name}`,
    });

    setSuccess(true);
    setSubmitting(false);
    setTimeout(onSuccess, 2000);
  }

  const presetAmounts = [100, 500, 1000, 2500, 5000, 10000];

  if (success) {
    return (
      <Overlay onClose={onClose}>
        <div className="text-center py-8 animate-scale-in">
          <div className="w-16 h-16 gradient-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Recharge Submitted!</h3>
          <p className="text-gray-400 text-sm">Your deposit is pending admin approval. You'll be notified once verified.</p>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose}>
      <div className="animate-slide-up">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-1.5 shadow-lg shadow-blue-500/10">
              <img src="/assets/images/waymo-removebg-preview.png" alt="WAYMO" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-300">WAYMO Wallet</p>
              <h3 className="text-lg font-bold text-white">Recharge securely</h3>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 transition-colors hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-5">
          {['Amount', 'Payment', 'Proof'].map((label, i) => {
            const stepIdx = ['amount', 'payment', 'proof'].indexOf(step);
            const active = i <= stepIdx;
            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  active ? 'gradient-primary text-white' : 'bg-[#0a0e1a] text-gray-500 border border-[#232a3f]'
                }`}>
                  {i + 1}
                </div>
                <span className={`text-xs ${active ? 'text-white' : 'text-gray-500'}`}>{label}</span>
                {i < 2 && <div className={`flex-1 h-0.5 ${active ? 'bg-blue-500' : 'bg-[#232a3f]'}`} />}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm mb-4 flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Step 1: Amount */}
        {step === 'amount' && (
          <div className="animate-fade-in">
            <label className="text-sm font-medium text-gray-300 mb-2 block">Enter Amount (₱)</label>
            <input
              ref={amountInputRef}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#0a0e1a] border border-[#232a3f] rounded-xl px-4 py-3.5 text-white text-2xl font-bold focus:border-blue-500 outline-none"
              placeholder="0.00"
              min="1"
              max="100000"
              step="0.01"
            />
            <div className="mt-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">Quick select</p>
              <div className="grid grid-cols-3 gap-2">
                {presetAmounts.map((amt) => {
                  const selected = amount === String(amt);
                  return (
                    <button
                      key={amt}
                      onClick={() => setAmount(String(amt))}
                      className={`rounded-lg border py-2 text-sm font-semibold transition-all active:scale-95 ${
                        selected
                          ? 'border-blue-400 bg-blue-500/15 text-blue-200 shadow-lg shadow-blue-500/10'
                          : 'border-[#232a3f] bg-[#0a0e1a] text-gray-400 hover:border-blue-500/40 hover:text-white'
                      }`}
                    >
                      ₱{amt.toLocaleString()}
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    setAmount('');
                    amountInputRef.current?.focus();
                  }}
                  className={`rounded-lg border py-2 text-sm font-semibold transition-all active:scale-95 ${
                    !presetAmounts.some((a) => amount === String(a)) && amount
                      ? 'border-blue-400 bg-blue-500/15 text-blue-200 shadow-lg shadow-blue-500/10'
                      : 'border-[#232a3f] bg-[#0a0e1a] text-gray-400 hover:border-blue-500/40 hover:text-white'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>
            <button
              onClick={() => setStep('payment')}
              disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > 100000}
              className="w-full gradient-primary text-white font-semibold py-3.5 rounded-xl mt-5 transition-all hover:opacity-90 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Payment method */}
        {step === 'payment' && (
          <div className="animate-fade-in">
            <p className="text-sm text-gray-400 mb-3">Choose where you sent the payment:</p>
            {methods.length === 0 ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-300 text-sm mb-5">
                Payment methods are temporarily unavailable. Please try again later.
              </div>
            ) : (
              <div className="space-y-2 mb-5">
                {methods.map((m) => {
                  const isCrypto = m.method_name.toLowerCase().includes('crypto') || m.method_name.toLowerCase().includes('usdt');
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethod(m)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        selectedMethod?.id === m.id
                          ? 'border-blue-500 bg-blue-500/5'
                          : 'border-[#232a3f] bg-[#0a0e1a] hover:border-[#334155]'
                      }`}
                    >
                      <img src={m.qr_image_url} alt="" className="w-12 h-12 rounded-lg object-cover bg-white flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold">{m.method_name}</p>
                        <p className="text-gray-500 text-xs truncate">{isCrypto ? 'USDT · BNB, opBNB, ERC20, Base, WorldCoin' : 'GCash · Maya · Bank Transfer'}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedMethod?.id === m.id ? 'border-blue-500 bg-blue-500' : 'border-[#334155]'
                      }`}>
                        {selectedMethod?.id === m.id && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('amount')}
                className="px-5 py-3 rounded-xl bg-[#0a0e1a] border border-[#232a3f] text-gray-400 font-medium hover:text-white transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setStep('proof')}
                disabled={!selectedMethod}
                className="flex-1 gradient-primary text-white font-semibold py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Proof upload */}
        {step === 'proof' && selectedMethod && (
          <div className="animate-fade-in">
            {/* QR code display */}
            <div className="bg-white rounded-xl p-4 text-center mb-4">
              <img src={selectedMethod.qr_image_url} alt={`${selectedMethod.method_name} payment QR code`} className="w-56 h-56 max-w-full mx-auto rounded-lg object-contain" />
              <p className="text-gray-700 text-sm font-semibold mt-3">{selectedMethod.method_name}</p>
              <p className="text-gray-500 text-xs mt-1">Payment amount: {formatCurrency(parseFloat(amount))}</p>
            </div>
            {selectedMethod.instructions && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 mb-4">
                <p className="text-blue-300 text-xs font-semibold mb-2">Step-by-step deposit guide</p>
                <ol className="space-y-2">
                  {selectedMethod.instructions.split('\n').filter((s) => s.trim()).map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                      <span className="text-gray-300 text-xs leading-relaxed">{step.trim()}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Reference number */}
            <label className="text-sm font-medium text-gray-300 mb-2 block">Transaction Reference Number</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full bg-[#0a0e1a] border border-[#232a3f] rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none mb-4"
              placeholder="e.g. TXN123456789"
            />

            {/* Proof upload */}
            <label className="text-sm font-medium text-gray-300 mb-2 block">Upload Payment Screenshot <span className="text-red-400">*</span></label>
            <p className="text-gray-500 text-xs mb-2">Use a clear screenshot showing the amount, recipient, and transaction reference. JPG, PNG, or WEBP up to 5 MB.</p>
            <div className="mb-4">
              {proofUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-emerald-500/30">
                  <img src={proofUrl} alt="Proof" className="w-full h-40 object-cover" />
                  <button
                    onClick={() => setProofUrl(null)}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#232a3f] rounded-xl cursor-pointer hover:border-blue-500/40 transition-all bg-[#0a0e1a]">
                  <div className="flex flex-col items-center gap-2">
                    {uploading ? (
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 text-gray-500" />
                    )}
                    <span className="text-gray-500 text-sm">{uploading ? 'Uploading...' : 'Click to upload receipt'}</span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                </label>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('payment')}
                className="px-5 py-3 rounded-xl bg-[#0a0e1a] border border-[#232a3f] text-gray-400 font-medium hover:text-white transition-all"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !proofUrl}
                className="flex-1 gradient-primary text-white font-semibold py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Recharge'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#131825] rounded-t-2xl sm:rounded-2xl border border-[#232a3f] p-5 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
