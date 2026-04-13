// ---------------------------------------------------------------------------
// Badge Definitions — 10 initial badges for the gamification system
// Each badge has machine-readable criteria in criteria_json for automatic
// eligibility checks. Icons use Lucide icon names (matching project UI lib).
// ---------------------------------------------------------------------------

export interface BadgeCriteria {
  type: string;
  threshold?: number;
  bloomMinLevel?: string;
  timeMaxMs?: number;
  consecutiveDays?: number;
  [key: string]: unknown;
}

export interface BadgeDefinitionSeed {
  code: string;
  nameAr: string;
  descriptionAr: string;
  icon: string;
  category: 'academic' | 'behavioral' | 'streak' | 'special';
  xpReward: number;
  criteriaJson: BadgeCriteria;
}

/**
 * 10 initial badge definitions seeded into badge_definitions table.
 * criteria_json is consumed by checkBadgeEligibility() in the DAL.
 */
export const BADGE_DEFINITIONS: readonly BadgeDefinitionSeed[] = [
  {
    code: 'FIRST_STEP',
    nameAr: 'الخطوة الأولى',
    descriptionAr: 'أول إجابة صحيحة — بداية رحلة التعلم!',
    icon: 'footprints',
    category: 'academic',
    xpReward: 10,
    criteriaJson: {
      type: 'first_correct_answer',
      threshold: 1,
    },
  },
  {
    code: 'PERFECT_SCORE',
    nameAr: 'علامة كاملة',
    descriptionAr: 'الحصول على 100% في تمرين واحد',
    icon: 'trophy',
    category: 'academic',
    xpReward: 25,
    criteriaJson: {
      type: 'perfect_score',
      threshold: 100,
    },
  },
  {
    code: 'STREAK_3',
    nameAr: 'سلسلة ثلاثية',
    descriptionAr: '3 إجابات صحيحة متتالية',
    icon: 'flame',
    category: 'streak',
    xpReward: 15,
    criteriaJson: {
      type: 'correct_streak',
      threshold: 3,
    },
  },
  {
    code: 'STREAK_7',
    nameAr: 'سلسلة سباعية',
    descriptionAr: '7 إجابات صحيحة متتالية',
    icon: 'zap',
    category: 'streak',
    xpReward: 30,
    criteriaJson: {
      type: 'correct_streak',
      threshold: 7,
    },
  },
  {
    code: 'BLOOM_ANALYST',
    nameAr: 'المحلل',
    descriptionAr: 'إجابة صحيحة على سؤال بمستوى تحليل أو أعلى',
    icon: 'brain',
    category: 'academic',
    xpReward: 20,
    criteriaJson: {
      type: 'bloom_level_correct',
      bloomMinLevel: 'analyze',
    },
  },
  {
    code: 'TEAM_PLAYER',
    nameAr: 'لاعب فريق',
    descriptionAr: 'المشاركة في تحدي فريقي',
    icon: 'users',
    category: 'behavioral',
    xpReward: 15,
    criteriaJson: {
      type: 'challenge_participation',
      threshold: 1,
    },
  },
  {
    code: 'SPEED_SOLVER',
    nameAr: 'حلّال سريع',
    descriptionAr: 'إجابة صحيحة في أقل من 10 ثوانٍ',
    icon: 'timer',
    category: 'academic',
    xpReward: 15,
    criteriaJson: {
      type: 'speed_correct',
      timeMaxMs: 10000,
    },
  },
  {
    code: 'DAILY_LEARNER',
    nameAr: 'متعلم يومي',
    descriptionAr: 'تمرين في يومين متتاليين',
    icon: 'calendar-check',
    category: 'behavioral',
    xpReward: 20,
    criteriaJson: {
      type: 'consecutive_days',
      consecutiveDays: 2,
    },
  },
  {
    code: 'CHAPTER_MASTER',
    nameAr: 'متقن الوحدة',
    descriptionAr: 'إكمال كل تمارين وحدة دراسية',
    icon: 'book-check',
    category: 'academic',
    xpReward: 50,
    criteriaJson: {
      type: 'chapter_complete',
      threshold: 1,
    },
  },
  {
    code: 'MISCONCEPTION_HUNTER',
    nameAr: 'صائد المفاهيم الخاطئة',
    descriptionAr: 'اكتشاف 3 مفاهيم خاطئة وتصحيحها',
    icon: 'search-check',
    category: 'special',
    xpReward: 30,
    criteriaJson: {
      type: 'misconceptions_resolved',
      threshold: 3,
    },
  },
] as const;
