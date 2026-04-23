#!/usr/bin/env python3
"""Parse PDF24 OCR .txt output into curriculum-pages JSON.

Expects page markers of the form '@@@ N @@@' between pages.

Usage:
  python parse-ocr-text.py <txt> <out.json> --label <str> [--start N --end M]
                          [--figures-manifest path] [--pdf-path /abs/to.pdf]
"""
import re, json, argparse, sys
from pathlib import Path

PAGE_MARKER = re.compile(r'^@@@\s*(\d+)\s*@@@\s*$')

# Lines we always drop: indd filenames, pure-ASCII junk, ISBN, timestamps
JUNK_PATTERNS = [
    re.compile(r'\.indd\s', re.I),
    re.compile(r'^\s*\d{1,2}/\d{1,2}/\d{4}\s+\d{1,2}:\d{2}', re.I),  # dates
    re.compile(r'^\s*ISBN[-:\s]', re.I),
    re.compile(r'^\s*MTH\d+_\w+_\w+', re.I),
    re.compile(r'^\s*FO\d+_', re.I),
    re.compile(r'^\s*Qatar\s+Math[_\s]', re.I),
]

# Quick heuristic: line with math symbols likely contains formula
FORMULA_HINTS = re.compile(r'[×÷√∑∫≤≥≠≈±∞πθ]|[0-9]+\s*[+\-×÷*/]\s*[0-9]+|\^[0-9]|[a-z]\s*[+\-]\s*[a-z]')

def clean_line(ln: str) -> str | None:
    s = ln.rstrip()
    if not s.strip():
        return ""  # preserve blank
    for pat in JUNK_PATTERNS:
        if pat.search(s):
            return None
    # drop pure-Latin noise that's just 2-3 tokens (likely header fragment)
    if re.fullmatch(r'[A-Za-z0-9_\-\.\s]{3,30}', s) and not re.search(r'[\u0600-\u06FF]', s):
        return None
    return s

def load_figures_manifest(path: str | None):
    """Return dict {page_number: [{path, width, height, ...}]} from manifest.json files."""
    if not path:
        return {}
    p = Path(path)
    if p.is_file():
        data = json.loads(p.read_text(encoding='utf-8'))
        return {page["page_number"]: page["figures"] for page in data.get("pages", [])}
    # directory: merge all manifest.json inside
    merged = {}
    for m in p.rglob("manifest.json"):
        data = json.loads(m.read_text(encoding='utf-8'))
        for page in data.get("pages", []):
            merged.setdefault(page["page_number"], []).extend(page["figures"])
    return merged

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("txt")
    ap.add_argument("out")
    ap.add_argument("--label", required=True)
    ap.add_argument("--pdf-path", default="")
    ap.add_argument("--start", type=int, default=None)
    ap.add_argument("--end", type=int, default=None)
    ap.add_argument("--figures-manifest", default="")
    ap.add_argument("--ocr-model", default="pdf24-tesseract")
    ap.add_argument("--ocr-dpi", type=int, default=300)
    args = ap.parse_args()

    text = Path(args.txt).read_text(encoding='utf-8', errors='replace')
    lines = text.splitlines()

    # split by marker
    pages_raw: dict[int, list[str]] = {}
    current: int | None = None
    for ln in lines:
        m = PAGE_MARKER.match(ln)
        if m:
            current = int(m.group(1))
            pages_raw.setdefault(current, [])
        elif current is not None:
            pages_raw[current].append(ln)

    figures_by_page = load_figures_manifest(args.figures_manifest)

    page_nums = sorted(pages_raw.keys())
    if args.start is not None:
        page_nums = [n for n in page_nums if n >= args.start]
    if args.end is not None:
        page_nums = [n for n in page_nums if n <= args.end]

    pages_out = []
    for n in page_nums:
        raw = pages_raw[n]
        cleaned = []
        for ln in raw:
            c = clean_line(ln)
            if c is None:
                continue
            cleaned.append(c)
        # collapse 3+ blank lines to 1
        content = "\n".join(cleaned)
        content = re.sub(r'\n{3,}', '\n\n', content).strip()

        formulas = []
        for ln in cleaned:
            if ln.strip() and FORMULA_HINTS.search(ln):
                formulas.append(ln.strip())

        pages_out.append({
            "page_number": n,
            "content_ar": content,
            "formulas_latex": formulas,
            "figures": figures_by_page.get(n, []),
        })

    actual_start = page_nums[0] if page_nums else 0
    actual_end = page_nums[-1] if page_nums else 0

    out = {
        "source_pdf": args.pdf_path or args.txt,
        "label": args.label,
        "page_start": actual_start,
        "page_end": actual_end,
        "model": args.ocr_model,
        "dpi": args.ocr_dpi,
        "pages": pages_out,
    }
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')

    total_chars = sum(len(p["content_ar"]) for p in pages_out)
    total_figs = sum(len(p["figures"]) for p in pages_out)
    total_forms = sum(len(p["formulas_latex"]) for p in pages_out)
    print(f"Saved {args.out}")
    print(f"  pages: {len(pages_out)} (p{actual_start}..p{actual_end})")
    print(f"  chars: {total_chars:,}")
    print(f"  figures attached: {total_figs}")
    print(f"  formula-hint lines: {total_forms}")

if __name__ == "__main__":
    main()
