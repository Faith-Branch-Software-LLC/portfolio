'use client';

import { useEffect, useState } from 'react';
import { AutoSummary, AutoSummaryProject, createProgressReport, getAutoSummary } from '@/lib/actions/admin/reports';
import { ProgressReport } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

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
          <li key={i} className="text-sm text-gray-700">{title}</li>
        ))}
      </ul>
    </div>
  );
}

function SummaryPreview({ summary }: { summary: AutoSummary }) {
  if (summary.projects.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic">
        No activity recorded since the last report.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {summary.projects.map((project: AutoSummaryProject) => (
        <div key={project.id} className="space-y-2.5">
          <p className="text-sm font-medium">{project.name}</p>
          <div className="pl-3 border-l-2 border-black/10 space-y-2.5">
            <Section label="New" items={project.newTasks} color="text-blue-600" />
            <Section label="In Progress" items={project.inProgress} color="text-indigo-500" />
            <Section label="Waiting" items={project.waiting} color="text-amber-500" />
            <Section label="Done" items={project.done} color="text-green-600" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface CreateReportFormProps {
  clientId: string;
  onCreated: (report: ProgressReport) => void;
  onCancel: () => void;
}

export default function CreateReportForm({ clientId, onCreated, onCancel }: CreateReportFormProps) {
  const [summary, setSummary] = useState<AutoSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    getAutoSummary(clientId).then((s) => {
      setSummary(s);
      setLoading(false);
    });
  }, [clientId]);

  const handleSave = async () => {
    setSaving(true);
    const report = await createProgressReport(clientId, notes);
    onCreated(report);
  };

  return (
    <div className="bg-white rounded-xl border border-black/10 p-6 space-y-5">
      <p className="text-sm font-semibold text-gray-500">New Report</p>

      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
          Activity Summary
        </p>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading activity…
          </div>
        ) : summary ? (
          <SummaryPreview summary={summary} />
        ) : null}
      </div>

      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
          Notes
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Add context, talking points, or anything else for this check-in…"
          className="w-full rounded-lg border border-black/10 bg-gray-50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black/10 placeholder:text-gray-300"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={loading || saving}>
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Saving…
            </>
          ) : (
            'Create Report'
          )}
        </Button>
      </div>
    </div>
  );
}
