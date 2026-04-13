// ---------------------------------------------------------------------------
// Misconception Catalog — 18 documented common math errors
// Grade 11 Literary Track — State of Qatar
// ---------------------------------------------------------------------------

export interface MisconceptionExample {
  input: string;
  expected: string;
  explanation: string; // Arabic
}

export interface MisconceptionEntry {
  code: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  category:
    | 'algebra'
    | 'functions'
    | 'trigonometry'
    | 'sequences'
    | 'statistics'
    | 'geometry';
  severity: 'low' | 'medium' | 'high';
  examples: MisconceptionExample[];
  remediationHintAr: string;
  remediationHintEn: string;
  relatedTopics: string[];
  detectionPatterns: string[];
}

// ---------------------------------------------------------------------------
// Algebra (4)
// ---------------------------------------------------------------------------

const MC_ALG_001: MisconceptionEntry = {
  code: 'MC-ALG-001',
  name: 'Distribution error over addition (squaring binomials)',
  nameAr: 'خطأ توزيع الضرب على الجمع',
  description:
    'Student squares a binomial by squaring each term individually, omitting the cross-product term. e.g. (a+b)^2 = a^2 + b^2 instead of a^2 + 2ab + b^2.',
  descriptionAr:
    'يقوم الطالب بتربيع ذات الحدين عن طريق تربيع كل حد على حدة، متجاهلاً حد الضرب التبادلي. مثلاً: (أ+ب)² = أ²+ب² بدلاً من أ²+2أب+ب².',
  category: 'algebra',
  severity: 'high',
  examples: [
    {
      input: '(x+3)^2 = x^2 + 9',
      expected: '(x+3)^2 = x^2 + 6x + 9',
      explanation:
        'الطالب نسي الحد الأوسط 2×x×3 = 6x عند تربيع ذات الحدين.',
    },
    {
      input: '(a-b)^2 = a^2 - b^2',
      expected: '(a-b)^2 = a^2 - 2ab + b^2',
      explanation:
        'الطالب خلط بين مربع الفرق وفرق المربعين. (أ-ب)² ≠ أ²-ب².',
    },
    {
      input: '(2x+1)^2 = 4x^2 + 1',
      expected: '(2x+1)^2 = 4x^2 + 4x + 1',
      explanation:
        'الطالب أهمل الحد الأوسط 2×2x×1 = 4x.',
    },
  ],
  remediationHintAr:
    'راجع قاعدة مربع المجموع: (أ+ب)² = أ² + 2أب + ب². استخدم المربعات الهندسية (نموذج المساحة) لتوضيح سبب وجود الحد الأوسط.',
  remediationHintEn:
    'Review the binomial square formula: (a+b)^2 = a^2 + 2ab + b^2. Use area model (geometric squares) to visualize why the middle term exists.',
  relatedTopics: ['المتطابقات الجبرية', 'كثيرات الحدود', 'التحليل'],
  detectionPatterns: [
    '\\(.*\\+.*\\)\\s*[²\\^2]\\s*=\\s*[^+]*\\+[^+]*$',
    '\\(.*\\-.*\\)\\s*[²\\^2]\\s*=\\s*[^-]*\\-[^-]*$',
    'a\\^2\\s*\\+\\s*b\\^2',
  ],
};

const MC_ALG_002: MisconceptionEntry = {
  code: 'MC-ALG-002',
  name: 'Exponent law error (product of powers)',
  nameAr: 'خطأ في قوانين الأسس',
  description:
    'Student multiplies exponents instead of adding them when multiplying powers with the same base. e.g. a^m * a^n = a^(m*n) instead of a^(m+n).',
  descriptionAr:
    'يقوم الطالب بضرب الأسس بدلاً من جمعها عند ضرب قوى لها نفس الأساس. مثلاً: a^m × a^n = a^(m×n) بدلاً من a^(m+n).',
  category: 'algebra',
  severity: 'high',
  examples: [
    {
      input: 'x^2 * x^3 = x^6',
      expected: 'x^2 * x^3 = x^5',
      explanation:
        'عند ضرب قوى لها نفس الأساس نجمع الأسس: 2+3=5 وليس نضربها: 2×3=6.',
    },
    {
      input: '2^3 * 2^4 = 2^12',
      expected: '2^3 * 2^4 = 2^7',
      explanation:
        'الطالب ضرب الأسس 3×4=12 بدلاً من جمعها 3+4=7.',
    },
    {
      input: 'a^5 / a^2 = a^(5/2)',
      expected: 'a^5 / a^2 = a^3',
      explanation:
        'عند قسمة قوى لها نفس الأساس نطرح الأسس: 5-2=3 وليس نقسمها.',
    },
  ],
  remediationHintAr:
    'راجع قوانين الأسس الأساسية: a^m × a^n = a^(m+n) و a^m ÷ a^n = a^(m-n). استخدم أمثلة عددية بسيطة للتحقق: 2² × 2³ = 4 × 8 = 32 = 2⁵.',
  remediationHintEn:
    'Review basic exponent laws: a^m * a^n = a^(m+n) and a^m / a^n = a^(m-n). Use simple numerical examples to verify: 2^2 * 2^3 = 4 * 8 = 32 = 2^5.',
  relatedTopics: ['الأسس والجذور', 'قوانين الأسس', 'تبسيط التعابير'],
  detectionPatterns: [
    'a\\^?m\\s*[×\\*]\\s*a\\^?n\\s*=\\s*a\\^?\\(?m\\s*[×\\*]\\s*n',
    'x\\^(\\d+)\\s*[×\\*]\\s*x\\^(\\d+)\\s*=\\s*x\\^(\\d+)',
  ],
};

const MC_ALG_003: MisconceptionEntry = {
  code: 'MC-ALG-003',
  name: 'Incorrect algebraic fraction simplification',
  nameAr: 'خطأ تبسيط الكسور الجبرية',
  description:
    'Student cancels individual terms in the numerator and denominator instead of common factors. e.g. (x+3)/(x+5) = 3/5 by canceling x.',
  descriptionAr:
    'يقوم الطالب بحذف حدود فردية من البسط والمقام بدلاً من حذف العوامل المشتركة. مثلاً: (س+3)/(س+5) = 3/5 بحذف س.',
  category: 'algebra',
  severity: 'high',
  examples: [
    {
      input: '(x+3)/(x+5) = 3/5',
      expected: '(x+3)/(x+5) لا يمكن تبسيطها أكثر',
      explanation:
        'لا يمكن حذف x من البسط والمقام لأنها حد وليست عاملاً مشتركاً. الحذف يتم فقط للعوامل المشتركة.',
    },
    {
      input: '(x^2 + x) / x = x^2',
      expected: '(x^2 + x) / x = x + 1',
      explanation:
        'يجب تحليل البسط أولاً: x(x+1)/x = x+1، وليس حذف x من الحد الأول فقط.',
    },
    {
      input: '(2x + 4) / 2 = x + 4',
      expected: '(2x + 4) / 2 = x + 2',
      explanation:
        'يجب قسمة كل حد في البسط على 2: (2x)/2 + 4/2 = x + 2.',
    },
  ],
  remediationHintAr:
    'ذكّر الطالب أنه لا يمكن حذف إلا العوامل المشتركة (وليس الحدود). يجب تحليل البسط والمقام أولاً ثم اختصار العوامل المشتركة.',
  remediationHintEn:
    'Remind the student that only common factors (not individual terms) can be cancelled. Factor numerator and denominator first, then cancel common factors.',
  relatedTopics: ['الكسور الجبرية', 'التحليل', 'تبسيط التعابير الجبرية'],
  detectionPatterns: [
    '\\(.*x.*\\+.*\\)\\s*/\\s*\\(.*x.*\\+.*\\)\\s*=\\s*\\d+\\s*/\\s*\\d+',
    'cancel.*term',
    'حذف.*حد',
  ],
};

const MC_ALG_004: MisconceptionEntry = {
  code: 'MC-ALG-004',
  name: 'Sign error when solving equations',
  nameAr: 'خطأ في حل المعادلات (خطأ الإشارة)',
  description:
    'Student forgets to flip the sign when moving a term to the other side of an equation.',
  descriptionAr:
    'ينسى الطالب تغيير الإشارة عند نقل حد من طرف إلى آخر في المعادلة.',
  category: 'algebra',
  severity: 'medium',
  examples: [
    {
      input: '2x + 5 = 11 => 2x = 11 + 5 = 16 => x = 8',
      expected: '2x + 5 = 11 => 2x = 11 - 5 = 6 => x = 3',
      explanation:
        'عند نقل +5 إلى الطرف الآخر تتغير إشارته إلى -5، فتصبح 2x = 11-5 = 6.',
    },
    {
      input: '3x - 4 = 8 => 3x = 8 - 4 = 4',
      expected: '3x - 4 = 8 => 3x = 8 + 4 = 12 => x = 4',
      explanation:
        'عند نقل -4 إلى الطرف الآخر تتغير إشارته إلى +4.',
    },
    {
      input: '-x = 5 => x = 5',
      expected: '-x = 5 => x = -5',
      explanation:
        'عند القسمة على -1 يجب تغيير الإشارة: x = -5.',
    },
  ],
  remediationHintAr:
    'عند نقل حد من طرف إلى آخر في المعادلة، تتغير إشارته دائماً (الجمع يصبح طرحاً والعكس). تحقق دائماً بالتعويض في المعادلة الأصلية.',
  remediationHintEn:
    'When moving a term to the other side of an equation, always flip its sign (+ becomes - and vice versa). Always verify by substituting back into the original equation.',
  relatedTopics: ['حل المعادلات الخطية', 'المعادلات من الدرجة الأولى'],
  detectionPatterns: [
    'نقل.*بدون.*تغيير.*إشارة',
    'move.*without.*sign',
    '=\\s*\\d+\\s*\\+\\s*\\d+',
  ],
};

// ---------------------------------------------------------------------------
// Functions (4)
// ---------------------------------------------------------------------------

const MC_FUN_001: MisconceptionEntry = {
  code: 'MC-FUN-001',
  name: 'Confusing function and equation',
  nameAr: 'خلط بين الدالة والمعادلة',
  description:
    'Student treats a function definition as an equation to solve, or confuses f(x) notation with multiplication.',
  descriptionAr:
    'يخلط الطالب بين مفهوم الدالة والمعادلة، فيعامل تعريف الدالة كمعادلة يجب حلها، أو يفسر f(x) كعملية ضرب f×x.',
  category: 'functions',
  severity: 'medium',
  examples: [
    {
      input: 'f(x) = 2x + 3، إذن f × x = 2x + 3',
      expected: 'f(x) تعني "قيمة الدالة f عند x" وليست ضرب f في x',
      explanation:
        'الطالب فسّر الأقواس في f(x) كعملية ضرب بدلاً من ترميز الدالة.',
    },
    {
      input: 'f(x) = x^2 + 1، أوجد x => x^2 + 1 = 0',
      expected: 'f(x) = x^2 + 1 هي تعريف للدالة وليست معادلة يجب حلها',
      explanation:
        'الطالب حاول حل تعريف الدالة كمعادلة بجعله يساوي صفراً.',
    },
    {
      input: 'f(2) = 2f',
      expected: 'f(2) = 2(2) + 3 = 7 (إذا كانت f(x)=2x+3)',
      explanation:
        'الطالب عامل f(2) كضرب بدلاً من التعويض بـ x=2 في الدالة.',
    },
  ],
  remediationHintAr:
    'وضّح أن f(x) هي ترميز يعني "قيمة الدالة f عند المدخل x". ليست عملية ضرب. الدالة هي علاقة تعطي لكل مدخل مخرجاً واحداً.',
  remediationHintEn:
    'Clarify that f(x) is notation meaning "the value of function f at input x". It is not multiplication. A function is a relation that assigns exactly one output to each input.',
  relatedTopics: ['مفهوم الدالة', 'ترميز الدوال', 'تمثيل الدوال'],
  detectionPatterns: [
    'f\\s*[×\\*]\\s*x',
    'f\\(x\\).*=.*0.*حل',
    'ضرب.*f.*x',
  ],
};

const MC_FUN_002: MisconceptionEntry = {
  code: 'MC-FUN-002',
  name: 'Domain and range identification error',
  nameAr: 'خطأ في تحديد المجال والمدى',
  description:
    'Student confuses domain (input values) with range (output values) or fails to identify restrictions on the domain.',
  descriptionAr:
    'يخلط الطالب بين المجال (قيم المدخلات) والمدى (قيم المخرجات)، أو يفشل في تحديد القيود على المجال مثل عدم القسمة على صفر أو الجذر التربيعي لعدد سالب.',
  category: 'functions',
  severity: 'medium',
  examples: [
    {
      input: 'f(x) = 1/x، المجال = ℝ',
      expected: 'f(x) = 1/x، المجال = ℝ - {0}',
      explanation:
        'الطالب لم يستثنِ القيمة x=0 التي تجعل المقام صفراً.',
    },
    {
      input: 'f(x) = √x، المجال = ℝ',
      expected: 'f(x) = √x، المجال = [0, +∞)',
      explanation:
        'لا يمكن حساب الجذر التربيعي لعدد سالب في الأعداد الحقيقية.',
    },
    {
      input: 'f(x) = x^2، المدى = ℝ',
      expected: 'f(x) = x^2، المدى = [0, +∞)',
      explanation:
        'مربع أي عدد حقيقي لا يمكن أن يكون سالباً، فالمدى يبدأ من صفر.',
    },
  ],
  remediationHintAr:
    'المجال هو مجموعة جميع قيم x المسموح بها (المدخلات). المدى هو مجموعة جميع قيم y الناتجة (المخرجات). تحقق دائماً من: القسمة على صفر، الجذر التربيعي لعدد سالب، اللوغاريتم لعدد غير موجب.',
  remediationHintEn:
    'Domain is the set of all allowed x-values (inputs). Range is the set of all resulting y-values (outputs). Always check for: division by zero, square root of negatives, logarithm of non-positive numbers.',
  relatedTopics: ['المجال والمدى', 'أنواع الدوال', 'تمثيل الدوال بيانياً'],
  detectionPatterns: [
    'المجال.*=.*ℝ\\s*$',
    'المدى.*=.*ℝ\\s*$',
    'domain.*=.*R\\b',
    'range.*=.*R\\b',
  ],
};

const MC_FUN_003: MisconceptionEntry = {
  code: 'MC-FUN-003',
  name: 'Function composition error',
  nameAr: 'خطأ في تركيب الدوال f(g(x))',
  description:
    'Student multiplies functions instead of composing them, or applies composition in the wrong order.',
  descriptionAr:
    'يقوم الطالب بضرب الدالتين بدلاً من تركيبهما، أو يطبّق التركيب بترتيب خاطئ (يخلط بين f∘g و g∘f).',
  category: 'functions',
  severity: 'medium',
  examples: [
    {
      input: 'f(x)=2x, g(x)=x+1 => f(g(x)) = 2x(x+1) = 2x^2+2x',
      expected: 'f(g(x)) = f(x+1) = 2(x+1) = 2x+2',
      explanation:
        'التركيب يعني التعويض وليس الضرب. f(g(x)) تعني تعويض g(x) مكان x في f.',
    },
    {
      input: 'f(g(x)) = g(f(x)) دائماً',
      expected: 'تركيب الدوال ليس تبديلياً عموماً: f(g(x)) ≠ g(f(x))',
      explanation:
        'ترتيب التركيب مهم. مثال: f(x)=x², g(x)=x+1. f(g(x))=(x+1)² لكن g(f(x))=x²+1.',
    },
    {
      input: 'f(x)=x^2, g(x)=x+3 => (f∘g)(2) = f(2)×g(2) = 4×5 = 20',
      expected: '(f∘g)(2) = f(g(2)) = f(5) = 25',
      explanation:
        'الطالب ضرب قيمتي الدالتين عند 2 بدلاً من تركيبهما: أولاً g(2)=5 ثم f(5)=25.',
    },
  ],
  remediationHintAr:
    'تركيب الدوال f∘g يعني f(g(x)): نحسب g(x) أولاً ثم نعوّض الناتج في f. ليس ضرباً! ابدأ من الدالة الداخلية (الأقرب لـ x) ثم اتجه للخارج.',
  remediationHintEn:
    'Function composition f∘g means f(g(x)): compute g(x) first, then substitute the result into f. It is NOT multiplication! Start from the innermost function and work outward.',
  relatedTopics: ['تركيب الدوال', 'العمليات على الدوال'],
  detectionPatterns: [
    'f\\(g\\(x\\)\\)\\s*=.*[×\\*]',
    'f∘g.*=.*f.*[×\\*].*g',
    'تركيب.*ضرب',
  ],
};

const MC_FUN_004: MisconceptionEntry = {
  code: 'MC-FUN-004',
  name: 'Inverse function error',
  nameAr: 'خطأ في إيجاد الدالة العكسية',
  description:
    'Student confuses the inverse function with the reciprocal (1/f(x)), or makes errors in the algebraic steps to find the inverse.',
  descriptionAr:
    'يخلط الطالب بين الدالة العكسية f⁻¹(x) ومقلوب الدالة 1/f(x)، أو يخطئ في الخطوات الجبرية لإيجاد الدالة العكسية.',
  category: 'functions',
  severity: 'medium',
  examples: [
    {
      input: 'f(x) = 2x+3 => f^(-1)(x) = 1/(2x+3)',
      expected: 'f^(-1)(x) = (x-3)/2',
      explanation:
        'f⁻¹(x) لا تعني 1/f(x). يجب تبديل x و y ثم حل بالنسبة لـ y.',
    },
    {
      input: 'f(x) = x^2 => f^(-1)(x) = x^(1/2) لجميع x',
      expected: 'f(x) = x^2 ليس لها دالة عكسية إلا إذا قيّدنا المجال (مثلاً x ≥ 0)',
      explanation:
        'الدالة التربيعية ليست متباينة (one-to-one) على ℝ كله، فلا تملك دالة عكسية بدون تقييد المجال.',
    },
    {
      input: 'f(x) = 3x-1، بتبديل x و y: x = 3y-1 => y = 3x-1',
      expected: 'x = 3y-1 => x+1 = 3y => y = (x+1)/3',
      explanation:
        'بعد التبديل يجب حل المعادلة بالنسبة لـ y، وليس إعادة كتابة نفس الصيغة.',
    },
  ],
  remediationHintAr:
    'لإيجاد الدالة العكسية: (1) اكتب y = f(x) (2) بدّل x و y (3) حل بالنسبة لـ y. تذكر أن f⁻¹ ≠ 1/f. تحقق: f(f⁻¹(x)) = x.',
  remediationHintEn:
    'To find the inverse: (1) write y = f(x) (2) swap x and y (3) solve for y. Remember f^(-1) is NOT 1/f. Verify: f(f^(-1)(x)) = x.',
  relatedTopics: ['الدالة العكسية', 'الدوال المتباينة'],
  detectionPatterns: [
    'f\\^?\\(-?1\\).*=.*1\\s*/\\s*f',
    'f⁻¹.*=.*1/f',
    'عكس.*مقلوب',
  ],
};

// ---------------------------------------------------------------------------
// Trigonometry (4)
// ---------------------------------------------------------------------------

const MC_TRG_001: MisconceptionEntry = {
  code: 'MC-TRG-001',
  name: 'Confusing degrees and radians',
  nameAr: 'خلط بين الدرجات والراديان',
  description:
    'Student mixes degree and radian measures, using one where the other is required.',
  descriptionAr:
    'يخلط الطالب بين قياس الزوايا بالدرجات والراديان، فيستخدم أحدهما مكان الآخر.',
  category: 'trigonometry',
  severity: 'medium',
  examples: [
    {
      input: 'sin(90) = 0.894 (حاسبة بالراديان)',
      expected: 'sin(90°) = 1 أو sin(π/2) = 1',
      explanation:
        'الطالب أدخل 90 في الحاسبة وهي مضبوطة على الراديان. 90 راديان ≠ 90 درجة.',
    },
    {
      input: 'π/2 = 1.57°',
      expected: 'π/2 راديان = 90°',
      explanation:
        'الطالب لم يحوّل بشكل صحيح. لتحويل من راديان إلى درجات: نضرب في 180/π.',
    },
    {
      input: '180° = 180 راديان',
      expected: '180° = π راديان ≈ 3.14 راديان',
      explanation:
        'الطالب لم يستخدم عامل التحويل. 180° = π راديان.',
    },
  ],
  remediationHintAr:
    'التحويل: الدرجات = الراديان × (180/π). الراديان = الدرجات × (π/180). تذكّر الزوايا الأساسية: 30°=π/6, 45°=π/4, 60°=π/3, 90°=π/2, 180°=π.',
  remediationHintEn:
    'Conversion: degrees = radians * (180/pi). radians = degrees * (pi/180). Memorize key angles: 30=pi/6, 45=pi/4, 60=pi/3, 90=pi/2, 180=pi.',
  relatedTopics: ['قياس الزوايا', 'التحويل بين الدرجات والراديان', 'الدائرة المثلثية'],
  detectionPatterns: [
    'sin\\s*\\(?90\\)?\\s*=\\s*0',
    'cos\\s*\\(?180\\)?\\s*=\\s*-?0',
    'π.*=.*°',
    '180\\s*=\\s*180\\s*راديان',
  ],
};

const MC_TRG_002: MisconceptionEntry = {
  code: 'MC-TRG-002',
  name: 'Special angle values error',
  nameAr: 'خطأ في قيم الزوايا الخاصة',
  description:
    'Student recalls incorrect values for trigonometric functions of special angles (30, 45, 60, 90 degrees).',
  descriptionAr:
    'يتذكر الطالب قيماً خاطئة للدوال المثلثية عند الزوايا الخاصة (30°, 45°, 60°, 90°).',
  category: 'trigonometry',
  severity: 'high',
  examples: [
    {
      input: 'sin(30°) = √3/2',
      expected: 'sin(30°) = 1/2',
      explanation:
        'الطالب خلط بين sin(30°) = 1/2 و sin(60°) = √3/2.',
    },
    {
      input: 'cos(45°) = 1/2',
      expected: 'cos(45°) = √2/2',
      explanation:
        'cos(45°) = √2/2 ≈ 0.707 وليس 1/2 = 0.5.',
    },
    {
      input: 'tan(60°) = 1',
      expected: 'tan(60°) = √3',
      explanation:
        'الطالب خلط مع tan(45°) = 1. قيمة tan(60°) = √3 ≈ 1.732.',
    },
  ],
  remediationHintAr:
    'احفظ جدول القيم الخاصة باستخدام المثلثين: مثلث 30-60-90 (أضلاعه 1, √3, 2) ومثلث 45-45-90 (أضلاعه 1, 1, √2). ارسمهما وتدرّب عليهما يومياً.',
  remediationHintEn:
    'Memorize special values using two triangles: 30-60-90 triangle (sides 1, sqrt(3), 2) and 45-45-90 triangle (sides 1, 1, sqrt(2)). Draw them and practice daily.',
  relatedTopics: ['الزوايا الخاصة', 'الدوال المثلثية', 'المثلث قائم الزاوية'],
  detectionPatterns: [
    'sin\\s*\\(?30\\)?\\s*=\\s*√?3',
    'cos\\s*\\(?60\\)?\\s*=\\s*√?3',
    'cos\\s*\\(?45\\)?\\s*=\\s*1/2',
    'tan\\s*\\(?60\\)?\\s*=\\s*1\\b',
    'sin\\s*\\(?60\\)?\\s*=\\s*1/2',
  ],
};

const MC_TRG_003: MisconceptionEntry = {
  code: 'MC-TRG-003',
  name: 'Trigonometric identity error',
  nameAr: 'خطأ في المتطابقات المثلثية',
  description:
    'Student misapplies trigonometric identities, such as treating sin(A+B) as sin(A)+sin(B).',
  descriptionAr:
    'يطبّق الطالب المتطابقات المثلثية بشكل خاطئ، مثل معاملة sin(A+B) = sin(A)+sin(B).',
  category: 'trigonometry',
  severity: 'high',
  examples: [
    {
      input: 'sin(A+B) = sin(A) + sin(B)',
      expected: 'sin(A+B) = sin(A)cos(B) + cos(A)sin(B)',
      explanation:
        'دالة الجيب ليست خطية. لا يمكن توزيعها على الجمع.',
    },
    {
      input: 'cos(2x) = 2cos(x)',
      expected: 'cos(2x) = 2cos²(x) - 1 أو cos²(x) - sin²(x) أو 1 - 2sin²(x)',
      explanation:
        'الطالب عامل cos كدالة خطية. صيغة الزاوية المضاعفة مختلفة تماماً.',
    },
    {
      input: 'sin²(x) + cos²(x) = 2',
      expected: 'sin²(x) + cos²(x) = 1',
      explanation:
        'هذه المتطابقة الأساسية تساوي 1 دائماً وليس 2. مشتقة من نظرية فيثاغورس.',
    },
  ],
  remediationHintAr:
    'المتطابقة الأساسية: sin²θ + cos²θ = 1. الدوال المثلثية ليست خطية: sin(A+B) ≠ sin(A)+sin(B). راجع صيغ الجمع والزاوية المضاعفة واحفظها جيداً.',
  remediationHintEn:
    'Fundamental identity: sin^2(t) + cos^2(t) = 1. Trig functions are NOT linear: sin(A+B) != sin(A)+sin(B). Review and memorize sum formulas and double angle formulas.',
  relatedTopics: ['المتطابقات المثلثية', 'صيغ الجمع', 'الزاوية المضاعفة'],
  detectionPatterns: [
    'sin\\s*\\(.*\\+.*\\)\\s*=\\s*sin.*\\+\\s*sin',
    'cos\\s*\\(.*\\+.*\\)\\s*=\\s*cos.*\\+\\s*cos',
    'sin².*\\+.*cos².*=\\s*2',
    'cos\\(2.*\\)\\s*=\\s*2\\s*cos',
  ],
};

const MC_TRG_004: MisconceptionEntry = {
  code: 'MC-TRG-004',
  name: 'Quadrant and sign error for trig functions',
  nameAr: 'خطأ في تحديد الربع وإشارة الدوال المثلثية',
  description:
    'Student fails to determine the correct sign of a trigonometric function based on the quadrant of the angle.',
  descriptionAr:
    'يفشل الطالب في تحديد الإشارة الصحيحة للدالة المثلثية بناءً على الربع الذي تقع فيه الزاوية.',
  category: 'trigonometry',
  severity: 'medium',
  examples: [
    {
      input: 'sin(150°) = -1/2',
      expected: 'sin(150°) = 1/2 (الربع الثاني، الجيب موجب)',
      explanation:
        '150° في الربع الثاني حيث sin موجب. sin(150°) = sin(180°-30°) = sin(30°) = 1/2.',
    },
    {
      input: 'cos(240°) = 1/2',
      expected: 'cos(240°) = -1/2 (الربع الثالث، جيب التمام سالب)',
      explanation:
        '240° في الربع الثالث حيث cos سالب. cos(240°) = cos(180°+60°) = -cos(60°) = -1/2.',
    },
    {
      input: 'tan(315°) = 1',
      expected: 'tan(315°) = -1 (الربع الرابع، الظل سالب)',
      explanation:
        '315° في الربع الرابع حيث tan سالب. tan(315°) = tan(360°-45°) = -tan(45°) = -1.',
    },
  ],
  remediationHintAr:
    'استخدم قاعدة "أستاذ" لتذكر الإشارات: الربع الأول (الكل+)، الثاني (sin+)، الثالث (tan+)، الرابع (cos+). ارسم دائرة الوحدة وحدد الأرباع.',
  remediationHintEn:
    'Use the ASTC rule (All Students Take Calculus): Q1 (all+), Q2 (sin+), Q3 (tan+), Q4 (cos+). Draw the unit circle and identify quadrants.',
  relatedTopics: ['الدائرة المثلثية', 'الأرباع', 'إشارات الدوال المثلثية'],
  detectionPatterns: [
    'sin\\s*\\(?150\\)?\\s*=\\s*-',
    'cos\\s*\\(?120\\)?\\s*=\\s*[^-]',
    'cos\\s*\\(?240\\)?\\s*=\\s*[^-]',
    'tan\\s*\\(?315\\)?\\s*=\\s*[^-]',
  ],
};

// ---------------------------------------------------------------------------
// Sequences (3)
// ---------------------------------------------------------------------------

const MC_SEQ_001: MisconceptionEntry = {
  code: 'MC-SEQ-001',
  name: 'Confusing arithmetic and geometric sequences',
  nameAr: 'خلط بين المتتالية الحسابية والهندسية',
  description:
    'Student applies the formula for one type of sequence to the other (e.g., using common difference formula for a geometric sequence).',
  descriptionAr:
    'يخلط الطالب بين صيغ المتتالية الحسابية والهندسية، فيستخدم صيغة إحداهما للأخرى.',
  category: 'sequences',
  severity: 'medium',
  examples: [
    {
      input: 'المتتالية 2, 6, 18, 54 => d = 4 (حسابية)',
      expected: 'المتتالية 2, 6, 18, 54 هي هندسية بنسبة r = 3',
      explanation:
        'النسبة بين الحدود المتتالية ثابتة (×3) وليس الفرق. هذه متتالية هندسية وليست حسابية.',
    },
    {
      input: 'الحد العام للمتتالية 3, 7, 11, 15 هو a_n = 3 × r^(n-1)',
      expected: 'a_n = 3 + (n-1) × 4 = 4n - 1',
      explanation:
        'هذه متتالية حسابية (d=4) وليست هندسية. الصيغة الصحيحة: a_n = a₁ + (n-1)d.',
    },
    {
      input: 'متتالية حسابية أساسها d=2 وحدها الأول a₁=5 => a₃ = 5 × 2² = 20',
      expected: 'a₃ = 5 + (3-1)×2 = 5 + 4 = 9',
      explanation:
        'استخدم الطالب صيغة المتتالية الهندسية a_n = a₁ × r^(n-1) بدلاً من الحسابية a_n = a₁ + (n-1)d.',
    },
  ],
  remediationHintAr:
    'الحسابية: الفرق بين حدين متتاليين ثابت (d)، الصيغة: a_n = a₁ + (n-1)d. الهندسية: النسبة بين حدين متتاليين ثابتة (r)، الصيغة: a_n = a₁ × r^(n-1). حدد أولاً نوع المتتالية ثم اختر الصيغة المناسبة.',
  remediationHintEn:
    'Arithmetic: constant difference (d), formula: a_n = a_1 + (n-1)d. Geometric: constant ratio (r), formula: a_n = a_1 * r^(n-1). First identify the sequence type, then choose the correct formula.',
  relatedTopics: ['المتتاليات الحسابية', 'المتتاليات الهندسية'],
  detectionPatterns: [
    'حسابية.*r\\s*=',
    'هندسية.*d\\s*=',
    'a_n\\s*=.*a₁\\s*[×\\*].*حسابية',
    'a_n\\s*=.*a₁\\s*\\+.*هندسية',
  ],
};

const MC_SEQ_002: MisconceptionEntry = {
  code: 'MC-SEQ-002',
  name: 'General term formula error',
  nameAr: 'خطأ في صيغة الحد العام',
  description:
    'Student makes an off-by-one error in the general term formula, typically using n instead of (n-1).',
  descriptionAr:
    'يخطئ الطالب في صيغة الحد العام، عادةً باستخدام n بدلاً من (n-1).',
  category: 'sequences',
  severity: 'medium',
  examples: [
    {
      input: 'a₁=3, d=5 => a_n = 3 + 5n',
      expected: 'a_n = 3 + (n-1)×5 = 5n - 2',
      explanation:
        'الصيغة الصحيحة هي a_n = a₁ + (n-1)d. عند n=1 يجب أن نحصل على a₁=3 وليس 3+5=8.',
    },
    {
      input: 'a₁=2, r=3 => a_n = 2 × 3^n',
      expected: 'a_n = 2 × 3^(n-1)',
      explanation:
        'الأس يجب أن يكون (n-1) وليس n. عند n=1: a₁ = 2×3⁰ = 2 ✓ وليس 2×3¹ = 6.',
    },
    {
      input: 'الحد العاشر لمتتالية a₁=4, d=3: a₁₀ = 4 + 10×3 = 34',
      expected: 'a₁₀ = 4 + (10-1)×3 = 4 + 27 = 31',
      explanation:
        'الطالب استخدم n=10 بدلاً من (n-1)=9. الصيغة: a_n = a₁ + (n-1)d.',
    },
  ],
  remediationHintAr:
    'تحقق دائماً بالتعويض: عند n=1 يجب أن تحصل على الحد الأول a₁. إذا لم تحصل على a₁، فالصيغة خاطئة. تذكر: (n-1) وليس n.',
  remediationHintEn:
    'Always verify by substituting n=1: you should get a_1. If not, the formula is wrong. Remember: use (n-1), not n.',
  relatedTopics: ['الحد العام', 'المتتاليات'],
  detectionPatterns: [
    'a_n\\s*=\\s*a₁\\s*\\+\\s*n\\s*[×\\*]?\\s*d',
    'a_n\\s*=\\s*a₁\\s*[×\\*]\\s*r\\s*\\^\\s*n\\b',
    'a_?\\d+\\s*=.*\\+\\s*\\d+\\s*[×\\*]\\s*d',
  ],
};

const MC_SEQ_003: MisconceptionEntry = {
  code: 'MC-SEQ-003',
  name: 'Series summation error',
  nameAr: 'خطأ في مجموع المتتالية',
  description:
    'Student uses the wrong summation formula or confuses the sum with the general term.',
  descriptionAr:
    'يستخدم الطالب صيغة مجموع خاطئة أو يخلط بين المجموع والحد العام.',
  category: 'sequences',
  severity: 'medium',
  examples: [
    {
      input: 'مجموع أول 10 حدود لمتتالية حسابية = a₁ + a₁₀',
      expected: 'S₁₀ = (10/2)(a₁ + a₁₀) = 5(a₁ + a₁₀)',
      explanation:
        'الطالب نسي الضرب في n/2. صيغة المجموع: S_n = (n/2)(a₁ + a_n).',
    },
    {
      input: 'مجموع متتالية هندسية S_n = a₁(r^n - 1)/(r - 1)',
      expected: 'S_n = a₁(1 - r^n)/(1 - r) عندما r < 1 أو a₁(r^n - 1)/(r - 1) عندما r > 1',
      explanation:
        'يجب الانتباه للإشارات حسب قيمة r لتجنب القسمة على صفر أو الحصول على نتيجة سالبة.',
    },
    {
      input: 'S₅ = a₅ (خلط المجموع بالحد)',
      expected: 'S₅ = a₁ + a₂ + a₃ + a₄ + a₅ (مجموع أول 5 حدود)',
      explanation:
        'المجموع S_n هو حاصل جمع الحدود من a₁ إلى a_n وليس الحد العام a_n.',
    },
  ],
  remediationHintAr:
    'المجموع الحسابي: S_n = (n/2)(a₁ + a_n) أو S_n = (n/2)(2a₁ + (n-1)d). المجموع الهندسي: S_n = a₁(1-r^n)/(1-r). لا تخلط بين الحد العام والمجموع.',
  remediationHintEn:
    'Arithmetic sum: S_n = (n/2)(a_1 + a_n). Geometric sum: S_n = a_1(1-r^n)/(1-r). Do not confuse the general term with the sum.',
  relatedTopics: ['مجموع المتتالية الحسابية', 'مجموع المتتالية الهندسية'],
  detectionPatterns: [
    'S_?n?\\s*=\\s*a₁\\s*\\+\\s*a_?n',
    'S_?\\d+\\s*=\\s*a_?\\d+\\b',
    'مجموع.*=.*الحد',
  ],
};

// ---------------------------------------------------------------------------
// Statistics (2)
// ---------------------------------------------------------------------------

const MC_STA_001: MisconceptionEntry = {
  code: 'MC-STA-001',
  name: 'Confusing mean, median, and mode',
  nameAr: 'خلط بين المتوسط والوسيط والمنوال',
  description:
    'Student confuses the three measures of central tendency or applies the wrong procedure to calculate them.',
  descriptionAr:
    'يخلط الطالب بين مقاييس النزعة المركزية الثلاثة أو يطبّق إجراءً خاطئاً لحسابها.',
  category: 'statistics',
  severity: 'low',
  examples: [
    {
      input: 'البيانات: 3, 5, 7, 7, 8 => المتوسط = 7 (القيمة الأكثر تكراراً)',
      expected: 'المتوسط = (3+5+7+7+8)/5 = 6. القيمة 7 هي المنوال وليس المتوسط',
      explanation:
        'المتوسط = مجموع القيم / عددها. المنوال = القيمة الأكثر تكراراً. الطالب خلط بينهما.',
    },
    {
      input: 'البيانات: 2, 8, 3, 9, 1 => الوسيط = 3 (العنصر الأوسط)',
      expected: 'يجب ترتيب البيانات أولاً: 1, 2, 3, 8, 9 => الوسيط = 3',
      explanation:
        'رغم أن الإجابة صحيحة بالصدفة هنا، الطالب لم يرتّب البيانات أولاً وهذا خطأ منهجي.',
    },
    {
      input: 'البيانات: 4, 4, 6, 6 => لا يوجد منوال',
      expected: 'المنوال: 4 و 6 (منوالان) — البيانات ثنائية المنوال',
      explanation:
        'إذا تكررت قيمتان بنفس العدد الأكبر فكلاهما منوال. لا يشترط وجود منوال واحد فقط.',
    },
  ],
  remediationHintAr:
    'المتوسط = مجموع القيم ÷ عددها. الوسيط = القيمة الوسطى بعد الترتيب تصاعدياً. المنوال = القيمة الأكثر تكراراً. رتّب البيانات دائماً قبل إيجاد الوسيط.',
  remediationHintEn:
    'Mean = sum of values / count. Median = middle value after sorting in ascending order. Mode = most frequent value. Always sort data before finding the median.',
  relatedTopics: ['مقاييس النزعة المركزية', 'الإحصاء الوصفي'],
  detectionPatterns: [
    'المتوسط.*الأكثر.*تكرار',
    'الوسيط.*بدون.*ترتيب',
    'المنوال.*مجموع',
    'mean.*mode',
    'median.*frequent',
  ],
};

const MC_STA_002: MisconceptionEntry = {
  code: 'MC-STA-002',
  name: 'Standard deviation calculation error',
  nameAr: 'خطأ في حساب الانحراف المعياري',
  description:
    'Student makes errors in computing standard deviation, such as forgetting to square the deviations, forgetting to take the square root at the end, or dividing by n instead of n-1 for a sample.',
  descriptionAr:
    'يخطئ الطالب في حساب الانحراف المعياري، كنسيان تربيع الانحرافات، أو نسيان الجذر التربيعي في النهاية، أو الخلط بين القسمة على n و n-1.',
  category: 'statistics',
  severity: 'low',
  examples: [
    {
      input: 'الانحراف المعياري = مجموع |xi - x̄| / n',
      expected: 'σ = √(مجموع (xi - x̄)² / n)',
      explanation:
        'الطالب استخدم القيمة المطلقة بدلاً من التربيع، ونسي الجذر التربيعي.',
    },
    {
      input: 'التباين = مجموع (xi - x̄) / n',
      expected: 'التباين = مجموع (xi - x̄)² / n',
      explanation:
        'الطالب نسي تربيع الانحرافات. بدون التربيع، المجموع يساوي صفراً دائماً.',
    },
    {
      input: 'σ² = 16 => σ = 4² = 16',
      expected: 'σ² = 16 => σ = √16 = 4',
      explanation:
        'الانحراف المعياري هو الجذر التربيعي للتباين وليس مربعه.',
    },
  ],
  remediationHintAr:
    'خطوات حساب الانحراف المعياري: (1) احسب المتوسط x̄ (2) اطرح المتوسط من كل قيمة (3) ربّع كل فرق (4) احسب متوسط المربعات (التباين) (5) خذ الجذر التربيعي.',
  remediationHintEn:
    'Steps for standard deviation: (1) compute mean x-bar (2) subtract mean from each value (3) square each difference (4) compute average of squares (variance) (5) take the square root.',
  relatedTopics: ['الانحراف المعياري', 'التباين', 'مقاييس التشتت'],
  detectionPatterns: [
    'الانحراف.*=.*مجموع.*xi.*-.*x.*/',
    'σ\\s*=\\s*[^√]',
    'التباين.*=.*مجموع.*xi.*-.*x̄\\s*/',
    'standard.*deviation.*absolute',
  ],
};

// ---------------------------------------------------------------------------
// Geometry (1)
// ---------------------------------------------------------------------------

const MC_GEO_001: MisconceptionEntry = {
  code: 'MC-GEO-001',
  name: 'Distance formula and line equation error',
  nameAr: 'خطأ في المسافة بين نقطتين ومعادلة الخط المستقيم',
  description:
    'Student makes errors in the distance formula between two points or in deriving the equation of a line (slope-intercept or point-slope form).',
  descriptionAr:
    'يخطئ الطالب في صيغة المسافة بين نقطتين أو في إيجاد معادلة الخط المستقيم (صيغة الميل والمقطع أو صيغة النقطة والميل).',
  category: 'geometry',
  severity: 'medium',
  examples: [
    {
      input: 'المسافة بين (1,2) و (4,6) = √((4-1) + (6-2)) = √7',
      expected: 'd = √((4-1)² + (6-2)²) = √(9+16) = √25 = 5',
      explanation:
        'الطالب نسي تربيع الفروقات. صيغة المسافة: d = √((x₂-x₁)² + (y₂-y₁)²).',
    },
    {
      input: 'ميل الخط المار بـ (1,3) و (4,9) = (4-1)/(9-3) = 1/2',
      expected: 'm = (9-3)/(4-1) = 6/3 = 2',
      explanation:
        'الميل = (y₂-y₁)/(x₂-x₁) وليس العكس. الطالب قلب البسط والمقام.',
    },
    {
      input: 'معادلة الخط بميل 3 ويمر بالنقطة (2,1): y = 3x + 1',
      expected: 'y - 1 = 3(x - 2) => y = 3x - 5',
      explanation:
        'الطالب وضع إحداثي y مباشرة كمقطع. يجب استخدام صيغة النقطة والميل: y-y₁ = m(x-x₁).',
    },
  ],
  remediationHintAr:
    'صيغة المسافة: d = √((x₂-x₁)² + (y₂-y₁)²) — لا تنسَ التربيع! الميل: m = (y₂-y₁)/(x₂-x₁) — فرق y في البسط. معادلة الخط: y-y₁ = m(x-x₁).',
  remediationHintEn:
    'Distance formula: d = sqrt((x2-x1)^2 + (y2-y1)^2) — don\'t forget to square! Slope: m = (y2-y1)/(x2-x1) — y-difference on top. Line equation: y-y1 = m(x-x1).',
  relatedTopics: ['المسافة بين نقطتين', 'معادلة الخط المستقيم', 'الميل', 'الهندسة التحليلية'],
  detectionPatterns: [
    'd\\s*=\\s*√?\\(.*-.*\\+.*-.*\\)[^²]',
    'm\\s*=\\s*\\(x.*-.*x.*\\)\\s*/\\s*\\(y.*-.*y.*\\)',
    'الميل.*=.*x.*-.*x.*\\/.*y.*-.*y',
    'المسافة.*بدون.*تربيع',
  ],
};

// ---------------------------------------------------------------------------
// Full catalog
// ---------------------------------------------------------------------------

export const MISCONCEPTION_CATALOG: readonly MisconceptionEntry[] = [
  // Algebra
  MC_ALG_001,
  MC_ALG_002,
  MC_ALG_003,
  MC_ALG_004,
  // Functions
  MC_FUN_001,
  MC_FUN_002,
  MC_FUN_003,
  MC_FUN_004,
  // Trigonometry
  MC_TRG_001,
  MC_TRG_002,
  MC_TRG_003,
  MC_TRG_004,
  // Sequences
  MC_SEQ_001,
  MC_SEQ_002,
  MC_SEQ_003,
  // Statistics
  MC_STA_001,
  MC_STA_002,
  // Geometry
  MC_GEO_001,
] as const;

/**
 * Look up a misconception entry by its code (e.g. "MC-ALG-001").
 */
export function getMisconceptionByCode(
  code: string,
): MisconceptionEntry | undefined {
  return MISCONCEPTION_CATALOG.find((m) => m.code === code);
}

/**
 * Get all misconceptions in a given category.
 */
export function getMisconceptionsByCategory(
  category: MisconceptionEntry['category'],
): MisconceptionEntry[] {
  return MISCONCEPTION_CATALOG.filter((m) => m.category === category);
}

/**
 * Build a condensed catalog summary suitable for an AI system prompt.
 * Includes code, Arabic name, description, and examples for each misconception.
 */
export function buildCatalogPromptReference(): string {
  return MISCONCEPTION_CATALOG.map((m) => {
    const examples = m.examples
      .map(
        (ex, i) =>
          `    مثال ${i + 1}: الطالب كتب "${ex.input}" — الصحيح: "${ex.expected}"`,
      )
      .join('\n');

    return `- ${m.code}: ${m.nameAr}
  الوصف: ${m.descriptionAr}
  الخطورة: ${m.severity === 'high' ? 'عالية' : m.severity === 'medium' ? 'متوسطة' : 'منخفضة'}
${examples}
  العلاج: ${m.remediationHintAr}`;
  }).join('\n\n');
}
