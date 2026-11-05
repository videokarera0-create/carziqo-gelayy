import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { PaymentMethod } from '@/lib/types';
import { QrCode, Upload, Check, X, Plus, Trash2, CircleAlert as AlertCircle, Loader2 } from 'lucide-react';

export default function AdminPaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetUploadId = useRef<string | null>(null);

  useEffect(() => {
    loadMethods();
  }, []);

  async function loadMethods() {
    setLoading(true);
    const { data, error } = await supabase.from('payment_methods').select('*').order('created_at', { ascending: true });
    if (error) {
      setNotice({ type: 'error', text: 'Could not load payment methods.' });
    }
    setMethods((data as unknown as PaymentMethod[]) || []);
    setLoading(false);
  }

  async function handleUploadQR(e: React.ChangeEvent<HTMLInputElement>, methodId: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      setNotice({ type: 'error', text: 'Please upload an image file.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: 'error', text: 'Image must be smaller than 5 MB.' });
      return;
    }

    setUploadingId(methodId);
    setNotice(null);
    const ext = file.type.split('/')[1] || 'jpg';
    const fileName = `qr-${methodId}-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage.from('payment-qr-codes').upload(fileName, file, {
      contentType: file.type,
      cacheControl: '3600',
    });

    if (upErr) {
      setNotice({ type: 'error', text: 'Upload failed. Please try again.' });
      setUploadingId(null);
      return;
    }

    const { data } = supabase.storage.from('payment-qr-codes').getPublicUrl(fileName);
    const publicUrl = data.publicUrl;

    const { error: updateErr } = await supabase
      .from('payment_methods')
      .update({ qr_image_url: publicUrl })
      .eq('id', methodId);

    if (updateErr) {
      setNotice({ type: 'error', text: 'Could not update the QR code. Please try again.' });
    } else {
      setNotice({ type: 'success', text: 'QR code updated successfully.' });
      setMethods((prev) => prev.map((m) => (m.id === methodId ? { ...m, qr_image_url: publicUrl } : m)));
    }
    setUploadingId(null);
  }

  function triggerUpload(methodId: string) {
    targetUploadId.current = methodId;
    fileInputRef.current?.click();
  }

  async function handleToggleActive(method: PaymentMethod) {
    const { error } = await supabase
      .from('payment_methods')
      .update({ is_active: !method.is_active })
      .eq('id', method.id);
    if (error) {
      setNotice({ type: 'error', text: 'Could not update status.' });
      return;
    }
    setMethods((prev) => prev.map((m) => (m.id === method.id ? { ...m, is_active: !m.is_active } : m)));
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase
      .from('payment_methods')
      .update({
        method_name: editing.method_name,
        instructions: editing.instructions,
      })
      .eq('id', editing.id);
    if (error) {
      setNotice({ type: 'error', text: 'Could not save changes.' });
    } else {
      setNotice({ type: 'success', text: 'Payment method updated.' });
      setMethods((prev) => prev.map((m) => (m.id === editing.id ? editing : m)));
      setEditing(null);
    }
    setSaving(false);
  }

  async function handleCreate(name: string, instructions: string) {
    setSaving(true);
    const { data, error } = await supabase
      .from('payment_methods')
      .insert({
        method_name: name,
        qr_image_url: '/assets/payment/bank-payment_copy copy 2.jpg',
        instructions: instructions || null,
        is_active: true,
      })
      .select('*')
      .single();
    if (error) {
      setNotice({ type: 'error', text: 'Could not create payment method.' });
    } else {
      setNotice({ type: 'success', text: 'Payment method created. Upload a QR code for it.' });
      setMethods((prev) => [...prev, data as unknown as PaymentMethod]);
      setCreating(false);
    }
    setSaving(false);
  }

  async function handleDelete(method: PaymentMethod) {
    if (!confirm(`Delete ${method.method_name}? This removes it from the recharge page.`)) return;
    const { error } = await supabase.from('payment_methods').delete().eq('id', method.id);
    if (error) {
      setNotice({ type: 'error', text: 'Could not delete this payment method.' });
      return;
    }
    setMethods((prev) => prev.filter((m) => m.id !== method.id));
    setNotice({ type: 'success', text: 'Payment method deleted.' });
  }

  return (
    <div className="animate-fade-in space-y-5">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
        if (targetUploadId.current) handleUploadQR(e, targetUploadId.current);
      }} />

      <div className="relative overflow-hidden rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-600/20 via-[#131825] to-emerald-500/10 p-6">
        <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-blue-400/10 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-300">WAYMO Operations</p>
              <h2 className="text-2xl font-bold text-white">Payment QR Codes</h2>
              <p className="mt-1 text-sm text-gray-400">Upload and manage QR codes users see when recharging.</p>
            </div>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 gradient-primary text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Add Method
          </button>
        </div>
      </div>

      {notice && (
        <div className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
          notice.type === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            : 'border-red-500/30 bg-red-500/10 text-red-300'
        }`}>
          <span className="flex items-center gap-2">
            {notice.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {notice.text}
          </span>
          <button onClick={() => setNotice(null)} className="text-gray-400 hover:text-white">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : methods.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <QrCode className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No payment methods yet. Click "Add Method" to create one.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {methods.map((m) => (
            <div key={m.id} className="bg-[#131825] rounded-xl border border-[#232a3f] overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold text-sm">{m.method_name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      m.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'
                    }`}>
                      {m.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(m)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 rounded-xl bg-white p-2 border border-[#232a3f] overflow-hidden">
                      <img src={m.qr_image_url} alt={m.method_name} className="w-full h-full object-contain" />
                    </div>
                    <button
                      onClick={() => triggerUpload(m.id)}
                      disabled={uploadingId === m.id}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium py-2 rounded-lg hover:bg-blue-500/20 transition-all disabled:opacity-50"
                    >
                      {uploadingId === m.id ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
                      ) : (
                        <><Upload className="w-3.5 h-3.5" /> Upload QR</>
                      )}
                    </button>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Instructions</p>
                      <p className="text-gray-300 text-xs leading-relaxed line-clamp-4">
                        {m.instructions || 'No instructions set.'}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setEditing({ ...m })}
                        className="flex-1 text-xs font-medium py-2 rounded-lg bg-[#0a0e1a] border border-[#232a3f] text-gray-400 hover:text-white transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(m)}
                        className={`flex-1 text-xs font-medium py-2 rounded-lg transition-all ${
                          m.is_active
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                            : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        {m.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          method={editing}
          onChange={setEditing}
          onClose={() => setEditing(null)}
          onSave={handleSaveEdit}
          saving={saving}
        />
      )}

      {creating && (
        <CreateModal
          onClose={() => setCreating(false)}
          onCreate={handleCreate}
          saving={saving}
        />
      )}
    </div>
  );
}

function EditModal({
  method,
  onChange,
  onClose,
  onSave,
  saving,
}: {
  method: PaymentMethod;
  onChange: (m: PaymentMethod) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const fieldClass = 'w-full bg-[#0a0e1a] border border-[#232a3f] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition-colors';
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-[#131825] rounded-2xl border border-[#232a3f] p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Edit Payment Method</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-sm text-gray-300 mb-1.5 block">Method Name</label>
            <input
              type="text"
              value={method.method_name}
              onChange={(e) => onChange({ ...method, method_name: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-1.5 block">Instructions</label>
            <textarea
              value={method.instructions || ''}
              onChange={(e) => onChange({ ...method, instructions: e.target.value })}
              className={fieldClass}
              rows={4}
              placeholder="Payment instructions users will see..."
            />
          </div>
        </div>
        <button
          onClick={onSave}
          disabled={saving || !method.method_name.trim()}
          className="w-full gradient-primary text-white font-semibold py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-5 h-5" /> Save Changes</>}
        </button>
      </div>
    </div>
  );
}

function CreateModal({
  onClose,
  onCreate,
  saving,
}: {
  onClose: () => void;
  onCreate: (name: string, instructions: string) => void;
  saving: boolean;
}) {
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const fieldClass = 'w-full bg-[#0a0e1a] border border-[#232a3f] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition-colors';
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-[#131825] rounded-2xl border border-[#232a3f] p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Add Payment Method</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-sm text-gray-300 mb-1.5 block">Method Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              placeholder="e.g. GCash, Maya, Bank Transfer, USDT"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-1.5 block">Instructions (optional)</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className={fieldClass}
              rows={4}
              placeholder="Payment instructions users will see..."
            />
          </div>
          <p className="text-gray-500 text-xs">A placeholder QR will be used initially. You can upload the real QR code after creating.</p>
        </div>
        <button
          onClick={() => onCreate(name.trim(), instructions.trim())}
          disabled={saving || !name.trim()}
          className="w-full gradient-primary text-white font-semibold py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-5 h-5" /> Create Method</>}
        </button>
      </div>
    </div>
  );
}
