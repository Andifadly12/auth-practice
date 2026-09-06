import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { TodoPriority, TodoStatus } from '../../generated/prisma/client';

export interface TodoDraft {
  title: string;
  description: string | null;
  status: TodoStatus;
  priority: TodoPriority;
  dueAt: string | null;
  reminderAt: string | null;
  completedAt: string | null;
}

const todoDraftSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    description: { type: ['string', 'null'] },
    status: { type: 'string', enum: Object.values(TodoStatus) },
    priority: { type: 'string', enum: Object.values(TodoPriority) },
    dueAt: { type: ['string', 'null'] },
    reminderAt: { type: ['string', 'null'] },
    completedAt: { type: ['string', 'null'] },
  },
  required: [
    'title',
    'description',
    'status',
    'priority',
    'dueAt',
    'reminderAt',
    'completedAt',
  ],
} as const;

@Injectable()
export class AiService {
  async parseTodo(text: string): Promise<{ draft: TodoDraft }> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'OPENAI_API_KEY belum dikonfigurasi',
      );
    }

    const client = new OpenAI({ apiKey });

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

      if (!this.isTodoDraft(draft)) {
        throw new Error('Respons AI tidak sesuai dengan struktur Todo');
      }

      return { draft };
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) throw error;

      throw new BadGatewayException('Gagal membuat draft Todo dari AI');
    }
  }

  private isTodoDraft(value: unknown): value is TodoDraft {
    if (!value || typeof value !== 'object') return false;

    const draft = value as Record<string, unknown>;

    return (
      typeof draft.title === 'string' &&
      (typeof draft.description === 'string' || draft.description === null) &&
      Object.values(TodoStatus).includes(draft.status as TodoStatus) &&
      Object.values(TodoPriority).includes(draft.priority as TodoPriority) &&
      this.isNullableDate(draft.dueAt) &&
      this.isNullableDate(draft.reminderAt) &&
      this.isNullableDate(draft.completedAt)
    );
  }

  private isNullableDate(value: unknown): value is string | null {
    return (
      value === null ||
      (typeof value === 'string' && !Number.isNaN(Date.parse(value)))
    );
  }
}
