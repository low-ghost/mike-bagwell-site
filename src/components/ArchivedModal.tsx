import { useEffect, useId, useRef } from 'react';
import { useDialogPresence } from './ui/useDialogPresence';

interface ArchivedModalProps {
  title: string;
  publisher: string;
  archivedBody: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ArchivedModal({
  title,
  publisher,
  archivedBody,
  isOpen,
  onClose,
}: ArchivedModalProps) {
  const { mounted, visible, stateClass, handleTransitionEnd } = useDialogPresence(isOpen);
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mounted || !visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [mounted, visible, onClose]);

  if (!mounted) return null;

  return (
    <div
      className={`ui-dialog${stateClass}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="ui-dialog__panel" onClick={(e) => e.stopPropagation()}>
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          className="ui-dialog__close"
          aria-label="Close"
        >
          &times;
        </button>
        <h2
          id={titleId}
          className="font-display text-2xl font-normal tracking-tight mb-2 text-[var(--color-ink)]"
        >
          {title}
        </h2>
        <p className="text-sm text-[var(--color-mute)] mb-6">{publisher}</p>
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: archivedBody }} />
      </div>
    </div>
  );
}
