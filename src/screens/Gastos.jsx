import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Screen, Card, Sheet, Button, NumberInput, TextInput, Empty, SectionTitle } from '../ui/kit';
import { money, num, prettyDate, uid, nowTime } from '../lib/format';
import { ensureDay } from '../lib/store';

const TIPO = { planilla: 'Planilla', insumo: 'Insumo', fijo: 'Recibo' };

const FIJOS = [
  ['luz', 'Luz'],
  ['agua', 'Agua'],
  ['internet', 'Internet'],
  ['cuota', 'Cuota fija'],
  ['policia', 'Policía'],
];

export default function Gastos({ state, update, view, date, onBack }) {
  const [sheet, setSheet] = useState(null); // { name, amount, type }
  const s = state.settings;
  const gastos = view.day.gastos || [];
  const total = gastos.reduce((a, g) => a + num(g.amount), 0);

  const add = (name, amount, type) =>
    update(d => {
      const day = ensureDay(d, date);
      day.gastos.push({ id: uid(), name, amount: num(amount), type, time: nowTime() });
    });

  return (
    <Screen
      title="Gastos"
      subtitle={prettyDate(date)}
      onBack={onBack}
      footer={
        <Button className="w-full" onClick={() => setSheet({ name: '', amount: '', type: 'otro' })}>
          <Plus className="w-5 h-5" /> Otro gasto
        </Button>
      }
    >
      <Card className="p-4 flex items-center justify-between">
        <span className="text-[15px] text-stone-600">Gastado hoy</span>
        <span className="text-[20px] font-bold tabular-nums">{money(total)}</span>
      </Card>

      <SectionTitle>Planilla (un toque)</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <QuickBtn
          title={money(s.planilla1)}
          desc="Empleada del día"
          onClick={() => add('Planilla empleada', s.planilla1, 'planilla')}
        />
        <QuickBtn
          title={money(s.planilla2)}
          desc="Ayudante fin de semana"
          onClick={() => add('Planilla ayudante', s.planilla2, 'planilla')}
        />
      </div>
      <button
        onClick={() => setSheet({ name: 'Planilla', amount: '', type: 'planilla' })}
        className="mt-2 text-[14px] text-stone-700 underline px-1"
      >
        Pagar otro monto de planilla
      </button>

      <SectionTitle>Recibos y pagos del mes</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {FIJOS.map(([k, name]) => (
          <button
            key={k}
            onClick={() => setSheet({ name, amount: s[k] ? String(s[k]) : '', type: 'fijo' })}
            className="bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-left active:bg-stone-100"
          >
            <div className="text-[15px] font-medium text-stone-900">{name}</div>
            <div className="text-[13px] text-stone-500 tabular-nums">{s[k] ? `aprox. ${money(s[k])}` : 'Poner monto'}</div>
          </button>
        ))}
      </div>
      <p className="mt-2 px-1 text-[13px] text-stone-500 leading-snug">
        Anótelo el día que lo pague. Si ese día sale en pérdida no se asuste: vea el balance de la semana o del mes.
      </p>

      <SectionTitle>Insumos (toque y ponga el monto)</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {state.insumos.map(name => (
          <button
            key={name}
            onClick={() => setSheet({ name, amount: '', type: 'insumo' })}
            className="h-11 px-4 rounded-xl bg-white border border-stone-300 text-[15px] active:bg-stone-100"
          >
            {name}
          </button>
        ))}
      </div>

      <SectionTitle>Anotados hoy</SectionTitle>
      {gastos.length === 0 ? (
        <Empty>No hay gastos anotados hoy.</Empty>
      ) : (
        <Card className="divide-y divide-stone-100">
          {gastos.map(g => (
            <div key={g.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="text-[16px] font-medium truncate">{g.name}</div>
                <div className="text-[13px] text-stone-500">
                  {g.time}
                  {TIPO[g.type] ? ` · ${TIPO[g.type]}` : ''}
                </div>
              </div>
              <span className="text-[16px] font-semibold tabular-nums">{money(g.amount)}</span>
              <button
                onClick={() =>
                  confirm('¿Borrar este gasto?') &&
                  update(d => {
                    const day = ensureDay(d, date);
                    day.gastos = day.gastos.filter(x => x.id !== g.id);
                  })
                }
                className="w-9 h-9 flex items-center justify-center text-stone-400 active:text-red-700"
                aria-label="Borrar"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </Card>
      )}


      {sheet && (
        <AmountSheet
          initial={sheet}
          onClose={() => setSheet(null)}
          onSave={(name, amount) => {
            add(name || 'Gasto', amount, sheet.type);
            setSheet(null);
          }}
        />
      )}
    </Screen>
  );
}

function QuickBtn({ title, desc, onClick }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => {
        onClick();
        setOk(true);
        setTimeout(() => setOk(false), 1200);
      }}
      className="bg-white border border-stone-200 rounded-2xl p-4 text-left active:bg-stone-50"
    >
      <div className="text-[20px] font-bold tabular-nums">{ok ? 'Anotado ✓' : title}</div>
      <div className="text-[14px] text-stone-500 mt-0.5">{desc}</div>
    </button>
  );
}

function AmountSheet({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial.name);
  const [amount, setAmount] = useState(initial.amount);
  return (
    <Sheet
      title={initial.name || 'Nuevo gasto'}
      onClose={onClose}
      footer={
        <Button className="w-full" disabled={!num(amount)} onClick={() => onSave(name.trim(), amount)}>
          Guardar gasto
        </Button>
      }
    >
      <label className="block text-[15px] font-medium mb-2">¿En qué se gastó?</label>
      <TextInput value={name} onChange={setName} placeholder="Ej. Hielo, gas, reparación" autoFocus={!initial.name} />
      <label className="block text-[15px] font-medium mt-5 mb-2">¿Cuánto?</label>
      <NumberInput value={amount} onChange={setAmount} prefix="C$" autoFocus={Boolean(initial.name)} decimal />
    </Sheet>
  );
}
