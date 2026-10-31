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

  function render(rows, inv, deliv) {
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
    document.title = "Menu - " + name;

    var items = [];
    for (var r = C.firstRecipeRow; r <= C.lastRecipeRow; r++) {
      if (/\d/.test(cell(r, 0)) || /chef\s*notes/i.test(cell(r, 0))) break;   // fecha ("Sept 28") = semana anterior; "Chef Notes" = fin del menú
      var v = cell(r, col);
      if (v && !/^n\/?a$/i.test(v)) items.push({ text: v, label: cell(r, 0) });
    }
    var sections = deliverySections(deliv || [], name);
    // Si la pestaña de entregas no trae platillos para este cliente, se usa su columna del menú principal
    if (sections && !sections.some(function (s) { return s.list.length; })) sections = null;
    if (sections) items = [].concat.apply([], sections.map(function (s) { return s.list; }));
    renderInvoice(inv || [], col);
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


  // Fecha escrita en la hoja ("10/13/26", "Oct 13", "October 13") -> "Oct 13"; "" si no se entiende
  function formatDue(v) {
    v = String(v || "").trim();
    if (!v) return "";
    var mons = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], mo, da;
    var s = /^(\d{1,2})\/(\d{1,2})(?:\/\d{2,4})?$/.exec(v);
    if (s) { mo = +s[1]; da = +s[2]; }
    else {
      var t = /^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:,?\s*\d{4})?$/.exec(v);
      var idx = t ? mons.map(function (x) { return x.toLowerCase(); }).indexOf(t[1].slice(0, 3).toLowerCase()) : -1;
      if (idx < 0) return v;   // texto libre ("On delivery"): se muestra tal cual
      mo = idx + 1; da = +t[2];
    }
    if (mo < 1 || mo > 12 || da < 1 || da > 31) return v;
    return mons[mo - 1] + " " + String(da).padStart(2, "0");
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

  // Clientes con entregas (pestañas "Freshly Delivered Clients", "Perfectly Portioned Clients"):
  // devuelve [{title, list}] por entrega, o null si el cliente no aparece en ninguna.
  function deliverySections(tabs, name) {
    if (!name) return null;
    var key = function (s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); };
    for (var t = 0; t < (tabs || []).length; t++) {
      var rows = tabs[t] || [];
      if (!rows.length) continue;
      var dc = -1;
      for (var c = 1; c <= (C.deliveryMaxCol || 3); c++) if (key(rows[0][c]) === key(name)) { dc = c; break; }
      if (dc < 0) continue;
      var secs = [], cur = null;
      for (var r = C.firstRecipeRow; r <= C.lastRecipeRow; r++) {
        var a = ((rows[r - 1] || [])[0] || "").trim();
        if (/\d/.test(a) || /chef\s*notes/i.test(a)) break;
        if (/deliver|entrega/i.test(a)) {
          var title = a.replace(/\s+/g, " ").toLowerCase();
          cur = { title: title.charAt(0).toUpperCase() + title.slice(1), list: [] }; secs.push(cur);
        }
        var v = ((rows[r - 1] || [])[dc] || "").trim();
        if (!v || /^n\/?a$/i.test(v)) continue;
        if (!cur) { cur = { title: "First delivery", list: [] }; secs.push(cur); }
        cur.list.push({ text: v, label: "" });
      }
      if (secs.length) return secs;
    }
    return null;
  }

  // Datos de pago del cliente de esta página (o los generales)
  function payList() {
    return (C.paymentsByColumn && C.paymentsByColumn[window.CLIENT_COL]) || C.payments || [];
  }

  // "$1.00" / "4.0" -> "1" / "4" (la celda de semana a veces tiene formato de moneda)
  function weekNum(v) { return String(v || "").trim().replace(/^\$/, "").replace(/\.0+$/, ""); }

  function money(v) { var n = parseFloat(String(v || "").replace(/[^0-9.\-]/g, "")); return isNaN(n) ? null : n; }
  function usd(n) { return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  function renderInvoice(inv, col) {
    var box = $("invoice");
    if (!box) return;
    var cell = function (r) { return ((inv[r - 1] || [])[col] || "").trim(); };
    var label = function (r) { return ((inv[r - 1] || [])[0] || "").trim(); };
    var key = function (r) { return label(r).toLowerCase().replace(/[^a-z]/g, ""); };
    var lines = [], wk = {}, svcWeek = "", invWeek = "", paidRow = false, paidVal = "", dueVal = "";
    // Encabezado de la factura: "Week of …" y "Week Number" (semana del servicio); si hay varias, vale la última
    for (var h = 1; h <= C.invoiceLastRow; h++) {
      if (/^weekof/.test(key(h))) invWeek = label(h).replace(/^week of\s*/i, "");
      if (key(h) === "weeknumber" && cell(h)) svcWeek = weekNum(cell(h));
    }
    for (var r = C.invoiceFirstRow; r <= C.invoiceLastRow; r++) {
      var k = key(r), v = cell(r);
      if (/^(amount)?paid(button|status|\?)?$/.test(k)) { paidRow = true; paidVal = v; continue; }
      if (/^(payment)?due(date)?$/.test(k)) { dueVal = v; continue; }
      if (k === "weeknumber" || /^weekof/.test(k)) continue;   // ya leídos arriba; no son montos
      if (!k || !v) continue;
      if (k === "groceryweeknumber" || k === "groceryweek") wk.grocery = weekNum(v);
      else if (k === "addonsweek" || k === "addons" || k === "addonsweeknumber") wk.addons = weekNum(v);
      else if (k === "servicefee") lines.push({ label: "Service fee", amt: money(v), week: svcWeek, note: (C.serviceNotes || {})[col] || "" });
      else if (k === "grocerycost") lines.push({ label: "Groceries", amt: money(v), wkKey: "grocery" });
      else if (k === "addonscost") lines.push({ label: "Add-ons", amt: money(v), wkKey: "addons" });
      else if (k !== "total" && money(v) !== null) lines.push({ label: label(r), amt: money(v) });
    }
    lines = lines.filter(function (l) { return l.amt !== null; });
    if (!lines.length) { box.hidden = true; return; }
    var total = lines.reduce(function (a, l) { return a + l.amt; }, 0);
    box.hidden = false;
    var paid = paidRow && !!paidVal && !/^(false|no|n|0|unpaid|-)$/i.test(paidVal);
    var due = formatDue(dueVal) || dueDate(invWeek);   // la fecha de la hoja manda; si no hay, el día antes de la semana
    $("invoice-week").textContent = invWeek ? "Week of " + invWeek : "";
    $("invoice-due").textContent = paid ? "Payment received" : (due ? (/^(payment\s+)?due/i.test(due) ? due : "Payment due " + due) : "");
    $("invoice-title").textContent = paid ? "Amount paid" : "Amount due";
    $("total-label").textContent = paid ? "Total paid" : "Total";
    if ($("paybox")) $("paybox").hidden = paid;
    $("invoice-lines").innerHTML = lines.map(function (l) {
      var w = l.week || (l.wkKey && wk[l.wkKey]) || "";
      return '<li><span class="dish">' + esc(l.label) + (w ? ' <span class="day">Week ' + esc(w) + '</span>' : "") + (l.note ? '<span class="svc-note">' + esc(l.note) + '</span>' : "") + '</span><span class="amt">' + usd(l.amt) + '</span></li>';
    }).join("");
    $("invoice-total").textContent = usd(total);
    window.__invoice = { name: $("client").textContent, week: invWeek, due: due, paid: paid, total: total,
      lines: lines.map(function (l) { return { label: l.label, note: l.note || "", week: l.week || (l.wkKey && wk[l.wkKey]) || "", amt: l.amt }; }) };
    renderPayments();
  }


  function renderPayments() {
    var ul = $("pay-list");
    if (!ul || ul.children.length) return;
    ul.innerHTML = (payList() || []).map(function (p, i) {
      return '<li><span class="pay-name">' + esc(p.name) + '</span><span class="pay-handle">' + esc(p.handle) +
        '</span><button type="button" class="copy" data-i="' + i + '">Copy</button></li>';
    }).join("");
    ul.addEventListener("click", function (e) {
      var b = e.target.closest(".copy"); if (!b) return;
      var txt = payList()[+b.dataset.i].handle;
      var done = function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, done); else done();
    });
  }

  function downloadPdf() {
    var inv = window.__invoice, btn = $("download-pdf");
    if (!inv || !window.jspdf || !window.html2canvas) { window.print(); return; }
    var label = btn.textContent; btn.disabled = true; btn.textContent = "Preparing PDF…";
    var pay = payList() || [];
    var sheet = document.createElement("div");
    sheet.className = "pdf-sheet";
    sheet.innerHTML =
      '<section class="hero"><p class="brand">Patricia Ysabella</p><div class="hero-text">' +
      '<p class="eyebrow">' + (inv.week ? "Week of " + esc(inv.week) : "Invoice") + '</p><h1>' + esc(inv.name) + '</h1></div></section>' +
      '<div class="paper"><h2>' + (inv.paid ? "Receipt" : "Invoice") + '<span class="dot">.</span></h2>' + (inv.paid ? '<p class="due">Payment received</p>' : inv.due ? '<p class="due">Payment due ' + esc(inv.due) + '</p>' : "") + '<ul class="menu bill">' +
      inv.lines.map(function (l) {
        return '<li><span class="dish">' + esc(l.label) + (l.week ? ' <span class="day">Week ' + esc(l.week) + '</span>' : "") +
          (l.note ? '<span class="svc-note">' + esc(l.note) + '</span>' : "") +
          '</span><span class="amt">' + usd(l.amt) + '</span></li>';
      }).join("") + '</ul><p class="total"><span>' + (inv.paid ? "Total paid" : "Total") + '</span><strong>' + usd(inv.total) + '</strong></p>' +
      (inv.paid ? "" : '<div class="paybox"><p class="paybox-title">How to pay</p><ul class="pay">' +
      pay.map(function (p) { return '<li><span class="pay-name">' + esc(p.name) + '</span><span class="pay-handle">' + esc(p.handle) + '</span></li>'; }).join("") +
      '</ul><p class="paybox-note">Please include your name and the week in the payment note.</p></div>') + '</div>';
    document.body.appendChild(sheet);
    var safe = function (s) { return String(s).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, ""); };
    var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    fonts.then(function () { return window.html2canvas(sheet, { scale: 2, backgroundColor: "#fef4e2", useCORS: true, windowWidth: 816 }); })
      .then(function (canvas) {
        var W = 612, H = Math.max(792, W * canvas.height / canvas.width);
        var doc = new window.jspdf.jsPDF({ unit: "pt", format: [W, H], orientation: "portrait" });
        doc.setFillColor(254, 244, 226); doc.rect(0, 0, W, H, "F");
        doc.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, W, W * canvas.height / canvas.width);
        doc.save((inv.paid ? "Receipt-" : "Invoice-") + safe(inv.name) + (inv.week ? "-" + safe(inv.week) : "") + ".pdf");
      })
      .catch(function () { window.print(); })
      .then(function () { sheet.remove(); btn.disabled = false; btn.textContent = label; });
  }
  document.addEventListener("click", function (e) { if (e.target.closest("#download-pdf")) downloadPdf(); });

  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  window.MenuLib = { parseCSV: parseCSV, renderInvoice: renderInvoice };
  if (!$("menu")) return;
  if (!C.sheetCsvUrl) { render(DEMO, []); return; }
  var bust = function (u) { return u + (u.indexOf("?") > -1 ? "&" : "?") + "t=" + Date.now(); };
  var get = function (u) {
    return fetch(bust(u), { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(parseCSV);
  };
  var soft = function (u) { return u ? get(u).catch(function () { return []; }) : []; };
  Promise.all([get(C.sheetCsvUrl), soft(C.invoicesCsvUrl), Promise.all((C.deliveryCsvUrls || []).map(soft))])
    .then(function (d) { render(d[0], d[1], d[2]); })
    .catch(function () {
      $("menu").innerHTML = '<li class="loading">Couldn\u2019t load the menu. Please try again in a few minutes.</li>';
    });
})();
