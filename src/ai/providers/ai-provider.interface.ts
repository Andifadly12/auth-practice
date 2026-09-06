export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface AiProvider {
  parseTodo(text: string): Promise<unknown>;
}
