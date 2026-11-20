import { Link } from 'react-router-dom';
import { useT } from '../contexts/LanguageContext';

export function Footer() {
  const { t } = useT();
  return (
    <footer className="flex-shrink-0 border-t border-line bg-paper px-5 py-6 md:py-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:pb-3 flex flex-col-reverse md:flex-row md:items-center justify-between gap-4">
      <span className="text-xs text-ink-faint">© {new Date().getFullYear()} Stampica · {t('madeWithLove')} <span className="text-vermilion" aria-hidden="true">♥</span></span>
      <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 -mx-1">
        <Link to="/terms" className="text-sm md:text-xs text-ink-soft hover:text-ink transition-colors px-1 py-2 md:py-1">{t('terms')}</Link>
        <Link to="/privacy" className="text-sm md:text-xs text-ink-soft hover:text-ink transition-colors px-1 py-2 md:py-1">{t('privacy')}</Link>
        <Link to="/refunds" className="text-sm md:text-xs text-ink-soft hover:text-ink transition-colors px-1 py-2 md:py-1">{t('refundsDelivery')}</Link>
        <Link to="/support" className="text-sm md:text-xs text-ink-soft hover:text-ink transition-colors px-1 py-2 md:py-1">{t('support')}</Link>
        <a href="https://instagram.com/stampica_studio" target="_blank" rel="noopener noreferrer"
          className="text-sm md:text-xs text-ink-soft hover:text-ink transition-colors px-1 py-2 md:py-1">{t('instagram')}</a>
      </nav>
    </footer>
  );
}
