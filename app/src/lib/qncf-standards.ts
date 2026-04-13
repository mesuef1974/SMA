/**
 * Qatar National Curriculum Framework (QNCF) reference standards
 * for Grade 11 Literary Track — Mathematics.
 *
 * Standard code format: MA.11.L.<domain>.<standard>
 *   MA     = Mathematics
 *   11     = Grade 11
 *   L      = Literary track
 *   domain = Domain number (1-5)
 *   standard = Standard number within domain
 */

export interface QNCFStandard {
  /** Standard code, e.g. "MA.11.L.1.1" */
  code: string;
  /** Arabic domain name */
  domain: string;
  /** English domain name */
  domainEn: string;
  /** Arabic description of the standard */
  description: string;
  /** English description of the standard */
  descriptionEn: string;
}

/**
 * Full list of QNCF standards for Qatar Grade 11 Literary Mathematics.
 * Covers five domains: Algebra & Functions, Trigonometric Functions,
 * Sequences & Series, Statistics & Probability, and Analytic Geometry.
 */
export const QNCF_GRADE_11_LITERARY: QNCFStandard[] = [
  // ─── Domain 1: الجبر والدوال (Algebra & Functions) ─────────────────────
  {
    code: 'MA.11.L.1.1',
    domain: 'الجبر والدوال',
    domainEn: 'Algebra & Functions',
    description: 'يتعرّف على مفهوم الدالة ويحدّد مجالها ومداها',
    descriptionEn: 'Recognize the concept of a function and determine its domain and range',
  },
  {
    code: 'MA.11.L.1.2',
    domain: 'الجبر والدوال',
    domainEn: 'Algebra & Functions',
    description: 'يميّز بين أنواع الدوال (خطية، تربيعية، كثيرات الحدود)',
    descriptionEn: 'Distinguish between types of functions (linear, quadratic, polynomial)',
  },
  {
    code: 'MA.11.L.1.3',
    domain: 'الجبر والدوال',
    domainEn: 'Algebra & Functions',
    description: 'يجري العمليات على الدوال (الجمع، الطرح، الضرب، القسمة، التركيب)',
    descriptionEn: 'Perform operations on functions (addition, subtraction, multiplication, division, composition)',
  },
  {
    code: 'MA.11.L.1.4',
    domain: 'الجبر والدوال',
    domainEn: 'Algebra & Functions',
    description: 'يحدّد الدالة العكسية ويوجدها إن أمكن',
    descriptionEn: 'Identify and find the inverse of a function when it exists',
  },

  // ─── Domain 2: الدوال المثلثية (Trigonometric Functions) ───────────────
  {
    code: 'MA.11.L.2.1',
    domain: 'الدوال المثلثية',
    domainEn: 'Trigonometric Functions',
    description: 'يتعرّف على وحدة القياس بالتقدير الدائري (الراديان) ويحوّل بينها وبين الدرجات',
    descriptionEn: 'Understand radian measure and convert between radians and degrees',
  },
  {
    code: 'MA.11.L.2.2',
    domain: 'الدوال المثلثية',
    domainEn: 'Trigonometric Functions',
    description: 'يعرّف الدوال المثلثية الأساسية (جيب، جيب تمام، ظل) ويمثّلها بيانيًّا',
    descriptionEn: 'Define and graph the basic trigonometric functions (sine, cosine, tangent)',
  },
  {
    code: 'MA.11.L.2.3',
    domain: 'الدوال المثلثية',
    domainEn: 'Trigonometric Functions',
    description: 'يطبّق المتطابقات المثلثية الأساسية في التبسيط والإثبات',
    descriptionEn: 'Apply fundamental trigonometric identities for simplification and proof',
  },
  {
    code: 'MA.11.L.2.4',
    domain: 'الدوال المثلثية',
    domainEn: 'Trigonometric Functions',
    description: 'يحلّ المعادلات المثلثية البسيطة',
    descriptionEn: 'Solve basic trigonometric equations',
  },

  // ─── Domain 3: المتتاليات والمتسلسلات (Sequences & Series) ────────────
  {
    code: 'MA.11.L.3.1',
    domain: 'المتتاليات والمتسلسلات',
    domainEn: 'Sequences & Series',
    description: 'يتعرّف على المتتالية الحسابية ويجد حدّها العام ومجموعها',
    descriptionEn: 'Recognize arithmetic sequences and find their general term and sum',
  },
  {
    code: 'MA.11.L.3.2',
    domain: 'المتتاليات والمتسلسلات',
    domainEn: 'Sequences & Series',
    description: 'يتعرّف على المتتالية الهندسية ويجد حدّها العام ومجموعها',
    descriptionEn: 'Recognize geometric sequences and find their general term and sum',
  },
  {
    code: 'MA.11.L.3.3',
    domain: 'المتتاليات والمتسلسلات',
    domainEn: 'Sequences & Series',
    description: 'يحلّ مسائل تطبيقية على المتتاليات والمتسلسلات الحسابية والهندسية',
    descriptionEn: 'Solve applied problems involving arithmetic and geometric sequences and series',
  },
  {
    code: 'MA.11.L.3.4',
    domain: 'المتتاليات والمتسلسلات',
    domainEn: 'Sequences & Series',
    description: 'يستنتج مجموع متسلسلة هندسية لا نهائية متقاربة',
    descriptionEn: 'Derive the sum of a convergent infinite geometric series',
  },

  // ─── Domain 4: الإحصاء والاحتمالات (Statistics & Probability) ─────────
  {
    code: 'MA.11.L.4.1',
    domain: 'الإحصاء والاحتمالات',
    domainEn: 'Statistics & Probability',
    description: 'يحسب مقاييس النزعة المركزية (المتوسط، الوسيط، المنوال) ومقاييس التشتت',
    descriptionEn: 'Calculate measures of central tendency (mean, median, mode) and measures of dispersion',
  },
  {
    code: 'MA.11.L.4.2',
    domain: 'الإحصاء والاحتمالات',
    domainEn: 'Statistics & Probability',
    description: 'يمثّل البيانات بيانيًّا ويفسّر التمثيلات الإحصائية',
    descriptionEn: 'Represent data graphically and interpret statistical representations',
  },
  {
    code: 'MA.11.L.4.3',
    domain: 'الإحصاء والاحتمالات',
    domainEn: 'Statistics & Probability',
    description: 'يطبّق قواعد الاحتمالات (الاحتمال الشرطي، الأحداث المستقلة)',
    descriptionEn: 'Apply probability rules (conditional probability, independent events)',
  },
  {
    code: 'MA.11.L.4.4',
    domain: 'الإحصاء والاحتمالات',
    domainEn: 'Statistics & Probability',
    description: 'يستخدم التباديل والتوافيق في حساب الاحتمالات',
    descriptionEn: 'Use permutations and combinations in calculating probabilities',
  },

  // ─── Domain 5: الهندسة التحليلية (Analytic Geometry) ──────────────────
  {
    code: 'MA.11.L.5.1',
    domain: 'الهندسة التحليلية',
    domainEn: 'Analytic Geometry',
    description: 'يجد المسافة بين نقطتين وإحداثيات منتصف قطعة مستقيمة',
    descriptionEn: 'Find the distance between two points and the midpoint of a line segment',
  },
  {
    code: 'MA.11.L.5.2',
    domain: 'الهندسة التحليلية',
    domainEn: 'Analytic Geometry',
    description: 'يكتب معادلة المستقيم بصيغ مختلفة ويحدّد ميله',
    descriptionEn: 'Write the equation of a line in various forms and determine its slope',
  },
  {
    code: 'MA.11.L.5.3',
    domain: 'الهندسة التحليلية',
    domainEn: 'Analytic Geometry',
    description: 'يكتب معادلة الدائرة ويحدّد مركزها ونصف قطرها',
    descriptionEn: 'Write the equation of a circle and determine its center and radius',
  },
  {
    code: 'MA.11.L.5.4',
    domain: 'الهندسة التحليلية',
    domainEn: 'Analytic Geometry',
    description: 'يحلّ مسائل هندسية باستخدام الإحداثيات',
    descriptionEn: 'Solve geometric problems using coordinates',
  },
];

/**
 * Returns the set of unique QNCF domains for Grade 11 Literary Math.
 */
export function getQNCFDomains(): { domain: string; domainEn: string }[] {
  const seen = new Set<string>();
  const domains: { domain: string; domainEn: string }[] = [];

  for (const standard of QNCF_GRADE_11_LITERARY) {
    if (!seen.has(standard.domain)) {
      seen.add(standard.domain);
      domains.push({ domain: standard.domain, domainEn: standard.domainEn });
    }
  }

  return domains;
}

/**
 * Looks up a QNCF standard by code. Returns undefined if not found.
 */
export function findQNCFStandard(code: string): QNCFStandard | undefined {
  return QNCF_GRADE_11_LITERARY.find((s) => s.code === code);
}

/**
 * Builds a formatted Arabic reference string listing all QNCF standards.
 * Used in AI prompts to provide context for mapping.
 */
export function buildQNCFPromptReference(): string {
  return QNCF_GRADE_11_LITERARY.map(
    (s) => `${s.code} — ${s.domain}: ${s.description}`
  ).join('\n');
}
