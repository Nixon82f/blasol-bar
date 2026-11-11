import { useEffect, useState, useCallback, useRef } from 'react';
import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS, DEFAULT_INSUMOS, catGroup } from './catalog';
import { num } from './format';
import { supabase, isSupabaseConfigured } from './supabase';


const KEY = 'cafetin_v2';

export function initialState() {
  return {
    products: DEFAULT_PRODUCTS,
    freezers: ['Freezer 1', 'Freezer 2'],
    settings: DEFAULT_SETTINGS,
    insumos: DEFAULT_INSUMOS,
    days: {},
    debts: [],
    lastCost: {},
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState();
    return { ...initialState(), ...JSON.parse(raw) };
  } catch {
    return initialState();
  }
}

const clone = o => JSON.parse(JSON.stringify(o));

export function emptyDay() {
  return { rows: {}, entradas: [], gastos: [], caja: { efectivo: '', transf: '', restarGastos: true } };
}

// Asegura que exista el día dentro del borrador
export function ensureDay(draft, date) {
  if (!draft.days[date]) draft.days[date] = emptyDay();
  return draft.days[date];
}

export function useStore() {
  const [state, setState] = useState(load);
  const syncTimeoutRef = useRef(null);

  // Guardar en localStorage siempre como caché rápido offline
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* almacenamiento lleno o bloqueado */
    }
  }, [state]);

  // Sincronización inicial y Realtime desde Supabase
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    let isMounted = true;

    async function fetchFromSupabase() {
      try {
        const [configRes, sheetsRes, debtsRes] = await Promise.all([
          supabase.from('app_config').select('*').eq('id', 'main').maybeSingle(),
          supabase.from('daily_sheets').select('*'),
          supabase.from('debts').select('*')
        ]);

        if (!isMounted) return;

        setState(prev => {
          const next = clone(prev);
          if (configRes.data) {
            if (configRes.data.products?.length) next.products = configRes.data.products;
            if (configRes.data.freezers?.length) next.freezers = configRes.data.freezers;
            if (configRes.data.settings) next.settings = { ...next.settings, ...configRes.data.settings };
            if (configRes.data.insumos?.length) next.insumos = configRes.data.insumos;
            if (configRes.data.last_cost) next.lastCost = configRes.data.last_cost;
          }

          if (sheetsRes.data) {
            sheetsRes.data.forEach(sheet => {
              next.days[sheet.date] = {
                rows: sheet.rows || {},
                entradas: sheet.entradas || [],
                gastos: sheet.gastos || [],
                caja: sheet.caja || { efectivo: '', transf: '', restarGastos: true }
              };
            });
          }

          if (debtsRes.data) {
            next.debts = debtsRes.data.map(d => ({
              id: d.id,
              name: d.name,
              detail: d.detail,
              amount: Number(d.amount),
              date: d.date,
              status: d.status,
              resolvedDate: d.resolved_date
            }));
          }

          return next;
        });
      } catch (err) {
        console.error('Error cargando datos de Supabase:', err);
      }
    }

    fetchFromSupabase();

    // Escuchar cambios en vivo (Realtime) para que ambos celulares vean lo mismo
    const channel = supabase.channel('realtime_blasol')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_sheets' }, payload => {
        if (!payload.new || !payload.new.date) return;
        setState(prev => {
          const next = clone(prev);
          next.days[payload.new.date] = {
            rows: payload.new.rows || {},
            entradas: payload.new.entradas || [],
            gastos: payload.new.gastos || [],
            caja: payload.new.caja || { efectivo: '', transf: '', restarGastos: true }
          };
          return next;
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'debts' }, payload => {
        if (payload.eventType === 'INSERT') {
          setState(prev => {
            const next = clone(prev);
            if (!next.debts.some(d => d.id === payload.new.id)) {
              next.debts.unshift({
                id: payload.new.id,
                name: payload.new.name,
                detail: payload.new.detail,
                amount: Number(payload.new.amount),
                date: payload.new.date,
                status: payload.new.status,
                resolvedDate: payload.new.resolved_date
              });
            }
            return next;
          });
        } else if (payload.eventType === 'UPDATE') {
          setState(prev => {
            const next = clone(prev);
            const idx = next.debts.findIndex(d => d.id === payload.new.id);
            if (idx >= 0) {
              next.debts[idx] = {
                id: payload.new.id,
                name: payload.new.name,
                detail: payload.new.detail,
                amount: Number(payload.new.amount),
                date: payload.new.date,
                status: payload.new.status,
                resolvedDate: payload.new.resolved_date
              };
            }
            return next;
          });
        } else if (payload.eventType === 'DELETE') {
          setState(prev => {
            const next = clone(prev);
            next.debts = next.debts.filter(d => d.id !== payload.old.id);
            return next;
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_config' }, payload => {
        if (!payload.new) return;
        setState(prev => {
          const next = clone(prev);
          if (payload.new.products) next.products = payload.new.products;
          if (payload.new.freezers) next.freezers = payload.new.freezers;
          if (payload.new.settings) next.settings = payload.new.settings;
          if (payload.new.insumos) next.insumos = payload.new.insumos;
          if (payload.new.last_cost) next.lastCost = payload.new.last_cost;
          return next;
        });
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // update(draft => { ...mutar draft... })
  const update = useCallback(fn => {
    setState(prev => {
      const draft = clone(prev);
      fn(draft);

      // Sincronizar a Supabase con debounce
      if (isSupabaseConfigured && supabase) {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(async () => {
          try {
            // Guardar configuración
            await supabase.from('app_config').upsert({
              id: 'main',
              products: draft.products,
              freezers: draft.freezers,
              settings: draft.settings,
              insumos: draft.insumos,
              last_cost: draft.lastCost,
              updated_at: new Date().toISOString()
            });

            // Guardar días modificados
            for (const [dateKey, dayData] of Object.entries(draft.days)) {
              await supabase.from('daily_sheets').upsert({
                date: dateKey,
                rows: dayData.rows,
                entradas: dayData.entradas,
                gastos: dayData.gastos,
                caja: dayData.caja,
                updated_at: new Date().toISOString()
              });
            }

            // Sincronizar deudas
            if (draft.debts) {
              for (const d of draft.debts) {
                await supabase.from('debts').upsert({
                  id: d.id,
                  name: d.name,
                  detail: d.detail,
                  amount: d.amount,
                  date: d.date,
                  status: d.status,
                  resolved_date: d.resolvedDate
                });
              }
            }
          } catch (e) {
            console.error('Error guardando en Supabase:', e);
          }
        }, 600);
      }

      return draft;
    });
  }, []);

  const replace = useCallback(next => {
    setState(prev => {
      const full = { ...initialState(), ...next };
      if (isSupabaseConfigured && supabase) {
        supabase.from('app_config').upsert({
          id: 'main',
          products: full.products,
          freezers: full.freezers,
          settings: full.settings,
          insumos: full.insumos,
          last_cost: full.lastCost,
          updated_at: new Date().toISOString()
        }).catch(console.error);
      }
      return full;
    });
  }, []);

  return [state, update, replace];
}

// ---------- Cálculos ----------

// Reparte las unidades vendidas entre promo/cubeta y sueltas
export function splitPack(venta, pack, sueltas) {
  if (!pack || !pack.units) return { packs: 0, ind: venta };
  const u = pack.units;
  if (sueltas === '' || sueltas === null || sueltas === undefined) {
    return { packs: Math.floor(venta / u), ind: venta % u };
  }
  const s = Math.min(Math.max(0, num(sueltas)), venta);
  const rest = venta - s;
  return { packs: Math.floor(rest / u), ind: s + (rest % u) };
}

export function moneyFor(product, venta, sueltas) {
  const { packs, ind } = splitPack(venta, product.pack, sueltas);
  const total = packs * num(product.pack?.price) + ind * num(product.price);
  return { packs, ind, total };
}

function unitCost(state, day, product) {
  const ents = (day.entradas || []).filter(e => e.pid === product.id && num(e.qty) > 0);
  if (ents.length) {
    const q = ents.reduce((a, e) => a + num(e.qty), 0);
    const c = ents.reduce((a, e) => a + num(e.qty) * num(e.unitCost), 0);
    return q ? c / q : 0;
  }
  return state.lastCost[product.id] ?? num(product.cost);
}

function computeSingle(state, date, carryIn) {
  const day = state.days[date] || emptyDay();
  const rows = {};
  const carryOut = { ...carryIn };

  let ventas = 0;
  let costoVendido = 0;
  let unidades = 0;
  let comprasDirectas = 0;
  let mermas = 0;
  const porGrupo = {};

  for (const product of state.products) {
    const r = day.rows[product.id] || {};
    const ingreso = (day.entradas || [])
      .filter(e => e.pid === product.id)
      .reduce((a, e) => a + num(e.qty), 0);

    let row;
    if (product.kind === 'compra') {
      const gasto = (day.entradas || [])
        .filter(e => e.pid === product.id)
        .reduce((a, e) => a + num(e.qty) * num(e.unitCost), 0);
      comprasDirectas += gasto;
      row = { kind: 'compra', ingreso, gasto, venta: 0, total: 0, costo: 0 };
    } else if (product.kind === 'directo') {
      const venta = num(r.vendidos);
      const m = moneyFor(product, venta, r.sueltas);
      const costo = venta * num(product.cost);
      row = { kind: 'directo', venta, counted: r.vendidos !== undefined && r.vendidos !== '', ...m, costo };
    } else {
      const inicio = r.inicioManual !== undefined && r.inicioManual !== '' ? num(r.inicioManual) : num(carryIn[product.id]);
      const fiado = num(r.fiado);
      const disponible = inicio + ingreso - fiado;
      const counted = Boolean(r.counted);
      const hay = counted ? Object.values(r.freezers || {}).reduce((a, v) => a + num(v), 0) : null;
      const venta = counted ? Math.max(0, disponible - hay) : 0;
      const invFinal = counted ? hay : disponible;
      const m = moneyFor(product, venta, r.sueltas);
      const uc = unitCost(state, day, product);
      const costo = venta * uc;
      mermas += fiado * uc;
      row = {
        kind: 'inventario',
        inicio,
        ingreso,
        fiado,
        disponible,
        counted,
        hay,
        venta,
        invFinal,
        sobra: counted && hay > disponible ? hay - disponible : 0,
        ...m,
        costo,
      };
      carryOut[product.id] = invFinal;
    }

    rows[product.id] = row;
    if (row.venta > 0) {
      ventas += row.total;
      costoVendido += row.costo;
      unidades += row.venta;
      const g = catGroup(product.cat);
      porGrupo[g] = porGrupo[g] || { ventas: 0, ganancia: 0, unidades: 0 };
      porGrupo[g].ventas += row.total;
      porGrupo[g].ganancia += row.total - row.costo;
      porGrupo[g].unidades += row.venta;
    }
  }

  // Los recibos (luz, agua, internet...) se anotan a mano el día que se pagan, como cualquier gasto
  const gastos = (day.gastos || []).reduce((a, g) => a + num(g.amount), 0);
  const gastosTipo = { planilla: 0, insumo: 0, fijo: 0, otro: 0 };
  for (const g of day.gastos || []) {
    const k = gastosTipo[g.type] !== undefined ? g.type : 'otro';
    gastosTipo[k] += num(g.amount);
  }

  const fiadosNuevos = state.debts.filter(d => d.date === date).reduce((a, d) => a + num(d.amount), 0);
  const fiadosCobrados = state.debts
    .filter(d => d.status === 'cobrado' && d.resolvedDate === date)
    .reduce((a, d) => a + num(d.amount), 0);
  const fiadosPerdidos = state.debts
    .filter(d => d.status === 'perdida' && d.resolvedDate === date)
    .reduce((a, d) => a + num(d.amount), 0);

  const gananciaProductos = ventas - costoVendido;
  const quedoLibre = gananciaProductos - comprasDirectas - mermas - gastos - fiadosPerdidos;

  return {
    date,
    day,
    rows,
    carryOut,
    hasData: Boolean(state.days[date]),
    // true solo si de verdad se anotó algo (no basta con que el día exista vacío)
    activo:
      Object.values(rows).some(r => r.counted || r.venta > 0 || r.ingreso > 0 || r.fiado > 0) ||
      (day.entradas || []).length > 0 ||
      (day.gastos || []).length > 0 ||
      fiadosNuevos + fiadosCobrados + fiadosPerdidos > 0,
    totals: {
      ventas,
      costoVendido,
      unidades,
      comprasDirectas,
      mermas,
      gananciaProductos,
      gastos,
      gastosTipo,
      fiadosNuevos,
      fiadosCobrados,
      fiadosPerdidos,
      quedoLibre,
      porGrupo,
    },
  };
}

// Calcula el día pidiendo como "Inicio" el inventario final del último día con datos
// (si el miércoles cerraron, el jueves arranca con lo del martes).
export function computeDay(state, date) {
  const dates = Object.keys(state.days).filter(d => d < date).sort();
  let carry = {};
  for (const d of dates) carry = computeSingle(state, d, carry).carryOut;
  const view = computeSingle(state, date, carry);
  view.prevDate = dates.length ? dates[dates.length - 1] : null;
  return view;
}

// Suma varios días (semana, mes). Solo cuenta los días en que se anotó algo;
// los días cerrados simplemente no aparecen.
export const SUM_KEYS = ['ventas', 'costoVendido', 'unidades', 'comprasDirectas', 'mermas', 'gananciaProductos', 'gastos', 'fiadosPerdidos', 'quedoLibre'];

export function computeRange(state, from, to) {
  const dates = Object.keys(state.days).filter(d => d <= to).sort();
  let carry = {};
  const days = [];
  const totals = Object.fromEntries(SUM_KEYS.map(k => [k, 0]));
  totals.gastosTipo = { planilla: 0, insumo: 0, fijo: 0, otro: 0 };
  totals.porGrupo = {};
  const porProducto = {};
  for (const d of dates) {
    const v = computeSingle(state, d, carry);
    carry = v.carryOut;
    if (d < from || !v.activo) continue;
    days.push({ date: d, ventas: v.totals.ventas, quedoLibre: v.totals.quedoLibre, gastos: v.totals.gastos });
    SUM_KEYS.forEach(k => (totals[k] += v.totals[k]));
    Object.entries(v.totals.gastosTipo).forEach(([k, n]) => (totals.gastosTipo[k] += n));
    Object.entries(v.totals.porGrupo).forEach(([g, x]) => {
      const t = (totals.porGrupo[g] = totals.porGrupo[g] || { ventas: 0, ganancia: 0, unidades: 0 });
      t.ventas += x.ventas;
      t.ganancia += x.ganancia;
      t.unidades += x.unidades;
    });
    Object.entries(v.rows).forEach(([pid, r]) => {
      if (!(r.venta > 0)) return;
      const t = (porProducto[pid] = porProducto[pid] || { venta: 0, total: 0, costo: 0 });
      t.venta += r.venta;
      t.total += r.total;
      t.costo += r.costo;
    });
  }
  return { from, to, days, totals, porProducto };
}
