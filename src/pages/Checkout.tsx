import { useState, useEffect } from 'react';
import { API_BASE } from '../lib/api';
import { SHIPPING_COST, FREE_SHIPPING_THRESHOLD, itemPrice } from '../../shared/pricing';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { OrderConfirmation } from '../components/OrderConfirmation';
import { FramedPoster } from '../components/FramedPoster';
import { Lightbox } from '../components/Lightbox';
import { exportPosterHiResBlob } from '../lib/posterExport';
import { uploadPosterFile } from '../lib/supabase';



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
  const [viewIdx, setViewIdx] = useState<number | null>(null);
  const wallImages = items.map(i => i.previewBlobUrl).filter(Boolean);

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
    <div className="md:h-full bg-paper md:overflow-hidden">
      <div className="flex flex-col md:flex-row md:h-full">

        {/* Left — the order as a little gallery wall; tap a poster to see it up close */}
        <div className="md:w-1/2 bg-surface border-b md:border-b-0 md:border-r border-line flex-shrink-0 md:h-full md:overflow-y-auto custom-scrollbar">
          <div className="p-6 md:p-10">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-display font-extrabold text-2xl tracking-[-0.02em]">
                {t('yourPosters', { count: items.length })}
              </h2>
              {wallImages.length > 0 && <span className="text-xs text-ink-faint">{t('tapToView')}</span>}
            </div>
            {wallImages.length === 0 ? (
              <div className="w-full aspect-[1/1.41] max-w-xs mx-auto bg-paper rounded-xl flex items-center justify-center text-ink-faint text-sm">
                {t('noPreview')}
              </div>
            ) : (
              <>
                {/* Phones: swipe through the wall */}
                <div className="md:hidden no-scrollbar flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-6 -mx-6 px-6 pb-2">
                  {items.map((item, i) => item.previewBlobUrl && (
                    <figure key={item.id} className={`snap-start shrink-0 ${items.length === 1 ? 'w-full max-w-[280px] mx-auto' : 'w-[68%]'}`}>
                      <button
                        onClick={() => setViewIdx(wallImages.indexOf(item.previewBlobUrl))}
                        aria-label={t('viewPoster', { n: i + 1 })}
                        className="block w-full text-left"
                      >
                        <FramedPoster src={item.previewBlobUrl} eager />
                      </button>
                      <figcaption className="mt-3 text-xs text-ink-soft">
                        {item.size}{item.quantity > 1 ? ` × ${item.quantity}` : ''}
                      </figcaption>
                    </figure>
                  ))}
                </div>
                {/* Desktop: masonry wall */}
                <div className={`hidden md:block ${items.length === 1 ? 'max-w-sm mx-auto' : `gap-6 ${items.length <= 4 ? 'columns-2' : 'columns-2 lg:columns-3'}`}`}>
                  {items.map((item, i) => item.previewBlobUrl && (
                    <figure key={item.id} className="break-inside-avoid mb-6">
                      <button
                        onClick={() => setViewIdx(wallImages.indexOf(item.previewBlobUrl))}
                        aria-label={t('viewPoster', { n: i + 1 })}
                        className="block w-full text-left focus-visible:outline-offset-4"
                      >
                        <FramedPoster src={item.previewBlobUrl} eager className="poster-lift" />
                      </button>
                      <figcaption className="mt-3 text-xs text-ink-soft">
                        {item.size}{item.quantity > 1 ? ` × ${item.quantity}` : ''}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        {viewIdx !== null && (
          <Lightbox srcs={wallImages} initialIndex={viewIdx} alt={t('yourPosters', { count: items.length })} onClose={() => setViewIdx(null)} />
        )}

        {/* Right — form */}
        <div className="md:w-1/2 md:overflow-y-auto p-4 md:p-8 md:h-full">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <button onClick={() => navigate('/cart')} className="text-ink-faint hover:text-ink transition-colors">
                <ArrowLeft size={20} />
              </button>
              <div className="w-10 h-10 rounded-xl bg-paper flex items-center justify-center">
                <ShoppingBag className="text-ink" size={20} />
              </div>
              <h1 className="text-2xl font-bold text-ink">{t('orderYourPoster')}</h1>
            </div>

            {!user ? (
              <div className="bg-surface rounded-2xl p-6 text-center border border-line">
                <p className="text-ink-soft mb-4 text-sm">{t('signInToOrder')}</p>
                <div className="flex justify-center">
                  <GoogleLoginButton />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Order summary */}
                <section className="bg-surface rounded-2xl border border-line overflow-hidden">
                  <div className="px-6 py-4 border-b border-line">
                    <h2 className="font-semibold text-ink">{t('printDetails')}</h2>
                  </div>
                  <div className="divide-y divide-line">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                        {item.previewBlobUrl
                          ? <img src={item.previewBlobUrl} alt="" className="w-10 object-contain rounded border border-line flex-shrink-0" />
                          : <div className="w-10 aspect-[1/1.41] bg-paper rounded flex-shrink-0" />
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink">{item.size} · {item.frame !== 'none' ? item.frame + ' frame · ' : ''}{item.quantity}×</p>
                        </div>
                        <p className="text-sm font-bold text-ink flex-shrink-0">{itemPrice(item)} din</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-line space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-soft">{t('subtotal')}</span>
                      <span className="text-ink">{subtotal} din</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-soft">{t('shipping')}</span>
                      {shipping === 0
                        ? <span className="text-green-400">{t('freeShipping')}</span>
                        : <span className="text-ink">{shipping} din</span>
                      }
                    </div>
                    {shipping > 0 && (
                      <p className="text-[11px] text-ink-faint">{t('freeShippingNote', { amount: FREE_SHIPPING_THRESHOLD })}</p>
                    )}
                    <div className="flex justify-between pt-2 border-t border-line">
                      <span className="text-sm text-ink-soft">{t('total')}</span>
                      <span className="text-2xl font-bold text-ink">{total} din</span>
                    </div>
                  </div>
                </section>

                {/* Payment notice */}
                <div className="flex items-start gap-3 bg-line/40 border border-line rounded-xl px-4 py-3">
                  <span className="text-lg leading-none mt-0.5">💳</span>
                  <div>
                    <p className="text-sm font-medium text-ink">{t('paymentOnDelivery')}</p>
                    <p className="text-xs text-ink-soft mt-0.5">{t('paymentOnDeliveryDesc')}</p>
                  </div>
                </div>

                {/* Shipping details */}
                <section className="bg-surface rounded-2xl border border-line overflow-hidden">
                  <div className="px-6 py-4 border-b border-line">
                    <h2 className="font-semibold text-ink">{t('shippingDetails')}</h2>
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
                        className="w-4 h-4 rounded accent-[#161513] cursor-pointer"
                      />
                      <span className="text-sm text-ink-soft">{t('saveShipping')}</span>
                    </label>
                  </div>
                </section>

                {submitError && (
                  <p className="text-red-400 text-sm bg-red-900/20 px-4 py-3 rounded-xl border border-red-900/30">{submitError}</p>
                )}

                <button type="submit" disabled={isSubmitting}
                  className="w-full bg-ink text-paper font-semibold py-4 rounded-xl hover:bg-black disabled:opacity-50 transition-all text-base">
                  {isSubmitting ? t('uploading') : `${t('placeOrder')} · ${total} din`}
                </button>
                <button
                  type="button"
                  disabled
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-line text-ink-faint text-sm cursor-not-allowed"
                >
                  <Download size={15} />
                  {t('downloadHires')}
                  <span className="text-[10px] bg-paper text-ink-faint px-1.5 py-0.5 rounded">Coming soon</span>
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
      <label className="block text-sm text-ink-soft mb-1.5">{label}</label>
      <input
        type={type} value={value} autoComplete={autoComplete}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        className={`w-full px-3 py-2.5 rounded-lg border bg-paper text-ink text-sm focus:outline-none transition-colors ${
          error ? 'border-red-500/60 focus:border-red-400' : 'border-line focus:border-ink/40'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
