export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface AiProvider {
  ask(message: string): Promise<string>;
  parseTodo(text: string): Promise<unknown>;
}
