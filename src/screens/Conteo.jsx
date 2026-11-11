import React, { useMemo, useState } from 'react';
import { Check, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Screen, Card, SearchBox, Chips, Sheet, Button, Stepper, NumberInput, Empty, TextInput } from '../ui/kit';
import { CATEGORIES } from '../lib/catalog';
import { money, normalize, num, prettyDate } from '../lib/format';
import { ensureDay, moneyFor } from '../lib/store';

export default function Conteo({ state, update, view, date, onBack }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('todos');
  const [openId, setOpenId] = useState(null);

  const products = state.products.filter(p => p.kind !== 'compra');

  const list = useMemo(() => {
    return products.filter(p => {
      const r = view.rows[p.id];
      const listo = Boolean(r?.counted);
      if (cat === 'porcontar' && listo) return false;
      if (cat === 'contados' && !listo) return false;
      if (!['todos', 'porcontar', 'contados'].includes(cat) && p.cat !== cat) return false;
      if (q && !normalize(p.name).includes(normalize(q))) return false;
      return true;
    });
  }, [products, view, cat, q]);

  // Incluye también lo que se anota directo (tragos, bocadillos)
  const invProducts = products;
  const done = invProducts.filter(p => view.rows[p.id]?.counted).length;

  const options = [
    { id: 'todos', label: 'Todos' },
    { id: 'porcontar', label: `Sin contar (${products.filter(p => !view.rows[p.id]?.counted).length})` },
    { id: 'contados', label: 'Ya contados' },
    ...CATEGORIES.map(c => ({ id: c.id, label: c.label })),
  ];

  const openProduct = state.products.find(p => p.id === openId);
  const idx = list.findIndex(p => p.id === openId);
  const nextId = idx >= 0 && idx < list.length - 1 ? list[idx + 1].id : null;

  const save = (pid, patch) => {
    update(d => {
      const day = ensureDay(d, date);
      day.rows[pid] = { ...(day.rows[pid] || {}), ...patch };
    });
  };

  return (
    <Screen title="Contar inventario" subtitle={prettyDate(date)} onBack={onBack}>
      {/* Progreso */}
      <Card className="p-4">
        <div className="flex items-center justify-between text-[15px]">
          <span className="text-stone-600">Productos ya contados</span>
          <span className="font-semibold tabular-nums">
            {done} de {invProducts.length}
          </span>
        </div>
        <div className="mt-2 h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all"
            style={{ width: `${invProducts.length ? (done / invProducts.length) * 100 : 0}%` }}
          />
        </div>
        <p className="mt-3 text-[14px] text-stone-500 leading-snug">
          Toque un producto y escriba cuántos hay en cada freezer. Al guardar pasa solo al siguiente.
        </p>
      </Card>

      <div className="mt-4 space-y-3 sticky top-14 z-10 bg-[#FAFAF8] pb-2 pt-1 -mx-4 px-4">
        <SearchBox value={q} onChange={setQ} />
        <Chips options={options} value={cat} onChange={setCat} />
      </div>

      <div className="mt-2 space-y-2">
        {list.length === 0 && <Empty>{cat === 'porcontar' ? '¡Listo! Ya contó todos los productos.' : 'No hay productos aquí.'}</Empty>}
        {list.map(p => {
          const r = view.rows[p.id] || {};
          const isDirect = p.kind === 'directo';
          return (
            <button
              key={p.id}
              onClick={() => setOpenId(p.id)}
              className="w-full text-left bg-white border border-stone-200 rounded-2xl px-4 py-3 flex items-center gap-3 active:bg-stone-50"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[16px] font-semibold text-stone-900 truncate">{p.name}</div>
                <div className="text-[13px] text-stone-500 mt-0.5">
                  {isDirect ? (
                    'Se anota lo vendido'
                  ) : (
                    <>
                      Último conteo: {r.inicio ?? 0}
                      {r.ingreso > 0 && ` · Entró ${r.ingreso}`}
                      {r.fiado > 0 && ` · Se quebraron ${r.fiado}`}
                    </>
                  )}
                </div>
                {r.counted && r.venta > 0 && (
                  <div className="text-[13px] text-stone-800 mt-0.5">
                    Vendió {r.venta} · {money(r.total)}
                  </div>
                )}
              </div>
              {r.counted ? (
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-[11px] text-stone-500">{isDirect ? 'Vendidos' : 'Hay'}</div>
                    <div className="text-[20px] font-bold tabular-nums leading-none">{isDirect ? r.venta : r.hay}</div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center">
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </div>
                </div>
              ) : (
                <span className="h-9 px-3 rounded-lg border border-stone-300 text-[14px] font-medium text-stone-700 flex items-center">
                  {isDirect ? 'Anotar' : 'Contar'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {openProduct && (
        <CountSheet
          key={openProduct.id}
          product={openProduct}
          row={view.rows[openProduct.id] || {}}
          raw={view.day.rows[openProduct.id] || {}}
          freezers={state.freezers}
          hasNext={Boolean(nextId)}
          onAddFreezer={name =>
            update(d => {
              if (!d.freezers.includes(name)) d.freezers.push(name);
            })
          }
          onClose={() => setOpenId(null)}
          onClear={() => {
            update(d => {
              const day = ensureDay(d, date);
              const r = { ...(day.rows[openProduct.id] || {}) };
              ['freezers', 'counted', 'fiado', 'sueltas', 'vendidos'].forEach(k => delete r[k]);
              day.rows[openProduct.id] = r;
            });
            setOpenId(null);
          }}
          onSave={(patch, goNext) => {
            save(openProduct.id, patch);
            setOpenId(goNext ? nextId : null);
          }}
        />
      )}
    </Screen>
  );
}

function CountSheet({ product, row, raw, freezers, hasNext, onSave, onClose, onClear, onAddFreezer }) {
  const isDirect = product.kind === 'directo';
  const allFreezers = Array.from(new Set([...freezers, ...Object.keys(raw.freezers || {})]));

  const [qty, setQty] = useState(() => {
    const o = {};
    allFreezers.forEach(f => (o[f] = raw.freezers?.[f] !== undefined ? String(raw.freezers[f]) : ''));
    return o;
  });
  const [vendidos, setVendidos] = useState(raw.vendidos ?? '');
  const [fiado, setFiado] = useState(raw.fiado ? String(raw.fiado) : '');
  const [sueltas, setSueltas] = useState(raw.sueltas ?? '');
  const [showSueltas, setShowSueltas] = useState(raw.sueltas !== undefined && raw.sueltas !== '');
  const [showFiado, setShowFiado] = useState(Boolean(raw.fiado));
  const [newFreezer, setNewFreezer] = useState('');
  const [addingFreezer, setAddingFreezer] = useState(false);

  const hay = Object.values(qty).reduce((a, v) => a + num(v), 0);
  const disponible = num(row.inicio) + num(row.ingreso) - num(fiado);
  const venta = isDirect ? num(vendidos) : Math.max(0, disponible - hay);
  const sobra = !isDirect && hay > disponible ? hay - disponible : 0;
  const m = moneyFor(product, venta, showSueltas ? sueltas : '');

  const doSave = goNext => {
    if (isDirect) {
      onSave({ vendidos: vendidos === '' ? '0' : vendidos, sueltas: showSueltas ? sueltas : '' }, goNext);
    } else {
      const fr = {};
      Object.entries(qty).forEach(([k, v]) => {
        if (v !== '') fr[k] = num(v);
      });
      onSave({ freezers: fr, counted: true, fiado: num(fiado), sueltas: showSueltas ? sueltas : '' }, goNext);
    }
  };

  return (
    <Sheet
      title={product.name}
      subtitle={product.price ? `Precio ${money(product.price)}${product.pack ? ` · ${product.pack.label} ${product.pack.units} x ${money(product.pack.price)}` : ''}` : 'Sin precio todavía (póngalo en Productos)'}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => doSave(false)}>
            Guardar
          </Button>
          {hasNext && (
            <Button className="flex-[1.4]" onClick={() => doSave(true)}>
              Guardar y siguiente
            </Button>
          )}
        </div>
      }
    >
      {isDirect ? (
        <Card className="p-4">
          <div className="text-[16px] font-semibold text-stone-900 mb-3">¿Cuántos se vendieron?</div>
          <Stepper value={vendidos} onChange={setVendidos} />
        </Card>
      ) : (
        <>
          {/* De dónde parte */}
          <Card className="px-4 divide-y divide-stone-100">
            <div className="flex justify-between py-2.5 text-[15px]">
              <span className="text-stone-600">Último conteo</span>
              <span className="font-semibold tabular-nums">{row.inicio ?? 0}</span>
            </div>
            <div className="flex justify-between py-2.5 text-[15px]">
              <span className="text-stone-600">Entró hoy</span>
              <span className="font-semibold tabular-nums">{row.ingreso ?? 0}</span>
            </div>
            {num(fiado) > 0 && (
              <div className="flex justify-between py-2.5 text-[15px]">
                <span className="text-stone-600">Quebradas / regaladas</span>
                <span className="font-semibold tabular-nums">- {num(fiado)}</span>
              </div>
            )}
            <div className="flex justify-between py-2.5 text-[15px]">
              <span className="text-stone-900 font-medium">Debería haber</span>
              <span className="font-bold tabular-nums">{disponible}</span>
            </div>
          </Card>

          {/* Freezers */}
          <div className="mt-5 mb-2 px-1 text-[16px] font-semibold text-stone-900">¿Cuántos hay ahora?</div>
          <Card className="divide-y divide-stone-100">
            {Object.keys(qty).map(f => (
              <div key={f} className="flex items-center justify-between px-4 py-3 gap-3">
                <span className="text-[16px] text-stone-800">{f}</span>
                <Stepper value={qty[f]} onChange={v => setQty(s => ({ ...s, [f]: v }))} />
              </div>
            ))}
            {addingFreezer ? (
              <div className="flex gap-2 p-3">
                <TextInput value={newFreezer} onChange={setNewFreezer} placeholder="Ej. Freezer 3, hielera" autoFocus />
                <Button
                  onClick={() => {
                    const n = newFreezer.trim();
                    if (n && qty[n] === undefined) {
                      setQty(s => ({ ...s, [n]: '' }));
                      onAddFreezer(n);
                    }
                    setNewFreezer('');
                    setAddingFreezer(false);
                  }}
                >
                  Listo
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setAddingFreezer(true)}
                className="w-full flex items-center justify-center gap-1.5 py-3 text-[15px] text-stone-600 active:bg-stone-50 rounded-b-2xl"
              >
                <Plus className="w-4 h-4" /> Agregar otro freezer
              </button>
            )}
          </Card>
        </>
      )}

      {/* Resultado */}
      <Card className="mt-5 p-4 bg-brand border-brand text-white">
        {!isDirect && (
          <div className="flex justify-between text-[15px] text-white/75">
            <span>Hay en total</span>
            <span className="tabular-nums">{hay}</span>
          </div>
        )}
        <div className="flex justify-between items-end mt-1">
          <span className="text-[16px]">Se vendieron</span>
          <span className="text-[28px] font-bold tabular-nums leading-none">{venta}</span>
        </div>
        <div className="flex justify-between items-end mt-2">
          <span className="text-[16px]">Dinero</span>
          <span className="text-[22px] font-bold tabular-nums leading-none">{money(m.total)}</span>
        </div>
        {product.pack && venta > 0 && (
          <div className="mt-2 text-[14px] text-white/75 text-right">
            {m.packs} {product.pack.label.toLowerCase()} de {product.pack.units} + {m.ind} sueltas
          </div>
        )}
      </Card>

      {sobra > 0 && (
        <p className="mt-3 text-[14px] text-red-700">
          Hay {sobra} más de lo que debería. Revise el conteo o si faltó anotar una entrada.
        </p>
      )}

      {/* Opcionales */}
      {product.pack && venta > 0 && (
        <Card className="mt-4">
          <button
            onClick={() => {
              setShowSueltas(s => !s);
              if (showSueltas) setSueltas('');
            }}
            className="w-full flex items-center justify-between px-4 py-3 text-[15px] text-stone-800"
          >
            <span>¿Quiere poner cuántas se vendieron sueltas según las comandas?</span>
            {showSueltas ? <ChevronUp className="w-5 h-5 shrink-0" /> : <ChevronDown className="w-5 h-5 shrink-0" />}
          </button>
          {showSueltas && (
            <div className="px-4 pb-4 flex items-center justify-between gap-3">
              <span className="text-[15px] text-stone-600">Vendidas sueltas</span>
              <Stepper value={sueltas} onChange={setSueltas} />
            </div>
          )}
        </Card>
      )}

      {!isDirect && (
        <Card className="mt-3">
          <button
            onClick={() => setShowFiado(s => !s)}
            className="w-full flex items-center justify-between px-4 py-3 text-[15px] text-stone-800"
          >
            <span>¿Se quebró o se regaló alguna?</span>
            {showFiado ? <ChevronUp className="w-5 h-5 shrink-0" /> : <ChevronDown className="w-5 h-5 shrink-0" />}
          </button>
          {showFiado && (
            <div className="px-4 pb-4 flex items-center justify-between gap-3">
              <span className="text-[15px] text-stone-600">Cantidad</span>
              <Stepper value={fiado} onChange={setFiado} />
            </div>
          )}
        </Card>
      )}

      {row.counted && (
        <button
          onClick={() => {
            if (window.confirm(`¿Borrar el conteo de ${product.name}?`)) onClear();
          }}
          className="mt-5 w-full py-3 text-[15px] text-red-700 underline"
        >
          Borrar este conteo
        </button>
      )}
    </Sheet>
  );
}
