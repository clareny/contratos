"""Regenera js/logos.js y js/fuentes.js (ejecutar si cambias los logos o las fuentes)."""
import base64
from pathlib import Path

root = Path(__file__).resolve().parent.parent


def b64(path):
    return base64.b64encode(path.read_bytes()).decode()


logos = {"graykids": "logo-graykids.png", "clareny": "logo-clareny.png"}
lines = ["window.LOGOS = {"]
for key, name in logos.items():
    lines.append(f'  {key}: "data:image/png;base64,{b64(root / "assets" / name)}",')
lines.append("};")
(root / "js" / "logos.js").write_text("\n".join(lines) + "\n", encoding="utf-8")

fuentes = [
    ("tektur-latin.woff2", "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212, U+FEFF, U+FFFD"),
    ("tektur-latin-ext.woff2", "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F, U+20A0-20AB, U+20AD-20C0, U+2C60-2C7F, U+A720-A7FF"),
]
css = ""
for archivo, rango in fuentes:
    css += (
        "@font-face{font-family:'Tektur';font-style:normal;font-weight:400 900;font-display:swap;"
        f"src:url(data:font/woff2;base64,{b64(root / 'fonts' / archivo)}) format('woff2');unicode-range:{rango};}}"
    )
css_ui = (
    "@font-face{font-family:'Great Laker';font-display:swap;"
    f"src:url(data:font/woff;base64,{b64(root / 'fonts' / 'greatlaker.woff')}) format('woff');}}"
)
(root / "js" / "fuentes.js").write_text(
    f'window.FUENTES_CSS = "{css}";\nwindow.FUENTES_UI_CSS = "{css_ui}";\n', encoding="utf-8"
)
print("js/logos.js y js/fuentes.js actualizados")
