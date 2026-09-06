import React, { useState, useEffect, useCallback } from 'react';
import { Clock, LogIn, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { attendanceService } from '../../services/attendanceService';

export const QuickAttendanceWidget: React.FC = () => {
  const { user } = useAuth();
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      if (isCheckedIn && checkInTime) {
        const diff = Math.floor((now.getTime() - checkInTime.getTime()) / 1000);
        setElapsedSeconds(diff >= 0 ? diff : 0);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isCheckedIn, checkInTime]);

  // Fetch today's attendance status
  const fetchStatus = useCallback(async () => {
    if (!user) return;
    try {
      const data = await attendanceService.getMyStatus();
      if (data.is_checked_in && data.check_in) {
        setIsCheckedIn(true);
        const checkInDate = new Date(data.check_in);
        setCheckInTime(checkInDate);
        const now = new Date();
        const diff = Math.floor((now.getTime() - checkInDate.getTime()) / 1000);
        setElapsedSeconds(diff >= 0 ? diff : data.worked_seconds);
      } else {
        setIsCheckedIn(false);
        setCheckInTime(null);
        setElapsedSeconds(0);
      }
      setErrorMessage(null);
    } catch {
      // Ignore network errors on initial mount
    }
  }, [user]);

  useEffect(() => {
    fetchStatus();

    // Listen for global attendance updates
    const handleGlobalUpdate = () => {
      fetchStatus();
    };
    window.addEventListener('attendance-updated', handleGlobalUpdate);
    return () => window.removeEventListener('attendance-updated', handleGlobalUpdate);
  }, [fetchStatus]);

  const handleCheckIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await attendanceService.checkIn();
      setIsCheckedIn(true);
      if (res.check_in) {
        setCheckInTime(new Date(res.check_in));
      } else {
        setCheckInTime(new Date());
      }
      window.dispatchEvent(new CustomEvent('attendance-updated'));
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to check in';
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await attendanceService.checkOut();
      setIsCheckedIn(false);
      setCheckInTime(null);
      setElapsedSeconds(0);
      window.dispatchEvent(new CustomEvent('attendance-updated'));
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to check out';
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const formatElapsed = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100/90 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs transition-all">
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-mono font-semibold">
          <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>{currentTime || '09:00:00 AM'}</span>
        </div>

        <div className="h-4 w-px bg-slate-200" />

        {isCheckedIn ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{formatElapsed(elapsedSeconds)}</span>
            </div>
            <button
              onClick={handleCheckOut}
              disabled={isLoading}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs px-2.5 py-1 rounded-lg transition-all font-medium shadow-2xs cursor-pointer disabled:opacity-50"
              title="Click to Check Out"
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
              <span>Check Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleCheckIn}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs px-3 py-1 rounded-lg transition-all font-medium shadow-2xs cursor-pointer disabled:opacity-50"
            title="Click to Check In"
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogIn className="w-3 h-3" />}
            <span>Check In</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-rose-600 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg border border-rose-700 whitespace-nowrap animate-in fade-in slide-in-from-top-1">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
