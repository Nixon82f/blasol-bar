import React, { useEffect, useMemo, useState } from 'react';
import { useStore, computeDay } from './lib/store';
import { todayLocal } from './lib/format';
import Home from './screens/Home';
import Conteo from './screens/Conteo';
import Entradas from './screens/Entradas';
import Gastos from './screens/Gastos';
import Cierre from './screens/Cierre';
import Fiados from './screens/Fiados';
import Productos from './screens/Productos';
import Balance from './screens/Balance';

const SCREENS = { conteo: Conteo, entradas: Entradas, gastos: Gastos, cierre: Cierre, fiados: Fiados, productos: Productos, balance: Balance };

const currentHash = () => window.location.hash.replace('#', '') || 'home';

export default function App() {
  const [state, update, replace] = useStore();
  const [date, setDate] = useState(todayLocal);
  const [screen, setScreen] = useState(currentHash);

  // Usar el historial del navegador para que el gesto "atrás" del iPhone funcione
  useEffect(() => {
    const onHash = () => {
      setScreen(currentHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = id => {
    window.location.hash = id;
  };
  const back = () => {
    window.location.hash = '';
  };

  const view = useMemo(() => computeDay(state, date), [state, date]);
  const pendingDebts = state.debts.filter(d => d.status === 'pendiente').length;

  const Current = SCREENS[screen];
  if (!Current) {
    return <Home state={state} update={update} date={date} setDate={setDate} view={view} go={go} pendingDebts={pendingDebts} />;
  }
  return <Current state={state} update={update} replace={replace} view={view} date={date} onBack={back} />;
}
