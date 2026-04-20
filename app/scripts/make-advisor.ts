/** Grant advisor privileges to teacher@sma.qa by promoting `users.role`
 *  to 'advisor' (P1.1 — replaced ADVISOR_EMAILS env allowlist). */
import { config } from 'dotenv'; config({ path: '.env.local' });
import { sql } from 'drizzle-orm';

async function main() {
  const { db } = await import('../src/db');
  // Promote teacher@sma.qa to 'advisor' role (DB-backed authorization).
  await db.execute(
    sql`UPDATE users SET role = 'advisor' WHERE email = 'teacher@sma.qa' AND role <> 'admin'`,
  );
  console.log("✅ Promoted teacher@sma.qa to role='advisor' (if not already admin)");

  const r = (await db.execute(
    sql`SELECT email, role, full_name_ar FROM users WHERE email='teacher@sma.qa'`,
  )) as any[];
  console.log('\nLogin credentials:');
  console.table(r);
  console.log('\nEmail:    teacher@sma.qa');
  console.log('Password: (من reference_sma_deployment.md — راجع الذاكرة)');
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
