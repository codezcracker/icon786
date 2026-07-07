import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../utils/api';
import {
  getApiConfig,
  setApiConfig,
  configToAiHeaders,
  getProviderLabel,
} from '../utils/aiApiConfig';

const AiContext = createContext(null);

export function AiProvider({ children }) {
  const [apiConfig, setApiConfigState] = useState(getApiConfig);
  const [serverConfig, setServerConfig] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [apiConfigOpen, setApiConfigOpen] = useState(false);
  const [initialTab, setInitialTab] = useState('search');

  const refreshConfig = useCallback(() => {
    setApiConfigState(getApiConfig());
  }, []);

  useEffect(() => {
    fetch(apiUrl('/api/ai/config'))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setServerConfig(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onUpdate = () => refreshConfig();
    window.addEventListener('icon786:ai-config-updated', onUpdate);
    return () => window.removeEventListener('icon786:ai-config-updated', onUpdate);
  }, [refreshConfig]);

  const openAi = useCallback((tab = 'search') => {
    setInitialTab(tab);
    setModalOpen(true);
  }, []);

  const openApiConfig = useCallback(() => {
    setApiConfigOpen(true);
  }, []);

  const closeAi = useCallback(() => {
    setModalOpen(false);
  }, []);

  const aiHeaders = useCallback(
    () => configToAiHeaders(apiConfig, serverConfig?.models),
    [apiConfig, serverConfig]
  );

  return (
    <AiContext.Provider
      value={{
        apiConfig,
        serverConfig,
        serverAiEnabled: Boolean(serverConfig?.serverAiEnabled),
        providerLabel: getProviderLabel(apiConfig),
        modalOpen,
        apiConfigOpen,
        setApiConfigOpen,
        initialTab,
        openAi,
        openApiConfig,
        closeAi,
        aiHeaders,
        refreshConfig,
        setApiConfig,
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
