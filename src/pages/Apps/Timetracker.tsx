import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface TimerData {
  startTime: string | null;
  breakStartTime: string | null;
  totalWorkTime: string;
  totalBreakTime: string;
  isWorking: boolean;
  isOnBreak: boolean;
}

const TimeTracker = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [timerData, setTimerData] = useState<TimerData>({
    startTime: null,
    breakStartTime: null,
    totalWorkTime: '00:00:00',
    totalBreakTime: '00:00:00',
    isWorking: false,
    isOnBreak: false
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format time helper
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Parse time string helper
  const parseTimeString = useCallback((timeStr: string): number => {
    if (!timeStr) return 0;
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }, []);

  // Calculate elapsed time helper
  const calculateElapsedTime = useCallback((start: string | null): number => {
    if (!start) return 0;
    const startTime = new Date(start).getTime();
    const now = new Date().getTime();
    return Math.floor((now - startTime) / 1000);
  }, []);

  // Fetch current timer data
  const fetchTimerData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('http://localhost:5000/api/timers/current', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        setTimerData({
          startTime: response.data.startTime,
          breakStartTime: response.data.breakStartTime,
          totalWorkTime: response.data.totalWorkTime || '00:00:00',
          totalBreakTime: response.data.totalBreakTime || '00:00:00',
          isWorking: response.data.isWorking,
          isOnBreak: response.data.isOnBreak
        });
      }
    } catch (error) {
      console.error('Error fetching timer data:', error);
      setError('Failed to load timer data');
    }
  }, []);

  // Load timer data on component mount
  useEffect(() => {
    fetchTimerData();
  }, [fetchTimerData]);

  // Calculate total times
  const totalWorkSeconds = parseTimeString(timerData.totalWorkTime) + 
    (timerData.isWorking ? calculateElapsedTime(timerData.startTime) : 0);
  const totalBreakSeconds = parseTimeString(timerData.totalBreakTime) + 
    (timerData.isOnBreak ? calculateElapsedTime(timerData.breakStartTime) : 0);

  // Timer control handlers
  const handleStart = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/timers/start',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTimerData({
        ...timerData,
        startTime: response.data.startTime,
        isWorking: true,
        isOnBreak: false,
        totalWorkTime: '00:00:00',
        totalBreakTime: '00:00:00'
      });
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error starting timer:', error);
      setError('Failed to start timer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBreak = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/timers/break',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTimerData({
        ...timerData,
        breakStartTime: response.data.breakStartTime,
        startTime: null,
        isWorking: false,
        isOnBreak: true,
        totalWorkTime: response.data.workDuration
      });
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error starting break:', error);
      setError('Failed to start break');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/timers/continue',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTimerData({
        ...timerData,
        breakStartTime: null,
        startTime: new Date().toISOString(),
        totalBreakTime: response.data.breakDuration,
        isWorking: true,
        isOnBreak: false
      });
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error continuing work:', error);
      setError('Failed to continue work');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/timers/end',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      navigate('/auth/boxed-signin');
    } catch (error) {
      console.error('Error logging out:', error);
      setError('Failed to log out properly');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 ml-auto">
      <div className="text-sm font-semibold">{currentTime}</div>
      
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={isLoading}
          className={`flex items-center justify-center px-4 py-2 rounded-md transition
            ${timerData.isWorking ? 'bg-green-500 hover:bg-green-600' : 
              timerData.isOnBreak ? 'bg-blue-500 hover:bg-blue-600' : 
              'bg-primary hover:bg-primary-dark'} 
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} text-white`}
        >
          {isLoading ? 'Loading...' : 
           timerData.isWorking ? 'Working' : 
           timerData.isOnBreak ? 'On Break' : 'Start Working'}
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 border border-gray-200">
            <div className="p-4">
              {error && (
                <div className="mb-2 p-2 bg-red-100 text-red-700 text-sm rounded">
                  {error}
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="font-bold text-gray-800">Time Tracking</h3>
                <div className="text-sm mt-2 space-y-1">
                  <p className="flex justify-between">
                    <span className="text-gray-600">Work:</span>
                    <span className="font-mono">{formatTime(totalWorkSeconds)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Break:</span>
                    <span className="font-mono">{formatTime(totalBreakSeconds)}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {!timerData.isWorking && !timerData.isOnBreak && (
                  <button
                    onClick={handleStart}
                    disabled={isLoading}
                    className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>▶</span> Start Work
                  </button>
                )}

                {timerData.isWorking && (
                  <button
                    onClick={handleBreak}
                    disabled={isLoading}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>⏸</span> Take Break
                  </button>
                )}

                {timerData.isOnBreak && (
                  <button
                    onClick={handleContinue}
                    disabled={isLoading}
                    className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>▶</span> Continue Work
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>⏹</span> End Session
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeTracker;