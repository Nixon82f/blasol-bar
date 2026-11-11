import React, { useMemo, useState } from 'react';
import { Plus, Trash2, ChevronRight, Download, Upload } from 'lucide-react';
import { Screen, Card, Sheet, Button, NumberInput, TextInput, SearchBox, Chips, SectionTitle, Row } from '../ui/kit';
import { daysSinceBackup, shareBackup } from '../lib/backup';
import { CATEGORIES, catLabel } from '../lib/catalog';
import { money, normalize, num, uid, todayLocal } from '../lib/format';

export default function Productos({ state, update, replace, onBack }) {
  const [tab, setTab] = useState('productos');
  return (
    <Screen title="Productos y precios" onBack={onBack}>
      <Chips
        value={tab}
        onChange={setTab}
        options={[
          { id: 'productos', label: 'Productos' },
          { id: 'freezers', label: 'Freezers' },
          { id: 'gastos', label: 'Montos de gastos' },
          { id: 'respaldo', label: 'Respaldo' },
        ]}
      />
      <div className="mt-4">
        {tab === 'productos' && <ProductList state={state} update={update} />}
        {tab === 'freezers' && <Freezers state={state} update={update} />}
        {tab === 'gastos' && <FixedCosts state={state} update={update} />}
        {tab === 'respaldo' && <Backup state={state} update={update} replace={replace} />}
      </div>
    </Screen>
  );
}

function ProductList({ state, update }) {
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const list = useMemo(
    () => state.products.filter(p => !q || normalize(p.name).includes(normalize(q))),
    [state.products, q]
  );
  const sinPrecio = state.products.filter(p => p.kind !== 'compra' && !num(p.price)).length;

  return (
    <>
      {sinPrecio > 0 && (
        <Card className="p-4 mb-3 bg-amber-50 border-amber-200">
          <p className="text-[15px] text-amber-900">
            Faltan precios en {sinPrecio} productos. Sin precio la app no puede calcular el dinero vendido.
          </p>
        </Card>
      )}
      <div className="flex gap-2">
        <div className="flex-1">
          <SearchBox value={q} onChange={setQ} />
        </div>
        <Button onClick={() => setEditing({ id: null, name: '', cat: 'cerveza', kind: 'inventario', price: '', cost: '', pack: null })}>
          <Plus className="w-5 h-5" /> Nuevo
        </Button>
      </div>

      {CATEGORIES.map(c => {
        const items = list.filter(p => p.cat === c.id);
        if (!items.length) return null;
        return (
          <div key={c.id}>
            <SectionTitle>{c.label}</SectionTitle>
            <Card className="divide-y divide-stone-100">
              {items.map(p => (
                <button
                  key={p.id}
                  onClick={() => setEditing(p)}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 active:bg-stone-50 first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[16px] font-medium truncate">{p.name}</div>
                    <div className="text-[13px] text-stone-500">
                      {p.kind === 'compra'
                        ? 'Solo se anota la compra'
                        : num(p.price)
                        ? `Precio ${money(p.price)}`
                        : 'Sin precio'}
                      {p.pack && ` · ${p.pack.label} ${p.pack.units} x ${money(p.pack.price)}`}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-400" />
                </button>
              ))}
            </Card>
          </div>
        );
      })}

      {editing && (
        <ProductSheet
          product={editing}
          lastCost={editing.id ? state.lastCost[editing.id] : undefined}
          onClose={() => setEditing(null)}
          onDelete={() => {
            if (confirm(`¿Quitar "${editing.name}" de la lista?`)) {
              update(d => {
                d.products = d.products.filter(p => p.id !== editing.id);
              });
              setEditing(null);
            }
          }}
          onSave={prod => {
            update(d => {
              if (prod.id) {
                d.products = d.products.map(p => (p.id === prod.id ? prod : p));
              } else {
                d.products.push({ ...prod, id: uid() });
              }
            });
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function ProductSheet({ product, lastCost, onSave, onClose, onDelete }) {
  const [f, setF] = useState({
    ...product,
    price: product.price ? String(product.price) : '',
    cost: product.cost ? String(product.cost) : '',
  });
  const [hasPack, setHasPack] = useState(Boolean(product.pack));
  const [pack, setPack] = useState(
    product.pack
      ? { label: product.pack.label, units: String(product.pack.units), price: String(product.pack.price) }
      : { label: 'Promo', units: '', price: '' }
  );
  const set = patch => setF(s => ({ ...s, ...patch }));

  const save = () =>
    onSave({
      ...f,
      name: f.name.trim(),
      price: num(f.price),
      cost: num(f.cost),
      pack: hasPack && num(pack.units) > 1 && num(pack.price) > 0
        ? { label: pack.label.trim() || 'Promo', units: num(pack.units), price: num(pack.price) }
        : null,
    });

  return (
    <Sheet
      title={product.id ? 'Editar producto' : 'Nuevo producto'}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          {product.id && (
            <Button variant="danger" onClick={onDelete} aria-label="Quitar">
              <Trash2 className="w-5 h-5" />
            </Button>
          )}
          <Button className="flex-1" disabled={!f.name.trim()} onClick={save}>
            Guardar
          </Button>
        </div>
      }
    >
      <label className="block text-[15px] font-medium mb-2">Nombre</label>
      <TextInput value={f.name} onChange={v => set({ name: v })} placeholder="Ej. Toña 12 onzas" />

      <label className="block text-[15px] font-medium mt-5 mb-2">Tipo</label>
      <select
        value={f.cat}
        onChange={e => set({ cat: e.target.value })}
        className="w-full h-12 rounded-xl border border-stone-300 bg-white px-3 text-[16px]"
      >
        {CATEGORIES.map(c => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>

      <label className="block text-[15px] font-medium mt-5 mb-2">¿Cómo se lleva?</label>
      <Card className="divide-y divide-stone-100">
        {[
          ['inventario', 'Se cuenta en el freezer o estante', 'Cervezas, gaseosas, chiverías, cigarros'],
          ['directo', 'Se anota cuántos se vendieron', 'Tragos, tostones, comida preparada'],
          ['compra', 'Solo se anota cuando se compra', 'Botellas de licor para tragos'],
        ].map(([id, t, d]) => (
          <label key={id} className="flex items-start gap-3 px-4 py-3">
            <input
              type="radio"
              name="kind"
              checked={f.kind === id}
              onChange={() => set({ kind: id })}
              className="mt-1 w-5 h-5 accent-brand"
            />
            <div>
              <div className="text-[15px] font-medium">{t}</div>
              <div className="text-[13px] text-stone-500">{d}</div>
            </div>
          </label>
        ))}
      </Card>

      {f.kind !== 'compra' && (
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div>
            <label className="block text-[15px] font-medium mb-2">Precio de venta</label>
            <NumberInput value={f.price} onChange={v => set({ price: v })} prefix="C$" decimal />
          </div>
          <div>
            <label className="block text-[15px] font-medium mb-2">Costo (aprox.)</label>
            <NumberInput value={f.cost} onChange={v => set({ cost: v })} prefix="C$" decimal />
          </div>
        </div>
      )}
      {f.kind === 'inventario' && lastCost !== undefined && (
        <p className="mt-2 text-[13px] text-stone-500">
          Última compra: {money(lastCost)} por unidad. La app usa el costo de cada entrada.
        </p>
      )}

      {f.kind !== 'compra' && (
        <Card className="mt-5 p-4">
          <label className="flex items-center gap-3 text-[15px] font-medium">
            <input
              type="checkbox"
              checked={hasPack}
              onChange={e => setHasPack(e.target.checked)}
              className="w-5 h-5 accent-brand"
            />
            Tiene promoción o cubeta
          </label>
          {hasPack && (
            <div className="mt-4 space-y-3">
              <TextInput value={pack.label} onChange={v => setPack(s => ({ ...s, label: v }))} placeholder="Nombre (Cubetazo, Promo)" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[14px] text-stone-600 mb-1.5">¿Cuántas?</label>
                  <NumberInput value={pack.units} onChange={v => setPack(s => ({ ...s, units: v }))} />
                </div>
                <div>
                  <label className="block text-[14px] text-stone-600 mb-1.5">¿Por cuánto?</label>
                  <NumberInput value={pack.price} onChange={v => setPack(s => ({ ...s, price: v }))} prefix="C$" />
                </div>
              </div>
              <p className="text-[13px] text-stone-500">
                Ej. Cubetazo: 6 por C$ 230. Promo tragos: 3 por C$ 120. Al contar, las que completan la promo se cobran
                a ese precio y el resto sueltas.
              </p>
            </div>
          )}
        </Card>
      )}
    </Sheet>
  );
}

function Freezers({ state, update }) {
  const [name, setName] = useState('');
  return (
    <>
      <p className="text-[15px] text-stone-600 mb-3 px-1">Estos aparecen al contar cada producto.</p>
      <Card className="divide-y divide-stone-100">
        {state.freezers.map((f, i) => (
          <div key={f} className="flex items-center justify-between px-4 py-3">
            <span className="text-[16px]">{f}</span>
            <button
              onClick={() =>
                state.freezers.length > 1 &&
                confirm(`¿Quitar "${f}"?`) &&
                update(d => {
                  d.freezers.splice(i, 1);
                })
              }
              className="w-9 h-9 flex items-center justify-center text-stone-400 active:text-red-700"
              aria-label="Quitar"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </Card>
      <div className="flex gap-2 mt-3">
        <TextInput value={name} onChange={setName} placeholder="Ej. Freezer 3, Bodega" />
        <Button
          onClick={() => {
            const n = name.trim();
            if (n && !state.freezers.includes(n)) update(d => d.freezers.push(n));
            setName('');
          }}
        >
          Agregar
        </Button>
      </div>
    </>
  );
}

function FixedCosts({ state, update }) {
  const s = state.settings;
  const set = (k, v) =>
    update(d => {
      d.settings[k] = v;
    });
  const fields = [
    ['internet', 'Internet'],
    ['luz', 'Luz (aprox.)'],
    ['agua', 'Agua (aprox.)'],
    ['cuota', 'Cuota fija'],
    ['policia', 'Policía'],
  ];
  return (
    <>
      <Card className="p-4 space-y-4">
        {fields.map(([k, label]) => (
          <div key={k} className="flex items-center justify-between gap-3">
            <label className="text-[15px] text-stone-700">{label}</label>
            <NumberInput value={s[k]} onChange={v => set(k, v)} prefix="C$" className="w-40" />
          </div>
        ))}
      </Card>
      <p className="mt-2 px-1 text-[13px] text-stone-500 leading-snug">
        Son los montos que salen sugeridos al tocar el botón en Gastos. Al pagar se pueden cambiar.
      </p>

      <SectionTitle>Botones de planilla</SectionTitle>
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <label className="text-[15px] text-stone-700">Empleada del día</label>
          <NumberInput value={s.planilla1} onChange={v => set('planilla1', v)} prefix="C$" className="w-40" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <label className="text-[15px] text-stone-700">Ayudante fin de semana</label>
          <NumberInput value={s.planilla2} onChange={v => set('planilla2', v)} prefix="C$" className="w-40" />
        </div>
      </Card>
    </>
  );
}

function Backup({ state, update, replace }) {
  const [msg, setMsg] = useState('');
  const n = daysSinceBackup(state);
  const download = async () => {
    if (await shareBackup(state)) {
      update(d => {
        d.lastBackup = todayLocal();
      });
      setMsg('Respaldo listo. Guárdelo en WhatsApp (por ejemplo, mandándoselo a usted misma).');
    }
  };
  return (
    <>
      <p className="text-[15px] text-stone-600 mb-1 px-1">
        Los datos se guardan solo en este celular. Si se borra Safari o cambia de teléfono, se pueden recuperar con el
        último respaldo.
      </p>
      <p className="text-[14px] text-stone-500 mb-3 px-1">
        {n === null ? 'Todavía no ha guardado ningún respaldo.' : n === 0 ? 'Último respaldo: hoy.' : `Último respaldo: hace ${n} ${n === 1 ? 'día' : 'días'}.`}
      </p>
      <div className="grid gap-3">
        <Button onClick={download}>
          <Download className="w-5 h-5" /> Guardar respaldo (WhatsApp)
        </Button>
        <label className="h-12 px-4 rounded-xl font-semibold text-[16px] flex items-center justify-center gap-2 bg-white border border-stone-300 active:bg-stone-100">
          <Upload className="w-5 h-5" /> Cargar respaldo
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              file.text().then(txt => {
                try {
                  const data = JSON.parse(txt);
                  if (!data.products) throw new Error('Archivo no válido');
                  if (confirm('Esto reemplaza todos los datos actuales. ¿Seguir?')) replace(data);
                } catch (err) {
                  alert('No se pudo cargar: ' + err.message);
                }
              });
            }}
          />
        </label>
      </div>
      {msg && <p className="mt-3 text-[14px] text-stone-700 px-1">{msg}</p>}
    </>
  );
}
