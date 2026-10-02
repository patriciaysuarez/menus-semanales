// CONFIG — pega aquí el link del Google Sheet publicado como CSV
// (Archivo → Compartir → Publicar en la web → hoja → CSV).
// Disposición de la hoja: columnas B a I (2 a 9) = clientes 1 a 8.
//   Fila 1, columna A  → fecha de la semana
//   Filas 2 a 9        → platillos (celda vacía = no hay platillo). Columna A = categoría
//   Solo se usa el bloque de arriba; las semanas anteriores más abajo se ignoran.
window.CONFIG = {
  sheetCsvUrl: "https://docs.google.com/spreadsheets/d/1q1VOhceXykHhoXB0jKa0iS69VZScwcsRAcLXpkRCm4U/gviz/tq?tqx=out:csv&gid=717356759",  // vacío = datos de demostración
  clientCount: 8,
  // Nombres de los clientes. Si la celda de la fila 1 de la columna (B a I)
  // trae un nombre, tiene prioridad sobre esta lista.
  names: ["Cliente 1","Cliente 2","Cliente 3","Cliente 4","Cliente 5","Cliente 6","Cliente 7","Cliente 8"],
  firstRecipeRow: 2,
  lastRecipeRow: 9
};
