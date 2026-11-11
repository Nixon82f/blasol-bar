const pad = n => String(n).padStart(2, '0');

// Fecha local (no UTC) en formato YYYY-MM-DD
export function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function prettyDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DIAS[dt.getDay()]} ${d} de ${MESES[m - 1]}`;
}

export function money(n) {
  const v = Math.round(Number(n) || 0);
  const s = Math.abs(v).toLocaleString('es-NI');
  return (v < 0 ? '- ' : '') + 'C$ ' + s;
}

export function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function nowTime() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Para buscar sin importar tildes ni mayúsculas
export function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const parse = dateStr => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const fmt = dt => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;

// Semana de lunes a domingo
export function weekRange(dateStr) {
  const dt = parse(dateStr);
  const offset = (dt.getDay() + 6) % 7; // lunes = 0
  const from = addDays(dateStr, -offset);
  return { from, to: addDays(from, 6) };
}

export function monthRange(dateStr) {
  const dt = parse(dateStr);
  return {
    from: fmt(new Date(dt.getFullYear(), dt.getMonth(), 1)),
    to: fmt(new Date(dt.getFullYear(), dt.getMonth() + 1, 0)),
  };
}

export function shortDate(dateStr) {
  const dt = parse(dateStr);
  return `${dt.getDate()} ${MESES[dt.getMonth()].slice(0, 3)}`;
}

export function dayName(dateStr) {
  return DIAS[parse(dateStr).getDay()];
}

export function monthName(dateStr) {
  const dt = parse(dateStr);
  const m = MESES[dt.getMonth()];
  return `${m[0].toUpperCase()}${m.slice(1)} ${dt.getFullYear()}`;
}
