#!/usr/bin/env python3
"""Genera una página por cliente: /<carpeta>/index.html (columna fija del Sheet)
más su imagen de vista previa (WhatsApp / iMessage): assets/og/<carpeta>.png
Uso: python3 make_pages.py   — editar CLIENTS si cambia la lista."""
import os, html
from PIL import Image, ImageDraw, ImageFont

BASE = "https://patriciaysuarez.github.io/menus-semanales"
# (carpeta, nombre visible, columna del Sheet: 1 = B, 2 = C, ...)
CLIENTS = [("mia", "Mia", 1), ("senia-sean", "Senia & Sean", 2), ("brittany", "Brittany", 3),
           ("tanya", "Tanya", 4), ("julian", "Julian", 5), ("aksana", "Aksana", 6), ("luiza", "Luiza", 7)]
LIME, CREAM = (200, 214, 85), (254, 244, 226)

def og_image(slug, name):
    img = Image.new("RGB", (1200, 630), LIME)
    d = ImageDraw.Draw(img)
    reg = lambda s: ImageFont.truetype("assets/InstrumentSerif-Regular.ttf", s)
    ita = lambda s: ImageFont.truetype("assets/InstrumentSerif-Italic.ttf", s)
    def center(text, font, y):
        w = d.textlength(text, font=font)
        d.text(((1200 - w) / 2, y), text, font=font, fill=CREAM)
    d.text((70, 56), "Patricia Ysabella", font=reg(40), fill=CREAM)
    size = 180
    while d.textlength(name, font=reg(size)) > 1040: size -= 6
    center("Menu", ita(84), 150)
    center(name, reg(size), 255)
    os.makedirs("assets/og", exist_ok=True)
    img.save(f"assets/og/{slug}.png", optimize=True)

src = open("index.html", encoding="utf-8").read()
for slug, name, col in CLIENTS:
    og_image(slug, name)
    title = html.escape(f"Menu - {name}")
    url = f"{BASE}/{slug}/"
    meta = (f'<meta property="og:type" content="website">\n'
            f'<meta property="og:site_name" content="Patricia Ysabella">\n'
            f'<meta property="og:title" content="{title}">\n'
            f'<meta property="og:description" content="Weekly menu">\n'
            f'<meta property="og:url" content="{url}">\n'
            f'<meta property="og:image" content="{BASE}/assets/og/{slug}.png">\n'
            f'<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n'
            f'<meta name="twitter:card" content="summary_large_image">\n'
            f'<meta name="twitter:title" content="{title}">\n'
            f'<meta name="twitter:image" content="{BASE}/assets/og/{slug}.png">\n')
    page = src.replace('href="css/', 'href="../css/').replace('src="js/', 'src="../js/')
    page = page.replace('<title>Menu</title>', f'<title>{title}</title>\n{meta}'.rstrip("\n"))
    page = page.replace('<script src="../js/config.js"></script>',
        f'<script>window.CLIENT_COL = {col};</script>\n<script src="../js/config.js"></script>')
    os.makedirs(slug, exist_ok=True)
    open(f"{slug}/index.html", "w", encoding="utf-8").write(page)
    print("ok", slug)

# Página raíz (por si alguien comparte un link viejo ?m=...): vista previa genérica
og_image("default", "Menu")
root = open("index.html", encoding="utf-8").read()
if "og:title" not in root:
    meta = (f'<meta property="og:type" content="website">\n<meta property="og:site_name" content="Patricia Ysabella">\n'
            f'<meta property="og:title" content="Menu">\n<meta property="og:description" content="Weekly menu">\n'
            f'<meta property="og:image" content="{BASE}/assets/og/default.png">\n<meta name="twitter:card" content="summary_large_image">\n')
    root = root.replace("<title>Menu</title>", "<title>Menu</title>\n" + meta.rstrip("\n"))
    open("index.html", "w", encoding="utf-8").write(root)
