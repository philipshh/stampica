import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { CartProvider } from './contexts/CartContext';
import { TopBar } from './components/TopBar';
import { Footer } from './components/Footer';
import App from './App';
import { Landing } from './pages/Landing';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { MyOrders } from './pages/MyOrders';
import { Downloads } from './pages/Downloads';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { Refunds } from './pages/Refunds';
import { Support } from './pages/Support';
import { DevNav } from './pages/DevNav';
import { PosterStudio } from './pages/PosterStudio';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-paper">
      <TopBar />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
      <Footer />
    </div>
  );
}

// Editor needs full layout control — no footer
function EditorLayout() {
  return (
    <div className="flex flex-col" style={{ height: '100vh' }}>
      <TopBar />
      <App />
    </div>
  );
}

export function Router() {
  return (
    <BrowserRouter>
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
        {import.meta.env.DEV && <Route path="/dev" element={<Layout><DevNav /></Layout>} />}
        {import.meta.env.DEV && <Route path="/dev/posters" element={<Layout><PosterStudio /></Layout>} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CartProvider>
    </LanguageProvider>
    </BrowserRouter>
  );
}
