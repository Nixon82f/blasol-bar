import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Screen, Card, Sheet, Button, NumberInput, TextInput, Empty, SectionTitle, Chips } from '../ui/kit';
import { money, num, prettyDate, uid } from '../lib/format';

export default function Fiados({ state, update, date, onBack }) {
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState('pendiente');

  const debts = state.debts;
  const pendiente = debts.filter(d => d.status === 'pendiente').reduce((a, d) => a + num(d.amount), 0);
  const list = debts.filter(d => filter === 'todos' || d.status === filter);

  const setStatus = (id, status) =>
    update(d => {
      const x = d.debts.find(y => y.id === id);
      if (x) {
        x.status = status;
        x.resolvedDate = date;
      }
    });

  return (
    <Screen
      title="Fiados"
      onBack={onBack}
      footer={
        <Button className="w-full" onClick={() => setAdding(true)}>
          <Plus className="w-5 h-5" /> Anotar fiado
        </Button>
      }
    >
      <Card className="p-4 flex items-center justify-between">
        <span className="text-[15px] text-stone-600">Le deben en total</span>
        <span className="text-[20px] font-bold tabular-nums">{money(pendiente)}</span>
      </Card>

      <div className="mt-4">
        <Chips
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'pendiente', label: 'Deben' },
            { id: 'cobrado', label: 'Pagaron' },
            { id: 'perdida', label: 'No pagaron' },
            { id: 'todos', label: 'Todos' },
          ]}
        />
      </div>

      <div className="mt-3 space-y-2">
        {list.length === 0 && <Empty>No hay nada aquí.</Empty>}
        {list.map(d => (
          <Card key={d.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[17px] font-semibold">{d.name}</div>
                {d.detail && <div className="text-[14px] text-stone-600">{d.detail}</div>}
                <div className="text-[13px] text-stone-500 mt-0.5">{prettyDate(d.date)}</div>
              </div>
              <div className="text-[18px] font-bold tabular-nums">{money(d.amount)}</div>
            </div>
            {d.status === 'pendiente' ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button onClick={() => setStatus(d.id, 'cobrado')}>Ya pagó</Button>
                <Button
                  variant="danger"
                  onClick={() => confirm('¿Darlo por perdido? Se restará de la ganancia de hoy.') && setStatus(d.id, 'perdida')}
                >
                  No va a pagar
                </Button>
              </div>
            ) : (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[14px] text-stone-600">
                  {d.status === 'cobrado' ? 'Pagó' : 'Perdido'} el {prettyDate(d.resolvedDate).toLowerCase()}
                </span>
                <button onClick={() => setStatus(d.id, 'pendiente')} className="text-[14px] underline text-stone-600">
                  Deshacer
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {adding && (
        <AddDebt
          onClose={() => setAdding(false)}
          onSave={(name, detail, amount) => {
            update(d => {
              d.debts.unshift({ id: uid(), name, detail, amount: num(amount), date, status: 'pendiente' });
            });
            setAdding(false);
          }}
        />
      )}
    </Screen>
  );
}

function AddDebt({ onSave, onClose }) {
  const [name, setName] = useState('');
  const [detail, setDetail] = useState('');
  const [amount, setAmount] = useState('');
  return (
    <Sheet
      title="Anotar fiado"
      onClose={onClose}
      footer={
        <Button className="w-full" disabled={!name.trim() || !num(amount)} onClick={() => onSave(name.trim(), detail.trim(), amount)}>
          Guardar
        </Button>
      }
    >
      <label className="block text-[15px] font-medium mb-2">¿Quién?</label>
      <TextInput value={name} onChange={setName} placeholder="Nombre" autoFocus />
      <label className="block text-[15px] font-medium mt-5 mb-2">¿Qué se llevó? (opcional)</label>
      <TextInput value={detail} onChange={setDetail} placeholder="Ej. 2 Toñas y un Zambo" />
      <label className="block text-[15px] font-medium mt-5 mb-2">¿Cuánto debe?</label>
      <NumberInput value={amount} onChange={setAmount} prefix="C$" />
      <p className="mt-4 text-[14px] text-stone-500">
        En el conteo cuéntelo como vendido normal. La app ya sabe que esa plata no entró a la caja hoy.
      </p>
    </Sheet>
  );
}
