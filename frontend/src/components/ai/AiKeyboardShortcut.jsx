import { useEffect } from 'react';
import { useAi } from '../../context/AiContext';

export default function AiKeyboardShortcut() {
  const { openAi, modalOpen, closeAi } = useAi();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (modalOpen) closeAi();
        else openAi('search');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openAi, modalOpen, closeAi]);

  return null;
}
