#!/usr/bin/env python3
"""Genera una página por cliente: /<nombre>/index.html (columna fija del Sheet).
Uso: python3 make_pages.py   — editar CLIENTS si cambia la lista."""
import os
# (carpeta, columna del Sheet: 1 = B, 2 = C, ...)
CLIENTS = [("mia", 1), ("senia-sean", 2), ("brittany", 3), ("tanya", 4),
           ("julian", 5), ("aksana", 6), ("luiza", 7)]
src = open("index.html", encoding="utf-8").read()
for slug, col in CLIENTS:
    page = src.replace('href="css/', 'href="../css/').replace('src="js/', 'src="../js/')
    page = page.replace('<script src="../js/config.js"></script>',
        f'<script>window.CLIENT_COL = {col};</script>\n<script src="../js/config.js"></script>')
    os.makedirs(slug, exist_ok=True)
    open(f"{slug}/index.html", "w", encoding="utf-8").write(page)
    print("ok", slug)
