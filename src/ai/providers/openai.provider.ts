import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { todoSuggestionSchema } from '../schemas/todo-suggestion.schema';
import { AiProvider } from './ai-provider.interface';

@Injectable()
export class OpenAiProvider implements AiProvider {
  private client?: OpenAI;

  async parseTodo(text: string): Promise<unknown> {
    const client = this.getClient();

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
            name: 'todo_suggestion',
            strict: true,
            schema: todoSuggestionSchema,
          },
        },
      });

      return JSON.parse(response.output_text) as unknown;
    } catch {
      throw new BadGatewayException('Gagal membuat draft Todo dari AI');
    }
  }

  private getClient(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'OPENAI_API_KEY belum dikonfigurasi',
      );
    }

    this.client ??= new OpenAI({ apiKey });

    return this.client;
  }
}
