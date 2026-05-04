import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PerfectScrollbar from 'react-perfect-scrollbar';
import IconCalendar from '../../components/Icon/IconCalendar';
import IconClock from '../../components/Icon/IconClock';
import IconMenu from '../../components/Icon/IconMenu';
import IconSearch from '../../components/Icon/IconSearch';
import { useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { API_BASE_URL } from '../../config/api';

interface AttendanceEntry {
  id: number;
  start_time: string | null;
  end_time: string | null;
  break_start_time: string | null;
  total_work_duration: string;
  total_break_duration: string;
  status: string;
  created_at: string;
}

const Attendance: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isShowMenu, setIsShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);

 useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found. User might not be logged in.');
          return;
        }

        const res = await axios.get(`${API_BASE_URL}/api/attendance/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data && res.data.success) {
          setAttendance(res.data.data || []);
        } else {
          console.error('Failed to load attendance:', res.data?.error || 'Unknown error');
        }
      } catch (err: any) {
        console.error('Error fetching attendance:', err.response?.data || err.message);
        // Optionally show error to user
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
}, []);

  const filteredAttendance = attendance.filter(entry => {
  const searchTermLower = searchTerm.toLowerCase();
  
  return (
    (entry.start_time && entry.start_time.toLowerCase().includes(searchTermLower)) ||
    (entry.end_time && entry.end_time.toLowerCase().includes(searchTermLower)) ||
    (entry.status && entry.status.toLowerCase().includes(searchTermLower))
  );
});

  const formatDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '-' : date.toLocaleString();
  } catch {
    return '-';
  }
};

  return (
    <div className="flex gap-5 relative sm:h-[calc(100vh_-_150px)] h-full">
      {/* Left sidebar menu */}
      <div
        className={`panel p-4 flex-none w-[240px] max-w-full absolute xl:relative z-10 space-y-4 xl:h-auto h-full xl:block ltr:xl:rounded-r-md ltr:rounded-r-none rtl:xl:rounded-l-md rtl:rounded-l-none hidden ${
          isShowMenu && '!block'
        }`}
      >
        <div className="flex flex-col h-full pb-16">
          <div className="pb-5">
            <div className="flex text-center items-center">
              <div className="shrink-0">
                <IconCalendar />
              </div>
              <h3 className="text-lg font-semibold ltr:ml-3 rtl:mr-3">Attendance</h3>
            </div>
          </div>
          <div className="h-px w-full border-b border-white-light dark:border-[#1b2e4b] mb-5"></div>
          <PerfectScrollbar className="relative ltr:pr-3.5 rtl:pl-3.5 ltr:-mr-3.5 rtl:-ml-3.5 h-full grow">
            <div className="space-y-1">
              <button
                type="button"
                className="w-full flex justify-between items-center p-2 hover:bg-white-dark/10 rounded-md dark:hover:text-primary hover:text-primary dark:hover:bg-[#181F32] font-medium h-10 bg-gray-100 dark:text-primary text-primary dark:bg-[#181F32]"
              >
                <div className="flex items-center">
                  <IconClock className="w-4.5 h-4.5 shrink-0" />
                  <div className="ltr:ml-3 rtl:mr-3">All Records</div>
                </div>
                <div className="bg-primary-light dark:bg-[#060818] rounded-md py-0.5 px-2 font-semibold whitespace-nowrap">
                  {attendance.length}
                </div>
              </button>
            </div>
          </PerfectScrollbar>
        </div>
      </div>
      
      {/* Main content area */}
      <div className={`overlay bg-black/60 z-[5] w-full h-full rounded-md absolute hidden ${isShowMenu && '!block xl:!hidden'}`} onClick={() => setIsShowMenu(!isShowMenu)}></div>
      <div className="panel p-0 flex-1 overflow-auto h-full">
        <div className="flex flex-col h-full">
          <div className="p-4 flex sm:flex-row flex-col w-full sm:items-center gap-4">
            <div className="ltr:mr-3 rtl:ml-3 flex items-center">
              <button type="button" className="xl:hidden hover:text-primary block ltr:mr-3 rtl:ml-3" onClick={() => setIsShowMenu(!isShowMenu)}>
                <IconMenu />
              </button>
              <div className="relative group flex-1">
                <input
                  type="text"
                  className="form-input peer ltr:!pr-10 rtl:!pl-10"
                  placeholder="Search attendance records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute ltr:right-[11px] rtl:left-[11px] top-1/2 -translate-y-1/2 peer-focus:text-primary">
                  <IconSearch />
                </div>
              </div>
            </div>
          </div>
          <div className="h-px w-full border-b border-white-light dark:border-[#1b2e4b]"></div>

          <div className="table-responsive grow overflow-y-auto sm:min-h-[300px] min-h-[400px]">
            <table className="table-hover">
              <thead>
                <tr>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Break Start</th>
                  <th>Work Duration</th>
                  <th>Break Duration</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      Loading attendance records...
                    </td>
                  </tr>
                ) : filteredAttendance.length > 0 ? (
                  filteredAttendance.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDateTime(entry.start_time)}</td>
                      <td>{entry.end_time ? formatDateTime(entry.end_time) : '-'}</td>
                      <td>{entry.break_start_time ? formatDateTime(entry.break_start_time) : '-'}</td>
                      <td>{entry.total_work_duration}</td>
                      <td>{entry.total_break_duration}</td>
                      <td>
                        <span className={`badge ${
                          entry.status === 'completed' ? 'badge-outline-success' : 
                          entry.status === 'active' ? 'badge-outline-primary' : 
                          'badge-outline-warning'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                      <td>{formatDateTime(entry.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      No attendance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;


