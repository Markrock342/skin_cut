import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { StudioProvider } from './context/StudioContext';
import { HomePage } from './pages/HomePage';
import { GamesPage } from './pages/GamesPage';
import { StudioPage } from './pages/StudioPage';
import { TopupPage } from './pages/TopupPage';
import { HistoryPage } from './pages/HistoryPage';

export default function App() {
  return (
    <BrowserRouter>
      <StudioProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="games" element={<GamesPage />} />
            <Route path="studio/:gameId" element={<StudioPage />} />
            <Route path="topup" element={<TopupPage />} />
            <Route path="history" element={<HistoryPage />} />
          </Route>
        </Routes>
      </StudioProvider>
    </BrowserRouter>
  );
}
