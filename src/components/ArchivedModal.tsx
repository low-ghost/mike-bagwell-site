import { useState } from 'react';

interface ArchivedModalProps {
  title: string;
  publisher: string;
  archivedBody: string;
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
}: ArchivedModalProps & { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-neutral-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 text-2xl leading-none"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-2xl font-semibold mb-2">{title}</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">{publisher}</p>
        <div 
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: archivedBody }}
        />
      </div>
    </div>
  );
}
