// CONFIG — pega aquí el link del Google Sheet publicado como CSV
// (Archivo → Compartir → Publicar en la web → hoja → CSV).
// Disposición de la hoja: columna N = cliente N (8 columnas).
//   Fila 1, columna 1  → fecha de la semana
//   Filas 2 a 9        → las recetas de cada cliente
window.CONFIG = {
  sheetCsvUrl: "https://docs.google.com/spreadsheets/d/1q1VOhceXykHhoXB0jKa0iS69VZScwcsRAcLXpkRCm4U/gviz/tq?tqx=out:csv&gid=717356759",  // vacío = datos de demostración
  clientCount: 8,
  // Nombres de los clientes. Si la celda de la fila 1 de la columna (2 a 8)
  // trae un nombre, tiene prioridad sobre esta lista.
  names: ["Cliente 1","Cliente 2","Cliente 3","Cliente 4","Cliente 5","Cliente 6","Cliente 7","Cliente 8"],
  firstRecipeRow: 2,
  lastRecipeRow: 9,
  dayLabels: ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo",""]  // etiqueta opcional por fila; vacío = solo número
};
