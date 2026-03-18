import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { OrderConfirmation } from '../components/OrderConfirmation';
import { exportPosterHiResBlob } from '../lib/posterExport';
import { uploadPosterFile } from '../lib/supabase';
import type { DitherOptions } from '../lib/dither';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// ── Sizes & prices ────────────────────────────────────────────────────────────
const SIZES = ['A5', 'A4', 'A3'] as const;
type PosterSize = (typeof SIZES)[number];

const SIZE_INFO: Record<PosterSize, { dims: string; price: number }> = {
  A5: { dims: '14.8 × 21 cm', price: 14 },
  A4: { dims: '21 × 29.7 cm', price: 22 },
  A3: { dims: '29.7 × 42 cm', price: 35 },
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface CheckoutLocationState {
  options?: DitherOptions;
  imageFile?: File;
  processedImage?: ImageData;
  previewBlob?: Blob;
  defaultSize?: string;
}

interface FormState {
  size: PosterSize;
  quantity: number;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

type FormKey = keyof Omit<FormState, 'size' | 'quantity'>;

const REQUIRED_FIELDS: FormKey[] = ['name', 'address', 'city', 'postalCode', 'country', 'phone'];

function validate(form: FormState): Partial<Record<FormKey, string>> {
  const errors: Partial<Record<FormKey, string>> = {};
  if (!form.name.trim()) errors.name = 'Full name is required';
  else if (form.name.trim().split(' ').filter(Boolean).length < 2) errors.name = 'Please enter your full name';
  if (!form.address.trim()) errors.address = 'Street address is required';
  if (!form.city.trim()) errors.city = 'City is required';
  if (!form.postalCode.trim()) errors.postalCode = 'Postal code is required';
  if (!form.country.trim()) errors.country = 'Country is required';
  if (!form.phone.trim()) errors.phone = 'Phone number is required';
  else if (!/^[+\d\s\-()]{6,}$/.test(form.phone.trim())) errors.phone = 'Enter a valid phone number';
  return errors;
}

// ── Component ────────────────────────────────────────────────────────────────
export function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as CheckoutLocationState;
  const { user, token } = useAuth();

  const defaultSize = (state.defaultSize ?? state.options?.poster.aspectRatio ?? 'A4') as PosterSize;
  const initialSize: PosterSize = SIZES.includes(defaultSize as PosterSize) ? defaultSize : 'A4';

  const [form, setForm] = useState<FormState>({
    size: initialSize,
    quantity: 1,
    name: user?.name ?? '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phone: '',
  });

  const [touched, setTouched] = useState<Partial<Record<FormKey, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string | null>(null);

  const previewUrl = state.previewBlob ? URL.createObjectURL(state.previewBlob) : null;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function touch(key: FormKey) {
    setTouched(prev => ({ ...prev, [key]: true }));
  }

  const errors = validate(form);
  const visibleErrors = Object.fromEntries(
    Object.entries(errors).filter(([k]) => touched[k as FormKey])
  ) as Partial<Record<FormKey, string>>;

  const totalPrice = SIZE_INFO[form.size].price * form.quantity;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    // Mark all fields touched to show all errors
    const allTouched = Object.fromEntries(REQUIRED_FIELDS.map(k => [k, true]));
    setTouched(allTouched);

    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const shippingAddress = `${form.name}, ${form.address}, ${form.city} ${form.postalCode}, ${form.country}`;
      const orderId = Date.now().toString(36);

      let previewFileUrl: string | null = null;
      let hiresFileUrl: string | null = null;

      if (state.previewBlob) {
        previewFileUrl = await uploadPosterFile(state.previewBlob, `${orderId}_preview.jpg`).catch(() => null);
      }

      if (state.options) {
        // Override aspect ratio to match the size the customer actually ordered
        const exportOptions: DitherOptions = {
          ...state.options,
          poster: { ...state.options.poster, aspectRatio: form.size },
        };
        const hiresBlob = await exportPosterHiResBlob(exportOptions, state.imageFile ?? null, state.processedImage ?? null);
        if (hiresBlob) {
          hiresFileUrl = await uploadPosterFile(hiresBlob, `${orderId}_hires.png`).catch(err => {
            console.error('Hi-res upload failed:', err);
            return null;
          });
        }
      }

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          size: form.size,
          quantity: form.quantity,
          shippingAddress,
          phone: form.phone,
          designData: state.options ?? {},
          previewUrl: previewFileUrl,
          posterUrl: hiresFileUrl,
        }),
      });

      const data = (await res.json()) as { order?: { order_number: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to place order');
      setConfirmedOrderNumber(data.order!.order_number);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmedOrderNumber) {
    return (
      <OrderConfirmation
        orderNumber={confirmedOrderNumber}
        onClose={() => navigate('/create')}
        onTrackOrder={() => navigate('/orders')}
      />
    );
  }

  return (
    <div className="min-h-full bg-neutral-950 p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center">
            <ShoppingBag className="text-white" size={20} />
          </div>
          <h1 className="text-2xl font-bold text-white">Order your poster</h1>
        </div>

        {/* Poster preview */}
        {previewUrl && (
          <div className="mb-6 flex justify-center">
            <img src={previewUrl} alt="Your poster"
              className="w-4/5 rounded-xl border border-neutral-800 object-contain shadow-lg" />
          </div>
        )}

        {!user ? (
          <div className="bg-neutral-900 rounded-2xl p-6 text-center border border-neutral-800">
            <p className="text-neutral-400 mb-4 text-sm">Sign in to place your order</p>
            <div className="flex justify-center">
              <GoogleLoginButton />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Print details */}
            <section className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-800">
                <h2 className="font-semibold text-white">Print details</h2>
              </div>
              <div className="p-6 space-y-5">
                {/* Size */}
                <div>
                  <label className="block text-sm text-neutral-400 mb-3">Size</label>
                  <div className="grid grid-cols-3 gap-2">
                    {SIZES.map(s => (
                      <button key={s} type="button" onClick={() => update('size', s)}
                        className={`py-3 px-2 rounded-xl text-sm font-medium border transition-all ${
                          form.size === s
                            ? 'bg-white text-black border-transparent'
                            : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:border-neutral-500'
                        }`}>
                        <div className="font-bold">{s}</div>
                        <div className={`text-[10px] mt-0.5 ${form.size === s ? 'text-black/60' : 'text-neutral-500'}`}>
                          {SIZE_INFO[s].dims}
                        </div>
                        <div className={`text-base font-bold mt-1.5 ${form.size === s ? 'text-black' : 'text-neutral-200'}`}>
                          €{SIZE_INFO[s].price}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm text-neutral-400 mb-3">Quantity</label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => update('quantity', Math.max(1, form.quantity - 1))}
                      className="w-9 h-9 rounded-lg border border-neutral-700 flex items-center justify-center text-lg font-medium text-white hover:bg-neutral-800 transition-colors">−</button>
                    <span className="w-8 text-center font-semibold text-white">{form.quantity}</span>
                    <button type="button" onClick={() => update('quantity', Math.min(20, form.quantity + 1))}
                      className="w-9 h-9 rounded-lg border border-neutral-700 flex items-center justify-center text-lg font-medium text-white hover:bg-neutral-800 transition-colors">+</button>
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-1 border-t border-neutral-800">
                    <span className="text-sm text-neutral-400">Total</span>
                    <span className="text-2xl font-bold text-white">€{totalPrice}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Shipping details */}
            <section className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-800">
                <h2 className="font-semibold text-white">Shipping details</h2>
              </div>
              <div className="p-6 space-y-3">
                <Field label="Full name" value={form.name}
                  onChange={v => update('name', v)} onBlur={() => touch('name')}
                  error={visibleErrors.name} autoComplete="name" />
                <Field label="Street address" value={form.address}
                  onChange={v => update('address', v)} onBlur={() => touch('address')}
                  error={visibleErrors.address} autoComplete="street-address" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City" value={form.city}
                    onChange={v => update('city', v)} onBlur={() => touch('city')}
                    error={visibleErrors.city} autoComplete="address-level2" />
                  <Field label="Postal code" value={form.postalCode}
                    onChange={v => update('postalCode', v)} onBlur={() => touch('postalCode')}
                    error={visibleErrors.postalCode} autoComplete="postal-code" />
                </div>
                <Field label="Country" value={form.country}
                  onChange={v => update('country', v)} onBlur={() => touch('country')}
                  error={visibleErrors.country} autoComplete="country-name" />
                <Field label="Phone number" value={form.phone}
                  onChange={v => update('phone', v)} onBlur={() => touch('phone')}
                  error={visibleErrors.phone} type="tel" autoComplete="tel" />
              </div>
            </section>

            {submitError && (
              <p className="text-red-400 text-sm bg-red-900/20 px-4 py-3 rounded-xl border border-red-900/30">{submitError}</p>
            )}

            <button type="submit" disabled={isSubmitting}
              className="w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-neutral-100 disabled:opacity-50 transition-all text-base">
              {isSubmitting ? 'Uploading & placing order…' : `Place order · €${totalPrice}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Field component ───────────────────────────────────────────────────────────
function Field({ label, value, onChange, onBlur, type = 'text', autoComplete, error }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  type?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-neutral-400 mb-1.5">{label}</label>
      <input
        type={type} value={value} autoComplete={autoComplete}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        className={`w-full px-3 py-2.5 rounded-lg border bg-neutral-800 text-white text-sm focus:outline-none transition-colors ${
          error ? 'border-red-500/60 focus:border-red-400' : 'border-neutral-700 focus:border-neutral-500'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
