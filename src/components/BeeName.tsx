import { useEffect, useRef, useState } from 'react';
import { meanings } from '../data';
import { translateUrl } from '../lib/names';

/** The bee's name as a heading; clicking it shows what the word means, with a translate link. */
export function BeeName({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const meaning = meanings[name];

  useEffect(() => setOpen(false), [name]);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  if (!meaning) return <h2>{name}</h2>;
  return (
    <h2>
      <span className="bname" ref={ref}>
        <button
          className="bname-btn"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          title="What does this name mean?"
        >
          {name}
        </button>
        {open && (
          <span className="bname-tip" role="dialog" aria-label={`Meaning of ${name}`}>
            <b>{name}</b>
            <span className="bname-text">{meaning}</span>
            <a href={translateUrl(name)} target="_blank" rel="noreferrer" className="btn">
              <span className="ico">🌐</span> Translate
            </a>
          </span>
        )}
      </span>
    </h2>
  );
}
