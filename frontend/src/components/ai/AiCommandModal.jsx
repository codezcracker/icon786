import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Sparkles, Search, Wand2, Settings, X, Loader2,
  Download, ExternalLink, Wand2 as WandIcon,
} from 'lucide-react';
import { useAi } from '../../context/AiContext';
import { aiSearch, aiGenerate } from '../../utils/aiClient';
import { downloadBlob } from '../../utils/downloadFile';
import Icon from '../Icon';
import AiApiConfigModal from './AiApiConfigModal';

export default function AiCommandModal() {
  const navigate = useNavigate();
  const {
    modalOpen, initialTab, closeAi,
    apiConfigOpen, setApiConfigOpen, openApiConfig,
    providerLabel, serverAiEnabled, aiHeaders,
  } = useAi();

  const [tab, setTab] = useState('search');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [generated, setGenerated] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (modalOpen) {
      setTab(initialTab);
      setError('');
      setSearchResult(null);
      setGenerated(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [modalOpen, initialTab]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setLoading(true);
    setError('');
    setSearchResult(null);
    setGenerated(null);

    try {
      if (tab === 'search') {
        setSearchResult(await aiSearch(text, aiHeaders()));
      } else {
        setGenerated(await aiGenerate(text, aiHeaders()));
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    }
    setLoading(false);
  };

  const browseKeyword = (kw) => {
    closeAi();
    navigate(`/browse?q=${encodeURIComponent(kw)}`);
  };

  const browseAll = () => {
    if (!searchResult?.keywords?.length) return;
    closeAi();
    navigate(`/browse?q=${encodeURIComponent(searchResult.keywords[0])}`);
  };

  const downloadGenerated = () => {
    if (!generated?.svg) return;
    downloadBlob(new Blob([generated.svg], { type: 'image/svg+xml' }), `${generated.name || 'ai-icon'}.svg`);
  };

  const openInEditor = () => {
    if (!generated?.svg) return;
    sessionStorage.setItem('icon786_ai_svg', generated.svg);
    sessionStorage.setItem('icon786_ai_name', generated.name || 'ai-icon');
    closeAi();
    navigate('/editor?ai=1');
  };

  return (
    <>
      <Dialog.Root open={modalOpen} onOpenChange={(open) => { if (!open) closeAi(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="ai-modal-overlay" />
          <Dialog.Content className="ai-modal" aria-describedby={undefined}>
            <div className="ai-modal__header">
              <div className="ai-modal__title-row">
                <Sparkles size={18} className="ai-modal__spark" />
                <Dialog.Title className="ai-modal__title">Icon786 AI</Dialog.Title>
              </div>
              <div className="ai-modal__tabs">
                <button
                  type="button"
                  className={`ai-modal__tab${tab === 'search' ? ' is-active' : ''}`}
                  onClick={() => setTab('search')}
                >
                  <Search size={14} /> Search
                </button>
                <button
                  type="button"
                  className={`ai-modal__tab${tab === 'generate' ? ' is-active' : ''}`}
                  onClick={() => setTab('generate')}
                >
                  <WandIcon size={14} /> Generate
                </button>
              </div>
              <div className="ai-modal__header-actions">
                <button type="button" className="ai-modal__icon-btn" onClick={openApiConfig} title="AI Configuration">
                  <Settings size={17} />
                </button>
                <Dialog.Close className="ai-modal__icon-btn" aria-label="Close">
                  <X size={17} />
                </Dialog.Close>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="ai-modal__form">
              <input
                ref={inputRef}
                type="text"
                className="ai-modal__input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={tab === 'search'
                  ? 'Describe what you need… e.g. "checkout button for a food app"'
                  : 'Describe an icon to generate… e.g. "minimal rocket launching"'}
              />
              <button type="submit" className="btn btn-primary ai-modal__submit" disabled={loading || !input.trim()}>
                {loading ? <Loader2 size={16} className="ai-spin" /> : tab === 'search' ? 'Find icons' : 'Generate'}
              </button>
            </form>

            {error && <p className="ai-modal__error">{error}</p>}

            {searchResult && (
              <div className="ai-modal__results">
                <p className="ai-modal__explain">{searchResult.explanation}</p>
                <div className="ai-modal__chips">
                  {searchResult.keywords?.map((kw) => (
                    <button key={kw} type="button" className="search-suggestions__chip" onClick={() => browseKeyword(kw)}>
                      {kw}
                    </button>
                  ))}
                </div>
                {searchResult.icons?.length > 0 && (
                  <>
                    <div className="ai-modal__result-grid">
                      {searchResult.icons.slice(0, 12).map((id) => (
                        <button
                          key={id}
                          type="button"
                          className="ai-modal__icon-cell"
                          onClick={() => {
                            const [pfx, ...rest] = id.split(':');
                            closeAi();
                            navigate(`/icon/${pfx}/${encodeURIComponent(rest.join(':'))}`);
                          }}
                        >
                          <Icon icon={id} style={{ fontSize: 22, color: 'var(--dark)' }} />
                        </button>
                      ))}
                    </div>
                    <button type="button" className="btn btn-secondary btn-full" onClick={browseAll}>
                      <ExternalLink size={14} /> View all in Browse
                    </button>
                  </>
                )}
                <span className="ai-modal__source">
                  {searchResult.source === 'ai' ? 'Powered by AI' : 'Basic AI (configure API key for smarter results)'}
                </span>
              </div>
            )}

            {generated && (
              <div className="ai-modal__results">
                <div className="ai-modal__generated-preview" dangerouslySetInnerHTML={{ __html: generated.svg }} />
                <p className="ai-modal__explain">Generated: <strong>{generated.name}</strong></p>
                <div className="ai-modal__gen-actions">
                  <button type="button" className="btn btn-primary flex-1" onClick={downloadGenerated}>
                    <Download size={14} /> Save SVG
                  </button>
                  <button type="button" className="btn btn-secondary flex-1" onClick={openInEditor}>
                    <WandIcon size={14} /> Open in Editor
                  </button>
                </div>
              </div>
            )}

            <div className="ai-modal__footer">
              <button type="button" className="ai-modal__model-chip" onClick={openApiConfig}>
                <Settings size={13} />
                {providerLabel}
              </button>
              <span className="ai-modal__shortcut">⌘K</span>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AiApiConfigModal
        open={apiConfigOpen}
        onOpenChange={setApiConfigOpen}
        serverAiEnabled={serverAiEnabled}
      />
    </>
  );
}
