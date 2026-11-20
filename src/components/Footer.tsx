import { Link } from 'react-router-dom';
import { useT } from '../contexts/LanguageContext';

export function Footer() {
  const { t } = useT();
  return (
    <footer className="flex-shrink-0 border-t border-line bg-paper px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
      <span className="text-xs text-ink-faint">© {new Date().getFullYear()} Stampica · {t('madeWithLove')} <span className="text-vermilion" aria-hidden="true">♥</span></span>
      <nav className="flex items-center gap-4">
        <Link to="/terms" className="text-xs text-ink-soft hover:text-ink transition-colors">{t('terms')}</Link>
        <Link to="/privacy" className="text-xs text-ink-soft hover:text-ink transition-colors">{t('privacy')}</Link>
        <Link to="/refunds" className="text-xs text-ink-soft hover:text-ink transition-colors">{t('refundsDelivery')}</Link>
        <Link to="/support" className="text-xs text-ink-soft hover:text-ink transition-colors">{t('support')}</Link>
        <a href="https://instagram.com/stampica_studio" target="_blank" rel="noopener noreferrer"
          className="text-xs text-ink-soft hover:text-ink transition-colors">{t('instagram')}</a>
      </nav>
    </footer>
  );
}
