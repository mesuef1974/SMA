# SMA — Backlog

> مصدر الحقيقة الموحَّد للبنود غير المكتملة. محدَّث: 2026-04-20 (تحديث 2).
> كل بند: الرقم / العنوان / الأولوية / القسم / الحالة / المرجع.

## P0 — حرج (6)

### BL-001 — Advisor Review Workflow UI
- **الأولوية:** P0
- **القسم:** Engineering + UX
- **الحالة:** ✅ MVP مكتمل 2026-04-19 (DEC-SMA-046)
- **المرجع:** DEC-SMA-037 / Content Policy v2 §5
- **تعريف الإنجاز:** صفحة + API + زر اعتماد/رفض + سايدبار

### BL-002 — Migration: rejected_gate enum
- **الأولوية:** P0 | Engineering | ✅ مكتمل 2026-04-19 (DEC-SMA-045)
- **المرجع:** `route.ts:193` — DEC-SMA-034
- **DoD:** migration SQL + status صريح بدل draft

### BL-003 — قاعدة QNCF-G11-M الحقيقية
- P0 | Research + Engineering | لم يبدأ
- المرجع: DEC-SMA-031
- DoD: كتالوج codes + `isKnownQncfCode()` حقيقي

### BL-004 — تعميم القوالب على بقية دروس الوحدة 5 والوحدات الأخرى
- P0 | Content + Engineering | لم يبدأ
- المرجع: KR2.1 | DEC-SMA-041
- DoD: 14 درساً على الأقل بنفس مستوى 5-1

### BL-005 — OCR كامل 229 صفحة دليل المعلم
- P0 | AI | ✅ مكتمل 2026-04-20 — كامل الفصل الثاني (15 درس × TE+SE = 30 مصدر، 378 صفحة، ~998 صورة)
- المرجع: DEC-SMA-025 | DEC-SMA-049 | DEC-SMA-052 | KR3.1
- DoD: JSON مُهيكل لكل درس ✓

### BL-006 — إلغاء qatarContextSchema enum
- P0 | Engineering | ✅ مكتمل 2026-04-19 (DEC-SMA-044)
- المرجع: DEC-SMA-041 ↔ schema.ts:53-66

## P1 — مهم (7)

### BL-007 — Dual-period sequential generation
- P1 | Engineering | لم يبدأ | DEC-SMA-035
- DoD: Period 2 يستقبل summary من Period 1

### BL-008 — SplitScreen + OutcomeCheck + boxplot في GuidedDrawing
- P1 | Engineering + UX | لم يبدأ | Wave 3
- DoD: 3 أنماط شرائح إضافية

### BL-009 — Dry Run أول مع معلم الشحانية
- P1 | Operations + CEO | لم يبدأ | KR1.4
- DoD: جلسة موثَّقة + feedback form

### BL-010 — Customer Discovery ≥3 معلمين
- P1 | Operations | لم يبدأ | KR4.3
- DoD: 3 مقابلات منظَّمة + نتائج

### BL-011 — CI gate على Content Policy fidelity
- P1 | Engineering + QA | لم يبدأ
- DoD: فحص آلي يرفض plan لا يذكر teacher_guide_page صحيح

### BL-012 — توثيق قاعدة QNCF الفرعية
- P1 | Documentation | لم يبدأ
- DoD: QNCF-SPEC.md في Azkia/projects/sma/

### BL-013 — تنظيف git status (docs/lessons/4.5 + PDFs untracked)
- P1 | DevOps | لم يبدأ
- DoD: إما commit أو gitignore مناسب

## P2 — لاحقاً (5)

### BL-014 — TTS عربي Azure Speech Neural
- P2 | AI + Engineering | لم يبدأ | DEC-SMA-038

### BL-015 — Color-blind Okabe-Ito palette
- P2 | UX | لم يبدأ | DEC-SMA-039

### BL-016 — Classroom tools sidebar (Timer + fair picker + attendance)
- P2 | Engineering + UX | لم يبدأ | DEC-SMA-040

### BL-017 — HSTS header
- P2 | Security | لم يبدأ

### BL-018 — Enrichment Mode
- P2 | Engineering | مُجمَّد (Content Policy v2 §8)

---

## بنود جديدة (2026-04-20)

### BL-019 — التحقق End-to-End من Wave 3A — توليد period=2 فعلي
- **الأولوية:** P0 | Engineering + QA | ✅ مكتمل 2026-04-20 — سكريبت scripts/test-wave3a.ts يمرّر 6/6 assertions (4 مصادر محمّلة + timing per-period + OCR حقيقي)
- **المرجع:** DEC-SMA-048 | DEC-SMA-050
- **DoD:** خطة حصة 2 محفوظة بـ `status=draft` و `gate_results.bloom_gate=pass` عبر الـ 3-layer source injection + Gate 2.5 traceability

### BL-020 — تعميق OCR + figures UI integration
- **الأولوية:** P1 | Engineering + UX | لم يبدأ
- **المرجع:** KR3.1 | DEC-SMA-049
- **DoD:** عرض 99 صورة وحدة 5 في prepare/present views

### BL-021 — Backfill بيانات الدروس: pageStartTe/pageEndTe على كل الدروس في DB
- **الأولوية:** P1 | Engineering + Content | ✅ مكتمل 2026-04-20 — 15/15 درس عبر scripts/backfill-lesson-pages.ts
- **المرجع:** F1 من QA Wave 3A
- **DoD:** استعلام `SELECT COUNT(*) FROM lessons WHERE page_start_te IS NULL OR page_end_te IS NULL` يُرجع 0 ✓

### BL-022 — توحيد مسار الرفض: unit_mismatch يُحفظ بـ status=rejected_gate بدل 502
- **الأولوية:** P2 | Engineering | لم يبدأ
- **المرجع:** F2 من QA Wave 3A، DEC-SMA-045
- **DoD:** route.ts:199-207 يستخدم createLessonPlan بـ rejected_gate

### BL-023 — تسجيل warn عند فشل parsing lesson.number suffix
- **الأولوية:** P2 | Engineering | لم يبدأ
- **المرجع:** F3 من QA Wave 3A
- **DoD:** console.warn عند !Number.isFinite(lessonNumSuffix) في route.ts:114-117

### BL-024 — تعميم القوالب على دروس الوحدتين 3 و 4 (10 دروس)
- **الأولوية:** P1 | Content + Engineering | لم يبدأ
- **المرجع:** KR2.1 | DEC-SMA-052 (OCR جاهز)
- **DoD:** 10 templates بنفس مستوى قالب 5-1 (100% fidelity لـ SE/TE)

### BL-025 — OCR لفصلي 1+2 (الوحدات 1+2) لتغطية كامل المنهج خارج MVP
- **الأولوية:** P2 | AI | مؤجَّل (خارج scope DEC-SMA-011)
- **المرجع:** DEC-SMA-011 (MVP = الفصل الثاني فقط) | DEC-SMA-049
- **DoD:** ~50 صفحة إضافية JSON مُهيكلة + ingested

---

## إحصاء سريع
- P0: 5 (2 لم يبدأ BL-003/BL-004) — (5 مكتملة: BL-001/BL-002/BL-005/BL-006/BL-019) — **النشط = 2**
- P1: 10 (9 لم يبدأ — BL-007..BL-013 + BL-020 + BL-024، 1 مكتمل BL-021)
- P2: 8 (كلها لم يبدأ — BL-014..BL-018 + BL-022 + BL-023 + BL-025)
- **المجموع النشط:** 19 بنداً (+ 6 مكتملة = 25 إجمالي تاريخياً)
