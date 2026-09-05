import React from 'react';
import { 
  Activity, 
  CheckCircle2, 
  UserPlus, 
  FileText, 
  Receipt, 
  Clock 
} from 'lucide-react';
import type { RecentActivityItem } from '../../types';

interface RecentActivityWidgetProps {
  activities: RecentActivityItem[];
}

export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({ activities }) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'PAYRUN_FINALIZED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'EMPLOYEE_JOINED':
        return <UserPlus className="w-3.5 h-3.5 text-[#714B67]" />;
      case 'CONTRACT_CREATED':
        return <FileText className="w-3.5 h-3.5 text-indigo-600" />;
      case 'PAYSLIP_GENERATED':
        return <Receipt className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-[#714B67]" />
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent System Activity</h3>
      </div>
      <p className="text-xs text-slate-500 mb-4">Chronological operational milestones across modules</p>

      {activities.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs font-medium">
          No recent activity logged yet.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
          {activities.map((act) => (
            <div key={act.id} className="relative group">
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                {getEventIcon(act.event_type)}
              </div>
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-800 leading-snug">{act.title}</h4>
                <span className="text-[10px] font-medium text-slate-400 shrink-0">
                  {formatTimestamp(act.timestamp)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{act.description}</p>
              {act.actor_name && (
                <span className="text-[10px] text-[#714B67] font-semibold mt-1 inline-block">
                  By {act.actor_name}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
