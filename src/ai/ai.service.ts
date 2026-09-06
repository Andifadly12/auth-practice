import { BadGatewayException, Injectable } from '@nestjs/common';
import { OpenAiProvider } from './providers/openai.provider';
import {
  isTodoDraft,
  TodoDraft,
  todoDraftSchema,
} from './schemas/todo-draft.schema';

@Injectable()
export class AiService {
  constructor(private readonly openAiProvider: OpenAiProvider) {}

  async parseTodo(text: string): Promise<{ draft: TodoDraft }> {
    const client = this.openAiProvider.getClient();

    try {
      const response = await client.responses.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-5-mini',
        store: false,
        instructions: [
          'Ubah kalimat pengguna menjadi draft todo berbahasa Indonesia.',
          'Jangan menambahkan informasi yang tidak tersirat.',
          'Gunakan status TODO jika status tidak disebutkan.',
          'Gunakan priority MEDIUM jika prioritas tidak disebutkan.',
          'Gunakan waktu ISO 8601 untuk tanggal yang dapat ditentukan.',
          'Gunakan null untuk informasi opsional yang tidak diketahui.',
        ].join(' '),
        input: `Waktu saat ini: ${new Date().toISOString()}\nKalimat: ${text}`,
        text: {
          format: {
            type: 'json_schema',
            name: 'todo_draft',
            strict: true,
            schema: todoDraftSchema,
          },
        },
      });

      const draft: unknown = JSON.parse(response.output_text);

      if (!isTodoDraft(draft)) {
        throw new Error('Respons AI tidak sesuai dengan struktur Todo');
      }

      return { draft };
    } catch {
      throw new BadGatewayException('Gagal membuat draft Todo dari AI');
    }
  }
}
