import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// App layout
import AppLayout from '@/components/layout/AppLayout';

// Pages
import Dashboard from '@/pages/Dashboard';
import Campaigns from '@/pages/Campaigns';
import CampaignWorkspace from '@/pages/CampaignWorkspace';
import Influencers from '@/pages/Influencers';
import Finance from '@/pages/Finance';
import ClientPayments from '@/pages/finance/ClientPayments';
import InfluencerPayments from '@/pages/finance/InfluencerPayments';
import Salaries from '@/pages/finance/Salaries';
import FundLedger from '@/pages/finance/FundLedger';
import Invoices from '@/pages/Invoices';
import Settings from '@/pages/Settings';
import PendingApproval from '@/pages/PendingApproval';
import OAuthCallback from '@/pages/OAuthCallback';
import UserApprovals from '@/pages/admin/UserApprovals';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading Buzzory CRM...</p>
        </div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/pending-approval" element={<PendingApproval />} />
      <Route path="/oauth-callback" element={<OAuthCallback />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaigns/:id" element={<CampaignWorkspace />} />
          <Route path="/influencers" element={<Influencers />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/finance/client-payments" element={<ClientPayments />} />
          <Route path="/finance/influencer-payments" element={<InfluencerPayments />} />
          <Route path="/finance/salaries" element={<Salaries />} />
          <Route path="/finance/fund-ledger" element={<FundLedger />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin/approvals" element={<UserApprovals />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App