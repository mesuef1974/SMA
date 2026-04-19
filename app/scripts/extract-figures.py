#!/usr/bin/env python3
"""Extract embedded images and full-page PNGs from PDF pages.

Usage:
  python extract-figures.py <pdf> <out_dir> <start> <end> [--dpi 200] [--prefix te]
"""
import sys, argparse, json
from pathlib import Path
import fitz  # PyMuPDF

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("out_dir")
    ap.add_argument("start", type=int)
    ap.add_argument("end", type=int)
    ap.add_argument("--dpi", type=int, default=200)
    ap.add_argument("--prefix", default="te")
    ap.add_argument("--min-width", type=int, default=150, help="skip images narrower than this (glyphs)")
    ap.add_argument("--min-height", type=int, default=150)
    ap.add_argument("--min-bytes", type=int, default=3000)
    args = ap.parse_args()

    out_base = Path(args.out_dir)
    out_base.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(args.pdf)
    manifest = []

    for p in range(args.start - 1, args.end):
        page = doc[p]
        page_num = p + 1
        page_dir = out_base / f"p{page_num:03d}"
        page_dir.mkdir(exist_ok=True)

        # 1. Full page screenshot
        pix = page.get_pixmap(dpi=args.dpi)
        page_png = page_dir / "page.png"
        pix.save(str(page_png))

        # 2. Embedded images
        figures = []
        images = page.get_images(full=True)
        skipped = 0
        kept = 0
        for i, img in enumerate(images, 1):
            xref = img[0]
            try:
                base = doc.extract_image(xref)
                w, h = base.get("width", 0), base.get("height", 0)
                data = base["image"]
                if w < args.min_width or h < args.min_height or len(data) < args.min_bytes:
                    skipped += 1
                    continue
                kept += 1
                ext = base.get("ext", "png")
                fig_path = page_dir / f"fig{kept:02d}.{ext}"
                fig_path.write_bytes(data)
                figures.append({
                    "index": kept,
                    "path": str(fig_path.relative_to(out_base.parent)).replace("\\", "/"),
                    "width": w, "height": h, "ext": ext, "bytes": len(data),
                })
            except Exception as e:
                figures.append({"index": i, "error": str(e)})

        manifest.append({
            "page_number": page_num,
            "page_png": str(page_png.relative_to(out_base.parent)).replace("\\", "/"),
            "figures": figures,
            "figure_count": len([f for f in figures if "error" not in f]),
        })
        print(f"  p{page_num}: kept {kept}, skipped {skipped} tiny glyphs", flush=True)

    manifest_path = out_base / "manifest.json"
    manifest_path.write_text(json.dumps({
        "source_pdf": args.pdf,
        "prefix": args.prefix,
        "page_start": args.start,
        "page_end": args.end,
        "dpi": args.dpi,
        "pages": manifest,
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    total_figs = sum(p["figure_count"] for p in manifest)
    print(f"\nDone: {args.end - args.start + 1} pages, {total_figs} figures extracted.")
    print(f"Manifest: {manifest_path}")

if __name__ == "__main__":
    main()
