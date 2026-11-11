import React, { useEffect } from 'react';
import { ArrowLeft, Minus, Plus, Search, X } from 'lucide-react';

export function Screen({ title, subtitle, onBack, children, footer }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-20 bg-[#FAFAF8]/95 backdrop-blur border-b border-stone-200">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={onBack}
            className="-ml-2 h-10 px-2 flex items-center gap-1 text-stone-700 rounded-lg active:bg-stone-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-[15px]">Inicio</span>
          </button>
          <div className="flex-1 min-w-0 text-right">
            <div className="font-bold text-[16px] text-stone-900 truncate">{title}</div>
            {subtitle && <div className="text-xs text-stone-500 truncate">{subtitle}</div>}
          </div>
        </div>
      </header>
      <main className={`flex-1 max-w-xl w-full mx-auto px-4 pt-4 ${footer ? 'pb-28' : 'pb-10'}`}>
        {children}
      </main>
      {footer && (
        <div className="fixed bottom-0 inset-x-0 z-20 bg-white border-t border-stone-200 pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-xl mx-auto px-4 py-3">{footer}</div>
        </div>
      )}
    </div>
  );
}

export function Card({ children, className = '', ...rest }) {
  return (
    <div className={`bg-white border border-stone-200 rounded-2xl ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, right }) {
  return (
    <div className="flex items-end justify-between mt-6 mb-2 px-1">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-stone-500">{children}</h2>
      {right}
    </div>
  );
}

export function Button({ children, variant = 'primary', className = '', ...rest }) {
  const styles = {
    primary: 'bg-brand text-white active:bg-brand-dark',
    secondary: 'bg-white text-stone-900 border border-stone-300 active:bg-stone-100',
    ghost: 'text-stone-700 active:bg-stone-100',
    danger: 'bg-white text-red-700 border border-red-200 active:bg-red-50',
  };
  return (
    <button
      className={`h-12 px-4 rounded-xl font-semibold text-[16px] flex items-center justify-center gap-2 disabled:opacity-40 ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// Campo numérico grande (16px+ para que iPhone no haga zoom)
export function NumberInput({ value, onChange, placeholder = '0', prefix, className = '', autoFocus, decimal }) {
  return (
    <div className={`relative ${className}`}>
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-[16px]">{prefix}</span>
      )}
      <input
        type="text"
        inputMode={decimal ? 'decimal' : 'numeric'}
        pattern={decimal ? undefined : '[0-9]*'}
        autoFocus={autoFocus}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={e => {
          const v = e.target.value.replace(decimal ? /[^0-9.]/g : /[^0-9]/g, '');
          onChange(v);
        }}
        onFocus={e => e.target.select()}
        className={`w-full h-12 rounded-xl border border-stone-300 bg-white text-[18px] font-semibold text-stone-900 outline-none focus:border-brand ${
          prefix ? 'pl-11 pr-3' : 'px-3 text-center'
        }`}
      />
    </div>
  );
}

export function TextInput({ value, onChange, placeholder, autoFocus, className = '' }) {
  return (
    <input
      type="text"
      autoFocus={autoFocus}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className={`w-full h-12 rounded-xl border border-stone-300 bg-white px-3 text-[16px] text-stone-900 outline-none focus:border-brand ${className}`}
    />
  );
}

// [-]  numero  [+]
export function Stepper({ value, onChange, step = 1 }) {
  const n = Number(value) || 0;
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(String(Math.max(0, n - step)))}
        className="w-12 h-12 rounded-xl border border-stone-300 bg-white flex items-center justify-center active:bg-stone-100"
        aria-label="Restar"
      >
        <Minus className="w-5 h-5" />
      </button>
      <NumberInput value={value} onChange={onChange} className="w-20" />
      <button
        type="button"
        onClick={() => onChange(String(n + step))}
        className="w-12 h-12 rounded-xl border border-stone-300 bg-white flex items-center justify-center active:bg-stone-100"
        aria-label="Sumar"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Buscar producto' }) {
  return (
    <div className="relative">
      <Search className="w-5 h-5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 rounded-xl border border-stone-300 bg-white pl-10 pr-10 text-[16px] outline-none focus:border-brand"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-stone-400"
          aria-label="Borrar"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export function Chips({ options, value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 py-1">
      {options.map(o => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`h-9 px-3.5 rounded-full text-[14px] whitespace-nowrap border ${
            value === o.id
              ? 'bg-brand text-white border-brand'
              : 'bg-white text-stone-700 border-stone-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Hoja de pantalla completa en celular
export function Sheet({ title, subtitle, onClose, children, footer }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-end sm:items-center justify-center">
      <div className="bg-[#FAFAF8] w-full sm:max-w-lg h-[100dvh] sm:h-auto sm:max-h-[90dvh] sm:rounded-2xl flex flex-col">
        <div className="flex items-start justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 border-b border-stone-200 bg-white sm:rounded-t-2xl">
          <div className="min-w-0">
            <div className="text-[19px] font-bold text-stone-900 leading-tight">{title}</div>
            {subtitle && <div className="text-[14px] text-stone-500 mt-0.5">{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 -mr-2 flex items-center justify-center rounded-lg text-stone-500 active:bg-stone-100"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && (
          <div className="border-t border-stone-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Row({ label, value, strong, muted, className = '' }) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${className}`}>
      <span className={`text-[15px] ${muted ? 'text-stone-500' : 'text-stone-700'}`}>{label}</span>
      <span className={`tabular-nums ${strong ? 'text-[17px] font-bold text-stone-900' : 'text-[15px] text-stone-900'}`}>
        {value}
      </span>
    </div>
  );
}

export function Empty({ children }) {
  return (
    <div className="text-center text-[15px] text-stone-500 py-10 px-4 border border-dashed border-stone-300 rounded-2xl">
      {children}
    </div>
  );
}
