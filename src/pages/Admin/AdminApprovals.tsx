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
import IconCalendar from '../../components/Icon/IconCalendar';
import IconClock from '../../components/Icon/IconClock';

type ApprovalType = 'leave' | 'attendanceIssue' | 'breakIssue';

interface Approval {
  id: string;
  type: ApprovalType;
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

const AdminApprovals: React.FC = () => {
  const [allApprovals, setAllApprovals] = useState<Approval[]>([]);
  const [filteredApprovals, setFilteredApprovals] = useState<Approval[]>([]);
  const [activeTab, setActiveTab] = useState<ApprovalType>('leave');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShowMenu, setIsShowMenu] = useState(false);
  const navigate = useNavigate();
  const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  

  const fetchAllApprovals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth/login');
        return;
      }

     const response = await fetch(
    `${apiBaseUrl}/api/approvals?status=${statusFilter}&adminView=true`, { //for the admin only Approval so it can only see his own approval request 
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch approvals. Status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch approvals');
      }

      setAllApprovals(data.data || []);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch approvals');
      showMessage('Failed to load approvals', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllApprovals();
  }, [statusFilter]);

 

// Update filteredApprovals useEffect
useEffect(() => {
  const filtered = allApprovals.filter(approval => {
    const matchesType = approval.type === activeTab;
    const matchesSearch = searchTerm === '' || 
      approval.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  });
  setFilteredApprovals(filtered);
}, [searchTerm, allApprovals, activeTab]);

  const updateApprovalStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth/login');
        return;
      }

      const response = await fetch(`${apiBaseUrl}/api/approvals/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update approval');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update approval');
      }

      showMessage(`Request ${status} successfully!`);
      fetchAllApprovals(); // Refresh the list
    } catch (error) {
      console.error('Error updating approval:', error);
      showMessage(error instanceof Error ? error.message : 'Failed to update approval', 'error');
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    Swal.fire({
      toast: true,
      position: 'top',
      title: msg,
      icon: type,
      showConfirmButton: false,
      timer: 3000
    });
  };

 const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  
  try {
    // Handle ISO format (2025-05-31)
    if (dateString.includes('T')) {
      return new Date(dateString).toLocaleDateString();
    }
    // Handle MySQL format (2025-05-31)
    return new Date(dateString + 'T00:00:00').toLocaleDateString();
  } catch (e) {
    console.error('Error formatting date:', dateString, e);
    return 'Invalid Date';
  }
};
  

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getTabTitle = (tab: ApprovalType) => {
    switch (tab) {
      case 'leave': return 'Leave Applications';
      case 'attendanceIssue': return 'Attendance Issues';
      case 'breakIssue': return 'Break Issues';
      default: return '';
    }
  };

// Update getApprovalCount function
// Update getApprovalCount function
const getApprovalCount = (type: ApprovalType) => {
  return allApprovals.filter(approval => approval.type === type).length;
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
                <IconClipboardText />
              </div>
              <h3 className="text-lg font-semibold ltr:ml-3 rtl:mr-3">Approvals</h3>
            </div>
          </div>
          <div className="h-px w-full border-b border-white-light dark:border-[#1b2e4b] mb-5"></div>
          <PerfectScrollbar className="relative ltr:pr-3.5 rtl:pl-3.5 ltr:-mr-3.5 rtl:-ml-3.5 h-full grow">
            <div className="space-y-1">
              {(['leave', 'attendanceIssue', 'breakIssue'] as ApprovalType[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`w-full flex justify-between items-center p-2 hover:bg-white-dark/10 rounded-md dark:hover:text-primary hover:text-primary dark:hover:bg-[#181F32] font-medium h-10 ${
                    activeTab === tab ? 'bg-gray-100 dark:text-primary text-primary dark:bg-[#181F32]' : ''
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  <div className="flex items-center">
                    {tab === 'leave' && <IconCalendar className="w-4.5 h-4.5 shrink-0" />}
                    {tab === 'attendanceIssue' && <IconClock className="w-4.5 h-4.5 shrink-0" />}
                    {tab === 'breakIssue' && <IconMenu className="w-4.5 h-4.5 shrink-0" />}
                    <div className="ltr:ml-3 rtl:mr-3">{getTabTitle(tab)}</div>
                  </div>
                  <div className="bg-primary-light dark:bg-[#060818] rounded-md py-0.5 px-2 font-semibold whitespace-nowrap">
                    {getApprovalCount(tab)}
                  </div>
                </button>
              ))}
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
                  placeholder="Search approvals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute ltr:right-[11px] rtl:left-[11px] top-1/2 -translate-y-1/2 peer-focus:text-primary">
                  <IconSearch />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                className={`px-4 py-2 rounded ${
                  statusFilter === 'pending' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-[#191e3a]'
                }`}
                onClick={() => setStatusFilter('pending')}
              >
                Pending
              </button>
              <button
                className={`px-4 py-2 rounded ${
                  statusFilter === 'approved' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-[#191e3a]'
                }`}
                onClick={() => setStatusFilter('approved')}
              >
                Approved
              </button>
              <button
                className={`px-4 py-2 rounded ${
                  statusFilter === 'rejected' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-[#191e3a]'
                }`}
                onClick={() => setStatusFilter('rejected')}
              >
                Rejected
              </button>
            </div>
          </div>
          <div className="h-px w-full border-b border-white-light dark:border-[#1b2e4b]"></div>

          {error && (
            <div className="p-4 mb-4 text-white bg-danger">
              {error}
            </div>
          )}

          <div className="table-responsive grow overflow-y-auto sm:min-h-[300px] min-h-[400px]">
            <table className="table-hover">
              <thead>
                <tr>
                  <th>Employee</th>
                  {activeTab === 'leave' ? (
                    <>
                      <th>From Date</th>
                      <th>To Date</th>
                    </>
                  ) : (
                    <th>Issue Date</th>
                  )}
                  <th>Details</th>
                  <th>Submitted On</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      Loading approvals...
                    </td>
                  </tr>
                ) : filteredApprovals.length > 0 ? (
                  filteredApprovals.map((approval) => (
                    <tr key={approval.id}>
                      <td>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-medium">
                              {approval.user_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {approval.user_name}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">
                              {approval.user_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {activeTab === 'leave' ? (
                        <>
                          <td className="whitespace-nowrap">{formatDate(approval.from_date)}</td>
                          <td className="whitespace-nowrap">{formatDate(approval.to_date)}</td>
                        </>
                      ) : (
                        <td className="whitespace-nowrap">{formatDate(approval.issue_date)}
                        {approval.issue_date ? formatDate(approval.issue_date) : formatDate(approval.created_at)}
                        </td>
                      )}
                      
                      <td className="max-w-xs">{approval.details}</td>
                      <td className="whitespace-nowrap">{formatDateTime(approval.created_at)}</td>
                      <td>
                        <span className={`badge ${
                          approval.status === 'approved' ? 'badge-outline-success' : 
                          approval.status === 'rejected' ? 'badge-outline-danger' : 
                          'badge-outline-warning'
                        }`}>
                          {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        {approval.status === 'pending' ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updateApprovalStatus(approval.id, 'approved')}
                              className="btn btn-success btn-sm"
                            >
                              <IconChecks className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => updateApprovalStatus(approval.id, 'rejected')}
                              className="btn btn-danger btn-sm"
                            >
                              <IconX className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => updateApprovalStatus(
                              approval.id, 
                              approval.status === 'approved' ? 'rejected' : 'approved'
                            )}
                            className="btn btn-primary btn-sm"
                          >
                            Toggle Status
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      No {statusFilter} {activeTab === 'leave' 
                        ? 'leave applications' 
                        : activeTab === 'attendanceIssue' 
                          ? 'attendance issues' 
                          : 'break issues'} found
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

export default AdminApprovals;