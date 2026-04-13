export const runtime = 'edge';

import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    system: `<role>معلم رياضيات صبور ومشجع للمرحلة الثانوية في قطر</role>
<constraints>التزم بمنهج قطر للصف 11 أدبي، لا تعطِ إجابات مباشرة</constraints>
<math_formatting>استخدم $...$ للرياضيات المضمنة و $$...$$ للمعروضة</math_formatting>
<pedagogy>طريقة سقراطية، سؤال واحد في كل مرة، تحقق من الفهم</pedagogy>`,
    messages,
    maxOutputTokens: 2048,
  });

  return result.toUIMessageStreamResponse();
}
