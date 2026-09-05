import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';

export const QuickAttendanceWidget: React.FC = () => {
  const { user } = useAuth();
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
  const fetchStatus = async () => {
    if (!user) return;
    try {
      const res = await apiClient.get('/attendance/my-status');
      if (res.data.is_checked_in) {
        setIsCheckedIn(true);
        setCheckInTime(new Date(res.data.check_in));
      } else {
        setIsCheckedIn(false);
        setCheckInTime(null);
        setElapsedSeconds(0);
      }
    } catch {
      // If endpoint not yet active, default to local state
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user]);

  const handleCheckIn = async () => {
    setIsLoading(true);
    try {
      await apiClient.post('/attendance/check-in');
      setIsCheckedIn(true);
      setCheckInTime(new Date());
    } catch {
      // Local fallback for demo
      setIsCheckedIn(true);
      setCheckInTime(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setIsLoading(true);
    try {
      await apiClient.post('/attendance/check-out');
      setIsCheckedIn(false);
      setCheckInTime(null);
      setElapsedSeconds(0);
    } catch {
      // Local fallback for demo
      setIsCheckedIn(false);
      setCheckInTime(null);
      setElapsedSeconds(0);
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
    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg text-white border border-white/15">
      <div className="flex items-center gap-1.5 text-xs text-purple-100 font-mono">
        <Clock className="w-3.5 h-3.5 text-emerald-300" />
        <span>{currentTime || '09:00 AM'}</span>
      </div>

      <div className="h-4 w-px bg-white/20" />

      {isCheckedIn ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-emerald-300 font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{formatElapsed(elapsedSeconds)}</span>
          </div>
          <button
            onClick={handleCheckOut}
            disabled={isLoading}
            className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white text-xs px-2.5 py-1 rounded transition-colors font-medium shadow-sm cursor-pointer"
            title="Check Out"
          >
            <LogOut className="w-3 h-3" />
            <span>Check Out</span>
          </button>
        </div>
      ) : (
        <button
          onClick={handleCheckIn}
          disabled={isLoading}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1 rounded transition-colors font-medium shadow-sm cursor-pointer"
          title="Check In"
        >
          <LogIn className="w-3 h-3" />
          <span>Check In</span>
        </button>
      )}
    </div>
  );
};
