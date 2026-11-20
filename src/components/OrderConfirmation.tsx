import { CheckCircle, X, Package } from 'lucide-react';
import { useT } from '../contexts/LanguageContext';

interface Props {
  orderNumber: string;
  onClose: () => void;
  onTrackOrder: () => void;
}

export function OrderConfirmation({ orderNumber, onClose, onTrackOrder }: Props) {
  const { t } = useT();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-paper/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-surface rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-ink-soft hover:text-ink-faint dark:hover:text-ink transition-colors">
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="text-green-600 dark:text-green-400" size={36} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-ink">{t('orderConfirmed')}</h2>
            <p className="mt-1 text-ink-faint dark:text-ink-soft text-sm">{t('orderConfirmedDesc')}</p>
          </div>

          <div className="w-full bg-neutral-100 dark:bg-paper rounded-xl p-4 text-left">
            <p className="text-xs text-ink-faint dark:text-ink-soft uppercase tracking-wide font-medium mb-1">{t('orderNumber')}</p>
            <p className="font-mono text-lg font-bold text-neutral-900 dark:text-ink">#{orderNumber}</p>
          </div>

          <div className="flex flex-col gap-3 w-full mt-2">
            <button onClick={onTrackOrder} className="flex items-center justify-center gap-2 w-full bg-surface  text-ink  font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity">
              <Package size={18} />
              {t('trackOrder')}
            </button>
            <button onClick={onClose} className="w-full text-ink-faint hover:text-ink-faint dark:text-ink-soft dark:hover:text-ink text-sm py-2 transition-colors">
              {t('backToCreate')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
