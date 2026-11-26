import { Printer } from 'lucide-react';
import { useT } from '../contexts/LanguageContext';

type Copy = { title: string; intro: string; groups: { h: string; items: string[] }[] };

const COPY: Record<'en' | 'sr', Copy> = {
  en: {
    title: 'How to print your posters',
    intro: 'Every file is a print-ready PNG. A4 and smaller are 300 dpi, the best print quality. Bigger sizes have a bit less, which you won\'t notice from normal viewing distance.',
    groups: [
      {
        h: 'At a print shop',
        items: [
          'Bring the file on a USB stick or send it by email. Messaging apps shrink images.',
          'Ask for 100% or "actual size", without fitting to the page.',
          'Matte or satin paper, 170–250 g/m². Matte suits the printed, grainy look best.',
          'Order the same size you downloaded, so nothing gets cut off.',
        ],
      },
      {
        h: 'At home',
        items: [
          'In the print window choose "Actual size" or 100%. Turn off "Fit to page" and borderless printing, which crops the edges.',
          'Set the best quality and the paper type you loaded (matte or photo).',
          'Use thick matte paper, 170 g/m² or more.',
          'Home printers leave a thin white edge. Trim it with a paper cutter or ruler.',
        ],
      },
      {
        h: 'Good to know',
        items: [
          'A4, A3, 30×40, 50×70 and 13×18 cm fit ready-made frames.',
          'Prints look a little darker than on screen. That\'s normal.',
        ],
      },
    ],
  },
  sr: {
    title: 'Kako da odštampaš postere',
    intro: 'Svaki fajl je PNG spreman za štampu. A4 i manji formati su 300 dpi, najbolji kvalitet za štampu. Veći formati imaju nešto manje, što se ne primećuje sa uobičajene udaljenosti.',
    groups: [
      {
        h: 'U štampariji',
        items: [
          'Donesi fajl na USB-u ili ga pošalji emailom. Aplikacije za poruke smanjuju slike.',
          'Traži štampu u 100% veličini, bez uklapanja na stranu.',
          'Mat ili saten papir, 170–250 g/m². Mat najbolje ističe štampani, zrnasti izgled.',
          'Poruči istu veličinu koju si preuzeo/la, da se ništa ne odseče.',
        ],
      },
      {
        h: 'Kod kuće',
        items: [
          'U prozoru za štampu izaberi "Stvarna veličina" ili 100%. Isključi "Uklopi na stranu" i štampu bez margina, jer seče ivice.',
          'Podesi najbolji kvalitet i vrstu papira koji si stavio/la (mat ili foto).',
          'Koristi deblji mat papir, od 170 g/m².',
          'Kućni štampači ostavljaju tanku belu ivicu. Iseci je sekačem ili lenjirom.',
        ],
      },
      {
        h: 'Dobro je znati',
        items: [
          'A4, A3, 30×40, 50×70 i 13×18 cm odgovaraju gotovim ramovima.',
          'Odštampano izgleda malo tamnije nego na ekranu. To je normalno.',
        ],
      },
    ],
  },
};

export function PrintGuide({ className = '' }: { className?: string }) {
  const { lang } = useT();
  const c = COPY[lang];
  return (
    <details className={`group bg-surface border border-line rounded-2xl ${className}`}>
      <summary className="cursor-pointer list-none flex items-center gap-3 p-4 md:p-5 select-none">
        <Printer size={18} className="text-ink-soft shrink-0" />
        <span className="font-semibold flex-1">{c.title}</span>
        <span className="text-ink-faint transition-transform group-open:rotate-45 text-xl leading-none" aria-hidden="true">+</span>
      </summary>
      <div className="px-4 md:px-5 pb-5 -mt-1 text-sm text-ink-soft leading-relaxed space-y-4">
        <p>{c.intro}</p>
        <div className="grid gap-4 md:grid-cols-3">
          {c.groups.map(g => (
            <div key={g.h}>
              <h3 className="text-xs uppercase tracking-[0.14em] font-semibold text-ink mb-2">{g.h}</h3>
              <ul className="space-y-1.5 list-disc pl-4 marker:text-ink-faint">
                {g.items.map(i => <li key={i}>{i}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
