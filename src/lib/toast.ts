// Minimal DOM toast — usable from plain lib code (posterExport, workers)
// where no React context is available.

type ToastKind = 'error' | 'success' | 'info';

let container: HTMLDivElement | null = null;

function getContainer(): HTMLDivElement {
  if (container && document.body.contains(container)) return container;
  container = document.createElement('div');
  container.style.cssText =
    'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;' +
    'display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;';
  document.body.appendChild(container);
  return container;
}

const COLORS: Record<ToastKind, string> = {
  error: '#7f1d1d',
  success: '#14532d',
  info: '#1e293b',
};

export function toast(message: string, kind: ToastKind = 'info', durationMs = 4000): void {
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText =
    `background:${COLORS[kind]};color:#fff;padding:10px 18px;border-radius:10px;` +
    'font-size:13px;font-family:Inter,system-ui,sans-serif;max-width:90vw;' +
    'box-shadow:0 4px 16px rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.12);' +
    'opacity:0;transition:opacity .2s ease;pointer-events:auto;';
  getContainer().appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = '1'; });
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 250);
  }, durationMs);
}

export const toastError = (message: string) => toast(message, 'error');
export const toastSuccess = (message: string) => toast(message, 'success');
