import { X } from '@phosphor-icons/react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import './BottomSheet.css';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function BottomSheet({ title, onClose, children, footer }: Props) {
  const titleId = useId();
  const sheet = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    sheet.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);

  return (
    <div className="sheet-layer">
      <div className="sheet-scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={sheet}>
        <div className="sheet__handle" aria-hidden="true" />
        <div className="sheet__header">
          <h2 id={titleId} className="sheet__title">
            {title}
          </h2>
          <button type="button" className="round-button round-button--soft" onClick={onClose} aria-label="Close">
            <X size={18} weight="bold" />
          </button>
        </div>
        <div className="sheet__body">{children}</div>
        {footer && <div className="sheet__footer">{footer}</div>}
      </div>
    </div>
  );
}
