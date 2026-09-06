import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenAiProvider {
  private client?: OpenAI;

  getClient(): OpenAI {
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
