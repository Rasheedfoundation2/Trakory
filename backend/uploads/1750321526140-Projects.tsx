import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '../../store';
import Swal from 'sweetalert2';
import PerfectScrollbar from 'react-perfect-scrollbar';
import IconClipboardText from '../../components/Icon/IconClipboardText';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconMenu from '../../components/Icon/IconMenu';
import IconSearch from '../../components/Icon/IconSearch';
import IconPlus from '../../components/Icon/IconPlus';
import IconRestore from '../../components/Icon/IconRestore';
import IconDelete from '../../components/Icon/IconDelete';
import IconFolder from '../../components/Icon/IconFolder';
import IconCalendar from '../../components/Icon/IconCalendar';
import IconClock from '../../components/Icon/IconClock';
import IconEdit from '../../components/Icon/IconEdit';

interface Project {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  userName?: string;
  userEmail?: string;
}

const ProjectManagement: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectStartDate, setNewProjectStartDate] = useState('');
  const [newProjectEndDate, setNewProjectEndDate] = useState('');
  const [selectedTab, setSelectedTab] = useState<'active' | 'recycleBin'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [isShowProjectMenu, setIsShowProjectMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectStartDate, setEditProjectStartDate] = useState('');
  const [editProjectEndDate, setEditProjectEndDate] = useState('');
  
  const authState = useSelector((state: IRootState) => state.auth);
  const currentUser = authState?.user || null;
  const isAdmin = currentUser?.role === 'admin';
  const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [searchTerm, projects, selectedTab]);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/project_task`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data.data || []);
    } catch (error: any) {
      console.error('Fetch error:', error);
      setError(error.message);
      showMessage(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects.filter(project => 
      selectedTab === 'active' ? !project.isDeleted : project.isDeleted
    );
    
    if (searchTerm) {
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.userName && project.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (project.userEmail && project.userEmail.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredProjects(filtered);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProjectName.trim()) {
      showMessage('Project name is required', 'error');
      return;
    }

    if (!newProjectStartDate || !newProjectEndDate) {
      showMessage('Both start and end dates are required', 'error');
      return;
    }

    if (new Date(newProjectStartDate) > new Date(newProjectEndDate)) {
      showMessage('End date must be after start date', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/project_task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newProjectName,
          startDate: newProjectStartDate,
          endDate: newProjectEndDate
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      showMessage(data.message || 'Project created successfully!');
      setProjects(prev => [data.data, ...prev]);
      setNewProjectName('');
      setNewProjectStartDate('');
      setNewProjectEndDate('');
    } catch (error: any) {
      console.error('Creation error:', error);
      showMessage(error.message || 'Error creating project', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProject) return;
    if (!editProjectName.trim()) {
      showMessage('Project name is required', 'error');
      return;
    }

    if (!editProjectStartDate || !editProjectEndDate) {
      showMessage('Both start and end dates are required', 'error');
      return;
    }

    if (new Date(editProjectStartDate) > new Date(editProjectEndDate)) {
      showMessage('End date must be after start date', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/project_task/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editProjectName,
          startDate: editProjectStartDate,
          endDate: editProjectEndDate
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update project');
      }

      showMessage(data.message || 'Project updated successfully!');
      setProjects(prev => 
        prev.map(project => 
          project.id === editingProject.id 
            ? { 
                ...project, 
                name: editProjectName,
                startDate: editProjectStartDate,
                endDate: editProjectEndDate,
                updatedAt: new Date().toISOString()
              } 
            : project
        )
      );
      setEditingProject(null);
    } catch (error: any) {
      console.error('Update error:', error);
      showMessage(error.message || 'Error updating project', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    Swal.fire({
      title: 'Move to Recycle Bin?',
      text: 'You can restore this project later',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Move to Bin',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;

          const response = await fetch(`http://localhost:5000/api/project_task/${projectId}/delete`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete project');
          }

          setProjects(prev => 
            prev.map(project => 
              project.id === projectId 
                ? { ...project, isDeleted: true, deletedAt: new Date().toISOString() } 
                : project
            )
          );
          showMessage('Project moved to recycle bin');
        } catch (error: any) {
          showMessage(error.message, 'error');
        }
      }
    });
  };

  const handleRestoreProject = async (projectId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/project_task/${projectId}/restore`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to restore project');
      }

      setProjects(prev => 
        prev.map(project => 
          project.id === projectId 
            ? { ...project, isDeleted: false, updatedAt: new Date().toISOString() } 
            : project
        )
      );
      showMessage('Project restored successfully');
    } catch (error: any) {
      showMessage(error.message, 'error');
    }
  };

  const handlePermanentDelete = (projectId: string) => {
    Swal.fire({
      title: 'Permanently Delete?',
      text: 'This cannot be undone',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Delete Permanently',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;

          const response = await fetch(`http://localhost:5000/api/project_task/${projectId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete project');
          }

          setProjects(prev => prev.filter(project => project.id !== projectId));
          showMessage('Project permanently deleted');
        } catch (error: any) {
          showMessage(error.message, 'error');
        }
      }
    });
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProjectStatus = (startDate: string, endDate: string) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (today < start) {
      return <span className="badge badge-outline-info">Upcoming</span>;
    } else if (today >= start && today <= end) {
      return <span className="badge badge-outline-primary">In Progress</span>;
    } else {
      return <span className="badge badge-outline-success">Completed</span>;
    }
  };

  return (
    <div className="flex gap-5 relative sm:h-[calc(100vh_-_150px)] h-full">
      {/* Left sidebar */}
      <div
        className={`panel p-4 flex-none w-[240px] max-w-full absolute xl:relative z-10 space-y-4 xl:h-auto h-full xl:block ltr:xl:rounded-r-md ltr:rounded-r-none rtl:xl:rounded-l-md rtl:rounded-l-none hidden ${
          isShowProjectMenu && '!block'
        }`}
      >
        <div className="flex flex-col h-full pb-16">
          <div className="pb-5">
            <div className="flex text-center items-center">
              <div className="shrink-0">
                <IconFolder />
              </div>
              <h3 className="text-lg font-semibold ltr:ml-3 rtl:mr-3">Projects</h3>
            </div>
          </div>
          <div className="h-px w-full border-b border-white-light dark:border-[#1b2e4b] mb-5"></div>
          <PerfectScrollbar className="relative ltr:pr-3.5 rtl:pl-3.5 ltr:-mr-3.5 rtl:-ml-3.5 h-full grow">
            <div className="space-y-1">
              <button
                type="button"
                className={`w-full flex justify-between items-center p-2 hover:bg-white-dark/10 rounded-md dark:hover:text-primary hover:text-primary dark:hover:bg-[#181F32] font-medium h-10 ${
                  selectedTab === 'active' ? 'bg-gray-100 dark:text-primary text-primary dark:bg-[#181F32]' : ''
                }`}
                onClick={() => setSelectedTab('active')}
              >
                <div className="flex items-center">
                  <IconFolder className="w-4.5 h-4.5 shrink-0" />
                  <div className="ltr:ml-3 rtl:mr-3">Active</div>
                </div>
                <div className="bg-primary-light dark:bg-[#060818] rounded-md py-0.5 px-2 font-semibold whitespace-nowrap">
                  {projects.filter(p => !p.isDeleted).length}
                </div>
              </button>
              <button
                type="button"
                className={`w-full flex justify-between items-center p-2 hover:bg-white-dark/10 rounded-md dark:hover:text-primary hover:text-primary dark:hover:bg-[#181F32] font-medium h-10 ${
                  selectedTab === 'recycleBin' ? 'bg-gray-100 dark:text-primary text-primary dark:bg-[#181F32]' : ''
                }`}
                onClick={() => setSelectedTab('recycleBin')}
              >
                <div className="flex items-center">
                  <IconTrashLines className="shrink-0" />
                  <div className="ltr:ml-3 rtl:mr-3">Recycle Bin</div>
                </div>
                <div className="bg-primary-light dark:bg-[#060818] rounded-md py-0.5 px-2 font-semibold whitespace-nowrap">
                  {projects.filter(p => p.isDeleted).length}
                </div>
              </button>
            </div>
          </PerfectScrollbar>
        </div>
      </div>
      
      {/* Main content */}
      <div className={`overlay bg-black/60 z-[5] w-full h-full rounded-md absolute hidden ${isShowProjectMenu && '!block xl:!hidden'}`} onClick={() => setIsShowProjectMenu(!isShowProjectMenu)}></div>
      <div className="panel p-0 flex-1 overflow-auto h-full">
        <div className="flex flex-col h-full">
          <div className="p-4 flex sm:flex-row flex-col w-full sm:items-center gap-4">
            <div className="ltr:mr-3 rtl:ml-3 flex items-center">
              <button type="button" className="xl:hidden hover:text-primary block ltr:mr-3 rtl:ml-3" onClick={() => setIsShowProjectMenu(!isShowProjectMenu)}>
                <IconMenu />
              </button>
              <div className="relative group flex-1">
                <input
                  type="text"
                  className="form-input peer ltr:!pr-10 rtl:!pl-10"
                  placeholder={`Search ${selectedTab === 'active' ? 'Active' : 'Deleted'} Projects...`}
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

          {selectedTab === 'active' && (
            <div className="p-4">
              <form onSubmit={handleCreateProject} className="space-y-5">
                <div>
                  <label htmlFor="projectName">Project Name</label>
                  <input
                    id="projectName"
                    type="text"
                    className="form-input"
                    placeholder="Enter project name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate">Start Date</label>
                    <input
                      id="startDate"
                      type="date"
                      className="form-input"
                      value={newProjectStartDate}
                      onChange={(e) => setNewProjectStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate">End Date</label>
                    <input
                      id="endDate"
                      type="date"
                      className="form-input"
                      value={newProjectEndDate}
                      onChange={(e) => setNewProjectEndDate(e.target.value)}
                      required
                      min={newProjectStartDate}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-4">
                  <button 
                    type="submit" 
                    className="btn btn-primary flex items-center" 
                    disabled={isLoading || !newProjectName.trim() || !newProjectStartDate || !newProjectEndDate}
                  >
                    <IconPlus className="w-5 h-5 mr-2" />
                    {isLoading ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
              <div className="h-px w-full border-b border-white-light dark:border-[#1b2e4b] my-4"></div>
            </div>
          )}

          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">
              {selectedTab === 'active' ? 'Active Projects' : 'Recycle Bin'}
            </h3>
            {error && (
              <div className="alert alert-danger mb-4">
                {error}
              </div>
            )}
            <div className="table-responsive grow overflow-y-auto sm:min-h-[300px] min-h-[400px]">
              <table className="table-hover">
                <thead>
                  <tr>
                    {isAdmin && <th>Created By</th>}
                    <th>Project Name</th>
                    {selectedTab === 'active' && <th>Status</th>}
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Created</th>
                    {selectedTab === 'recycleBin' && <th>Deleted</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={isAdmin ? (selectedTab === 'recycleBin' ? 7 : 6) : (selectedTab === 'recycleBin' ? 6 : 5)} className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary inline-block"></div>
                        <span className="ml-2">Loading projects...</span>
                      </td>
                    </tr>
                  ) : filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                      <tr key={project.id}>
                        {isAdmin && (
                          <td>
                            <div className="font-medium">{project.userName}</div>
                            <div className="text-xs text-gray-500">{project.userEmail}</div>
                          </td>
                        )}
                        <td className="font-medium">{project.name}</td>
                        {selectedTab === 'active' && (
                          <td>{getProjectStatus(project.startDate, project.endDate)}</td>
                        )}
                        <td>{formatDate(project.startDate)}</td>
                        <td>{formatDate(project.endDate)}</td>
                        <td>{formatDateTime(project.createdAt)}</td>
                        {selectedTab === 'recycleBin' && (
                          <td>{project.deletedAt ? formatDateTime(project.deletedAt) : 'N/A'}</td>
                        )}
                        <td>
                          <div className="flex items-center space-x-2">
                            {selectedTab === 'active' ? (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-outline-primary p-2"
                                  onClick={() => {
                                    setEditingProject(project);
                                    setEditProjectName(project.name);
                                    setEditProjectStartDate(project.startDate);
                                    setEditProjectEndDate(project.endDate);
                                  }}
                                  title="Edit Project"
                                >
                                  <IconEdit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger p-2"
                                  onClick={() => handleDeleteProject(project.id)}
                                  title="Move to Recycle Bin"
                                >
                                  <IconTrashLines className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-outline-success p-2"
                                  onClick={() => handleRestoreProject(project.id)}
                                  title="Restore Project"
                                >
                                  <IconRestore className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger p-2"
                                  onClick={() => handlePermanentDelete(project.id)}
                                  title="Delete Permanently"
                                >
                                  <IconDelete className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isAdmin ? (selectedTab === 'recycleBin' ? 7 : 6) : (selectedTab === 'recycleBin' ? 6 : 5)} className="text-center py-4">
                        {selectedTab === 'active' 
                          ? 'No active projects found. Create your first project!' 
                          : 'Recycle bin is empty'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Project</h3>
            <form onSubmit={handleUpdateProject} className="space-y-4">
              <div>
                <label htmlFor="editProjectName">Project Name</label>
                <input
                  id="editProjectName"
                  type="text"
                  className="form-input"
                  value={editProjectName}
                  onChange={(e) => setEditProjectName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editStartDate">Start Date</label>
                  <input
                    id="editStartDate"
                    type="date"
                    className="form-input"
                    value={editProjectStartDate}
                    onChange={(e) => setEditProjectStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="editEndDate">End Date</label>
                  <input
                    id="editEndDate"
                    type="date"
                    className="form-input"
                    value={editProjectEndDate}
                    onChange={(e) => setEditProjectEndDate(e.target.value)}
                    required
                    min={editProjectStartDate}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button 
                  type="button" 
                  className="btn btn-outline-danger"
                  onClick={() => setEditingProject(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;