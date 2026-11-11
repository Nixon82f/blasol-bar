import React, { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Screen, Card, SearchBox, Sheet, Button, Stepper, NumberInput, Empty, SectionTitle } from '../ui/kit';
import { money, normalize, num, prettyDate, uid, nowTime } from '../lib/format';
import { ensureDay } from '../lib/store';

export default function Entradas({ state, update, view, date, onBack }) {
  const [picking, setPicking] = useState(false);
  const [product, setProduct] = useState(null);

  const entradas = view.day.entradas || [];
  const total = entradas.reduce((a, e) => a + num(e.qty) * num(e.unitCost), 0);
  const nameOf = id => state.products.find(p => p.id === id)?.name || 'Producto borrado';

  return (
    <Screen
      title="Entró mercadería"
      subtitle={prettyDate(date)}
      onBack={onBack}
      footer={
        <Button className="w-full" onClick={() => setPicking(true)}>
          <Plus className="w-5 h-5" /> Anotar lo que entró
        </Button>
      }
    >
      <Card className="p-4 flex items-center justify-between">
        <span className="text-[15px] text-stone-600">Total comprado hoy</span>
        <span className="text-[20px] font-bold tabular-nums">{money(total)}</span>
      </Card>

      <SectionTitle>Entradas de hoy</SectionTitle>
      {entradas.length === 0 ? (
        <Empty>Todavía no ha entrado nada hoy.</Empty>
      ) : (
        <Card className="divide-y divide-stone-100">
          {entradas.map(e => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="text-[16px] font-semibold truncate">{nameOf(e.pid)}</div>
                <div className="text-[13px] text-stone-500">
                  {e.qty} unid × {money(e.unitCost)} · {e.time}
                </div>
              </div>
              <span className="text-[16px] font-semibold tabular-nums">{money(num(e.qty) * num(e.unitCost))}</span>
              <button
                onClick={() => {
                  if (confirm('¿Borrar esta entrada?'))
                    update(d => {
                      const day = ensureDay(d, date);
                      day.entradas = day.entradas.filter(x => x.id !== e.id);
                    });
                }}
                className="w-9 h-9 flex items-center justify-center text-stone-400 active:text-red-700"
                aria-label="Borrar"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </Card>
      )}

      {picking && (
        <ProductPicker
          products={state.products.filter(p => p.kind !== 'directo')}
          onClose={() => setPicking(false)}
          onPick={p => {
            setPicking(false);
            setProduct(p);
          }}
        />
      )}

      {product && (
        <EntrySheet
          product={product}
          lastCost={state.lastCost[product.id] ?? (num(product.cost) || null)}
          onClose={() => setProduct(null)}
          onSave={(qty, unitCost) => {
            update(d => {
              const day = ensureDay(d, date);
              day.entradas.push({ id: uid(), pid: product.id, qty, unitCost, time: nowTime() });
              d.lastCost[product.id] = unitCost;
            });
            setProduct(null);
          }}
        />
      )}
    </Screen>
  );
}

export function ProductPicker({ products, onPick, onClose, title = '¿Qué producto entró?' }) {
  const [q, setQ] = useState('');
  const list = useMemo(
    () => products.filter(p => !q || normalize(p.name).includes(normalize(q))),
    [products, q]
  );
  return (
    <Sheet title={title} onClose={onClose}>
      <SearchBox value={q} onChange={setQ} />
      <Card className="mt-3 divide-y divide-stone-100">
        {list.map(p => (
          <button
            key={p.id}
            onClick={() => onPick(p)}
            className="w-full text-left px-4 py-3.5 text-[16px] text-stone-900 active:bg-stone-50 first:rounded-t-2xl last:rounded-b-2xl"
          >
            {p.name}
          </button>
        ))}
        {list.length === 0 && <div className="p-4 text-stone-500 text-[15px]">No encontrado.</div>}
      </Card>
    </Sheet>
  );
}

function EntrySheet({ product, lastCost, onSave, onClose }) {
  const [qty, setQty] = useState('');
  const [mode, setMode] = useState('unidad'); // 'unidad' | 'total'
  const [price, setPrice] = useState(lastCost ? String(lastCost) : '');

  const q = num(qty);
  const unitCost = mode === 'unidad' ? num(price) : q ? num(price) / q : 0;
  const total = mode === 'unidad' ? q * num(price) : num(price);

  return (
    <Sheet
      title={product.name}
      subtitle="Anotar entrada"
      onClose={onClose}
      footer={
        <Button className="w-full" disabled={!q} onClick={() => onSave(q, Math.round(unitCost * 100) / 100)}>
          Guardar entrada
        </Button>
      }
    >
      <Card className="p-4">
        <div className="text-[16px] font-semibold mb-3">¿Cuántas unidades entraron?</div>
        <div className="flex justify-center">
          <Stepper value={qty} onChange={setQty} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[6, 12, 24].map(n => (
            <button
              key={n}
              onClick={() => setQty(String(q + n))}
              className="h-11 rounded-xl border border-stone-300 bg-white text-[15px] font-medium active:bg-stone-100"
            >
              + {n}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4 mt-4">
        <div className="text-[16px] font-semibold mb-3">¿Cuánto costó?</div>
        <div className="grid grid-cols-2 bg-stone-100 rounded-xl p-1 mb-3">
          {[
            ['unidad', 'Precio por unidad'],
            ['total', 'Total que pagó'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                setMode(id);
                setPrice('');
              }}
              className={`h-10 rounded-lg text-[14px] font-medium ${
                mode === id ? 'bg-white shadow-sm text-stone-900' : 'text-stone-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <NumberInput value={price} onChange={setPrice} prefix="C$" decimal />
        {lastCost && mode === 'unidad' && num(price) !== num(lastCost) && (
          <button
            onClick={() => setPrice(String(lastCost))}
            className="mt-2 text-[14px] text-stone-700 underline"
          >
            Usar el precio de la vez pasada: {money(lastCost)}
          </button>
        )}
        {q > 0 && num(price) > 0 && (
          <div className="mt-3 text-[15px] text-stone-600">
            {mode === 'unidad' ? (
              <>Total: <b className="text-stone-900">{money(total)}</b></>
            ) : (
              <>Sale a <b className="text-stone-900">C$ {unitCost.toFixed(2)}</b> cada una</>
            )}
          </div>
        )}
      </Card>
    </Sheet>
  );
}
