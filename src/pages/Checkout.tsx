import { useState } from 'react';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { OrderConfirmation } from '../components/OrderConfirmation';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const SIZES = ['A5', 'A4', 'A3', 'A2', 'A1', 'A0', '18×24"', '24×36"', '27×40"'] as const;
type PosterSize = (typeof SIZES)[number];

interface CheckoutProps {
  onBack: () => void;
  onOrderPlaced: (orderNumber: string) => void;
  designData?: Record<string, unknown>;
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

export function Checkout({ onBack, onOrderPlaced, designData, defaultSize }: CheckoutProps) {
  const { user, token } = useAuth();
  const [form, setForm] = useState<FormState>({
    size: (defaultSize as PosterSize) ?? 'A4',
    quantity: 1,
    name: user?.name ?? '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const shippingAddress = `${form.name}, ${form.address}, ${form.city} ${form.postalCode}, ${form.country}`;

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          size: form.size,
          quantity: form.quantity,
          shippingAddress,
          phone: form.phone,
          designData: designData ?? {},
        }),
      });

      const data = (await res.json()) as { order?: { order_number: string }; error?: string };

      if (!res.ok) throw new Error(data.error ?? 'Failed to place order');

      const orderNumber = data.order!.order_number;
      setConfirmedOrderNumber(orderNumber);
      onOrderPlaced(orderNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmedOrderNumber) {
    return (
      <OrderConfirmation
        orderNumber={confirmedOrderNumber}
        onClose={onBack}
        onTrackOrder={() => {
          // Handled by parent via onOrderPlaced
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors mb-6 text-sm"
        >
          <ArrowLeft size={16} />
          Back to editor
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center">
            <ShoppingBag className="text-white dark:text-neutral-900" size={20} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Order your poster</h1>
        </div>

        {!user ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 text-center shadow-sm border border-neutral-200 dark:border-neutral-800">
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Sign in to place your order
            </p>
            <div className="flex justify-center">
              <GoogleLoginButton />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Size + Quantity */}
            <section className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
              <h2 className="font-semibold text-neutral-900 dark:text-white mb-4">Print details</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                    Size
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {SIZES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => update('size', s)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                          form.size === s
                            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-transparent'
                            : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => update('quantity', Math.max(1, form.quantity - 1))}
                      className="w-9 h-9 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-lg font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-semibold text-neutral-900 dark:text-white">
                      {form.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => update('quantity', Math.min(20, form.quantity + 1))}
                      className="w-9 h-9 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-lg font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Shipping */}
            <section className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
              <h2 className="font-semibold text-neutral-900 dark:text-white mb-4">Shipping details</h2>

              <div className="space-y-3">
                <Field
                  label="Full name"
                  value={form.name}
                  onChange={(v) => update('name', v)}
                  required
                />
                <Field
                  label="Street address"
                  value={form.address}
                  onChange={(v) => update('address', v)}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="City"
                    value={form.city}
                    onChange={(v) => update('city', v)}
                    required
                  />
                  <Field
                    label="Postal code"
                    value={form.postalCode}
                    onChange={(v) => update('postalCode', v)}
                    required
                  />
                </div>
                <Field
                  label="Country"
                  value={form.country}
                  onChange={(v) => update('country', v)}
                  required
                />
                <Field
                  label="Phone number"
                  value={form.phone}
                  onChange={(v) => update('phone', v)}
                  type="tel"
                  required
                />
              </div>
            </section>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold py-4 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity text-base"
            >
              {isSubmitting ? 'Placing order…' : 'Place order'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
      />
    </div>
  );
}
