import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ExternalLink, Settings, Shield, CheckCircle2, X } from 'lucide-react';
import {
  getApiConfig,
  setApiConfig,
  PROVIDER_INFO,
  validateApiConfig,
  getProviderLabel,
} from '../../utils/aiApiConfig';

const DEFAULT_FEATURES = [
  'No API key needed when Icon786 Free is enabled',
  'Smart icon search from natural language',
  'Basic keyword matching as fallback',
];

/**
 * API settings modal — adapted from samzong/ai-icon-generator (MIT)
 * https://github.com/samzong/ai-icon-generator
 */
export default function AiApiConfigModal({ open, onOpenChange, serverAiEnabled = false }) {
  const [config, setConfig] = useState(null);
  const [savedConfig, setSavedConfig] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    if (open) {
      const current = getApiConfig();
      setConfig(current);
      setSavedConfig(current);
      setValidationErrors([]);
    }
  }, [open]);

  const handleSave = () => {
    if (!config) return;
    const errors = validateApiConfig(config);
    setValidationErrors(errors);
    if (errors.length) return;
    setApiConfig(config);
    setSavedConfig(config);
    onOpenChange(false);
  };

  const handleOpenChange = (next) => {
    if (!next && savedConfig) {
      setConfig(savedConfig);
      setValidationErrors([]);
    }
    onOpenChange(next);
  };

  const handleCancel = () => {
    if (savedConfig) {
      setConfig(savedConfig);
      setValidationErrors([]);
    }
    onOpenChange(false);
  };

  const handleProviderChange = (provider) => {
    setConfig((prev) => ({ ...prev, selectedProvider: provider }));
    setValidationErrors([]);
  };

  const handleProviderConfigChange = (provider, field, value) => {
    setConfig((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [provider]: { ...prev.providers[provider], [field]: value },
      },
    }));
    setValidationErrors((prev) => prev.filter((e) => e.field !== field));
  };

  if (!config) return null;

  const selectedProvider = config.selectedProvider;
  const selectedProviderConfig = config.providers[selectedProvider];
  const selectedProviderInfo = PROVIDER_INFO[selectedProvider];
  const errorsByField = Object.fromEntries(validationErrors.map((e) => [e.field, e.message]));

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="ai-api-overlay" />
        <Dialog.Content className="ai-api-modal" aria-describedby="ai-api-desc">
          <Dialog.Title className="ai-api-modal__title">AI Configuration</Dialog.Title>
          <Dialog.Description id="ai-api-desc" className="ai-api-modal__desc">
            Choose a provider and add your own API key, or use Icon786 Free.
          </Dialog.Description>

          <button type="button" className="ai-api-modal__close" onClick={handleCancel} aria-label="Close">
            <X size={18} />
          </button>

          <div className="ai-api-modal__body">
            <div className="ai-api-notice">
              <Shield size={16} className="ai-api-notice__icon" />
              <div>
                <div className="ai-api-notice__title">Your keys stay private</div>
                <div className="ai-api-notice__text">
                  API keys are stored only in your browser. They are sent to our server only to proxy your AI request — we never save them.
                </div>
              </div>
            </div>

            <label className="form-label">Provider</label>
            <div className="ai-api-provider-list">
              {Object.values(PROVIDER_INFO).map((info) => {
                const active = selectedProvider === info.id;
                const configured = !info.isDefault && Boolean(config.providers[info.id]?.apiKey?.trim());
                return (
                  <button
                    key={info.id}
                    type="button"
                    className={`ai-api-provider${active ? ' is-active' : ''}`}
                    onClick={() => handleProviderChange(info.id)}
                  >
                    <div className="ai-api-provider__top">
                      <span className="ai-api-provider__name">{info.name}</span>
                      {info.isDefault ? (
                        <span className="ai-api-badge ai-api-badge--primary">Default</span>
                      ) : configured ? (
                        <span className="ai-api-badge">Configured</span>
                      ) : null}
                    </div>
                    <span className="ai-api-provider__desc">{info.description}</span>
                  </button>
                );
              })}
            </div>

            <div className="ai-api-panel">
              <div className="ai-api-panel__head">
                <h3>{selectedProviderInfo.name}</h3>
                {selectedProviderInfo.helpUrl && (
                  <a
                    href={selectedProviderInfo.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ai-api-panel__link"
                  >
                    Get API key <ExternalLink size={12} />
                  </a>
                )}
              </div>

              {selectedProviderInfo.isDefault ? (
                <ul className="ai-api-features">
                  {DEFAULT_FEATURES.map((f) => (
                    <li key={f}>
                      <CheckCircle2 size={14} />
                      <span>{f}</span>
                    </li>
                  ))}
                  {serverAiEnabled ? (
                    <li className="ai-api-features__ok">
                      <CheckCircle2 size={14} />
                      <span>Icon786 Free AI is enabled on this server</span>
                    </li>
                  ) : (
                    <li className="ai-api-features__warn">
                      <span>Server free AI not configured — add your own key below or ask admin to set OPENAI_API_KEY</span>
                    </li>
                  )}
                </ul>
              ) : (
                <>
                  <label className="form-label" htmlFor="ai-api-key">
                    API Key <span className="ai-api-required">*</span>
                  </label>
                  <input
                    id="ai-api-key"
                    type="password"
                    className={`input input-mono${errorsByField.apiKey ? ' input--error' : ''}`}
                    value={selectedProviderConfig.apiKey}
                    onChange={(e) => handleProviderConfigChange(selectedProvider, 'apiKey', e.target.value)}
                    placeholder="sk-…"
                    autoComplete="off"
                  />
                  {errorsByField.apiKey && <p className="ai-api-field-error">{errorsByField.apiKey}</p>}

                  {selectedProviderInfo.baseUrlEditable && (
                    <>
                      <label className="form-label" htmlFor="ai-api-base">
                        Base URL <span className="ai-api-required">*</span>
                      </label>
                      <input
                        id="ai-api-base"
                        type="url"
                        className={`input input-mono${errorsByField.baseUrl ? ' input--error' : ''}`}
                        value={selectedProviderConfig.baseUrl || ''}
                        onChange={(e) => handleProviderConfigChange(selectedProvider, 'baseUrl', e.target.value)}
                        placeholder="https://api.openai.com/v1"
                      />
                      {errorsByField.baseUrl && <p className="ai-api-field-error">{errorsByField.baseUrl}</p>}
                    </>
                  )}

                  {!selectedProviderInfo.baseUrlEditable && selectedProviderConfig.baseUrl && (
                    <>
                      <label className="form-label">Base URL</label>
                      <input className="input input-mono" value={selectedProviderConfig.baseUrl} disabled />
                    </>
                  )}

                  {selectedProviderInfo.modelEditable && (
                    <>
                      <label className="form-label" htmlFor="ai-api-model">Model</label>
                      <input
                        id="ai-api-model"
                        className="input input-mono"
                        value={selectedProviderConfig.model || ''}
                        onChange={(e) => handleProviderConfigChange(selectedProvider, 'model', e.target.value)}
                        placeholder={selectedProviderInfo.defaultModel}
                      />
                    </>
                  )}
                </>
              )}
            </div>

            {validationErrors.length > 0 && (
              <div className="ai-api-errors">
                <strong>Please fix the following:</strong>
                <ul>
                  {validationErrors.map((e) => (
                    <li key={e.field}>{e.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="ai-api-modal__footer">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>Save configuration</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function AiApiConfigTrigger({ onClick, config }) {
  const label = config ? getProviderLabel(config) : 'API Settings';
  return (
    <button type="button" className="ai-api-trigger" onClick={onClick}>
      <Settings size={15} />
      <span>{label}</span>
    </button>
  );
}
