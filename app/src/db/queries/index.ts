// ---------------------------------------------------------------------------
// Data Access Layer — central re-export
// ---------------------------------------------------------------------------

export { getUserByEmail, getUserById, getTeachersBySchool } from './users';

export {
  getLessonsWithChapter,
  getLessonById,
  getLearningOutcomes,
  getChaptersByGradeLevel,
  getGradeLevelForSubject,
} from './curriculum';

export {
  getLessonPlansByTeacher,
  getLessonPlanById,
  createLessonPlan,
  updateLessonPlan,
} from './lesson-plans';

export {
  getAssessmentsByLesson,
  getAssessmentWithQuestions,
  getStudentResponses,
  createAssessment,
} from './assessments';

export {
  getStudentMisconceptions,
  getMisconceptionStats,
  logMisconception,
} from './misconceptions';
