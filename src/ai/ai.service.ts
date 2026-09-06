import { BadGatewayException, Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER, AiProvider } from './providers/ai-provider.interface';
import {
  isTodoSuggestion,
  TodoSuggestion,
} from './schemas/todo-suggestion.schema';

@Injectable()
export class AiService {
  constructor(@Inject(AI_PROVIDER) private readonly aiProvider: AiProvider) {}

  async ask(message: string): Promise<{ answer: string }> {
    const answer = await this.aiProvider.ask(message);

    return { answer };
  }

  async parseTodo(text: string): Promise<{ draft: TodoSuggestion }> {
    const suggestion = await this.aiProvider.parseTodo(text);

    if (!isTodoSuggestion(suggestion)) {
      throw new BadGatewayException('Gagal membuat draft Todo dari AI');
    }

    return { draft: suggestion };
  }
}
