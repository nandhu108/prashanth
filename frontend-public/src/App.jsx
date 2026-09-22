import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EventMicrosite from './pages/EventMicrosite';
import { NotFoundState } from './components/ui/States';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root shows the featured/default event so a bare campaign link works. */}
        <Route path="/" element={<EventMicrosite />} />
        <Route path="/events/:slug" element={<EventMicrosite />} />

        {/* Registration flow is delivered in Module 3 and mounts here. */}
        <Route path="/events/:slug/register" element={<RegistrationPlaceholder />} />

        <Route path="/404" element={<NotFoundState />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

/** Temporary stand-in so the CTA hand-off is testable before Module 3 lands. */
function RegistrationPlaceholder() {
  return (
    <div className="state-message">
      <h1 className="state-message__title">Registration</h1>
      <p className="state-message__text">
        The registration flow is delivered in Module 3. The selected pass and campaign source are
        already being passed through in the URL.
      </p>
      <div className="state-message__actions">
        <a className="btn btn--primary btn--md" href="/">
          Back to the event
        </a>
      </div>
    </div>
  );
}
