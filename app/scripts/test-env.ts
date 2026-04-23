import dotenv from 'dotenv';
const r = dotenv.config({ path: '.env.local', override: true, debug: true });
console.log('parsed keys:', Object.keys(r.parsed || {}));
console.log('ANTHROPIC_API_KEY parsed val len:', (r.parsed?.ANTHROPIC_API_KEY || '').length);
console.log('process.env len:', (process.env.ANTHROPIC_API_KEY || '').length);
console.log('ANTHROPIC_BASE_URL in parsed:', r.parsed?.ANTHROPIC_BASE_URL);
console.log('ANTHROPIC_BASE_URL in process.env:', process.env.ANTHROPIC_BASE_URL);
