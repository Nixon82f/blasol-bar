import { todayLocal } from './format';

// Días desde el último respaldo (null si nunca se ha hecho)
export function daysSinceBackup(state) {
  if (!state.lastBackup) return null;
  const [y, m, d] = state.lastBackup.split('-').map(Number);
  const [y2, m2, d2] = todayLocal().split('-').map(Number);
  return Math.round((new Date(y2, m2 - 1, d2) - new Date(y, m - 1, d)) / 86400000);
}

export function needsBackup(state) {
  const hayDatos = Object.keys(state.days || {}).length > 0;
  if (!hayDatos) return false;
  const n = daysSinceBackup(state);
  return n === null || n >= 7;
}

// Comparte el archivo de respaldo (en iPhone abre el menú para mandarlo por WhatsApp).
// Si el teléfono no puede compartir archivos, lo descarga.
// Devuelve true si se compartió o descargó.
export async function shareBackup(state) {
  const { lastBackup, ...data } = state;
  const name = `blasol-respaldo-${todayLocal()}.json`;
  const json = JSON.stringify(data);
  const file = new File([json], name, { type: 'application/json' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Respaldo Bla Sol Bar' });
      return true;
    } catch (err) {
      if (err && err.name === 'AbortError') return false; // lo canceló
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download = name;
  a.click();
  return true;
}
