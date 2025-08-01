import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IRootState } from '../../store';
import Swal from 'sweetalert2';
import PerfectScrollbar from 'react-perfect-scrollbar';
import IconClipboardText from '../../components/Icon/IconClipboardText';
import IconThumbUp from '../../components/Icon/IconThumbUp';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconMenu from '../../components/Icon/IconMenu';
import IconSearch from '../../components/Icon/IconSearch';
import IconChecks from '../../components/Icon/IconChecks';
import IconX from '../../components/Icon/IconX';

type FormType = 'leave' | 'attendanceIssue' | 'breakIssue';

interface Approval {
    id: string;
    type: FormType;
    details: string;
    from_date?: string;
    to_date?: string;
    issue_date?: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at?: string;
    user_name: string;
    user_email: string;
}

interface AuthState {
    user: {
        role: string;
        // Add other user properties as needed
    } | null;
    // Add other auth state properties as needed
}

const ApprovalSystem: React.FC = () => {
    const [activeForm, setActiveForm] = useState<FormType>('leave');
    const [leaveData, setLeaveData] = useState({
        fromDate: '',
        toDate: '',
        reason: '',
    });
    const [attendanceIssueData, setAttendanceIssueData] = useState({
        issueDate: '',
        description: '',
    });
    const [breakIssueData, setBreakIssueData] = useState({
        issueDate: '',
        description: '',
    });
    const [allApprovals, setAllApprovals] = useState<Approval[]>([]);
    const [filteredApprovals, setFilteredApprovals] = useState<Approval[]>([]);
    const [selectedTab, setSelectedTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [isShowApprovalMenu, setIsShowApprovalMenu] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const authState = useSelector((state: IRootState) => state.auth);
    const currentUser = authState?.user || null;
    const isAdmin = currentUser?.role === 'admin';
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);

    useEffect(() => {
        fetchApprovals();
    }, [selectedTab]);

    useEffect(() => {
        filterApprovals();
    }, [searchTerm, allApprovals, selectedTab]);

    const fetchApprovals = async () => {
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('token');

        if (!token) {
            navigate('/auth/login');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/approvals', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch approvals');
            }

            setAllApprovals(data.data || []);
        } catch (error: any) {
            console.error('Fetch error:', error);
            setError(error.message || 'Error fetching approvals');
            showMessage(error.message || 'Error fetching approvals', 'error');
            setAllApprovals([]);
        } finally {
            setIsLoading(false);
        }
    };

    const filterApprovals = () => {
        let filtered = allApprovals.filter((approval) => approval.status === selectedTab);

        if (searchTerm) {
            filtered = filtered.filter(
                (approval) =>
                    approval.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    approval.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    approval.user_email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredApprovals(filtered);
    };

    const handleLeaveChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLeaveData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAttendanceIssueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setAttendanceIssueData((prev) => ({ ...prev, [name]: value }));
    };

    const handleBreakIssueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setBreakIssueData((prev) => ({ ...prev, [name]: value }));
    };

    const handleLeaveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/auth/login');
                return;
            }

            if (!leaveData.fromDate || !leaveData.toDate || !leaveData.reason) {
                throw new Error('All fields are required');
            }

            if (new Date(leaveData.fromDate) > new Date(leaveData.toDate)) {
                throw new Error('To date must be after from date');
            }

            const response = await fetch('http://localhost:5000/api/approvals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    type: 'leave',
                    details: leaveData.reason,
                    fromDate: leaveData.fromDate,
                    toDate: leaveData.toDate,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit leave request');
            }

            showMessage(data.message || 'Leave request submitted successfully!');
            setLeaveData({ fromDate: '', toDate: '', reason: '' });
            fetchApprovals();
        } catch (error: any) {
            console.error('Submission error:', error);
            showMessage(error.message || 'Error submitting leave request', 'error');
        }
    };

    const handleAttendanceIssueSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/auth/login');
                return;
            }

            if (!attendanceIssueData.issueDate || !attendanceIssueData.description) {
                throw new Error('All fields are required');
            }

            const response = await fetch('http://localhost:5000/api/approvals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    type: 'attendanceIssue',
                    details: attendanceIssueData.description,
                    issueDate: attendanceIssueData.issueDate,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to report attendance issue');
            }

            showMessage(data.message || 'Attendance issue reported successfully!');
            setAttendanceIssueData({ issueDate: '', description: '' });
            fetchApprovals();
        } catch (error: any) {
            console.error('Submission error:', error);
            showMessage(error.message || 'Error reporting attendance issue', 'error');
        }
    };

    const handleBreakIssueSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/auth/login');
                return;
            }

            if (!breakIssueData.issueDate || !breakIssueData.description) {
                throw new Error('All fields are required');
            }

            const response = await fetch('http://localhost:5000/api/approvals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    type: 'breakIssue',
                    details: breakIssueData.description,
                    issueDate: breakIssueData.issueDate,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to report break issue');
            }

            showMessage(data.message || 'Break issue reported successfully!');
            setBreakIssueData({ issueDate: '', description: '' });
            fetchApprovals();
        } catch (error: any) {
            console.error('Submission error:', error);
            showMessage(error.message || 'Error reporting break issue', 'error');
        }
    };

    const handleCancel = () => {
        navigate(-1);
    };

    const showMessage = (msg = '', type = 'success') => {
        const toast: any = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
            customClass: { container: 'toast' },
        });
        toast.fire({
            icon: type,
            title: msg,
            padding: '10px 20px',
        });
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    return (
        <div className="flex gap-5 relative sm:h-[calc(100vh_-_150px)] h-full">
            {/* Left sidebar menu */}
            <div
                className={`panel p-4 flex-none w-[240px] max-w-full absolute xl:relative z-10 space-y-4 xl:h-auto h-full xl:block ltr:xl:rounded-r-md ltr:rounded-r-none rtl:xl:rounded-l-md rtl:rounded-l-none hidden ${
                    isShowApprovalMenu && '!block'
                }`}
            >
                <div className="flex flex-col h-full pb-16">
                    <div className="pb-5">
                        <div className="flex text-center items-center">
                            <div className="shrink-0">
                                <IconClipboardText />
                            </div>
                            <h3 className="text-lg font-semibold ltr:ml-3 rtl:mr-3">My Approvals</h3>
                        </div>
                    </div>
                    <div className="h-px w-full border-b border-white-light dark:border-[#1b2e4b] mb-5"></div>
                    <PerfectScrollbar className="relative ltr:pr-3.5 rtl:pl-3.5 ltr:-mr-3.5 rtl:-ml-3.5 h-full grow">
                        <div className="space-y-1">
                            <button
                                type="button"
                                className={`w-full flex justify-between items-center p-2 hover:bg-white-dark/10 rounded-md dark:hover:text-primary hover:text-primary dark:hover:bg-[#181F32] font-medium h-10 ${
                                    selectedTab === 'pending' ? 'bg-gray-100 dark:text-primary text-primary dark:bg-[#181F32]' : ''
                                }`}
                                onClick={() => setSelectedTab('pending')}
                            >
                                <div className="flex items-center">
                                    <IconClipboardText className="w-4.5 h-4.5 shrink-0" />
                                    <div className="ltr:ml-3 rtl:mr-3">Pending</div>
                                </div>
                                <div className="bg-primary-light dark:bg-[#060818] rounded-md py-0.5 px-2 font-semibold whitespace-nowrap">
                                    {allApprovals.filter((d) => d.status === 'pending').length}
                                </div>
                            </button>
                            <button
                                type="button"
                                className={`w-full flex justify-between items-center p-2 hover:bg-white-dark/10 rounded-md dark:hover:text-primary hover:text-primary dark:hover:bg-[#181F32] font-medium h-10 ${
                                    selectedTab === 'approved' ? 'bg-gray-100 dark:text-primary text-primary dark:bg-[#181F32]' : ''
                                }`}
                                onClick={() => setSelectedTab('approved')}
                            >
                                <div className="flex items-center">
                                    <IconThumbUp className="w-5 h-5 shrink-0" />
                                    <div className="ltr:ml-3 rtl:mr-3">Approved</div>
                                </div>
                                <div className="bg-primary-light dark:bg-[#060818] rounded-md py-0.5 px-2 font-semibold whitespace-nowrap">
                                    {allApprovals.filter((d) => d.status === 'approved').length}
                                </div>
                            </button>
                            <button
                                type="button"
                                className={`w-full flex justify-between items-center p-2 hover:bg-white-dark/10 rounded-md dark:hover:text-primary hover:text-primary dark:hover:bg-[#181F32] font-medium h-10 ${
                                    selectedTab === 'rejected' ? 'bg-gray-100 dark:text-primary text-primary dark:bg-[#181F32]' : ''
                                }`}
                                onClick={() => setSelectedTab('rejected')}
                            >
                                <div className="flex items-center">
                                    <IconTrashLines className="shrink-0" />
                                    <div className="ltr:ml-3 rtl:mr-3">Rejected</div>
                                </div>
                                <div className="bg-primary-light dark:bg-[#060818] rounded-md py-0.5 px-2 font-semibold whitespace-nowrap">
                                    {allApprovals.filter((d) => d.status === 'rejected').length}
                                </div>
                            </button>
                        </div>
                    </PerfectScrollbar>
                </div>
            </div>

            {/* Main content area */}
            <div
                className={`overlay bg-black/60 z-[5] w-full h-full rounded-md absolute hidden ${isShowApprovalMenu && '!block xl:!hidden'}`}
                onClick={() => setIsShowApprovalMenu(!isShowApprovalMenu)}
            ></div>
            <div className="panel p-0 flex-1 overflow-auto h-full">
                <div className="flex flex-col h-full">
                    <div className="p-4 flex sm:flex-row flex-col w-full sm:items-center gap-4">
                        <div className="ltr:mr-3 rtl:ml-3 flex items-center">
                            <button type="button" className="xl:hidden hover:text-primary block ltr:mr-3 rtl:ml-3" onClick={() => setIsShowApprovalMenu(!isShowApprovalMenu)}>
                                <IconMenu />
                            </button>
                            <div className="relative group flex-1">
                                <input
                                    type="text"
                                    className="form-input peer ltr:!pr-10 rtl:!pl-10"
                                    placeholder="Search My Approvals..."
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

                    {!isAdmin && (
                        <>
                            <div className="p-4">
                                <div className="mb-5">
                                    <div className="flex border-b border-white-light dark:border-[#1b2e4b]">
                                        <button
                                            type="button"
                                            className={`py-2 px-4 border-b border-transparent hover:border-primary hover:text-primary ${activeForm === 'leave' ? '!border-primary text-primary' : ''}`}
                                            onClick={() => setActiveForm('leave')}
                                        >
                                            Request Leave
                                        </button>
                                        <button
                                            type="button"
                                            className={`py-2 px-4 border-b border-transparent hover:border-primary hover:text-primary ${
                                                activeForm === 'attendanceIssue' ? '!border-primary text-primary' : ''
                                            }`}
                                            onClick={() => setActiveForm('attendanceIssue')}
                                        >
                                            Report Login/Logout Issue
                                        </button>
                                        <button
                                            type="button"
                                            className={`py-2 px-4 border-b border-transparent hover:border-primary hover:text-primary ${
                                                activeForm === 'breakIssue' ? '!border-primary text-primary' : ''
                                            }`}
                                            onClick={() => setActiveForm('breakIssue')}
                                        >
                                            Report Break Issue
                                        </button>
                                    </div>
                                </div>

                                {activeForm === 'leave' ? (
                                    <form onSubmit={handleLeaveSubmit} className="space-y-5">
                                        <div>
                                            <label htmlFor="fromDate">From Date</label>
                                            <input id="fromDate" type="date" name="fromDate" className="form-input" value={leaveData.fromDate} onChange={handleLeaveChange} required />
                                        </div>
                                        <div>
                                            <label htmlFor="toDate">To Date</label>
                                            <input id="toDate" type="date" name="toDate" className="form-input" value={leaveData.toDate} onChange={handleLeaveChange} required />
                                        </div>
                                        <div>
                                            <label htmlFor="reason">Reason</label>
                                            <textarea id="reason" name="reason" rows={4} className="form-textarea" value={leaveData.reason} onChange={handleLeaveChange} required></textarea>
                                        </div>
                                        <div className="flex justify-end space-x-4">
                                            <button type="button" className="btn btn-outline-danger" onClick={handleCancel}>
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                                {isLoading ? 'Submitting...' : 'Send Request'}
                                            </button>
                                        </div>
                                    </form>
                                ) : activeForm === 'attendanceIssue' ? (
                                    <form onSubmit={handleAttendanceIssueSubmit} className="space-y-5">
                                        <div>
                                            <label htmlFor="issueDate">Date of Issue</label>
                                            <input
                                                id="issueDate"
                                                type="date"
                                                name="issueDate"
                                                className="form-input"
                                                value={attendanceIssueData.issueDate}
                                                onChange={handleAttendanceIssueChange}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="description">Describe your login/logout issue</label>
                                            <textarea
                                                id="description"
                                                name="description"
                                                rows={6}
                                                className="form-textarea"
                                                value={attendanceIssueData.description}
                                                onChange={handleAttendanceIssueChange}
                                                required
                                                placeholder="Please describe the issue you faced with your login or logout time..."
                                            ></textarea>
                                        </div>
                                        <div className="flex justify-end space-x-4">
                                            <button type="button" className="btn btn-outline-danger" onClick={handleCancel}>
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                                {isLoading ? 'Submitting...' : 'Report Issue'}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <form onSubmit={handleBreakIssueSubmit} className="space-y-5">
                                        <div>
                                            <label htmlFor="breakIssueDate">Date of Issue</label>
                                            <input
                                                id="breakIssueDate"
                                                type="date"
                                                name="issueDate"
                                                className="form-input"
                                                value={breakIssueData.issueDate}
                                                onChange={handleBreakIssueChange}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="breakDescription">Describe your break issue</label>
                                            <textarea
                                                id="breakDescription"
                                                name="description"
                                                rows={6}
                                                className="form-textarea"
                                                value={breakIssueData.description}
                                                onChange={handleBreakIssueChange}
                                                required
                                                placeholder="Please describe the issue you faced with your break time..."
                                            ></textarea>
                                        </div>
                                        <div className="flex justify-end space-x-4">
                                            <button type="button" className="btn btn-outline-danger" onClick={handleCancel}>
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                                {isLoading ? 'Submitting...' : 'Report Issue'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>

                            <div className="h-px w-full border-b border-white-light dark:border-[#1b2e4b]"></div>
                        </>
                    )}

                    <div className="p-4">
                        <h3 className="text-lg font-semibold mb-4">{isAdmin ? 'Approval Requests' : 'My Approval History'}</h3>
                        {error && <div className="alert alert-danger mb-4">{error}</div>}
                        <div className="table-responsive grow overflow-y-auto sm:min-h-[300px] min-h-[400px]">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        {isAdmin && <th>Requested By</th>}
                                        <th>Type</th>
                                        <th>Details</th>
                                        {selectedTab === 'pending' && <th>Submitted On</th>}
                                        {selectedTab !== 'pending' && <th>Processed On</th>}
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={isAdmin ? 6 : 4} className="text-center py-4">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary inline-block"></div>
                                                <span className="ml-2">Loading approvals...</span>
                                            </td>
                                        </tr>
                                    ) : filteredApprovals.length > 0 ? (
                                        filteredApprovals.map((approval) => (
                                            <tr key={approval.id}>
                                                {isAdmin && (
                                                    <td>
                                                        <div className="font-medium">{approval.user_name}</div>
                                                        <div className="text-xs text-gray-500">{approval.user_email}</div>
                                                    </td>
                                                )}
                                                <td className="capitalize">{approval.type}</td>
                                                <td className="max-w-xs whitespace-pre-wrap">
                                                    {approval.type === 'leave' ? (
                                                        <div>
                                                            <div className="font-medium">From: {formatDate(approval.from_date)}</div>
                                                            <div className="font-medium">To: {formatDate(approval.to_date)}</div>
                                                            <div className="mt-1">{approval.details}</div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="font-medium">Date: {formatDate(approval.issue_date)}</div>
                                                            <div className="mt-1">{approval.details}</div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    {selectedTab === 'pending'
                                                        ? formatDateTime(approval.created_at)
                                                        : approval.updated_at
                                                        ? formatDateTime(approval.updated_at)
                                                        : formatDateTime(approval.created_at)}
                                                </td>
                                                <td>
                                                    <div className="flex items-center">
                                                        {approval.status === 'approved' ? (
                                                            <span className="badge badge-outline-success flex items-center">
                                                                <IconChecks className="w-4 h-4 mr-1" />
                                                                Approved
                                                            </span>
                                                        ) : approval.status === 'rejected' ? (
                                                            <span className="badge badge-outline-danger flex items-center">
                                                                <IconX className="w-4 h-4 mr-1" />
                                                                Rejected
                                                            </span>
                                                        ) : (
                                                            <span className="badge badge-outline-warning">Pending</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={isAdmin ? 6 : 4} className="text-center py-4">
                                                No approvals found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApprovalSystem;
