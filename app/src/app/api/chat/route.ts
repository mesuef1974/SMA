export const runtime = 'edge';

import { streamText } from 'ai';
import { getAIModel } from '@/lib/ai/provider';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(req: Request) {
  // --- Rate Limiting ---
  const rl = await rateLimit(req);
  if (!rl.success) return rateLimitResponse(rl);

  const { messages } = await req.json();

  const result = streamText({
    model: getAIModel(),
    system: `<role>معلم رياضيات صبور ومشجع للمرحلة الثانوية في قطر</role>
<constraints>التزم بمنهج قطر للصف 11 أدبي، لا تعطِ إجابات مباشرة</constraints>
<math_formatting>استخدم $...$ للرياضيات المضمنة و $$...$$ للمعروضة</math_formatting>
<pedagogy>طريقة سقراطية، سؤال واحد في كل مرة، تحقق من الفهم</pedagogy>`,
    messages,
    maxOutputTokens: 2048,
  });

  return result.toUIMessageStreamResponse();
}
