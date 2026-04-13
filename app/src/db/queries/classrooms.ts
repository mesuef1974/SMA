import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { classrooms, classroomStudents } from '@/db/schema';
import type { NewClassroom } from '@/db/schema';

// ---------------------------------------------------------------------------
// Classrooms DAL — classroom management and student enrollment
// ---------------------------------------------------------------------------

/**
 * Retrieve a classroom by its unique join code.
 * Primary use: student join flow — validate the code before enrollment.
 */
export async function getClassroomByCode(code: string) {
  return db.query.classrooms.findFirst({
    where: eq(classrooms.code, code.toUpperCase()),
    with: {
      teacher: {
        columns: {
          passwordHash: false,
        },
      },
    },
  });
}

/**
 * Add a student to a classroom.
 * Returns the newly created student record.
 * Primary use: student join action after code validation.
 */
export async function joinClassroom(
  classroomId: string,
  displayName: string,
  displayNameAr: string,
) {
  const [inserted] = await db
    .insert(classroomStudents)
    .values({
      classroomId,
      displayName,
      displayNameAr,
    })
    .returning();
  return inserted;
}

/**
 * List all active students in a classroom.
 * Ordered by join date (newest first).
 * Primary use: teacher classroom management page.
 */
export async function getClassroomStudents(classroomId: string) {
  return db.query.classroomStudents.findMany({
    where: eq(classroomStudents.classroomId, classroomId),
    orderBy: (s, { desc }) => desc(s.joinedAt),
  });
}

/**
 * Create a new classroom for a teacher.
 * The caller must provide a unique 6-character code.
 * Returns the created classroom record.
 */
export async function createClassroom(data: NewClassroom) {
  const [inserted] = await db.insert(classrooms).values(data).returning();
  return inserted;
}

/**
 * List all classrooms owned by a specific teacher.
 * Includes student count via the students relation.
 * Ordered by creation date (newest first).
 * Primary use: teacher classroom management page.
 */
export async function getTeacherClassrooms(teacherId: string) {
  return db.query.classrooms.findMany({
    where: eq(classrooms.teacherId, teacherId),
    orderBy: (c, { desc }) => desc(c.createdAt),
    with: {
      students: true,
    },
  });
}

/**
 * Retrieve a classroom by ID with its students.
 * Primary use: classroom detail view for teachers.
 */
export async function getClassroomById(classroomId: string) {
  return db.query.classrooms.findFirst({
    where: eq(classrooms.id, classroomId),
    with: {
      students: true,
      teacher: {
        columns: {
          passwordHash: false,
        },
      },
    },
  });
}

/**
 * Retrieve a student by ID.
 * Includes the classroom relation.
 * Primary use: student dashboard — display student info.
 */
export async function getStudentById(studentId: string) {
  return db.query.classroomStudents.findFirst({
    where: eq(classroomStudents.id, studentId),
    with: {
      classroom: true,
    },
  });
}
