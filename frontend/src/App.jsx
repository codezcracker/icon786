import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AiProvider } from './context/AiContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AiCommandModal from './components/ai/AiCommandModal';
import AiFloatingButton from './components/ai/AiFloatingButton';
import AiKeyboardShortcut from './components/ai/AiKeyboardShortcut';
import LandingPage from './pages/LandingPage';
import BrowsePage from './pages/BrowsePage';
import IconDetailPage from './pages/IconDetailPage';
import CollectionsPage from './pages/CollectionsPage';
import FontGeneratorPage from './pages/FontGeneratorPage';
import EditorPage from './pages/EditorPage';

export default function App() {
  return (
    <AiProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-surface">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/icon/:prefix/:name" element={<IconDetailPage />} />
              <Route path="/collections" element={<CollectionsPage />} />
              <Route path="/font-generator" element={<FontGeneratorPage />} />
              <Route path="/editor" element={<EditorPage />} />
            </Routes>
          </main>
          <Footer />
          <AiFloatingButton />
          <AiCommandModal />
          <AiKeyboardShortcut />
        </div>
      </Router>
    </AiProvider>
  );
}
