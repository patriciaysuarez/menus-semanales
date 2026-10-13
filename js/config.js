// CONFIG — pega aquí el link del Google Sheet publicado como CSV
// (Archivo → Compartir → Publicar en la web → hoja → CSV).
// Disposición de la hoja: columnas B a I (2 a 9) = clientes 1 a 8.
//   Fila 1, columna A  → fecha de la semana
//   Filas 2 a 10       → platillos (celda vacía = no hay platillo). Columna A = categoría
//   Solo se usa el bloque de arriba; las semanas anteriores más abajo se ignoran.
window.CONFIG = {
  sheetCsvUrl: "https://docs.google.com/spreadsheets/d/1q1VOhceXykHhoXB0jKa0iS69VZScwcsRAcLXpkRCm4U/gviz/tq?tqx=out:csv&gid=717356759",  // vacío = datos de demostración
  // Pestaña "Invoices": filas 7 a 13, misma columna que el menú del cliente.
  invoicesCsvUrl: "https://docs.google.com/spreadsheets/d/1q1VOhceXykHhoXB0jKa0iS69VZScwcsRAcLXpkRCm4U/gviz/tq?tqx=out:csv&gid=1243489383",
  // Pestañas de clientes con entregas: "Freshly Delivered Clients" y "Perfectly Portioned Clients".
  // Fila 1 = nombre (columnas B a D); la columna A marca "First Delivery" / "Second Delivery" y cada marca vale hasta la siguiente.
  // Un cliente cuyo nombre aparezca en la fila 1 de alguna de estas pestañas toma su menú de ahí.
  deliveryCsvUrls: [
    "https://docs.google.com/spreadsheets/d/1q1VOhceXykHhoXB0jKa0iS69VZScwcsRAcLXpkRCm4U/gviz/tq?tqx=out:csv&gid=499317040",
    "https://docs.google.com/spreadsheets/d/1q1VOhceXykHhoXB0jKa0iS69VZScwcsRAcLXpkRCm4U/gviz/tq?tqx=out:csv&gid=1949387662"
  ],
  deliveryMaxCol: 3,
  // Estado de pago: en la pestaña "Invoices", la fila "Paid button" (una casilla por cliente, misma columna que su menú).
  // Casilla marcada (TRUE) = "Amount paid"; desmarcada (FALSE) o sin casilla = "Amount due".
  // Fecha límite: fila "Due Date" de la pestaña "Invoices" (una por cliente). Si la celda está vacía,
  // se usa el día antes de que empiece la semana.
  invoiceFirstRow: 7,
  invoiceLastRow: 13,
  payments: [
    { name: "Zelle", handle: "786-473-8009" },
    { name: "Venmo", handle: "patriciasuarez" }
  ],
  // Datos de pago distintos por cliente (clave = columna del Sheet: 2 = Senia & Sean, 7 = Luiza)
  paymentsByColumn: {
    2: [{ name: "Zelle", handle: "Sofritoysalsanyc@gmail.com" }, { name: "Venmo", handle: "patriciasuarez" }],
    7: [{ name: "Zelle", handle: "Sofritoysalsanyc@gmail.com" }, { name: "Venmo", handle: "patriciasuarez" }]
  },
  clientCount: 8,
  // Cada cliente entra con su código secreto: ?m=CODIGO  (código 1 = columna B, ... código 8 = columna I)
  tokens: ["i3vayHrn1ZqI", "C4UKXoyeXkQo", "VEy93HQmlLiz", "1MS64NjLcSjL", "2V092uvWD94Y", "72Uqw8djXkSR", "GYqImzXGkC8Y", "OrcPEBlVhz3S"],
  // Nombres de los clientes. Si la celda de la fila 1 de la columna (B a I)
  // trae un nombre, tiene prioridad sobre esta lista.
  names: ["Cliente 1","Cliente 2","Cliente 3","Cliente 4","Cliente 5","Cliente 6","Cliente 7","Cliente 8"],
  firstRecipeRow: 2,
  lastRecipeRow: 10
};
