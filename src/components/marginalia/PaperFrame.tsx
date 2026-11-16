import type { ReactNode } from 'react';
import './marginalia.css';

export function PaperFrame({ children }: { children?: ReactNode }) {
  return (
    <figure className="paper-frame">
      <div className="photo">
        <span className="sketch-border" aria-hidden="true" />
        <span className="tape tape-l" aria-hidden="true" />
        <span className="tape tape-r" aria-hidden="true" />

        <div className="screen">
          <span className="screen-hint">your video goes here</span>
        </div>

        {children}
      </div>
    </figure>
  );
}