import { useEffect, useState } from 'react';

/** Mount/unmount a dialog with open/closing CSS classes. */
export function useDialogPresence(isOpen: boolean) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

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

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    if (!isOpen && !visible) setMounted(false);
  };

  return {
    mounted,
    visible,
    stateClass: visible ? ' is-open' : ' is-closing',
    handleTransitionEnd,
  };
}
