import { Link } from 'react-router-dom';
import { useT } from '../contexts/LanguageContext';

export function Footer() {
  const { t } = useT();
  return (
    <footer className="flex-shrink-0 border-t border-neutral-800 bg-neutral-950 px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
      <span className="text-xs text-neutral-600">© {new Date().getFullYear()} Stampica</span>
      <nav className="flex items-center gap-4">
        <Link to="/terms" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">{t('terms')}</Link>
        <Link to="/privacy" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">{t('privacy')}</Link>
        <Link to="/shipping" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">{t('shippingReturns')}</Link>
        <Link to="/support" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">{t('support')}</Link>
        <a href="https://instagram.com/stampica_studio" target="_blank" rel="noopener noreferrer"
          className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">{t('instagram')}</a>
      </nav>
    </footer>
  );
}
