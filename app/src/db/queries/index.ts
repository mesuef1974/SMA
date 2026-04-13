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

export {
  getClassroomByCode,
  joinClassroom,
  getClassroomStudents,
  createClassroom,
  getTeacherClassrooms,
  getClassroomById,
  getStudentById,
} from './classrooms';

export {
  getStudentPerformance,
  getClassPerformance,
  getStudentResponsesByStudent,
} from './performance';

export {
  awardXP,
  getStudentXP,
  getClassLeaderboard,
  awardBadge,
  getStudentBadges,
  checkBadgeEligibility,
} from './gamification';

export {
  createChallenge,
  startChallenge,
  endChallenge,
  createTeams,
  assignStudentsToTeams,
  submitChallengeResponse,
  getChallengeLeaderboard,
  getChallengeStatus,
} from './challenges';
