# 🍻 Sistema de Inventario y Caja - Doña Claudia Cafetín

Aplicación web progresiva (**PWA**) diseñada específicamente para teléfono móvil, optimizada para agilidad extrema en el conteo de inventario diario matutino, cálculo automático de ventas por cubetas/unidades, gastos operativos y cuadratura de caja.

---

## 🚀 Cómo iniciar el sistema

```bash
cd /home/ricardos/cafetin-app
npm run dev -- --host 0.0.0.0 --port 5173
```

- **Acceso Local (PC):** `http://localhost:5173`
- **Acceso en el Teléfono (misma red WiFi):** `http://192.168.1.2:5173` (o la IP local del equipo).
- **En el teléfono:** Abrir el navegador (Chrome en Android o Safari en iOS) y seleccionar **"Agregar a pantalla principal / Instalar aplicación"**. Quedará como una app nativa con ícono.

---

## 📱 Características Principales

1. **Conteo Multi-Freezer con Auto-Suma (Sin calculadora externa):**
   - Toca el botón de **"Físico"** en cualquier producto.
   - Desglosa por ubicación: *Freezer 1*, *Freezer 2*, *Bodega*, etc.
   - Botones rápidos de incremento: `+1`, `+6`, `+12`, `+24` para no tener que teclear.
   - La app suma todo automáticamente en tiempo real.

2. **Doble Modalidad de Venta (Cubeta vs. Individual):**
   - **Automático:** Si se vendieron 15 Toñas, calcula 2 cubetas (12 unid @ C$ 230) + 3 individuales.
   - **Por Comanda (Manual):** En la misma fila, un botón permite ingresar cuántas cubetas y cuántas individuales se cobraron según el ticket de papel de Doña Claudia.

3. **Ingresos de Mercadería con Memoria de Costo:**
   - Botón `+ Ingreso` con acceso de 1 toque: *"Usar último costo registrado"*, o escribir el nuevo si el proveedor cambió de precio.

4. **Traspaso Automático de Días (Cierres como Miércoles):**
   - Cada día toma automáticamente el **Inventario Final** del último día abierto como su **Inicio**. Si el miércoles cierran, al abrir el jueves todo el inventario estará listo intacto.

5. **Gastos Operativos con 1 Toque:**
   - **Planilla:** Botones directos `[ +500 Normal ]`, `[ +600 Fin de semana ]`.
   - **Insumos:** Selección rápida de *Hielo, Cloro, Jabón, Servilletas, Sal, Limones*, etc.
   - **Servicios y Fijos:** Internet (C$ 1,180), Cuota fija (C$ 800), Policía (C$ 600), Energía y Agua prorrateados diarios (~C$ 220/día) para calcular la **Ganancia Neta Real**.

6. **Cuadratura de Caja y Compartir por WhatsApp:**
   - Registro de Efectivo en mano + Transferencias recibidas.
   - Indica en verde o rojo si sobró o faltó dinero en comparación al inventario.
   - Botón directo **"Enviar reporte a WhatsApp"** con el resumen listo y ordenado para enviar a la pareja o socios.

7. **Control de Fiados:**
   - Registro con nombre de la persona, detalle y monto.
   - Marcado rápido como *Cobrado* o *Pérdida*.

8. **Catálogo Completo Precargado:**
   - Todas las cervezas de 12 oz, litros, latas, premezclados (Spark, Bambú), bebidas sin alcohol, shots/licores, chiverías, bocadillos y cigarros.
   - Precios y costos 100% editables desde la pestaña de Ajustes.
   - Copias de seguridad descargables en JSON.
