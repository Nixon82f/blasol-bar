import React, { useMemo } from 'react';
import {
  ClipboardList,
  CalendarRange,
  Truck,
  Receipt,
  Calculator,
  UserRound,
  Tags,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { money, prettyDate, addDays, todayLocal, weekRange, monthRange } from '../lib/format';
import { computeRange } from '../lib/store';

// Ordenado según el día de trabajo
const SECCIONES = [
  {
    titulo: 'En la mañana',
    cards: [
      {
        id: 'conteo',
        icon: ClipboardList,
        title: 'Contar inventario',
        desc: 'Cuente lo que hay en cada freezer',
      },
      {
        id: 'entradas',
        icon: Truck,
        title: 'Entró mercadería',
        desc: 'Anote lo que trajo el proveedor y el costo',
      },
    ],
  },
  {
    titulo: 'Durante el día',
    cards: [
      {
        id: 'gastos',
        icon: Receipt,
        title: 'Gastos',
        desc: 'Planilla, recibos, hielo, cloro y más',
      },
      {
        id: 'fiados',
        icon: UserRound,
        title: 'Fiados',
        desc: 'Quién debe, cuánto y si ya pagó',
      },
    ],
  },
  {
    titulo: 'Al cerrar',
    cards: [
      {
        id: 'cierre',
        icon: Calculator,
        title: 'Cierre del día',
        desc: 'Ventas, ganancia y cuadre de caja',
        primary: true,
      },
      {
        id: 'balance',
        icon: CalendarRange,
        title: 'Balance semana y mes',
        desc: 'Cómo va el negocio, no solo hoy',
      },
    ],
  },
  {
    titulo: 'Administración',
    cards: [
      {
        id: 'productos',
        icon: Tags,
        title: 'Productos, precios y respaldo',
        desc: 'Catálogo, costos y copia de seguridad',
      },
    ],
  },
];

export default function Home({ state, update, date, setDate, view, go, pendingDebts }) {
  const t = view.totals;
  const invRows = Object.values(view.rows).filter(r => r.kind !== 'compra');
  const counted = invRows.filter(r => r.counted).length;
  const isToday = date === todayLocal();
  const wk = weekRange(date);
  const mo = monthRange(date);
  const semana = useMemo(() => computeRange(state, wk.from, wk.to), [state, wk.from, wk.to]);
  const mes = useMemo(() => computeRange(state, mo.from, mo.to), [state, mo.from, mo.to]);

  const entradasHoy = (view.day.entradas || []).length;
  const caja = view.day.caja || {};
  const cajaContada = (caja.efectivo ?? '') !== '' || (caja.transf ?? '') !== '';

  // Estado de cada tarjeta: { done, text }
  const status = {
    conteo:
      counted === 0
        ? null
        : counted >= invRows.length
          ? { done: true, text: 'Listo' }
          : { text: `${counted} de ${invRows.length}` },
    entradas: entradasHoy ? { done: true, text: `${entradasHoy} anotada${entradasHoy === 1 ? '' : 's'}` } : null,
    gastos: t.gastos ? { done: true, text: money(t.gastos) } : null,
    fiados: pendingDebts ? { text: `${pendingDebts} sin pagar` } : null,
    cierre: cajaContada ? { done: true, text: 'Caja contada' } : null,
    balance: null,
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[calc(96px+env(safe-area-inset-bottom))]">
      <div className="flex flex-col items-center text-center">
        <img
          src="/logo.jpg"
          alt="Bla Sol Bar"
          className="w-32 h-32 rounded-3xl object-contain bg-white border border-stone-200 p-2"
        />
        <h1 className="mt-3 text-[22px] font-black tracking-tight text-stone-900">Bla Sol Bar</h1>
        <span className="mt-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-stone-500">
          Inventario y Caja
        </span>

        {/* Fecha */}
        <div className="mt-3 flex items-center gap-1">
          <button
            onClick={() => setDate(addDays(date, -1))}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-stone-500 active:bg-stone-200"
            aria-label="Día anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <label className="relative px-2 text-[16px] font-medium text-stone-800">
            {prettyDate(date)}
            <input
              type="date"
              value={date}
              onChange={e => e.target.value && setDate(e.target.value)}
              className="absolute inset-0 opacity-0"
            />
          </label>
          <button
            onClick={() => setDate(addDays(date, 1))}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-stone-500 active:bg-stone-200"
            aria-label="Día siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        {!isToday && (
          <button onClick={() => setDate(todayLocal())} className="text-[14px] text-brand underline">
            Volver a hoy
          </button>
        )}
      </div>

      {/* Resumen corto */}
      <div className="mt-6 grid grid-cols-3 bg-white border border-stone-200 rounded-2xl divide-x divide-stone-200 text-center">
        <div className="py-3">
          <div className="text-[12px] text-stone-500">Vendido</div>
          <div className="text-[17px] font-bold tabular-nums">{money(t.ventas)}</div>
        </div>
        <div className="py-3">
          <div className="text-[12px] text-stone-500">Ganancia</div>
          <div
            className={`text-[17px] font-bold tabular-nums ${view.activo && t.quedoLibre < 0 ? 'text-red-700' : 'text-stone-900'}`}
          >
            {view.activo ? money(t.quedoLibre) : '—'}
          </div>
        </div>
        <div className="py-3">
          <div className="text-[12px] text-stone-500">Ya contados</div>
          <div className="text-[17px] font-bold tabular-nums">
            {counted}/{invRows.length}
          </div>
        </div>
      </div>

      {(semana.days.length > 0 || mes.days.length > 0) && (
        <button
          onClick={() => go('balance')}
          className="mt-2 w-full grid grid-cols-2 bg-white border border-stone-200 rounded-2xl divide-x divide-stone-200 text-center active:bg-stone-50"
        >
          {[
            ['Ganancia esta semana', semana],
            ['Ganancia este mes', mes],
          ].map(([label, r]) => (
            <div key={label} className="py-3">
              <div className="text-[12px] text-stone-500">{label}</div>
              <div
                className={`text-[17px] font-bold tabular-nums ${r.totals.quedoLibre < 0 ? 'text-red-700' : 'text-stone-900'}`}
              >
                {r.days.length ? money(r.totals.quedoLibre) : '—'}
              </div>
            </div>
          ))}
        </button>
      )}

      {!view.hasData && view.prevDate && (
        <p className="mt-3 text-center text-[14px] text-stone-500">
          El inventario de inicio viene del {prettyDate(view.prevDate).toLowerCase()}.
        </p>
      )}

      {/* Secciones por momento del día */}
      {SECCIONES.map(sec => (
        <section key={sec.titulo}>
          <h2 className="mt-6 mb-2 mx-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-stone-500">
            {sec.titulo}
          </h2>
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
            {sec.cards.map((c, idx) => {
              const Icon = c.icon;
              const st = status[c.id];
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => go(c.id)}
                  className={`relative w-full min-h-[64px] py-[14px] px-4 flex items-center gap-[14px] text-left transition-colors duration-[120ms] ${
                    c.primary ? 'bg-brand/[0.06] active:bg-brand/[0.06]' : 'bg-white active:bg-brand/[0.06]'
                  }`}
                >
                  {idx > 0 && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-0 left-[54px] right-0 h-px bg-stone-200/60"
                    />
                  )}
                  <Icon
                    className={`w-6 h-6 shrink-0 text-brand ${
                      c.primary ? 'fill-brand [&>line]:stroke-white [&>path]:stroke-white' : ''
                    }`}
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0 flex-1 flex flex-col gap-[2px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[16px] font-semibold text-stone-900 leading-tight truncate">
                        {c.title}
                      </span>
                      {st && (
                        <span
                          className={`shrink-0 text-[12px] font-semibold rounded-full px-2 py-0.5 ${
                            st.done ? 'bg-brand-soft text-brand' : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {st.text}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] font-normal text-stone-500 leading-[1.35] truncate">{c.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 text-stone-400" strokeWidth={1.75} />
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
