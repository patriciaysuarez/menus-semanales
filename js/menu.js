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

  function render(rows, inv) {
    var n = C.tokens.indexOf(new URLSearchParams(location.search).get("m")) + 1;
    if (n < 1) {
      $("client").textContent = "Invalid link";
      $("menu").innerHTML = '<li class="loading">Ask your chef for your menu link.</li>';
      return;
    }
    var col = n;  // cliente N = columna N+1 (B a I); la columna A trae la fecha
    var cell = function (r, c) { return ((rows[r - 1] || [])[c] || "").trim(); };

    var date = cell(1, 0);
    var name = cell(1, col) || C.names[n - 1] || "Cliente " + n;

    $("week").textContent = date ? "Week of " + date : "Menu";
    $("client").textContent = name;
    document.title = name + " — Menu";

    var items = [];
    for (var r = C.firstRecipeRow; r <= C.lastRecipeRow; r++) {
      var v = cell(r, col);
      if (v && !/^n\/?a$/i.test(v)) items.push({ i: r - C.firstRecipeRow, text: v, label: cell(r, 0) });
    }
    renderInvoice(inv || [], col);
    $("menu").innerHTML = items.length ? items.map(function (it, idx) {
      var label = it.label;
      return '<li><span class="num">' + String(idx + 1).padStart(2, "0") + '</span>' +
        '<span class="dish">' + esc(it.text) + '</span>' +
        (label ? '<span class="day">' + esc(label) + '</span>' : "") + '</li>';
    }).join("") : '<li class="loading">This week’s menu isn’t ready yet.</li>';
  }


  function money(v) { var n = parseFloat(String(v || "").replace(/[^0-9.\-]/g, "")); return isNaN(n) ? null : n; }
  function usd(n) { return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  function renderInvoice(inv, col) {
    var box = $("invoice");
    if (!box) return;
    var cell = function (r) { return ((inv[r - 1] || [])[col] || "").trim(); };
    var label = function (r) { return ((inv[r - 1] || [])[0] || "").trim(); };
    var key = function (r) { return label(r).toLowerCase().replace(/[^a-z]/g, ""); };
    var lines = [], wk = {}, svcWeek = "", invWeek = "";
    // Encabezado de la factura: "Week of …" y "Week Number" (semana del servicio) arriba de la fila 7
    for (var h = 1; h < C.invoiceFirstRow; h++) {
      if (/^weekof/.test(key(h))) invWeek = label(h).replace(/^week of\s*/i, "");
      if (key(h) === "weeknumber" && cell(h)) svcWeek = cell(h);
    }
    for (var r = C.invoiceFirstRow; r <= C.invoiceLastRow; r++) {
      var k = key(r), v = cell(r);
      if (!k || !v) continue;
      if (k === "groceryweeknumber" || k === "groceryweek") wk.grocery = v;
      else if (k === "addonsweek" || k === "addons" || k === "addonsweeknumber") wk.addons = v;
      else if (k === "servicefee") lines.push({ label: "Service fee", amt: money(v), week: svcWeek });
      else if (k === "grocerycost") lines.push({ label: "Groceries", amt: money(v), wkKey: "grocery" });
      else if (k === "addonscost") lines.push({ label: "Add-ons", amt: money(v), wkKey: "addons" });
      else if (k !== "total" && money(v) !== null) lines.push({ label: label(r), amt: money(v) });
    }
    lines = lines.filter(function (l) { return l.amt !== null; });
    if (!lines.length) { box.hidden = true; return; }
    var total = lines.reduce(function (a, l) { return a + l.amt; }, 0);
    box.hidden = false;
    $("invoice-week").textContent = invWeek ? "Week of " + invWeek : "";
    $("invoice-lines").innerHTML = lines.map(function (l) {
      var w = l.week || (l.wkKey && wk[l.wkKey]) || "";
      return '<li><span class="dish">' + esc(l.label) + (w ? ' <span class="day">Week ' + esc(w) + '</span>' : "") + '</span><span class="amt">' + usd(l.amt) + '</span></li>';
    }).join("");
    $("invoice-total").textContent = usd(total);
    window.__invoice = { name: $("client").textContent, week: invWeek, total: total,
      lines: lines.map(function (l) { return { label: l.label, week: l.week || (l.wkKey && wk[l.wkKey]) || "", amt: l.amt }; }) };
    renderPayments();
  }


  function renderPayments() {
    var ul = $("pay-list");
    if (!ul || ul.children.length) return;
    ul.innerHTML = (C.payments || []).map(function (p, i) {
      return '<li><span class="pay-name">' + esc(p.name) + '</span><span class="pay-handle">' + esc(p.handle) +
        '</span><button type="button" class="copy" data-i="' + i + '">Copy</button></li>';
    }).join("");
    ul.addEventListener("click", function (e) {
      var b = e.target.closest(".copy"); if (!b) return;
      var txt = C.payments[+b.dataset.i].handle;
      var done = function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, done); else done();
    });
  }

  function downloadPdf() {
    var inv = window.__invoice;
    if (!inv || !window.jspdf) { window.print(); return; }
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "letter" });
    var W = doc.internal.pageSize.getWidth(), M = 56, y;
    doc.setFillColor(200, 214, 85); doc.rect(0, 0, W, 150, "F");
    doc.setTextColor(254, 244, 226);
    doc.setFont("times", "normal"); doc.setFontSize(13); doc.text("Patricia Ysabella", M, 52);
    doc.setFont("times", "italic"); doc.setFontSize(15); doc.text(inv.week ? "Week of " + inv.week : "Invoice", M, 100);
    doc.setFont("times", "normal"); doc.setFontSize(34); doc.text(inv.name, M, 134);
    doc.setTextColor(73, 90, 24);
    doc.setFont("times", "normal"); doc.setFontSize(26); doc.text("Invoice", M, 205);
    doc.setDrawColor(73, 90, 24); doc.setLineWidth(1); doc.line(M, 222, W - M, 222);
    y = 252;
    inv.lines.forEach(function (l) {
      doc.setFont("times", "normal"); doc.setFontSize(14); doc.setTextColor(73, 90, 24);
      doc.text(l.label, M, y);
      if (l.week) { doc.setFontSize(10); doc.setTextColor(120, 135, 70); doc.text("WEEK " + l.week, M + 150, y); }
      doc.setFontSize(14); doc.setTextColor(73, 90, 24); doc.text(usd(l.amt), W - M, y, { align: "right" });
      doc.setDrawColor(210, 205, 185); doc.setLineWidth(.5); doc.line(M, y + 12, W - M, y + 12);
      y += 34;
    });
    y += 10;
    doc.setFont("times", "normal"); doc.setFontSize(18); doc.setTextColor(73, 90, 24); doc.text("Total", M, y);
    doc.setFontSize(26); doc.setTextColor(233, 36, 36); doc.text(usd(inv.total), W - M, y + 2, { align: "right" });
    y += 56;
    doc.setFillColor(254, 244, 226); doc.setDrawColor(73, 90, 24); doc.setLineWidth(.8);
    var pay = C.payments || [], bh = 52 + pay.length * 22;
    doc.rect(M, y, W - 2 * M, bh, "FD");
    doc.setFont("times", "italic"); doc.setFontSize(12); doc.setTextColor(233, 36, 36); doc.text("How to pay", M + 16, y + 26);
    doc.setFont("times", "normal"); doc.setFontSize(13); doc.setTextColor(73, 90, 24);
    pay.forEach(function (p, i) { doc.text(p.name + ":  " + p.handle, M + 16, y + 50 + i * 22); });
    var safe = function (s) { return String(s).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, ""); };
    doc.save("Invoice-" + safe(inv.name) + (inv.week ? "-" + safe(inv.week) : "") + ".pdf");
  }
  document.addEventListener("click", function (e) { if (e.target.closest("#download-pdf")) downloadPdf(); });

  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  window.MenuLib = { parseCSV: parseCSV };
  if (!$("menu")) return;
  if (!C.sheetCsvUrl) { render(DEMO, []); return; }
  var bust = function (u) { return u + (u.indexOf("?") > -1 ? "&" : "?") + "t=" + Date.now(); };
  var get = function (u) {
    return fetch(bust(u), { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(parseCSV);
  };
  Promise.all([get(C.sheetCsvUrl), C.invoicesCsvUrl ? get(C.invoicesCsvUrl).catch(function () { return []; }) : []])
    .then(function (d) { render(d[0], d[1]); })
    .catch(function () {
      $("menu").innerHTML = '<li class="loading">Couldn\u2019t load the menu. Please try again in a few minutes.</li>';
    });
})();
