// ---------------------------------------------------------------------------
// Central schema export — re-exports all tables, enums, relations, and types
// ---------------------------------------------------------------------------

export {
  // Enums
  userRoleEnum,
  // Tables
  schools,
  users,
  // Relations
  schoolsRelations,
  usersRelations,
  // Types
  type School,
  type NewSchool,
  type User,
  type NewUser,
} from './users';

export {
  // Enums
  trackEnum,
  bloomLevelEnum,
  // Tables
  subjects,
  gradeLevels,
  chapters,
  lessons,
  learningOutcomes,
  // Relations
  subjectsRelations,
  gradeLevelsRelations,
  chaptersRelations,
  lessonsRelations,
  learningOutcomesRelations,
  // Types
  type Subject,
  type NewSubject,
  type GradeLevel,
  type NewGradeLevel,
  type Chapter,
  type NewChapter,
  type Lesson,
  type NewLesson,
  type LearningOutcome,
  type NewLearningOutcome,
} from './curriculum';

export {
  // Enums
  lessonPlanStatusEnum,
  lessonPlanSectionEnum,
  // Tables
  lessonPlans,
  // Relations
  lessonPlansRelations,
  // Types
  type LessonPlan,
  type NewLessonPlan,
} from './lesson-plans';

export {
  // Enums
  reviewDecisionEnum,
  // Tables
  lessonPlanReviews,
  // Relations
  lessonPlanReviewsRelations,
  // Types
  type LessonPlanReview,
  type NewLessonPlanReview,
} from './lesson-plan-reviews';

export {
  // Enums
  severityEnum,
  detectionSourceEnum,
  // Tables
  misconceptionTypes,
  studentMisconceptions,
  // Relations
  misconceptionTypesRelations,
  studentMisconceptionsRelations,
  // Types
  type MisconceptionType,
  type NewMisconceptionType,
  type StudentMisconception,
  type NewStudentMisconception,
} from './misconceptions';

export {
  // Enums
  assessmentTypeEnum,
  questionTypeEnum,
  // Tables
  assessments,
  assessmentQuestions,
  studentResponses,
  // Relations
  assessmentsRelations,
  assessmentQuestionsRelations,
  studentResponsesRelations,
  // Types
  type Assessment,
  type NewAssessment,
  type AssessmentQuestion,
  type NewAssessmentQuestion,
  type StudentResponse,
  type NewStudentResponse,
} from './assessments';

export {
  // Enums
  chatRoleEnum,
  // Tables
  chatSessions,
  chatMessages,
  // Relations
  chatSessionsRelations,
  chatMessagesRelations,
  // Types
  type ChatSession,
  type NewChatSession,
  type ChatMessage,
  type NewChatMessage,
} from './chat';

export {
  // Tables
  classrooms,
  classroomStudents,
  // Relations
  classroomsRelations,
  classroomStudentsRelations,
  // Types
  type Classroom,
  type NewClassroom,
  type ClassroomStudent,
  type NewClassroomStudent,
} from './classrooms';

export {
  // Enums
  xpSourceTypeEnum,
  badgeCategoryEnum,
  challengeStatusEnum,
  // Tables
  xpConfig,
  studentXp,
  xpTransactions,
  badgeDefinitions,
  studentBadges,
  challenges,
  challengeTeams,
  challengeParticipants,
  challengeResponses,
  // Relations
  xpConfigRelations,
  studentXpRelations,
  xpTransactionsRelations,
  badgeDefinitionsRelations,
  studentBadgesRelations,
  challengesRelations,
  challengeTeamsRelations,
  challengeParticipantsRelations,
  challengeResponsesRelations,
  // Types
  type XpConfig,
  type NewXpConfig,
  type StudentXp,
  type NewStudentXp,
  type XpTransaction,
  type NewXpTransaction,
  type BadgeDefinition,
  type NewBadgeDefinition,
  type StudentBadge,
  type NewStudentBadge,
  type Challenge,
  type NewChallenge,
  type ChallengeTeam,
  type NewChallengeTeam,
  type ChallengeParticipant,
  type NewChallengeParticipant,
  type ChallengeResponse,
  type NewChallengeResponse,
} from './gamification';

export {
  // Enums
  curriculumSourceKindEnum,
  curriculumSourceBookEnum,
  // Tables
  curriculumSources,
  curriculumPages,
  // Relations
  curriculumSourcesRelations,
  curriculumPagesRelations,
  // Types
  type CurriculumSource,
  type NewCurriculumSource,
  type CurriculumPage,
  type NewCurriculumPage,
} from './curriculum-sources';
