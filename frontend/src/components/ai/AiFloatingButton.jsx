import { Sparkles } from 'lucide-react';
import { useAi } from '../../context/AiContext';

export default function AiFloatingButton() {
  const { openAi } = useAi();

  return (
    <button
      type="button"
      className="ai-fab"
      onClick={() => openAi('search')}
      title="Icon786 AI (⌘K)"
      aria-label="Open AI assistant"
    >
      <Sparkles size={20} />
    </button>
  );
}
