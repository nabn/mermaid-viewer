# /// script
# dependencies = ["fonttools[woff]"]
# ///
"""uv run scripts/build-fonts.py /path/to/MapleTight

Convert the user's tightened regular and bold fonts to WOFF2 without subsetting.
Rename the distributed derivative to respect Maple Mono's Reserved Font Name.
"""
from pathlib import Path
import sys
from fontTools.ttLib import TTFont

source = Path(sys.argv[1])
output = Path(__file__).resolve().parent.parent / "src" / "fonts"
output.mkdir(parents=True, exist_ok=True)
for weight in ("Regular", "Bold"):
    font = TTFont(source / f"MapleMonoNormal-NFTight-{weight}.ttf")
    names = {
        1: "Tight Mono", 2: weight, 3: f"TightMono-{weight}-1.0",
        4: f"Tight Mono {weight}", 6: f"TightMono-{weight}",
        16: "Tight Mono", 17: weight,
    }
    for record in font["name"].names:
        if record.nameID in names:
            record.string = names[record.nameID]
    font.flavor = "woff2"
    destination = output / f"tight-mono-{weight.lower()}.woff2"
    font.save(destination)
    print(f"{destination.name}: {destination.stat().st_size:,} bytes")
