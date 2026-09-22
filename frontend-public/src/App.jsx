import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EventMicrosite from './pages/EventMicrosite';
import RegisterPage from './pages/RegisterPage';
import { NotFoundState } from './components/ui/States';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root shows the featured/default event so a bare campaign link works. */}
        <Route path="/" element={<EventMicrosite />} />
        <Route path="/events/:slug" element={<EventMicrosite />} />
        <Route path="/events/:slug/register" element={<RegisterPage />} />

        <Route path="/404" element={<NotFoundState />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
