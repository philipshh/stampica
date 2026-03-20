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
    <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors"
      >
        <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">{title}</h3>
        <ChevronDown
          size={13}
          className={`text-neutral-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className={`p-4 ${spacing === 'sm' ? 'space-y-3' : 'space-y-4'}`}>
          {children}
        </div>
      )}
    </div>
  );
}
