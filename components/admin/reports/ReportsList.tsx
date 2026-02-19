'use client';

import { useState } from 'react';
import { ProgressReport } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ReportCard from './ReportCard';
import CreateReportForm from './CreateReportForm';

interface ReportsListProps {
  clientId: string;
  clientName: string;
  clientColor: string | null;
  initialReports: ProgressReport[];
}

export default function ReportsList({
  clientId,
  clientName,
  clientColor,
  initialReports,
}: ReportsListProps) {
  const [reports, setReports] = useState<ProgressReport[]>(initialReports);
  const [creating, setCreating] = useState(false);

  const handleCreated = (report: ProgressReport) => {
    setReports((prev) => [report, ...prev]);
    setCreating(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: clientColor ?? '#888888' }}
          />
          <h1 className="text-2xl font-fraunces font-semibold">
            {clientName} — Reports
          </h1>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Report
          </Button>
        )}
      </div>

      {creating && (
        <CreateReportForm
          clientId={clientId}
          onCreated={handleCreated}
          onCancel={() => setCreating(false)}
        />
      )}

      {reports.length === 0 && !creating ? (
        <div className="text-center py-16 text-gray-400">
          No reports yet. Create one to start tracking client progress.
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
