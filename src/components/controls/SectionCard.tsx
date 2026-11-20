import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  spacing?: 'sm' | 'md';
}

export function SectionCard({ title, children, defaultOpen = true, spacing = 'md' }: SectionCardProps) {
  const storageKey = `sc_${title.toLowerCase().replace(/\s+/g, '_')}`;
  const [open, setOpen] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored !== null ? stored === 'true' : defaultOpen;
  });
  function toggle() {
    const next = !open;
    setOpen(next);
    localStorage.setItem(storageKey, String(next));
  }
  return (
    <div className="bg-surface rounded-xl border border-line overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-line/30 transition-colors"
      >
        <h3 className="text-[10px] font-semibold text-ink-faint uppercase tracking-[0.14em]">{title}</h3>
        <ChevronDown
          size={13}
          className={`text-ink-faint transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className={`px-4 pb-4 ${spacing === 'sm' ? 'space-y-3' : 'space-y-4'}`}>
          {children}
        </div>
      )}
    </div>
  );
}
