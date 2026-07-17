import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import SearchPage from './pages/SearchPage';
import BookDetailPage from './pages/BookDetailPage';
import OnlineReaderPage from './pages/OnlineReaderPage';
import DashboardPage from './pages/DashboardPage';
import RecommendationsPage from './pages/RecommendationsPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/book/:id" element={<BookDetailPage />} />
            <Route path="/read/:id" element={<OnlineReaderPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
