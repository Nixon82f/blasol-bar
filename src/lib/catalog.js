// kind:
//  'inventario' -> se cuenta en los freezers. Venta = Inicio + Entró - Fiado - Hay ahora
//  'directo'    -> no se cuenta, se anota cuántos se vendieron (tragos, comida preparada)
//  'compra'     -> solo se registra cuando se compra (botellas de licor); su costo cuenta ese día
// pack: promoción o cubeta { units, price, label }

export const CATEGORIES = [
  { id: 'cerveza', label: 'Cervezas', group: 'Alcohol' },
  { id: 'lata', label: 'Latas y mezclas', group: 'Alcohol' },
  { id: 'licor', label: 'Licores y tragos', group: 'Alcohol' },
  { id: 'bebida', label: 'Sin alcohol', group: 'Bebidas sin alcohol' },
  { id: 'chiveria', label: 'Chiverías', group: 'Chiverías y comida' },
  { id: 'bocadillo', label: 'Bocadillos', group: 'Chiverías y comida' },
  { id: 'cigarro', label: 'Cigarros', group: 'Cigarros' },
];

export const GROUPS = ['Alcohol', 'Bebidas sin alcohol', 'Chiverías y comida', 'Cigarros'];

export const catLabel = id => CATEGORIES.find(c => c.id === id)?.label || id;
export const catGroup = id => CATEGORIES.find(c => c.id === id)?.group || 'Otros';

const CUBETA = { units: 6, price: 230, label: 'Cubetazo' };

const p = (id, name, cat, extra = {}) => ({
  id,
  name,
  cat,
  kind: 'inventario',
  price: 0,
  cost: 0,
  pack: null,
  ...extra,
});

export const DEFAULT_PRODUCTS = [
  // Cervezas
  p('tona-12', 'Toña 12 onzas', 'cerveza', { pack: CUBETA }),
  p('clasica-12', 'Clásica 12 onzas', 'cerveza', { pack: CUBETA }),
  p('frost-12', 'Frost 12 onzas', 'cerveza', { pack: CUBETA }),
  p('boreal', 'Boreal', 'cerveza'),
  p('sol', 'Sol', 'cerveza'),
  p('miller', 'Miller Lite', 'cerveza'),
  p('smirnoff', 'Smirnoff', 'cerveza'),
  p('heineken', 'Heineken', 'cerveza'),
  p('laton', 'Latón', 'cerveza'),
  p('tona-litro', 'Toña litro', 'cerveza'),
  p('clasica-litro', 'Clásica litro', 'cerveza'),
  p('frost-litro', 'Frost litro', 'cerveza'),

  // Latas y mezclas
  p('lata-tona', 'Lata Toña', 'lata'),
  p('laton-tona', 'Latón Toña', 'lata'),
  p('lata-clasica', 'Lata Clásica', 'lata'),
  p('tona-ultra', 'Toña Ultra lata', 'lata'),
  p('michelada', 'Michelada lata', 'lata'),
  p('spark-manzana', 'Spark manzana', 'lata'),
  p('spark-mandarina', 'Spark mandarina', 'lata'),
  p('spark-raspberry', 'Spark raspberry', 'lata'),
  p('spark-tripleberry', 'Spark tripleberry', 'lata'),
  p('spark-limon', 'Spark limón', 'lata'),
  p('spark-sandia', 'Spark sandía', 'lata'),
  p('spark-original', 'Spark original', 'lata'),
  p('bambu-pina', 'Bambú piña', 'lata'),
  p('bambu-daikiri', 'Bambú daikiry', 'lata'),

  // Licores y tragos
  p('trago', 'Trago / shot', 'licor', {
    kind: 'directo',
    pack: { units: 3, price: 120, label: 'Promo 3 tragos' },
  }),
  p('botella-licor', 'Botella de licor (compra)', 'licor', { kind: 'compra' }),

  // Sin alcohol
  p('suero', 'Suero', 'bebida'),
  p('ensa', 'Ensa', 'bebida'),
  p('agua-litro', 'Agua litro', 'bebida'),
  p('agua-peq', 'Agua pequeña', 'bebida'),
  p('coca', 'Coca Cola', 'bebida'),
  p('del-valle', 'Jugo del Valle', 'bebida'),
  p('hici', 'HiCi Té', 'bebida'),
  p('volt-grande', 'Volt grande', 'bebida'),
  p('volt-peq', 'Volt pequeño', 'bebida'),

  // Chiverías
  p('zibba', 'Zibba', 'chiveria'),
  p('yumi', 'Yumi mix', 'chiveria'),
  p('ranchita', 'Ranchita', 'chiveria'),
  p('chicharron', 'Chicharrón', 'chiveria'),
  p('chicharron-limon', 'Chicharrón limón', 'chiveria'),
  p('zambo', 'Zambo', 'chiveria'),
  p('jalapeno', 'Jalapeño', 'chiveria'),
  p('taquero', 'Taquero', 'chiveria'),
  p('mani', 'Maní', 'chiveria'),
  p('churros', 'Churros', 'chiveria'),

  // Bocadillos (por temporada, se anotan los vendidos)
  p('toston-queso', 'Tostón con queso', 'bocadillo', { kind: 'directo' }),
  p('toston-carne', 'Tostón con carne', 'bocadillo', { kind: 'directo' }),
  p('toston-mixto', 'Tostón mixto', 'bocadillo', { kind: 'directo' }),
  p('maruchan', 'Maruchan', 'bocadillo'),

  // Cigarros
  p('pall-mall', 'Pall Mall', 'cigarro'),
  p('modern-clic', 'Modern Clic', 'cigarro'),
  p('indigo', 'Índigo', 'cigarro'),
  p('modern', 'Modern', 'cigarro'),
];

export const DEFAULT_SETTINGS = {
  internet: 1180,
  luz: 3850,
  agua: 315,
  cuota: 800,
  policia: 600,
  diasMes: 30,
  planilla1: 500,
  planilla2: 600,
};

export const DEFAULT_INSUMOS = [
  'Hielo',
  'Papel higiénico',
  'Servilletas',
  'Sal',
  'Cloro',
  'Desinfectante',
  'Jabón',
  'Bolsas',
  'Limones',
];
