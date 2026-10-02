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

  function render(rows, inv, reheat, deliv) {
    var n = window.CLIENT_COL || (C.tokens.indexOf(new URLSearchParams(location.search).get("m")) + 1);
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
      if (/\d/.test(cell(r, 0))) break;   // la columna A con fecha ("Sept 28") = empieza la semana anterior
      var v = cell(r, col);
      if (v && !/^n\/?a$/i.test(v)) items.push({ text: v, label: cell(r, 0) });
    }
    var sections = deliverySections(deliv || [], name);
    if (sections) items = [].concat.apply([], sections.map(function (s) { return s.list; }));
    renderInvoice(inv || [], col);
    renderReheating(items, reheat || []);
    var row = function (it, n) {
      return '<li><span class="num">' + String(n).padStart(2, "0") + '</span>' +
        '<span class="dish">' + esc(it.text) + '</span>' +
        (it.label ? '<span class="day">' + esc(it.label) + '</span>' : "") + '</li>';
    };
    var html;
    if (!items.length) html = '<li class="loading">This week’s menu isn’t ready yet.</li>';
    else if (sections) {
      html = sections.map(function (s) {
        return s.list.length ? '<li class="group">' + esc(s.title) + '</li>' + s.list.map(function (it, i) { return row(it, i + 1); }).join("") : "";
      }).join("");
    } else html = items.map(function (it, i) { return row(it, i + 1); }).join("");
    $("menu").innerHTML = html;
  }


  // Fecha límite de pago = el día antes de que empiece la semana ("October 5" -> "Oct 04")
  function dueDate(weekStr) {
    if (!weekStr) return "";
    var now = new Date(), d = new Date(weekStr + " " + now.getFullYear() + " 12:00");
    if (isNaN(d)) return "";
    if (now - d > 150 * 864e5) d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    return d.toLocaleString("en-US", { month: "short" }) + " " + String(d.getDate()).padStart(2, "0");
  }

  // Normaliza un nombre de receta para compararlo: sin número inicial, sin signos, "&" = "and"
  function norm(s) {
    return String(s || "").toLowerCase().replace(/^\s*\d+\s+/, "").replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ").trim();
  }

  function renderReheating(items, rows) {
    var box = $("reheat-dishes");
    if (!box) return;
    var recipes = [];
    rows.forEach(function (r, i) {
      var name = norm(r[0]), how = (r[1] || "").trim();
      if (i === 0 || !name || !how) return;
      recipes.push({ key: name, how: how });
    });
    var seen = {}, out = [];
    items.forEach(function (it) {
      var k = norm(it.text);
      if (!k || seen[k]) return;
      var hit = recipes.filter(function (r) { return r.key === k; })[0] ||
        recipes.filter(function (r) { return r.key.length >= 12 && (k.indexOf(r.key) === 0 || r.key.indexOf(k) === 0); })[0];
      if (!hit) return;
      seen[k] = 1;
      out.push({ dish: it.text.replace(/^\s*\d+\s+/, ""), how: hit.how });
    });
    if (!out.length) { box.hidden = true; return; }
    box.hidden = false;
    $("reheat-list").innerHTML = out.map(function (o) {
      return '<li><span class="r-dish">' + esc(o.dish) + '</span><span class="r-how">' + esc(o.how) + '</span></li>';
    }).join("");
  }

  // Clientes de la pestaña "Freshly Delivered Clients": devuelve [{title, list}] por entrega, o null si el cliente no está.
  function deliverySections(rows, name) {
    if (!rows.length || !name) return null;
    var key = function (s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); };
    var dc = -1;
    for (var c = 1; c <= (C.deliveryMaxCol || 3); c++) if (key(rows[0][c]) === key(name)) { dc = c; break; }
    if (dc < 0) return null;
    var secs = [], cur = null;
    for (var r = C.firstRecipeRow; r <= C.lastRecipeRow; r++) {
      var a = ((rows[r - 1] || [])[0] || "").trim();
      if (/\d/.test(a)) break;
      if (/deliver|entrega/i.test(a)) { cur = { title: /second|segunda|2/i.test(a) ? "Second delivery" : "First delivery", list: [] }; secs.push(cur); }
      var v = ((rows[r - 1] || [])[dc] || "").trim();
      if (!v || /^n\/?a$/i.test(v)) continue;
      if (!cur) { cur = { title: "First delivery", list: [] }; secs.push(cur); }
      cur.list.push({ text: v, label: "" });
    }
    return secs.length ? secs : null;
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
    var due = dueDate(invWeek);
    $("invoice-week").textContent = invWeek ? "Week of " + invWeek : "";
    $("invoice-due").textContent = due ? "Payment due " + due : "";
    $("invoice-lines").innerHTML = lines.map(function (l) {
      var w = l.week || (l.wkKey && wk[l.wkKey]) || "";
      return '<li><span class="dish">' + esc(l.label) + (w ? ' <span class="day">Week ' + esc(w) + '</span>' : "") + '</span><span class="amt">' + usd(l.amt) + '</span></li>';
    }).join("");
    $("invoice-total").textContent = usd(total);
    window.__invoice = { name: $("client").textContent, week: invWeek, due: due, total: total,
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
    var inv = window.__invoice, btn = $("download-pdf");
    if (!inv || !window.jspdf || !window.html2canvas) { window.print(); return; }
    var label = btn.textContent; btn.disabled = true; btn.textContent = "Preparing PDF…";
    var pay = C.payments || [];
    var sheet = document.createElement("div");
    sheet.className = "pdf-sheet";
    sheet.innerHTML =
      '<section class="hero"><p class="brand">Patricia Ysabella</p><div class="hero-text">' +
      '<p class="eyebrow">' + (inv.week ? "Week of " + esc(inv.week) : "Invoice") + '</p><h1>' + esc(inv.name) + '</h1></div></section>' +
      '<div class="paper"><h2>Invoice<span class="dot">.</span></h2>' + (inv.due ? '<p class="due">Payment due ' + esc(inv.due) + '</p>' : "") + '<ul class="menu bill">' +
      inv.lines.map(function (l) {
        return '<li><span class="dish">' + esc(l.label) + (l.week ? ' <span class="day">Week ' + esc(l.week) + '</span>' : "") +
          '</span><span class="amt">' + usd(l.amt) + '</span></li>';
      }).join("") + '</ul><p class="total"><span>Total</span><strong>' + usd(inv.total) + '</strong></p>' +
      '<div class="paybox"><p class="paybox-title">How to pay</p><ul class="pay">' +
      pay.map(function (p) { return '<li><span class="pay-name">' + esc(p.name) + '</span><span class="pay-handle">' + esc(p.handle) + '</span></li>'; }).join("") +
      '</ul><p class="paybox-note">Please include your name and the week in the payment note.</p></div></div>';
    document.body.appendChild(sheet);
    var safe = function (s) { return String(s).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, ""); };
    var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    fonts.then(function () { return window.html2canvas(sheet, { scale: 2, backgroundColor: "#fef4e2", useCORS: true, windowWidth: 816 }); })
      .then(function (canvas) {
        var W = 612, H = Math.max(792, W * canvas.height / canvas.width);
        var doc = new window.jspdf.jsPDF({ unit: "pt", format: [W, H], orientation: "portrait" });
        doc.setFillColor(254, 244, 226); doc.rect(0, 0, W, H, "F");
        doc.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, W, W * canvas.height / canvas.width);
        doc.save("Invoice-" + safe(inv.name) + (inv.week ? "-" + safe(inv.week) : "") + ".pdf");
      })
      .catch(function () { window.print(); })
      .then(function () { sheet.remove(); btn.disabled = false; btn.textContent = label; });
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
  var soft = function (u) { return u ? get(u).catch(function () { return []; }) : []; };
  Promise.all([get(C.sheetCsvUrl), soft(C.invoicesCsvUrl), soft(C.reheatingCsvUrl), soft(C.deliveryCsvUrl)])
    .then(function (d) { render(d[0], d[1], d[2], d[3]); })
    .catch(function () {
      $("menu").innerHTML = '<li class="loading">Couldn\u2019t load the menu. Please try again in a few minutes.</li>';
    });
})();
