import { TodoPriority, TodoStatus } from '../../../generated/prisma/client';

export interface TodoDraft {
  title: string;
  description: string | null;
  status: TodoStatus;
  priority: TodoPriority;
  dueAt: string | null;
  reminderAt: string | null;
  completedAt: string | null;
}

export const todoDraftSchema = {
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

export function isTodoDraft(value: unknown): value is TodoDraft {
  if (!value || typeof value !== 'object') return false;

  const draft = value as Record<string, unknown>;

  return (
    typeof draft.title === 'string' &&
    (typeof draft.description === 'string' || draft.description === null) &&
    Object.values(TodoStatus).includes(draft.status as TodoStatus) &&
    Object.values(TodoPriority).includes(draft.priority as TodoPriority) &&
    isNullableDate(draft.dueAt) &&
    isNullableDate(draft.reminderAt) &&
    isNullableDate(draft.completedAt)
  );
}

function isNullableDate(value: unknown): value is string | null {
  return (
    value === null ||
    (typeof value === 'string' && !Number.isNaN(Date.parse(value)))
  );
}
