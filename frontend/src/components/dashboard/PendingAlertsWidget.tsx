import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PendingAlertItem } from '../../types';

interface PendingAlertsWidgetProps {
  alerts: PendingAlertItem[];
}

export const PendingAlertsWidget: React.FC<PendingAlertsWidgetProps> = ({ alerts }) => {
  const navigate = useNavigate();

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          badge: 'bg-rose-600 text-white',
          text: 'text-rose-900',
          icon: <ShieldAlert className="w-4 h-4 text-rose-600" />,
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          badge: 'bg-orange-500 text-white',
          text: 'text-orange-900',
          icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          badge: 'bg-amber-500 text-white',
          text: 'text-amber-900',
          icon: <Clock className="w-4 h-4 text-amber-600" />,
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          badge: 'bg-blue-500 text-white',
          text: 'text-blue-900',
          icon: <HelpCircle className="w-4 h-4 text-blue-600" />,
        };
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Pending Attention & Exceptions</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Items requiring administrator or manager action</p>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          alerts.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
        }`}>
          {alerts.length} Active
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-1.5" />
          <p className="text-xs font-bold text-slate-700">All Systems Operational</p>
          <p className="text-[11px] text-slate-400">No payroll processing failures or contract anomalies.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {alerts.map((alert) => {
            const style = getPriorityStyle(alert.priority);
            return (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${style.bg} ${style.border} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all hover:shadow-xs`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">{style.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded uppercase ${style.badge}`}>
                        {alert.priority}
                      </span>
                      <h4 className={`text-xs font-bold ${style.text}`}>{alert.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{alert.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(alert.action_url)}
                  className="shrink-0 flex items-center gap-1 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  <span>{alert.action_label}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
