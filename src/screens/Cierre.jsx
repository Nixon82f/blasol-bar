import React, { useState } from 'react';
import { Share2, Copy } from 'lucide-react';
import { Screen, Card, Row, Button, NumberInput, SectionTitle } from '../ui/kit';
import { GROUPS } from '../lib/catalog';
import { money, num, prettyDate } from '../lib/format';
import { ensureDay } from '../lib/store';

export const GASTO_LABELS = [
  ['planilla', 'Planilla'],
  ['insumo', 'Insumos'],
  ['fijo', 'Recibos (luz, agua, internet...)'],
  ['otro', 'Otros gastos'],
];

export default function Cierre({ state, update, view, date, onBack }) {
  const t = view.totals;
  const caja = view.day.caja || { efectivo: '', transf: '', restarGastos: true };
  const [copied, setCopied] = useState(false);

  const setCaja = patch =>
    update(d => {
      const day = ensureDay(d, date);
      day.caja = { ...(day.caja || {}), ...patch };
    });

  const restar = caja.restarGastos !== false;
  const esperado = t.ventas - t.fiadosNuevos + t.fiadosCobrados - (restar ? t.gastos + t.comprasDirectas : 0);
  const contado = num(caja.efectivo) + num(caja.transf);
  const hayConteoCaja = caja.efectivo !== '' || caja.transf !== '';
  const diff = contado - esperado;

  const top = state.products
    .map(p => ({ p, r: view.rows[p.id] }))
    .filter(x => x.r && x.r.venta > 0)
    .sort((a, b) => b.r.total - a.r.total);

  const reporte = () => {
    const L = [];
    L.push(`Bla Sol Bar - Cierre del día`);
    L.push(prettyDate(date));
    L.push('');
    L.push(`Vendido: ${money(t.ventas)}`);
    L.push(`Costo de lo vendido: ${money(t.costoVendido)}`);
    L.push(`Ganancia en productos: ${money(t.gananciaProductos)}`);
    if (t.comprasDirectas) L.push(`Compra de licor: ${money(t.comprasDirectas)}`);
    L.push(`Gastos del día: ${money(t.gastos)}`);
    if (t.fiadosPerdidos) L.push(`Fiados perdidos: ${money(t.fiadosPerdidos)}`);
    L.push(`QUEDÓ LIBRE: ${money(t.quedoLibre)}`);
    if (hayConteoCaja) {
      L.push('');
      L.push(`Efectivo: ${money(caja.efectivo)}`);
      L.push(`Transferencias: ${money(caja.transf)}`);
      L.push(diff === 0 ? 'Caja cuadra' : diff > 0 ? `Sobran ${money(diff)}` : `Faltan ${money(-diff)}`);
    }
    if (top.length) {
      L.push('');
      L.push('Lo vendido:');
      top.forEach(({ p, r }) => L.push(`- ${p.name}: ${r.venta} = ${money(r.total)}`));
    }
    return L.join('\n');
  };

  const share = async () => {
    const text = reporte();
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        /* cancelado */
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <Screen title="Cierre del día" subtitle={prettyDate(date)} onBack={onBack}>
      {/* Resultado principal */}
      <Card className="p-5 text-center">
        <div className="text-[15px] text-stone-500">Quedó libre</div>
        <div className={`text-[38px] font-extrabold tabular-nums tracking-tight ${view.activo && t.quedoLibre < 0 ? 'text-red-700' : 'text-stone-900'}`}>
          {view.activo ? money(t.quedoLibre) : '—'}
        </div>
        <div className="text-[14px] text-stone-500">
          {!view.activo
            ? 'Todavía no hay nada anotado hoy'
            : t.quedoLibre >= 0
              ? 'Ganancia después de pagar todo'
              : 'Hoy no alcanzó para cubrir los gastos'}
        </div>
      </Card>

      <SectionTitle>Cómo se calcula</SectionTitle>
      <Card className="px-4 divide-y divide-stone-100">
        <Row label="Se vendió" value={money(t.ventas)} />
        <Row label="Lo que costó esa mercadería" value={`- ${money(t.costoVendido)}`} muted />
        <Row label="Ganancia en productos" value={money(t.gananciaProductos)} strong />
        {t.comprasDirectas > 0 && <Row label="Botellas de licor compradas" value={`- ${money(t.comprasDirectas)}`} muted />}
        {t.mermas > 0 && <Row label="Quebradas o regaladas" value={`- ${money(t.mermas)}`} muted />}
        {GASTO_LABELS.filter(([k]) => t.gastosTipo[k] > 0).map(([k, label]) => (
          <Row key={k} label={label} value={`- ${money(t.gastosTipo[k])}`} muted />
        ))}
        {t.gastos === 0 && <Row label="Gastos" value="C$ 0" muted />}
        {t.fiadosPerdidos > 0 && <Row label="Fiados que no pagaron" value={`- ${money(t.fiadosPerdidos)}`} muted />}
        <Row label="Quedó libre" value={money(t.quedoLibre)} strong />
      </Card>

      <SectionTitle>Cuadrar la caja (opcional)</SectionTitle>
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[14px] text-stone-600 mb-1.5">Efectivo</label>
            <NumberInput value={caja.efectivo} onChange={v => setCaja({ efectivo: v })} prefix="C$" />
          </div>
          <div>
            <label className="block text-[14px] text-stone-600 mb-1.5">Transferencias</label>
            <NumberInput value={caja.transf} onChange={v => setCaja({ transf: v })} prefix="C$" />
          </div>
        </div>

        <label className="mt-4 flex items-center gap-3 text-[15px] text-stone-700">
          <input
            type="checkbox"
            checked={restar}
            onChange={e => setCaja({ restarGastos: e.target.checked })}
            className="w-5 h-5 accent-brand"
          />
          Los gastos de hoy se pagaron con plata de la caja
        </label>

        <div className="mt-3 divide-y divide-stone-100">
          <Row label="Debería haber" value={money(esperado)} />
          <Row label="Hay" value={money(contado)} />
        </div>

        {hayConteoCaja && (
          <div
            className={`mt-2 rounded-xl px-4 py-3 text-[16px] font-semibold text-center ${
              diff === 0 ? 'bg-stone-100 text-stone-900' : diff > 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {diff === 0 ? 'La caja cuadra' : diff > 0 ? `Sobran ${money(diff)}` : `Faltan ${money(-diff)}`}
          </div>
        )}
        {(t.fiadosNuevos > 0 || t.fiadosCobrados > 0) && (
          <p className="mt-2 text-[13px] text-stone-500">
            Ya se tomaron en cuenta los fiados de hoy ({money(t.fiadosNuevos)}) y lo cobrado de fiados anteriores (
            {money(t.fiadosCobrados)}).
          </p>
        )}
      </Card>

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
          <SectionTitle>Productos vendidos</SectionTitle>
          <Card className="px-4 divide-y divide-stone-100">
            {top.map(({ p, r }) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[15px] text-stone-800 truncate">{p.name}</div>
                  <div className="text-[13px] text-stone-500">
                    {r.venta} unid · ganancia {money(r.total - r.costo)}
                  </div>
                </div>
                <div className="text-[15px] font-semibold tabular-nums">{money(r.total)}</div>
              </div>
            ))}
          </Card>
        </>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button onClick={share}>
          <Share2 className="w-5 h-5" /> Compartir
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(reporte());
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              alert(reporte());
            }
          }}
        >
          <Copy className="w-5 h-5" /> {copied ? 'Copiado' : 'Copiar'}
        </Button>
      </div>
    </Screen>
  );
}
