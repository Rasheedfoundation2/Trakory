import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PerfectScrollbar from 'react-perfect-scrollbar';
import IconCalendar from '../../components/Icon/IconCalendar';
import IconClock from '../../components/Icon/IconClock';
import IconMenu from '../../components/Icon/IconMenu';
import IconSearch from '../../components/Icon/IconSearch';
import { useSelector } from 'react-redux';
import { IRootState } from '../../store';
import IconUser from '../../components/Icon/IconUser';
import IconFile from '../../components/Icon/IconFile';

interface AttendanceEntry {
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
    start_time: string | null;
    end_time: string | null;
    break_start_time: string | null;
    total_work_duration: string;
    total_break_duration: string;
    status: string;
    created_at: string;
}

interface SummaryData {
    user_id: number;
    user_name: string;
    user_email: string;
    total_hours: number;
    days_worked: number;
    average_hours: number;
}

const Reports: React.FC = () => {
    const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
    const [summary, setSummary] = useState<SummaryData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [filterPeriod, setFilterPeriod] = useState('all');
    const [isShowMenu, setIsShowMenu] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('detailed');
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

                const res = await axios.get('http://localhost:5000/api/attendance/all', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (res.data && res.data.success) {
                    setAttendance(res.data.data || []);
                    calculateSummary(res.data.data || []);
                } else {
                    console.error('Failed to load attendance:', res.data?.error || 'Unknown error');
                }
            } catch (err: any) {
                console.error('Error fetching attendance:', err.response?.data || err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAttendance();
    }, []);

    const calculateSummary = (data: AttendanceEntry[]) => {
        const userMap: Record<number, { user_id: number; user_name: string; user_email: string; total_hours: number; days_worked: number }> = {};

        data.forEach((entry) => {
            if (!userMap[entry.user_id]) {
                userMap[entry.user_id] = {
                    user_id: entry.user_id,
                    user_name: entry.user_name,
                    user_email: entry.user_email,
                    total_hours: 0,
                    days_worked: 0,
                };
            }

            // Convert total_work_duration (HH:MM:SS) to hours
            const [hours, minutes, seconds] = entry.total_work_duration.split(':').map(Number);
            const durationInHours = hours + minutes / 60 + seconds / 3600;

            userMap[entry.user_id].total_hours += durationInHours;
            userMap[entry.user_id].days_worked += 1;
        });

        const summaryData = Object.values(userMap).map((user) => ({
            ...user,
            average_hours: user.total_hours / user.days_worked,
        }));

        setSummary(summaryData);
    };

    // Helper function to check if a date falls within the selected period
    const isDateInPeriod = (dateString: string, period: string): boolean => {
        if (period === 'all') return true;

        const entryDate = new Date(dateString);
        const now = new Date();

        // Set time to start of day for accurate comparison
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());

        switch (period) {
            case 'today':
                return entryDay.getTime() === today.getTime();

            case 'week':
                // Get start of current week (Sunday)
                const startOfWeek = new Date(today);
                const dayOfWeek = today.getDay();
                startOfWeek.setDate(today.getDate() - dayOfWeek);

                // Get end of current week (Saturday)
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);

                return entryDay >= startOfWeek && entryDay <= endOfWeek;

            case 'month':
                return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();

            default:
                return true;
        }
    };

    const filteredAttendance = attendance.filter((entry) => {
        const searchTermLower = searchTerm.toLowerCase();
        const userFilterLower = filterUser.toLowerCase();

        const matchesSearch =
            (entry.user_name && entry.user_name.toLowerCase().includes(searchTermLower)) ||
            (entry.user_email && entry.user_email.toLowerCase().includes(searchTermLower)) ||
            (entry.start_time && entry.start_time.toLowerCase().includes(searchTermLower)) ||
            (entry.end_time && entry.end_time.toLowerCase().includes(searchTermLower)) ||
            (entry.status && entry.status.toLowerCase().includes(searchTermLower));

        const matchesUser = filterUser === '' || entry.user_name.toLowerCase().includes(userFilterLower) || entry.user_email.toLowerCase().includes(userFilterLower);

        // Implement proper date filtering using created_at field
        const matchesPeriod = isDateInPeriod(entry.created_at, filterPeriod);

        return matchesSearch && matchesUser && matchesPeriod;
    });

    // Recalculate summary based on filtered data
    useEffect(() => {
        calculateSummary(filteredAttendance);
    }, [filteredAttendance]);

    const formatDateTime = (dateString: string | null | undefined) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? '-' : date.toLocaleString();
        } catch {
            return '-';
        }
    };

    const formatHours = (hours: number) => {
        const wholeHours = Math.floor(hours);
        const minutes = Math.round((hours - wholeHours) * 60);
        return `${wholeHours}h ${minutes}m`;
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
                            <h3 className="text-lg font-semibold ltr:ml-3 rtl:mr-3">Reports</h3>
                        </div>
                    </div>
                    <div className="h-px w-full border-b border-white-light dark:border-[#1b2e4b] mb-5"></div>
                    <PerfectScrollbar className="relative ltr:pr-3.5 rtl:pl-3.5 ltr:-mr-3.5 rtl:-ml-3.5 h-full grow">
                        <div className="space-y-1">
                            <button
                                type="button"
                                className={`w-full flex justify-between items-center p-2 hover:bg-white-dark/10 rounded-md dark:hover:text-primary hover:text-primary dark:hover:bg-[#181F32] font-medium h-10 ${
                                    activeTab === 'detailed' ? 'bg-gray-100 dark:text-primary text-primary dark:bg-[#181F32]' : ''
                                }`}
                                onClick={() => setActiveTab('detailed')}
                            >
                                <div className="flex items-center">
                                    <IconClock className="w-4.5 h-4.5 shrink-0" />
                                    <div className="ltr:ml-3 rtl:mr-3">Detailed View</div>
                                </div>
                            </button>
                            <button
                                type="button"
                                className={`w-full flex justify-between items-center p-2 hover:bg-white-dark/10 rounded-md dark:hover:text-primary hover:text-primary dark:hover:bg-[#181F32] font-medium h-10 ${
                                    activeTab === 'summary' ? 'bg-gray-100 dark:text-primary text-primary dark:bg-[#181F32]' : ''
                                }`}
                                onClick={() => setActiveTab('summary')}
                            >
                                <div className="flex items-center">
                                    <IconUser className="w-4.5 h-4.5 shrink-0" />
                                    <div className="ltr:ml-3 rtl:mr-3">Summary View</div>
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
                        <div className="flex gap-2">
                            <div className="relative">
                                <select className="form-select peer ltr:!pr-10 rtl:!pl-10" value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
                                    <option value="">All Users</option>
                                    {Array.from(new Set(attendance.map((a) => a.user_id))).map((userId) => {
                                        const user = attendance.find((a) => a.user_id === userId);
                                        return (
                                            <option key={userId} value={user?.user_name || ''}>
                                                {user?.user_name} ({user?.user_email})
                                            </option>
                                        );
                                    })}
                                </select>
                                <div className="absolute ltr:right-[11px] rtl:left-[11px] top-1/2 -translate-y-1/2 peer-focus:text-primary">
                                    <IconUser />
                                </div>
                            </div>
                            <div className="relative">
                                <select className="form-select peer ltr:!pr-10 rtl:!pl-10" value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}>
                                    <option value="all">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                </select>
                                <div className="absolute ltr:right-[11px] rtl:left-[11px] top-1/2 -translate-y-1/2 peer-focus:text-primary">
                                    <IconFile />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="h-px w-full border-b border-white-light dark:border-[#1b2e4b]"></div>

                    {activeTab === 'detailed' ? (
                        <div className="table-responsive grow overflow-y-auto sm:min-h-[300px] min-h-[400px]">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Email</th>
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
                                            <td colSpan={9} className="text-center py-4">
                                                Loading attendance records...
                                            </td>
                                        </tr>
                                    ) : filteredAttendance.length > 0 ? (
                                        filteredAttendance.map((entry) => (
                                            <tr key={entry.id}>
                                                <td>{entry.user_name}</td>
                                                <td>{entry.user_email}</td>
                                                <td>{formatDateTime(entry.start_time)}</td>
                                                <td>{entry.end_time ? formatDateTime(entry.end_time) : '-'}</td>
                                                <td>{entry.break_start_time ? formatDateTime(entry.break_start_time) : '-'}</td>
                                                <td>{entry.total_work_duration}</td>
                                                <td>{entry.total_break_duration}</td>
                                                <td>
                                                    <span
                                                        className={`badge ${
                                                            entry.status === 'completed' ? 'badge-outline-success' : entry.status === 'active' ? 'badge-outline-primary' : 'badge-outline-warning'
                                                        }`}
                                                    >
                                                        {entry.status}
                                                    </span>
                                                </td>
                                                <td>{formatDateTime(entry.created_at)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={9} className="text-center py-4">
                                                No attendance records found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="table-responsive grow overflow-y-auto sm:min-h-[300px] min-h-[400px]">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Email</th>
                                        <th>Days Worked</th>
                                        <th>Total Hours</th>
                                        <th>Avg Hours/Day</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-4">
                                                Loading summary data...
                                            </td>
                                        </tr>
                                    ) : summary.length > 0 ? (
                                        summary.map((user) => (
                                            <tr key={user.user_id}>
                                                <td>{user.user_name}</td>
                                                <td>{user.user_email}</td>
                                                <td>{user.days_worked}</td>
                                                <td>{formatHours(user.total_hours)}</td>
                                                <td>{formatHours(user.average_hours)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="text-center py-4">
                                                No summary data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
