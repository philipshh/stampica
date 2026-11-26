import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { CartProvider } from './contexts/CartContext';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
// The editor (and its worker, drag-and-drop and render code) loads only on /create
const App = lazy(() => import('./App'));
import { Landing } from './pages/Landing';
const Cart = lazy(() => import('./pages/Cart').then(m => ({ default: m.Cart })));
const Checkout = lazy(() => import('./pages/Checkout').then(m => ({ default: m.Checkout })));
const MyOrders = lazy(() => import('./pages/MyOrders').then(m => ({ default: m.MyOrders })));
const Downloads = lazy(() => import('./pages/Downloads').then(m => ({ default: m.Downloads })));
const Terms = lazy(() => import('./pages/Terms').then(m => ({ default: m.Terms })));
const Privacy = lazy(() => import('./pages/Privacy').then(m => ({ default: m.Privacy })));
const Refunds = lazy(() => import('./pages/Refunds').then(m => ({ default: m.Refunds })));
const Support = lazy(() => import('./pages/Support').then(m => ({ default: m.Support })));
const DevNav = lazy(() => import('./pages/DevNav').then(m => ({ default: m.DevNav })));
const PosterStudio = lazy(() => import('./pages/PosterStudio').then(m => ({ default: m.PosterStudio })));

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh bg-paper pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <TopBar bottomNav />
      <main className="flex-1"><Suspense fallback={<div className="min-h-[60vh]" />}>{children}</Suspense></main>
      <Footer />
      <BottomNav />
    </div>
  );
}

// Editor fills exactly the visible screen (dvh excludes mobile browser bars); no footer
function EditorLayout() {
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden overscroll-none">
      <div className="hidden md:block"><TopBar /></div>
      <Suspense fallback={<div className="flex-1 bg-canvas workspace-grid" />}>
        <App />
      </Suspense>
    </div>
  );
}

// Pages share the window scroll, so start each new page at the top
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export function Router() {
  return (
    <BrowserRouter>
    <ScrollToTop />
    <LanguageProvider>
    <CartProvider>
      <Routes>
        <Route path="/" element={<Layout><Landing /></Layout>} />
        <Route path="/create" element={<EditorLayout />} />
        <Route path="/cart" element={<Layout><Cart /></Layout>} />
        <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
        <Route path="/orders" element={<Layout><MyOrders /></Layout>} />
        <Route path="/downloads/:id" element={<Layout><Downloads /></Layout>} />
        <Route path="/terms" element={<Layout><Terms /></Layout>} />
        <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
        <Route path="/refunds" element={<Layout><Refunds /></Layout>} />
        <Route path="/shipping" element={<Navigate to="/refunds" replace />} />
        <Route path="/support" element={<Layout><Support /></Layout>} />
        {import.meta.env.DEV && <Route path="/dev" element={<Layout><Suspense fallback={null}><DevNav /></Suspense></Layout>} />}
        {import.meta.env.DEV && <Route path="/dev/posters" element={<Layout><Suspense fallback={null}><PosterStudio /></Suspense></Layout>} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CartProvider>
    </LanguageProvider>
    </BrowserRouter>
  );
}
