import { Task } from '@prisma/client';

export type TaskWithTags = Task & {
  tags: { tag: { id: string; name: string; color: string | null } }[];
};
