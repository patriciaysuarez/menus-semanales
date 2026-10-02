(function () {
  var C = window.CONFIG;
  var $ = function (id) { return document.getElementById(id); };

  // CSV parser (comillas, comas y saltos de línea dentro de celdas)
  function parseCSV(text) {
    var rows = [], row = [], cell = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += ch;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  var DEMO = [
    ["1 de octubre de 2026","Ana","Bea","Carlos","Dani","Elena","Fer","Gabi"],
    ["Arepas de pabellón","Bowl de quinoa","Pollo al limón","Lasaña de vegetales","Sopa de lentejas","Tacos de pescado","Pasta al pesto"],
    ["Ensalada de garbanzos","Salmón al horno","Risotto de hongos","Curry de coco","Arroz con pollo","Ceviche","Berenjenas rellenas"],
    ["Crema de auyama","Tortilla española","Ratatouille","Pollo teriyaki","Pisca andina","Tostadas de palta","Shakshuka"],
    ["Pescado a la plancha","Falafel con tahini","Wok de vegetales","Chili vegetariano","Ají de gallina","Fajitas","Gnocchi"],
    ["Pasta primavera","Pollo asado","Tacos de coliflor","Pad thai","Asado negro","Burrito bowl","Sopa miso"],
    ["Lentejas guisadas","Ensalada niçoise","Pizza integral","Hamburguesa casera","Mondongo","Quesadillas","Moussaka"],
    ["Pollo en salsa","Pasta al limón","Ramen casero","Pastel de papa","Sancocho","Enchiladas","Paella"],
    ["Pan de jamón","Tarta de espinacas","Brunch dominical","Pescado frito","Hallacas","Arepas","Tortilla"]
  ];

  function render(rows) {
    var n = parseInt(new URLSearchParams(location.search).get("c"), 10);
    if (!(n >= 1 && n <= C.clientCount)) {
      $("client").textContent = "Enlace no válido";
      $("menu").innerHTML = '<li class="loading">Pide a tu chef el enlace de tu menú.</li>';
      return;
    }
    var col = n;  // cliente N = columna N+1 (B a I); la columna A trae la fecha
    var cell = function (r, c) { return ((rows[r - 1] || [])[c] || "").trim(); };

    var date = cell(1, 0);
    var name = cell(1, col) || C.names[n - 1] || "Cliente " + n;

    $("week").textContent = date ? "Semana del " + date : "Menú de la semana";
    $("client").textContent = name;
    document.title = name + " — Menú de la semana";

    var items = [];
    for (var r = C.firstRecipeRow; r <= C.lastRecipeRow; r++) {
      var v = cell(r, col);
      if (v) items.push({ i: r - C.firstRecipeRow, text: v });
    }
    $("menu").innerHTML = items.length ? items.map(function (it) {
      var label = (C.dayLabels && C.dayLabels[it.i]) || "";
      return '<li><span class="num">' + String(it.i + 1).padStart(2, "0") + '</span>' +
        '<span class="dish">' + esc(it.text) + '</span>' +
        (label ? '<span class="day">' + esc(label) + '</span>' : "") + '</li>';
    }).join("") : '<li class="loading">El menú de esta semana aún no está listo.</li>';
    $("updated").textContent = "Actualizado " + new Date().toLocaleString("es", { dateStyle: "medium", timeStyle: "short" });
  }

  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  if (!C.sheetCsvUrl) { render(DEMO); return; }
  var sep = C.sheetCsvUrl.indexOf("?") > -1 ? "&" : "?";
  fetch(C.sheetCsvUrl + sep + "t=" + Date.now(), { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(function (t) { render(parseCSV(t)); })
    .catch(function () {
      $("menu").innerHTML = '<li class="loading">No se pudo cargar el menú. Intenta de nuevo en unos minutos.</li>';
    });
})();
