import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EventBuilder from './pages/EventBuilder';
import EventEdit from './pages/EventEdit';
import GuestList from './pages/GuestList';
import EventPage from './pages/EventPage';
import RsvpForm from './pages/RsvpForm';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Host (protected) */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/events/new" element={<ProtectedRoute><EventBuilder /></ProtectedRoute>} />
            <Route path="/events/:id/edit" element={<ProtectedRoute><EventEdit /></ProtectedRoute>} />
            <Route path="/events/:id/guests" element={<ProtectedRoute><GuestList /></ProtectedRoute>} />

            {/* Guest-facing public pages — must come last to avoid shadowing /events/* */}
            <Route path="/:slug/rsvp" element={<RsvpForm />} />
            <Route path="/:slug" element={<EventPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
