import { useEffect, useId, useRef, useState } from 'react';

interface ArchivedModalProps {
  title: string;
  publisher: string;
  archivedBody: string;
  isOpen: boolean;
  onClose: () => void;
}

export function useArchivedModal() {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}

export function ArchivedModal({
  title,
  publisher,
  archivedBody,
  isOpen,
  onClose,
}: ArchivedModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
  }, [isOpen]);

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

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (!isOpen && !visible) setMounted(false);
  };

  if (!mounted) return null;

  const stateClass = visible ? ' is-open' : ' is-closing';

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
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: archivedBody }}
        />
      </div>
    </div>
  );
}
