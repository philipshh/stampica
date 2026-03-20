import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { TopBar } from './components/TopBar';
import { Footer } from './components/Footer';
import App from './App';
import { Landing } from './pages/Landing';
import { Checkout } from './pages/Checkout';
import { OrderTracking } from './pages/OrderTracking';
import { AdminDashboard } from './pages/AdminDashboard';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { Shipping } from './pages/Shipping';
import { DevNav } from './pages/DevNav';

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-neutral-950">
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
      <Routes>
        <Route path="/" element={<Layout><Landing /></Layout>} />
        <Route path="/create" element={<EditorLayout />} />
        <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
        <Route path="/orders" element={<Layout><OrderTracking /></Layout>} />
        <Route path="/admin" element={<AdminGuard><Layout><AdminDashboard /></Layout></AdminGuard>} />
        <Route path="/terms" element={<Layout><Terms /></Layout>} />
        <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
        <Route path="/shipping" element={<Layout><Shipping /></Layout>} />
        <Route path="/dev" element={<Layout><DevNav /></Layout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
