import { useEffect, useState } from 'react';
import { ArchivedModal } from './ArchivedModal';

interface ModalTriggerProps {
  title: string;
  publisher: string;
  archivedBody: string;
}

export function ModalTrigger({ title, publisher, archivedBody }: ModalTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Avoid bfcache restoring an open modal after following an in-modal link.
  useEffect(() => {
    const close = () => setIsOpen(false);
    window.addEventListener('pageshow', close);
    return () => window.removeEventListener('pageshow', close);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="absolute inset-0 w-full h-full cursor-pointer"
        aria-label={`View archived content for ${title}`}
      />
      <ArchivedModal
        title={title}
        publisher={publisher}
        archivedBody={archivedBody}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
