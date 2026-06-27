import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../utils/api';

const STORAGE_KEY = 'icon786_ai_settings';

const DEFAULT_SETTINGS = {
  provider: 'server',
  model: '',
  apiKey: '',
  baseUrl: '',
};

const AiContext = createContext(null);

export function AiProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  });
  const [config, setConfig] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [initialTab, setInitialTab] = useState('search');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    fetch(apiUrl('/api/ai/config'))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setConfig(data); })
      .catch(() => {});
  }, []);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const openAi = useCallback((tab = 'search') => {
    setInitialTab(tab);
    setSettingsOpen(false);
    setModalOpen(true);
  }, []);

  const openAiSettings = useCallback(() => {
    setSettingsOpen(true);
    setModalOpen(true);
  }, []);

  const closeAi = useCallback(() => {
    setModalOpen(false);
    setSettingsOpen(false);
  }, []);

  const aiHeaders = () => {
    const h = {
      'Content-Type': 'application/json',
      'X-AI-Provider': settings.provider || 'server',
    };
    if (settings.apiKey) h['X-AI-API-Key'] = settings.apiKey;
    if (settings.baseUrl) h['X-AI-Base-URL'] = settings.baseUrl;
    if (settings.model) h['X-AI-Model'] = settings.model;
    return h;
  };

  return (
    <AiContext.Provider
      value={{
        settings,
        config,
        updateSettings,
        modalOpen,
        settingsOpen,
        initialTab,
        openAi,
        openAiSettings,
        closeAi,
        setSettingsOpen,
        aiHeaders,
      }}
    >
      {children}
    </AiContext.Provider>
  );
}

export function useAi() {
  const ctx = useContext(AiContext);
  if (!ctx) throw new Error('useAi must be used within AiProvider');
  return ctx;
}
