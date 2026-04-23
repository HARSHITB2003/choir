// Every meeting tool records what was said. Choir shows what was happening.
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Arrival } from './components/screens/Arrival';
import { Join } from './components/screens/Join';
import { Room } from './components/screens/Room';
import { DemoLauncher } from './components/screens/DemoLauncher';
import { DemoRoom } from './components/screens/DemoRoom';

const Minutes = lazy(() => import('./components/screens/Minutes').then((m) => ({ default: m.Minutes })));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ padding: 40, color: '#7A8DA3', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, letterSpacing: '0.12em' }}>loading…</div>}>
        <Routes>
          <Route path="/" element={<Arrival />} />
          <Route path="/join/:code" element={<Join />} />
          <Route path="/room/:code" element={<Room />} />
          <Route path="/minutes/:code" element={<Minutes />} />
          <Route path="/demo" element={<DemoLauncher />} />
          <Route path="/demo/:demoId" element={<DemoRoom />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
