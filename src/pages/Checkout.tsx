import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../contexts/LanguageContext';
import { useCart, CartItem } from '../contexts/CartContext';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { OrderConfirmation } from '../components/OrderConfirmation';
import { exportPosterHiResBlob } from '../lib/posterExport';
import { uploadPosterFile } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const SIZE_PRICE: Record<string, number> = { A5: 700, A4: 900, A3: 1100 };
const FRAME_EXTRA: Record<string, number> = { none: 0, black: 1000, white: 1000 };
const SHIPPING_COST = 200;
const FREE_SHIPPING_THRESHOLD = 4000;

function itemPrice(item: CartItem) {
  return ((SIZE_PRICE[item.size] ?? 0) + (FRAME_EXTRA[item.frame] ?? 0)) * item.quantity;
}

interface FormState {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

type FormKey = keyof FormState;
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

export function Checkout() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { t } = useT();
  const { items, clearCart } = useCart();

  const savedShipping = (() => {
    try { return JSON.parse(localStorage.getItem('stampica_shipping') ?? 'null'); } catch { return null; }
  })();

  const [form, setForm] = useState<FormState>({
    name: user?.name ?? savedShipping?.name ?? '',
    address: savedShipping?.address ?? '',
    city: savedShipping?.city ?? '',
    postalCode: savedShipping?.postalCode ?? '',
    country: savedShipping?.country ?? '',
    phone: savedShipping?.phone ?? '',
  });
  const [saveShipping, setSaveShipping] = useState(!!savedShipping);
  const [touched, setTouched] = useState<Partial<Record<FormKey, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string | null>(null);

  // Redirect to cart if empty
  useEffect(() => {
    if (items.length === 0 && !confirmedOrderNumber) navigate('/cart', { replace: true });
  }, [items.length, confirmedOrderNumber]);

  function update(key: FormKey, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function touch(key: FormKey) {
    setTouched(prev => ({ ...prev, [key]: true }));
  }

  const errors = validate(form);
  const visibleErrors = Object.fromEntries(
    Object.entries(errors).filter(([k]) => touched[k as FormKey])
  ) as Partial<Record<FormKey, string>>;

  const subtotal = items.reduce((s, i) => s + itemPrice(i), 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;

  const firstPreview = items[0]?.previewBlobUrl ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    const allTouched = Object.fromEntries(REQUIRED_FIELDS.map(k => [k, true]));
    setTouched(allTouched);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (saveShipping) {
        localStorage.setItem('stampica_shipping', JSON.stringify({
          name: form.name, address: form.address, city: form.city,
          postalCode: form.postalCode, country: form.country, phone: form.phone,
        }));
      } else {
        localStorage.removeItem('stampica_shipping');
      }

      const shippingAddress = `${form.name}, ${form.address}, ${form.city} ${form.postalCode}, ${form.country}`;
      const orderId = Date.now().toString(36);

      // Upload files for each item
      const uploadedItems = await Promise.all(items.map(async (item, idx) => {
        let previewFileUrl: string | null = null;
        let hiresFileUrl: string | null = null;

        if (item.previewBlob) {
          previewFileUrl = await uploadPosterFile(item.previewBlob, `${orderId}_${idx}_preview.jpg`).catch(() => null);
        }

        if (item.options) {
          const exportOptions = { ...item.options, poster: { ...item.options.poster, aspectRatio: item.size } };
          const hiresBlob = await exportPosterHiResBlob(exportOptions, item.imageFile ?? null, item.processedImage ?? null);
          if (hiresBlob) {
            hiresFileUrl = await uploadPosterFile(hiresBlob, `${orderId}_${idx}_hires.png`).catch(() => null);
          }
        }

        return {
          size: item.size,
          quantity: item.quantity,
          frame: item.frame,
          previewUrl: previewFileUrl,
          posterUrl: hiresFileUrl,
          designData: item.options ?? {},
        };
      }));

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: uploadedItems,
          shippingAddress,
          phone: form.phone,
        }),
      });

      const data = (await res.json()) as { order?: { order_number: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to place order');
      setConfirmedOrderNumber(data.order!.order_number);
      clearCart();
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
    <div className="md:h-full bg-neutral-950 md:overflow-hidden">
      <div className="flex flex-col md:flex-row md:h-full">

        {/* Left — poster preview */}
        <div className="md:w-1/2 bg-neutral-900 border-b md:border-b-0 md:border-r border-neutral-800 flex items-center justify-center p-6 md:p-10 flex-shrink-0">
          {firstPreview ? (
            <div className="relative w-full flex items-center justify-center h-full">
              {items.length > 1 && (
                <img src={items[1]?.previewBlobUrl} alt=""
                  className="absolute left-1/2 -translate-x-1/2 max-h-[85%] max-w-[85%] object-contain rounded-xl border border-neutral-800 shadow-2xl opacity-40"
                  style={{ transform: 'translateX(-46%) translateY(3%) rotate(-3deg)' }}
                />
              )}
              <img src={firstPreview} alt="Your poster"
                className="relative max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-neutral-800 z-10"
              />
              {items.length > 1 && (
                <div className="absolute top-4 right-4 z-20 bg-white text-black text-xs font-bold rounded-full px-2.5 py-1">
                  {items.length} {t('items')}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full aspect-[1/1.41] max-h-full bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-600 text-sm">
              No preview
            </div>
          )}
        </div>

        {/* Right — form */}
        <div className="md:w-1/2 md:overflow-y-auto p-4 md:p-8 md:h-full">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <button onClick={() => navigate('/cart')} className="text-neutral-500 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </button>
              <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center">
                <ShoppingBag className="text-white" size={20} />
              </div>
              <h1 className="text-2xl font-bold text-white">{t('orderYourPoster')}</h1>
            </div>

            {!user ? (
              <div className="bg-neutral-900 rounded-2xl p-6 text-center border border-neutral-800">
                <p className="text-neutral-400 mb-4 text-sm">{t('signInToOrder')}</p>
                <div className="flex justify-center">
                  <GoogleLoginButton />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Order summary */}
                <section className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-neutral-800">
                    <h2 className="font-semibold text-white">{t('printDetails')}</h2>
                  </div>
                  <div className="divide-y divide-neutral-800">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                        {item.previewBlobUrl
                          ? <img src={item.previewBlobUrl} alt="" className="w-10 object-contain rounded border border-neutral-700 flex-shrink-0" />
                          : <div className="w-10 aspect-[1/1.41] bg-neutral-800 rounded flex-shrink-0" />
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{item.size} · {item.frame !== 'none' ? item.frame + ' frame · ' : ''}{item.quantity}×</p>
                        </div>
                        <p className="text-sm font-bold text-white flex-shrink-0">{itemPrice(item)} din</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-neutral-800 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">{t('subtotal')}</span>
                      <span className="text-white">{subtotal} din</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">{t('shipping')}</span>
                      {shipping === 0
                        ? <span className="text-green-400">{t('freeShipping')}</span>
                        : <span className="text-white">{shipping} din</span>
                      }
                    </div>
                    {shipping > 0 && (
                      <p className="text-[11px] text-neutral-600">{t('freeShippingNote', { amount: FREE_SHIPPING_THRESHOLD })}</p>
                    )}
                    <div className="flex justify-between pt-2 border-t border-neutral-800">
                      <span className="text-sm text-neutral-400">{t('total')}</span>
                      <span className="text-2xl font-bold text-white">{total} din</span>
                    </div>
                  </div>
                </section>

                {/* Payment notice */}
                <div className="flex items-start gap-3 bg-neutral-800/60 border border-neutral-700 rounded-xl px-4 py-3">
                  <span className="text-lg leading-none mt-0.5">💳</span>
                  <div>
                    <p className="text-sm font-medium text-white">{t('paymentOnDelivery')}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{t('paymentOnDeliveryDesc')}</p>
                  </div>
                </div>

                {/* Shipping details */}
                <section className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-neutral-800">
                    <h2 className="font-semibold text-white">{t('shippingDetails')}</h2>
                  </div>
                  <div className="p-6 space-y-3">
                    <Field label={t('fullName')} value={form.name}
                      onChange={v => update('name', v)} onBlur={() => touch('name')}
                      error={visibleErrors.name} autoComplete="name" />
                    <Field label={t('streetAddress')} value={form.address}
                      onChange={v => update('address', v)} onBlur={() => touch('address')}
                      error={visibleErrors.address} autoComplete="street-address" />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t('city')} value={form.city}
                        onChange={v => update('city', v)} onBlur={() => touch('city')}
                        error={visibleErrors.city} autoComplete="address-level2" />
                      <Field label={t('postalCode')} value={form.postalCode}
                        onChange={v => update('postalCode', v)} onBlur={() => touch('postalCode')}
                        error={visibleErrors.postalCode} autoComplete="postal-code" />
                    </div>
                    <Field label={t('country')} value={form.country}
                      onChange={v => update('country', v)} onBlur={() => touch('country')}
                      error={visibleErrors.country} autoComplete="country-name" />
                    <Field label={t('phoneNumber')} value={form.phone}
                      onChange={v => update('phone', v)} onBlur={() => touch('phone')}
                      error={visibleErrors.phone} type="tel" autoComplete="tel" />
                    <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={saveShipping}
                        onChange={e => setSaveShipping(e.target.checked)}
                        className="w-4 h-4 rounded accent-white cursor-pointer"
                      />
                      <span className="text-sm text-neutral-400">{t('saveShipping')}</span>
                    </label>
                  </div>
                </section>

                {submitError && (
                  <p className="text-red-400 text-sm bg-red-900/20 px-4 py-3 rounded-xl border border-red-900/30">{submitError}</p>
                )}

                <button type="submit" disabled={isSubmitting}
                  className="w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-neutral-100 disabled:opacity-50 transition-all text-base">
                  {isSubmitting ? t('uploading') : `${t('placeOrder')} · ${total} din`}
                </button>
                <div className="h-8" />
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
