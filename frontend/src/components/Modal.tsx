import type { ReactNode } from 'react';

interface Props { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; }

export default function Modal({ open, title, onClose, children, footer }: Props) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}