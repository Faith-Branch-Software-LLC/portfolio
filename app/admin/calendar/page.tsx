import { prisma } from '@/lib/db';
import { IntegrationType, KanbanColumn } from '@prisma/client';
import CalendarClient from '@/components/admin/calendar/CalendarClient';

export default async function CalendarPage() {
  const [googleIntegrations, appleIntegrations, dueTasks] = await Promise.all([
    prisma.integration.findMany({ where: { type: IntegrationType.GOOGLE_CALENDAR }, orderBy: { createdAt: 'asc' } }),
    prisma.integration.findMany({ where: { type: IntegrationType.APPLE_CALENDAR }, orderBy: { createdAt: 'asc' } }),
    prisma.task.findMany({
      where: { due: { not: null }, column: { notIn: [KanbanColumn.DONE] } },
      select: {
        id: true,
        title: true,
        due: true,
        project: { select: { id: true, name: true, client: { select: { color: true } } } },
      },
    }),
  ]);

  const taskDueEvents = dueTasks.map((t) => ({
    id: t.id,
    title: t.title,
    due: t.due!.toISOString(),
    projectId: t.project.id,
    projectName: t.project.name,
    color: t.project.client.color ?? '#F46036',
  }));

  return (
    <CalendarClient
      googleCalSources={googleIntegrations.map((i) => ({ id: i.id, name: i.name }))}
      appleCalSources={appleIntegrations.map((i) => ({ id: i.id, name: i.name }))}
      taskDueEvents={taskDueEvents}
    />
  );
}
