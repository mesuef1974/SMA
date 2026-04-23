#!/usr/bin/env bash
# Automated pipeline: extract figures + parse OCR + ingest for remaining unit 5 lessons (5-2..5-5).
# Assumes cwd = D:/SMA/app
set -uo pipefail

TE_PDF="D:/SMA/docs/MTH06_TE11_FND_QTR_AR_63971.pdf"
SE_PDF="D:/SMA/docs/Qatar Math_SE11_FND_V2_AR_09885.pdf"
TE_TXT="D:/SMA/docs/teach.txt"
SE_TXT="D:/SMA/docs/stu.txt"
FIG_BASE="D:/SMA/docs/figures"
PARSED="D:/SMA/docs/parsed"

mkdir -p "$FIG_BASE" "$PARSED"

# tuples: unit lesson te_start te_end se_start se_end title_ar
LESSONS=(
  "5 2 176 187 106 113 العمليات_على_كثيرات_الحدود"
  "5 3 188 197 114 120 قسمة_كثيرات_الحدود"
  "5 4 198 209 121 128 دوال_كثيرات_الحدود"
  "5 5 210 229 129 147 تحليل_كثيرات_الحدود"
)

STEP="${1:-all}"

for row in "${LESSONS[@]}"; do
  read -r U L TS TE SS SE TITLE <<< "$row"
  TAG="${U}-${L}"
  TITLE_AR="${TITLE//_/ }"
  echo "============================================================"
  echo "Lesson $TAG  TE:$TS-$TE  SE:$SS-$SE  -- $TITLE_AR"
  echo "============================================================"

  TE_FIG_DIR="$FIG_BASE/te-$TAG"
  SE_FIG_DIR="$FIG_BASE/se-$TAG"

  if [[ "$STEP" == "all" || "$STEP" == "figures" ]]; then
    echo "-- extract figures TE"
    python scripts/extract-figures.py "$TE_PDF" "$TE_FIG_DIR" "$TS" "$TE" --prefix "te-$TAG" --min-width 150 --min-height 150 --min-bytes 3000 2>&1 | tail -5
    echo "-- extract figures SE"
    python scripts/extract-figures.py "$SE_PDF" "$SE_FIG_DIR" "$SS" "$SE" --prefix "se-$TAG" --min-width 150 --min-height 150 --min-bytes 3000 2>&1 | tail -5
  fi

  if [[ "$STEP" == "all" || "$STEP" == "parse" ]]; then
    echo "-- parse TE OCR"
    python scripts/parse-ocr-text.py "$TE_TXT" "$PARSED/te-$TAG.json" \
      --label "$TITLE_AR — دليل المعلم" \
      --pdf-path "$TE_PDF" \
      --start "$TS" --end "$TE" \
      --figures-manifest "$TE_FIG_DIR/manifest.json" 2>&1 | tail -6
    echo "-- parse SE OCR"
    python scripts/parse-ocr-text.py "$SE_TXT" "$PARSED/se-$TAG.json" \
      --label "$TITLE_AR — كتاب الطالب" \
      --pdf-path "$SE_PDF" \
      --start "$SS" --end "$SE" \
      --figures-manifest "$SE_FIG_DIR/manifest.json" 2>&1 | tail -6
  fi

  if [[ "$STEP" == "all" || "$STEP" == "ingest" ]]; then
    echo "-- ingest TE"
    npx tsx scripts/ingest-curriculum-json.ts --file "$PARSED/te-$TAG.json" \
      --kind lesson_content --book TE --unit "$U" --lesson "$L" \
      --pdf-path "$TE_PDF" 2>&1 | tail -5
    echo "-- ingest SE"
    npx tsx scripts/ingest-curriculum-json.ts --file "$PARSED/se-$TAG.json" \
      --kind lesson_content --book SE --unit "$U" --lesson "$L" \
      --pdf-path "$SE_PDF" 2>&1 | tail -5
  fi
done

echo "All done."
