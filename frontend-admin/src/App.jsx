import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import Login from './pages/Login';
import DashboardOverview from './pages/DashboardOverview';
import ComingSoon from './pages/ComingSoon';

function Shielded({ children, roles }) {
  return (
    <ProtectedRoute roles={roles}>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<Shielded><DashboardOverview /></Shielded>} />
          <Route
            path="/event"
            element={<Shielded><ComingSoon title="Event CMS" module="Module 2" /></Shielded>}
          />
          <Route
            path="/ticket-types"
            element={<Shielded><ComingSoon title="Ticket Types" module="Module 4" /></Shielded>}
          />
          <Route
            path="/promo-codes"
            element={<Shielded><ComingSoon title="Promo Codes" module="Module 5" /></Shielded>}
          />
          <Route
            path="/registrations"
            element={<Shielded><ComingSoon title="Registrations" module="Module 3" /></Shielded>}
          />
          <Route
            path="/payments"
            element={<Shielded><ComingSoon title="Payments" module="Module 6" /></Shielded>}
          />
          <Route
            path="/checkin"
            element={<Shielded><ComingSoon title="Event-day Check-in" module="Module 9" /></Shielded>}
          />
          <Route
            path="/feedback"
            element={<Shielded><ComingSoon title="Feedback" module="Module 12" /></Shielded>}
          />
          <Route
            path="/reports"
            element={<Shielded><ComingSoon title="Reports" module="Module 11" /></Shielded>}
          />
          <Route
            path="/users"
            element={
              <Shielded roles={['superadmin']}>
                <ComingSoon title="Users & Roles" module="Module 13" />
              </Shielded>
            }
          />
          <Route
            path="/audit-log"
            element={
              <Shielded roles={['superadmin']}>
                <ComingSoon title="Audit Log" module="Module 13" />
              </Shielded>
            }
          />
          <Route
            path="/help"
            element={<Shielded><ComingSoon title="Help" module="Module 15" /></Shielded>}
          />

          <Route path="*" element={<Shielded><ComingSoon title="Not found" module="404" /></Shielded>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
