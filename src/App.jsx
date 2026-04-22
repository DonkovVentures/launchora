import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navigate } from 'react-router-dom';
import { LanguageProvider } from '@/lib/LanguageContext';

// Page imports
import Landing from './pages/Landing';
import Create from './pages/Create';
import ProductResult from './pages/ProductResult';
import LaunchAssistant from './pages/LaunchAssistant';
// Dashboard is unified under /projects — keeping import for backwards compat redirect
import Pricing from './pages/Pricing';
import SocialMediaKit from './pages/SocialMediaKit';
import ProjectDashboard from './pages/ProjectDashboard';
import Studio from './pages/Studio';

const AuthenticatedApp = () => {
  const { isLoadingPublicSettings } = useAuth();

  if (isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/create" element={<Create />} />
      <Route path="/product/:id" element={<ProductResult />} />
      <Route path="/launch/:id" element={<LaunchAssistant />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/social/:id" element={<SocialMediaKit />} />
      <Route path="/studio/:id" element={<Studio />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/" replace />} />}>
        <Route path="/dashboard" element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={<ProjectDashboard />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App