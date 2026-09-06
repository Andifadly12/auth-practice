import { TodoPriority, TodoStatus } from '../../../generated/prisma/client';

export interface TodoSuggestion {
  title: string;
  description: string | null;
  status: TodoStatus;
  priority: TodoPriority;
  dueAt: string | null;
  reminderAt: string | null;
  completedAt: string | null;
}

export const todoSuggestionSchema = {
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

export function isTodoSuggestion(value: unknown): value is TodoSuggestion {
  if (!value || typeof value !== 'object') return false;

  const suggestion = value as Record<string, unknown>;

  return (
    typeof suggestion.title === 'string' &&
    (typeof suggestion.description === 'string' ||
      suggestion.description === null) &&
    Object.values(TodoStatus).includes(suggestion.status as TodoStatus) &&
    Object.values(TodoPriority).includes(suggestion.priority as TodoPriority) &&
    isNullableDate(suggestion.dueAt) &&
    isNullableDate(suggestion.reminderAt) &&
    isNullableDate(suggestion.completedAt)
  );
}

function isNullableDate(value: unknown): value is string | null {
  return (
    value === null ||
    (typeof value === 'string' && !Number.isNaN(Date.parse(value)))
  );
}
