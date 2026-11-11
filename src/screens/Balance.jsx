import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Screen, Card, Row, Chips, SectionTitle, Empty } from '../ui/kit';
import { GROUPS } from '../lib/catalog';
import { computeRange } from '../lib/store';
import { money, addDays, weekRange, monthRange, shortDate, dayName, monthName, todayLocal } from '../lib/format';
import { GASTO_LABELS } from './Cierre';

const MODES = [
  { id: 'semana', label: 'Por semana' },
  { id: 'mes', label: 'Por mes' },
];

function rangeFor(mode, anchor) {
  return mode === 'semana' ? weekRange(anchor) : monthRange(anchor);
}

function shift(mode, anchor, dir) {
  if (mode === 'semana') return addDays(anchor, 7 * dir);
  const [y, m] = anchor.split('-').map(Number);
  const dt = new Date(y, m - 1 + dir, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function Balance({ state, date, onBack }) {
  const [mode, setMode] = useState('semana');
  const [anchor, setAnchor] = useState(date);

  const { from, to } = rangeFor(mode, anchor);
  const r = useMemo(() => computeRange(state, from, to), [state, from, to]);
  const prevRange = rangeFor(mode, shift(mode, anchor, -1));
  const prev = useMemo(() => computeRange(state, prevRange.from, prevRange.to), [state, prevRange.from, prevRange.to]);

  const t = r.totals;
  const hoy = todayLocal();
  const esActual = from <= hoy && hoy <= to;
  const titulo = mode === 'semana' ? `${shortDate(from)} al ${shortDate(to)}` : monthName(from);
  const etiqueta = mode === 'semana' ? (esActual ? 'Esta semana' : 'Semana') : esActual ? 'Este mes' : 'Mes';
  const maxAbs = Math.max(1, ...r.days.map(d => Math.max(d.ventas, Math.abs(d.quedoLibre))));

  const top = Object.entries(r.porProducto)
    .map(([pid, x]) => ({ p: state.products.find(p => p.id === pid), ...x }))
    .filter(x => x.p)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  return (
    <Screen title="Balance" subtitle="Semana y mes" onBack={onBack}>
      <Chips
        options={MODES}
        value={mode}
        onChange={m => {
          setMode(m);
          setAnchor(date);
        }}
      />

      {/* Selector de periodo */}
      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={() => setAnchor(a => shift(mode, a, -1))}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-stone-600 active:bg-stone-200"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <div className="text-[13px] text-stone-500">{etiqueta}</div>
          <div className="text-[17px] font-semibold text-stone-900">{titulo}</div>
        </div>
        <button
          onClick={() => setAnchor(a => shift(mode, a, 1))}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-stone-600 active:bg-stone-200"
          aria-label="Siguiente"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {r.days.length === 0 ? (
        <div className="mt-4">
          <Empty>No hay días anotados en este periodo.</Empty>
        </div>
      ) : (
        <>
          {/* Resultado */}
          <Card className="mt-3 p-5 text-center">
            <div className="text-[15px] text-stone-500">Ganancia neta</div>
            <div
              className={`text-[38px] font-extrabold tabular-nums tracking-tight ${
                t.quedoLibre < 0 ? 'text-red-700' : 'text-stone-900'
              }`}
            >
              {money(t.quedoLibre)}
            </div>
            <div className="text-[14px] text-stone-500">
              {r.days.length} {r.days.length === 1 ? 'día abierto' : 'días abiertos'} · vendió {money(t.ventas)}
            </div>
            {prev.days.length > 0 && (
              <div className="mt-2 text-[14px] text-stone-600">
                {mode === 'semana' ? 'Semana anterior' : 'Mes anterior'}: {money(prev.totals.quedoLibre)}
              </div>
            )}
          </Card>

          {/* Día por día */}
          <SectionTitle>Día por día</SectionTitle>
          <Card className="px-4 divide-y divide-stone-100">
            {r.days.map(d => (
              <div key={d.date} className="py-2.5">
                <div className="flex items-center justify-between text-[15px]">
                  <span className="text-stone-800">
                    {dayName(d.date)} {shortDate(d.date)}
                  </span>
                  <span
                    className={`font-semibold tabular-nums ${d.quedoLibre < 0 ? 'text-red-700' : 'text-stone-900'}`}
                  >
                    {money(d.quedoLibre)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${d.quedoLibre < 0 ? 'bg-red-600' : 'bg-brand'}`}
                    style={{ width: `${(Math.abs(d.quedoLibre) / maxAbs) * 100}%` }}
                  />
                </div>
                <div className="mt-1 text-[13px] text-stone-500">
                  Vendió {money(d.ventas)}
                  {d.gastos > 0 && ` · gastos ${money(d.gastos)}`}
                </div>
              </div>
            ))}
          </Card>
          <p className="mt-2 px-1 text-[13px] text-stone-500 leading-snug">
            Un día en rojo no es malo si ese día se pagó un recibo. Lo que importa es el total de arriba.
          </p>

          {/* Cómo se calcula */}
          <SectionTitle>Cómo se calcula</SectionTitle>
          <Card className="px-4 divide-y divide-stone-100">
            <Row label="Se vendió" value={money(t.ventas)} />
            <Row label="Costo de la mercadería vendida" value={`- ${money(t.costoVendido)}`} muted />
            <Row label="Ganancia en productos" value={money(t.gananciaProductos)} strong />
            {t.comprasDirectas > 0 && (
              <Row label="Botellas de licor compradas" value={`- ${money(t.comprasDirectas)}`} muted />
            )}
            {t.mermas > 0 && <Row label="Quebradas o regaladas" value={`- ${money(t.mermas)}`} muted />}
            {GASTO_LABELS.filter(([k]) => t.gastosTipo[k] > 0).map(([k, label]) => (
              <Row key={k} label={label} value={`- ${money(t.gastosTipo[k])}`} muted />
            ))}
            {t.fiadosPerdidos > 0 && (
              <Row label="Fiados que no pagaron" value={`- ${money(t.fiadosPerdidos)}`} muted />
            )}
            <Row label="Ganancia neta" value={money(t.quedoLibre)} strong />
          </Card>

          {/* Por tipo */}
          <SectionTitle>Ventas por tipo</SectionTitle>
          <Card className="px-4 divide-y divide-stone-100">
            {GROUPS.map(g => {
              const v = t.porGrupo[g] || { ventas: 0, ganancia: 0, unidades: 0 };
              return (
                <div key={g} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-[15px] text-stone-800">{g}</div>
                    <div className="text-[13px] text-stone-500">
                      {v.unidades} unid · ganancia {money(v.ganancia)}
                    </div>
                  </div>
                  <div className="text-[16px] font-semibold tabular-nums">{money(v.ventas)}</div>
                </div>
              );
            })}
          </Card>

          {top.length > 0 && (
            <>
              <SectionTitle>Lo que más se vendió</SectionTitle>
              <Card className="px-4 divide-y divide-stone-100">
                {top.map(x => (
                  <div key={x.p.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[15px] text-stone-800 truncate">{x.p.name}</div>
                      <div className="text-[13px] text-stone-500">
                        {x.venta} unid · ganancia {money(x.total - x.costo)}
                      </div>
                    </div>
                    <div className="text-[15px] font-semibold tabular-nums">{money(x.total)}</div>
                  </div>
                ))}
              </Card>
            </>
          )}
        </>
      )}
    </Screen>
  );
}
