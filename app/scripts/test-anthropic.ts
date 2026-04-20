delete process.env.ANTHROPIC_BASE_URL;
delete process.env.ANTHROPIC_AUTH_TOKEN;
delete process.env.ANTHROPIC_API_KEY;
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

async function main() {
  console.log('key len:', (process.env.ANTHROPIC_API_KEY || '').length);
  console.log('base:', process.env.ANTHROPIC_BASE_URL);
  const { anthropic } = await import('@ai-sdk/anthropic');
  const { generateText } = await import('ai');
  try {
    const r = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      messages: [{ role: 'user', content: 'ping' }],
    });
    console.log('OK:', r.text);
  } catch (e: any) {
    console.log('ERR:', e?.message, e?.url);
  }
}
main();
