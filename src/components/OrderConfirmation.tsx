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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors">
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="text-green-600 dark:text-green-400" size={36} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('orderConfirmed')}</h2>
            <p className="mt-1 text-neutral-500 dark:text-neutral-400 text-sm">{t('orderConfirmedDesc')}</p>
          </div>

          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4 text-left">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide font-medium mb-1">{t('orderNumber')}</p>
            <p className="font-mono text-lg font-bold text-neutral-900 dark:text-white">#{orderNumber}</p>
          </div>

          <div className="flex flex-col gap-3 w-full mt-2">
            <button onClick={onTrackOrder} className="flex items-center justify-center gap-2 w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity">
              <Package size={18} />
              {t('trackOrder')}
            </button>
            <button onClick={onClose} className="w-full text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 text-sm py-2 transition-colors">
              {t('backToCreate')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
