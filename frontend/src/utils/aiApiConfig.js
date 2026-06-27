const STORAGE_KEY = 'icon786_ai_api_config';

export const PROVIDER_INFO = {
  server: {
    id: 'server',
    name: 'Icon786 Free',
    description: 'Use free AI on our server when enabled',
    baseUrlEditable: false,
    modelEditable: true,
    helpUrl: '',
    defaultModel: 'gpt-4o-mini',
    isDefault: true,
    defaultBaseUrl: '',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'Official OpenAI API',
    baseUrlEditable: true,
    modelEditable: true,
    helpUrl: 'https://platform.openai.com/api-keys',
    defaultModel: 'gpt-4o-mini',
    isDefault: false,
    defaultBaseUrl: 'https://api.openai.com/v1',
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    description: 'Fast inference — free tier available',
    baseUrlEditable: false,
    modelEditable: true,
    helpUrl: 'https://console.groq.com/keys',
    defaultModel: 'llama-3.3-70b-versatile',
    isDefault: false,
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Many models including free options',
    baseUrlEditable: false,
    modelEditable: true,
    helpUrl: 'https://openrouter.ai/keys',
    defaultModel: 'openai/gpt-4o-mini',
    isDefault: false,
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    description: 'Any OpenAI-compatible API endpoint',
    baseUrlEditable: true,
    modelEditable: true,
    helpUrl: '',
    defaultModel: 'gpt-4o-mini',
    isDefault: false,
    defaultBaseUrl: '',
  },
};

const DEFAULT_PROVIDER_CONFIG = () =>
  Object.fromEntries(
    Object.keys(PROVIDER_INFO).map((id) => [
      id,
      {
        apiKey: '',
        baseUrl: PROVIDER_INFO[id].defaultBaseUrl || '',
        model: PROVIDER_INFO[id].defaultModel || '',
      },
    ])
  );

export function getDefaultApiConfig() {
  return {
    selectedProvider: 'server',
    providers: DEFAULT_PROVIDER_CONFIG(),
  };
}

function migrateLegacySettings() {
  try {
    const legacy = JSON.parse(localStorage.getItem('icon786_ai_settings') || '{}');
    if (!legacy.provider) return null;
    const cfg = getDefaultApiConfig();
    cfg.selectedProvider = legacy.provider || 'server';
    const p = cfg.providers[cfg.selectedProvider];
    if (p) {
      p.apiKey = legacy.apiKey || '';
      p.baseUrl = legacy.baseUrl || p.baseUrl;
      p.model = legacy.model || p.model;
    }
    return cfg;
  } catch {
    return null;
  }
}

export function getApiConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const base = getDefaultApiConfig();
      return {
        selectedProvider: parsed.selectedProvider || base.selectedProvider,
        providers: { ...base.providers, ...parsed.providers },
      };
    }
    const migrated = migrateLegacySettings();
    if (migrated) {
      setApiConfig(migrated);
      return migrated;
    }
  } catch { /* fall through */ }
  return getDefaultApiConfig();
}

export function setApiConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('icon786:ai-config-updated'));
}

export function getSelectedProviderConfig(config) {
  const id = config?.selectedProvider || 'server';
  return config?.providers?.[id] || getDefaultApiConfig().providers.server;
}

export function validateApiConfig(config) {
  const errors = [];
  const id = config.selectedProvider;
  const info = PROVIDER_INFO[id];
  const pcfg = config.providers[id];
  if (!info || info.isDefault) return errors;

  if (!pcfg?.apiKey?.trim()) {
    errors.push({ field: 'apiKey', message: 'API key is required' });
  }
  if (info.baseUrlEditable && !pcfg?.baseUrl?.trim()) {
    errors.push({ field: 'baseUrl', message: 'Base URL is required' });
  }
  return errors;
}

export function configToAiHeaders(config, serverModels) {
  const id = config.selectedProvider;
  const pcfg = getSelectedProviderConfig(config);
  const h = {
    'Content-Type': 'application/json',
    'X-AI-Provider': id,
  };
  if (pcfg.apiKey) h['X-AI-API-Key'] = pcfg.apiKey;
  if (pcfg.baseUrl) h['X-AI-Base-URL'] = pcfg.baseUrl;
  const model = pcfg.model || PROVIDER_INFO[id]?.defaultModel;
  if (model) h['X-AI-Model'] = model;
  return h;
}

export function getProviderLabel(config) {
  const id = config?.selectedProvider || 'server';
  const info = PROVIDER_INFO[id];
  const pcfg = getSelectedProviderConfig(config);
  let label = info?.name || 'Icon786 Free';
  if (pcfg.model) label += ` · ${pcfg.model}`;
  if (!info?.isDefault && pcfg.apiKey) label += ' · Your key';
  else if (info?.isDefault) label += ' · Free';
  return label;
}
