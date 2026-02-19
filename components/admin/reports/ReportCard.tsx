import { ProgressReport } from '@prisma/client';
import { AutoSummary, AutoSummaryProject } from '@/lib/actions/admin/reports';

function Section({
  label,
  items,
  color,
}: {
  label: string;
  items: string[];
  color: string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${color}`}>
        {label} <span className="font-normal opacity-60">({items.length})</span>
      </p>
      <ul className="space-y-0.5 pl-0.5">
        {items.map((title, i) => (
          <li key={i} className="text-sm text-gray-700">
            {title}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProjectSummary({ project }: { project: AutoSummaryProject }) {
  // Defensively default arrays — old saved reports may be missing new fields
  const newTasks = project.newTasks ?? [];
  const inProgress = project.inProgress ?? [];
  const waiting = project.waiting ?? [];
  const done = project.done ?? [];

  const hasContent =
    newTasks.length > 0 ||
    inProgress.length > 0 ||
    waiting.length > 0 ||
    done.length > 0;

  if (!hasContent) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">{project.name}</h4>
      <div className="pl-3 border-l-2 border-black/10 space-y-3">
        <Section label="New" items={newTasks} color="text-blue-600" />
        <Section label="In Progress" items={inProgress} color="text-indigo-500" />
        <Section label="Waiting" items={waiting} color="text-amber-500" />
        <Section label="Done" items={done} color="text-green-600" />
      </div>
    </div>
  );
}

interface ReportCardProps {
  report: ProgressReport;
}

export default function ReportCard({ report }: ReportCardProps) {
  const summary = report.autoSummary as AutoSummary | null;

  const formatted = new Date(report.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  });

  return (
    <div className="bg-white rounded-xl border border-black/10 p-6 space-y-5">
      <p className="text-sm font-semibold text-gray-400">{formatted}</p>

      {summary && summary.projects.length > 0 ? (
        <div className="space-y-6">
          {summary.projects.map((project) => (
            <ProjectSummary key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">No activity recorded.</p>
      )}

      {report.content && (
        <div className="pt-4 border-t border-black/5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Notes</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.content}</p>
        </div>
      )}
    </div>
  );
}
