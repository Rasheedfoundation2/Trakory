import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

type ServiceType = 'Google Docs' | 'MS Office Online' | 'Office 365' | 'Desktop applications';

interface DriveFile {
  id: number;
  name: string;
  size: string;
  type: string;
  item_type: 'file' | 'folder';
  path?: string;
  user_id: number;
  parent_id?: number | null;
  created_at: string;
  updated_at: string;
  category?: string;
  content?: string;
  headers?: string[];
  theme?: string;
  slides?: number;
  service?: ServiceType;
  external_url?: string;
}

interface RecycleBinItem {
  id: number;
  file_id: number;
  name: string;
  size: string;
  type: string;
  item_type: 'file' | 'folder';
  original_path: string;
  date_deleted: string;
  file_path?: string;
}

const Drive = () => {
  const [selectedItems, setSelectedItems] = useState<number>(0);
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<ServiceType | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [selectedDocType, setSelectedDocType] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentView, setCurrentView] = useState<'my-drive' | 'drive-cleanup' | 'recycle-bin'>('my-drive');
  const [searchTerm, setSearchTerm] = useState('');
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [recycleBinItems, setRecycleBinItems] = useState<RecycleBinItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [folderPath, setFolderPath] = useState<DriveFile[]>([]);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showDocCreationModal, setShowDocCreationModal] = useState(false);
  const [showDocEditModal, setShowDocEditModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docContent, setDocContent] = useState('');
  const [currentDocId, setCurrentDocId] = useState<number | null>(null);
  const [showSheetCreationModal, setShowSheetCreationModal] = useState(false);
  const [showSheetEditModal, setShowSheetEditModal] = useState(false);
  const [sheetName, setSheetName] = useState('');
  const [sheetHeaders, setSheetHeaders] = useState('');
  const [sheetData, setSheetData] = useState<string[][]>([]);
  const [currentSheetId, setCurrentSheetId] = useState<number | null>(null);
  const [showPresentationCreationModal, setShowPresentationCreationModal] = useState(false);
  const [showPresentationEditModal, setShowPresentationEditModal] = useState(false);
  const [presentationName, setPresentationName] = useState('');
  const [presentationTheme, setPresentationTheme] = useState('');
  const [slideCount, setSlideCount] = useState(1);
  const [currentPresentationId, setCurrentPresentationId] = useState<number | null>(null);
  const [showDeepCleanupModal, setShowDeepCleanupModal] = useState(false);
  const [cleanupProgress, setCleanupProgress] = useState(0);
  const [cleanupResults, setCleanupResults] = useState({
    duplicateFiles: 0,
    largeFiles: 0,
    temporaryFiles: 0,
    totalSpaceSaved: '0 MB'
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const API_BASE_URL = `${API_BASE_URL}/api/drive`;

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAddDropdownOpen(false);
        setActiveSubmenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentView === 'recycle-bin') {
      fetchRecycleBin();
    } else {
      fetchFiles();
    }
  }, [currentView, currentFolderId]);

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Please login to access your drive');
        return;
      }

      const params: any = { parentId: currentFolderId };
      
      const response = await axios.get(`${API_BASE_URL}/folders`, {
        params,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
      showNotification('error', 'Failed to load items');
    }
  };

  const fetchRecycleBin = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Please login to access your drive');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/recycle-bin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setRecycleBinItems(response.data);
    } catch (error) {
      console.error('Error fetching recycle bin:', error);
      showNotification('error', 'Failed to load recycle bin');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          showNotification('error', 'Please login to upload files');
          return;
        }

        const formData = new FormData();
        formData.append('file', file);
        if (currentFolderId) {
          formData.append('parentId', currentFolderId.toString());
        }

        const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        showNotification('success', 'File uploaded successfully');
        fetchFiles();
      } catch (error: unknown) {
  console.error('Error uploading file:', error);
  let errorMsg = 'File upload failed';

  if (axios.isAxiosError(error) && error.response) {
    errorMsg += `: ${error.response.data.error || error.response.statusText}`;
  }

  showNotification('error', errorMsg);
}

    }
  };

  const handleViewChange = (view: 'my-drive' | 'drive-cleanup' | 'recycle-bin') => {
    setCurrentView(view);
    setCurrentFolderId(null);
    setFolderPath([]);
  };

  const handleAddItem = (itemType: string, service?: ServiceType) => {
    if (service) {
      setSelectedService(service);
      setSelectedDocType(itemType);
      
      if (itemType === 'Document') {
        setShowDocCreationModal(true);
      } else if (itemType === 'Spreadsheet') {
        setShowSheetCreationModal(true);
      } else if (itemType === 'Presentation') {
        setShowPresentationCreationModal(true);
      }
    } else {
      if (itemType === 'File') {
        fileInputRef.current?.click();
      } else if (itemType === 'Folder') {
        setShowFolderModal(true);
      }
    }
    setIsAddDropdownOpen(false);
  };

  const getDocumentUrl = (name: string, service: ServiceType, category: string) => {
    const encodedName = encodeURIComponent(name);
    
    if (service === 'Google Docs') {
      if (category === 'document') {
        return `https://docs.google.com/document/create?title=${encodedName}&usp=direct_url`;
      } else if (category === 'spreadsheet') {
        return `https://docs.google.com/spreadsheets/create?title=${encodedName}&usp=direct_url`;
      } else if (category === 'presentation') {
        return `https://docs.google.com/presentation/create?title=${encodedName}&usp=direct_url`;
      }
    } else if (service === 'MS Office Online' || service === 'Office 365') {
      if (category === 'document') {
        return `https://www.office.com/launch/word?auth=2&nf=1&title=${encodedName}`;
      } else if (category === 'spreadsheet') {
        return `https://www.office.com/launch/excel?auth=2&nf=1&title=${encodedName}`;
      } else if (category === 'presentation') {
        return `https://www.office.com/launch/powerpoint?auth=2&nf=1&title=${encodedName}`;
      }
    }
    
    return null;
  };

  const openFileInOriginalApp = (file: DriveFile) => {
    if (file.item_type === 'folder') {
      navigateToFolder(file.id);
      return;
    }

    if (file.external_url) {
      try {
        window.location.href = file.external_url;
      } catch (e) {
        console.error("Error opening external file:", e);
        showNotification('error', `Could not open external file: ${(e as Error).message}`);
      }
      return;
    }

    if (!file.external_url && (file.service === 'Desktop applications' || !file.service)) {
      if (file.category === 'document') {
        setCurrentDocId(file.id);
        setDocName(file.name);
        setDocContent(file.content || '');
        setShowDocEditModal(true);
      } else if (file.category === 'spreadsheet') {
        setCurrentSheetId(file.id);
        setSheetName(file.name);
        setSheetHeaders(file.headers ? file.headers.join(', ') : '');
        setShowSheetEditModal(true);
      } else if (file.category === 'presentation') {
        setCurrentPresentationId(file.id);
        setPresentationName(file.name);
        setPresentationTheme(file.theme || '');
        setSlideCount(file.slides || 1);
        setShowPresentationEditModal(true);
      } else {
        showNotification('error', 'This local file type cannot be opened directly in the app yet.');
      }
      return;
    }

    showNotification('error', 'Unable to determine how to open this file.');
  };

  const createDocument = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Please login to create documents');
        return;
      }

      const fileName = docName || `New Document ${new Date().toLocaleDateString()}`;
      const externalUrl = selectedService ? getDocumentUrl(fileName, selectedService, 'document') : null;

      const response = await axios.post(`${API_BASE_URL}/folders`, {
        name: fileName,
        type: 'document',
        itemType: 'file',
        category: 'document',
        content: docContent,
        service: selectedService,
        parentId: currentFolderId,
        external_url: externalUrl
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data) {
        fetchFiles();
        showNotification('success', `Document created successfully with ${selectedService}`);
        setShowDocCreationModal(false);
        setDocName('');
        setDocContent('');

        if (externalUrl) {
          window.location.href = externalUrl;
        } else {
          openFileInOriginalApp(response.data);
        }
      }
    } catch (error) {
      console.error('Error creating document:', error);
      let errorMessage = 'Failed to create document';
      if (axios.isAxiosError(error) && error.response) {
        errorMessage += `: ${error.response.data.error || error.response.statusText}`;
      }
      showNotification('error', errorMessage);
    }
  };

  const editDocument = async () => {
    if (!currentDocId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Please login to edit documents');
        return;
      }

      const response = await axios.put(`${API_BASE_URL}/folders/${currentDocId}`, {
        name: docName,
        content: docContent
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      fetchFiles();
      showNotification('success', 'Document updated successfully');
      setShowDocEditModal(false);
      
      openFileInOriginalApp(response.data);
    } catch (error) {
      console.error('Error updating document:', error);
      showNotification('error', 'Failed to update document');
    }
  };

  const createSpreadsheet = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Please login to create spreadsheets');
        return;
      }

      const fileName = sheetName || `New Spreadsheet ${new Date().toLocaleDateString()}`;
      const headers = sheetHeaders.split(',').map(h => h.trim());
      const externalUrl = selectedService ? getDocumentUrl(fileName, selectedService, 'spreadsheet') : null;

      const response = await axios.post(`${API_BASE_URL}/folders`, {
        name: fileName,
        type: 'spreadsheet',
        itemType: 'file',
        category: 'spreadsheet',
        headers: headers,
        service: selectedService,
        parentId: currentFolderId,
        external_url: externalUrl
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data) {
        fetchFiles();
        showNotification('success', `Spreadsheet created successfully with ${selectedService}`);
        setShowSheetCreationModal(false);
        setSheetName('');
        setSheetHeaders('');

        if (externalUrl) {
          window.location.href = externalUrl;
        } else {
          openFileInOriginalApp(response.data);
        }
      }
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      showNotification('error', 'Failed to create spreadsheet');
    }
  };

  const editSpreadsheet = async () => {
    if (!currentSheetId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Please login to edit spreadsheets');
        return;
      }

      const headers = sheetHeaders.split(',').map(h => h.trim());
      
      const response = await axios.put(`${API_BASE_URL}/folders/${currentSheetId}`, {
        name: sheetName,
        headers: headers
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      fetchFiles();
      showNotification('success', 'Spreadsheet updated successfully');
      setShowSheetEditModal(false);
      
      openFileInOriginalApp(response.data);
    } catch (error) {
      console.error('Error updating spreadsheet:', error);
      showNotification('error', 'Failed to update spreadsheet');
    }
  };

  const createPresentation = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Please login to create presentations');
        return;
      }

      const fileName = presentationName || `New Presentation ${new Date().toLocaleDateString()}`;
      const externalUrl = selectedService ? getDocumentUrl(fileName, selectedService, 'presentation') : null;

      const response = await axios.post(`${API_BASE_URL}/folders`, {
        name: fileName,
        type: 'presentation',
        itemType: 'file',
        category: 'presentation',
        theme: presentationTheme,
        slides: slideCount,
        service: selectedService,
        parentId: currentFolderId,
        external_url: externalUrl
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data) {
        fetchFiles();
        showNotification('success', `Presentation created successfully with ${selectedService}`);
        setShowPresentationCreationModal(false);
        setPresentationName('');
        setPresentationTheme('');
        setSlideCount(1);

        if (externalUrl) {
          window.location.href = externalUrl;
        } else {
          openFileInOriginalApp(response.data);
        }
      }
    } catch (error) {
      console.error('Error creating presentation:', error);
      showNotification('error', 'Failed to create presentation');
    }
  };

  const editPresentation = async () => {
    if (!currentPresentationId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Please login to edit presentations');
        return;
      }

      const response = await axios.put(`${API_BASE_URL}/folders/${currentPresentationId}`, {
        name: presentationName,
        theme: presentationTheme,
        slides: slideCount
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      fetchFiles();
      showNotification('success', 'Presentation updated successfully');
      setShowPresentationEditModal(false);
      
      openFileInOriginalApp(response.data);
    } catch (error) {
      console.error('Error updating presentation:', error);
      showNotification('error', 'Failed to update presentation');
    }
  };

  const performDeepCleanup = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Please login to perform cleanup');
        return;
      }

      setCleanupProgress(0);
      setShowDeepCleanupModal(true);

      // Simulate cleanup process
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setCleanupProgress(i);
      }

      // Get cleanup results
      const response = await axios.get(`${API_BASE_URL}/cleanup`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setCleanupResults(response.data);
      showNotification('success', 'Deep cleanup completed successfully');
    } catch (error) {
      console.error('Error performing cleanup:', error);
      showNotification('error', 'Failed to perform cleanup');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      showNotification('error', 'Please enter a folder name');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Please login to create folders');
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/folders`, {
        name: newFolderName,
        type: 'folder',
        itemType: 'folder',
        parentId: currentFolderId
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data) {
        fetchFiles();
        showNotification('success', 'Folder created successfully');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      showNotification('error', 'Failed to create folder');
    }

    setShowFolderModal(false);
    setNewFolderName('');
  };

  const handleDelete = async (itemId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Please login to delete items');
        return;
      }

      await axios.delete(`${API_BASE_URL}/folders/${itemId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      fetchFiles();
      showNotification('success', 'Item moved to recycle bin');
    } catch (error) {
      console.error('Error deleting item:', error);
      showNotification('error', 'Failed to delete item');
    }
  };

  const handleEmptyRecycleBin = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Please login to empty recycle bin');
        return;
      }

      await axios.delete(`${API_BASE_URL}/recycle-bin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      fetchRecycleBin();
      showNotification('success', 'Recycle bin emptied');
    } catch (error) {
      console.error('Error emptying recycle bin:', error);
      showNotification('error', 'Failed to empty recycle bin');
    }
  };

  const handleRestoreItem = async (itemId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Please login to restore items');
        return;
      }

      await axios.post(`${API_BASE_URL}/recycle-bin/restore/${itemId}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      fetchFiles();
      fetchRecycleBin();
      showNotification('success', 'Item restored successfully');
    } catch (error) {
      console.error('Error restoring item:', error);
      showNotification('error', 'Failed to restore item');
    }
  };

  const navigateToFolder = async (folderId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/folders/${folderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setCurrentFolderId(folderId);
      setFolderPath(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Error navigating to folder:', error);
      showNotification('error', 'Failed to navigate to folder');
    }
  };

  const navigateUp = () => {
    if (folderPath.length > 0) {
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);
      setCurrentFolderId(newPath.length > 0 ? newPath[newPath.length - 1].id : null);
    }
  };

  const handleEditItem = (item: DriveFile) => {
    if (item.category === 'document') {
      setCurrentDocId(item.id);
      setDocName(item.name);
      setDocContent(item.content || '');
      setShowDocEditModal(true);
    } else if (item.category === 'spreadsheet') {
      setCurrentSheetId(item.id);
      setSheetName(item.name);
      setSheetHeaders(item.headers?.join(', ') || '');
      setShowSheetEditModal(true);
    } else if (item.category === 'presentation') {
      setCurrentPresentationId(item.id);
      setPresentationName(item.name);
      setPresentationTheme(item.theme || '');
      setSlideCount(item.slides || 1);
      setShowPresentationEditModal(true);
    }
  };

  const renderBreadcrumbs = () => {
    if (folderPath.length === 0) return null;

    return (
      <div className="flex items-center mb-4 text-sm">
        <button 
          onClick={navigateUp}
          className="text-blue-600 hover:text-blue-800 mr-2"
        >
          ← Back
        </button>
        <span className="text-gray-600">/</span>
        {folderPath.map((folder, index) => (
          <React.Fragment key={folder.id}>
            <button
              onClick={() => {
                const newPath = folderPath.slice(0, index + 1);
                setFolderPath(newPath);
                setCurrentFolderId(folder.id);
              }}
              className="text-blue-600 hover:text-blue-800 mx-1"
            >
              {folder.name}
            </button>
            {index < folderPath.length - 1 && <span className="text-gray-600">/</span>}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const menuItems = [
    { type: 'File', hasSubmenu: false },
    { type: 'Folder', hasSubmenu: false },
    { 
      type: 'Google Docs' as ServiceType,
      hasSubmenu: true,
      submenu: ['Document', 'Spreadsheet', 'Presentation']
    },
    { 
      type: 'MS Office Online' as ServiceType,
      hasSubmenu: true,
      submenu: ['Document', 'Spreadsheet', 'Presentation']
    },
    { 
      type: 'Office 365' as ServiceType,
      hasSubmenu: true,
      submenu: ['Document', 'Spreadsheet', 'Presentation']
    },
    { 
      type: 'Desktop applications' as ServiceType,
      hasSubmenu: true,
      submenu: ['Document', 'Spreadsheet', 'Presentation']
    }
  ];

  const renderDropdown = () => {
    if (!isAddDropdownOpen) return null;

    return (
      <div className="absolute top-full left-0 mt-1 w-48 bg-[#1b2e4b] rounded-md shadow-lg">
        {menuItems.map((item, index) => (
          <div key={index} className="relative group">
            <button
              className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-300 hover:bg-[#283c5d]"
              onClick={() => !item.hasSubmenu && handleAddItem(item.type)}
              onMouseEnter={() => item.hasSubmenu && setActiveSubmenu(item.type as ServiceType)}
              onMouseLeave={() => setActiveSubmenu(null)}
            >
              {item.type}
              {item.hasSubmenu && (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            {item.hasSubmenu && activeSubmenu === item.type && (
              <div 
                className="absolute right-full top-0 w-48 bg-[#1b2e4b] rounded-md shadow-lg"
                style={{ marginRight: '2px' }}
                onMouseEnter={() => setActiveSubmenu(item.type as ServiceType)}
                onMouseLeave={() => setActiveSubmenu(null)}
              >
                {item.submenu?.map((subItem, subIndex) => (
                  <button
                    key={subIndex}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#283c5d]"
                    onClick={() => handleAddItem(subItem, item.type as ServiceType)}
                  >
                    {subItem}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderDocumentCreationModal = () => {
    if (!showDocCreationModal && !showDocEditModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-96">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">
              {showDocCreationModal ? 'Create New Document' : 'Edit Document'}
            </h2>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter document name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={5}
                placeholder="Enter document content"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 p-4 border-t">
            <button
              onClick={() => showDocCreationModal ? setShowDocCreationModal(false) : setShowDocEditModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={showDocCreationModal ? createDocument : editDocument}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              {showDocCreationModal ? 'Create Document' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSpreadsheetCreationModal = () => {
    if (!showSheetCreationModal && !showSheetEditModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-96">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">
              {showSheetCreationModal ? 'Create New Spreadsheet' : 'Edit Spreadsheet'}
            </h2>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Spreadsheet Name</label>
              <input
                type="text"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter spreadsheet name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Column Headers (comma separated)</label>
              <input
                type="text"
                value={sheetHeaders}
                onChange={(e) => setSheetHeaders(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g. Name, Age, Email"
              />
            </div>
            {showSheetEditModal && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <div className="border border-gray-300 rounded-md p-2">
                  <p className="text-sm text-gray-500">Spreadsheet data editor would go here</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 p-4 border-t">
            <button
              onClick={() => showSheetCreationModal ? setShowSheetCreationModal(false) : setShowSheetEditModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={showSheetCreationModal ? createSpreadsheet : editSpreadsheet}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
            >
              {showSheetCreationModal ? 'Create Spreadsheet' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPresentationCreationModal = () => {
    if (!showPresentationCreationModal && !showPresentationEditModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-96">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">
              {showPresentationCreationModal ? 'Create New Presentation' : 'Edit Presentation'}
            </h2>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Presentation Name</label>
              <input
                type="text"
                value={presentationName}
                onChange={(e) => setPresentationName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter presentation name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <input
                type="text"
                value={presentationTheme}
                onChange={(e) => setPresentationTheme(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter presentation theme"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Slides</label>
              <input
                type="number"
                value={slideCount}
                onChange={(e) => setSlideCount(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            {showPresentationEditModal && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Slides Preview</label>
                <div className="border border-gray-300 rounded-md p-2">
                  <p className="text-sm text-gray-500">Presentation slides editor would go here</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 p-4 border-t">
            <button
              onClick={() => showPresentationCreationModal ? setShowPresentationCreationModal(false) : setShowPresentationEditModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={showPresentationCreationModal ? createPresentation : editPresentation}
              className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-md"
            >
              {showPresentationCreationModal ? 'Create Presentation' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDeepCleanupModal = () => {
    if (!showDeepCleanupModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-96">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">Drive Cleanup</h2>
          </div>
          <div className="p-6">
            {cleanupProgress < 100 ? (
              <div>
                <p className="mb-2">Cleaning up your drive... {cleanupProgress}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${cleanupProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium mb-4">Cleanup Results</h3>
                <div className="space-y-2">
                  <p>Duplicate files found: {cleanupResults.duplicateFiles}</p>
                  <p>Large files found: {cleanupResults.largeFiles}</p>
                  <p>Temporary files found: {cleanupResults.temporaryFiles}</p>
                  <p className="font-medium">Total space saved: {cleanupResults.totalSpaceSaved}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end p-4 border-t">
            <button
              onClick={() => setShowDeepCleanupModal(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              {cleanupProgress < 100 ? 'Cancel' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderFolderModal = () => {
    if (!showFolderModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#1b2e4b] rounded-lg shadow-xl w-96 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-300">Create folder</h3>
            <button
              onClick={() => setShowFolderModal(false)}
              className="text-gray-400 hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mb-4">
            <label className="block text-gray-400 text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full px-3 py-2 bg-[#283c5d] border border-gray-600 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter folder name"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowFolderModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateFolder}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTopBar = () => {
    return (
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
            {currentView === 'my-drive' ? 'My Drive' : 
             currentView === 'recycle-bin' ? 'Recycle Bin' : 
             currentView === 'drive-cleanup' ? 'Drive Cleanup' : 'Drive'}
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          {currentView === 'my-drive' && (
            <>
              <button 
                type="button" 
                className="btn btn-outline-primary"
                onClick={() => handleViewChange('recycle-bin')}
              >
                RECYCLE BIN
              </button>
              <button 
                type="button" 
                className="btn btn-outline-primary"
                onClick={() => handleViewChange('drive-cleanup')}
              >
                DRIVE CLEANUP
              </button>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
                  className="px-4 py-2 bg-[#4361ee] text-white rounded-md hover:bg-[#3651d4] flex items-center"
                >
                  <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  ADD
                </button>
                {renderDropdown()}
              </div>
            </>
          )}
          {currentView === 'recycle-bin' && (
            <>
              <button
                onClick={() => handleViewChange('my-drive')}
                className="px-4 py-2 bg-[#4361ee] text-white rounded-md hover:bg-[#3651d4]"
              >
                BACK TO DRIVE
              </button>
              <button
                onClick={handleEmptyRecycleBin}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Empty Recycle Bin
              </button>
            </>
          )}
          {currentView === 'drive-cleanup' && (
            <>
              <button
                onClick={() => handleViewChange('my-drive')}
                className="px-4 py-2 bg-[#4361ee] text-white rounded-md hover:bg-[#3651d4]"
              >
                BACK TO DRIVE
              </button>
              <button
                onClick={performDeepCleanup}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Start Cleanup
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white z-50`}>
          {notification.message}
        </div>
      )}
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
      
      {/* Navigation */}
      <div className="mb-5 flex items-center justify-between border-b border-[#ebedf2] dark:border-[#191e3a]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleViewChange('my-drive')}
            className={`!py-4 !px-2 -mb-[1px] ${
              currentView === 'my-drive'
                ? 'text-primary border-b border-primary'
                : 'text-gray-500 dark:text-gray-400 hover:text-primary'
            }`}
          >
            My Drive
          </button>
          <button
            onClick={() => handleViewChange('recycle-bin')}
            className={`!py-4 !px-2 -mb-[1px] ${
              currentView === 'recycle-bin'
                ? 'text-primary border-b border-primary'
                : 'text-gray-500 dark:text-gray-400 hover:text-primary'
            }`}
          >
            Recycle Bin
          </button>
          <button
            onClick={() => handleViewChange('drive-cleanup')}
            className={`!py-4 !px-2 -mb-[1px] ${
              currentView === 'drive-cleanup'
                ? 'text-primary border-b border-primary'
                : 'text-gray-500 dark:text-gray-400 hover:text-primary'
            }`}
          >
            Drive Cleanup
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="panel">
        {/* Header */}
        {renderTopBar()}
        {/* Content based on current view */}
        <div className="mt-5">
          {renderBreadcrumbs()}
          {currentView === 'recycle-bin' ? (
            recycleBinItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Recycle bin is empty</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Deleted items will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {recycleBinItems.map((item) => (
                  <div key={item.id} className="border border-[#e0e6ed] dark:border-[#191e3a] rounded-md p-4 hover:shadow-[0_0_15px_1px_rgba(113,106,202,0.20)]">
                    <div className="flex items-start justify-between">
                      <div className="w-14 h-14 bg-primary/20 rounded-md flex items-center justify-center">
                        {item.item_type === 'folder' ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
                            <path opacity="0.5" d="M18 10L13 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                            <path d="M2 6.94975C2 6.06722 2 5.62595 2.06935 5.25839C2.37464 3.64031 3.64031 2.37464 5.25839 2.06935C5.62595 2 6.06722 2 6.94975 2C7.33642 2 7.52976 2 7.71557 2.01738C8.51665 2.09229 9.27652 2.40704 9.89594 2.92051C10.0396 3.03961 10.1763 3.17633 10.4497 3.44975L11 4C11.8158 4.81578 12.2237 5.22367 12.7121 5.49543C12.9804 5.64471 13.2651 5.7626 13.5604 5.84678C14.0979 6 14.6747 6 15.8284 6H16.2021C18.8345 6 20.1506 6 21.0062 6.76946C21.0849 6.84024 21.1598 6.91514 21.2305 6.99383C22 7.84935 22 9.16554 22 11.7979V14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14V6.94975Z" stroke="currentColor" strokeWidth="1.5"></path>
                          </svg>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
                            <path d="M9 12H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                            <path d="M9 16H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                            <path d="M14 5H17.4C17.7314 5 18 5.26863 18 5.6V18.4C18 18.7314 17.7314 19 17.4 19H6.6C6.26863 19 6 18.7314 6 18.4V5.6C6 5.26863 6.26863 5 6.6 5H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                            <path d="M10 5C10 3.89543 10.8954 3 12 3C13.1046 3 14 3.89543 14 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                          </svg>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleRestoreItem(item.id)}
                          className="text-gray-400 hover:text-green-500"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h6 className="text-base font-medium">{item.name}</h6>
                      <p className="text-xs text-gray-500 mt-1">
                        Deleted: {new Date(item.date_deleted).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Original Path: {item.original_path}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : currentView === 'drive-cleanup' ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Drive Cleanup</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Clean up your drive to free up space</p>
              <button
                onClick={performDeepCleanup}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
              >
                Start Deep Cleanup
              </button>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No items found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Upload a file or create a new document</p>
              <button
                onClick={() => setIsAddDropdownOpen(true)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                Add item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files
                .filter(file => file.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((item) => (
                  <div 
                    key={item.id} 
                    className="border border-[#e0e6ed] dark:border-[#191e3a] rounded-md p-4 hover:shadow-[0_0_15px_1px_rgba(113,106,202,0.20)] cursor-pointer"
                    onClick={() => openFileInOriginalApp(item)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-14 h-14 bg-primary/20 rounded-md flex items-center justify-center">
                        {item.item_type === 'folder' ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
                            <path opacity="0.5" d="M18 10L13 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                            <path d="M2 6.94975C2 6.06722 2 5.62595 2.06935 5.25839C2.37464 3.64031 3.64031 2.37464 5.25839 2.06935C5.62595 2 6.06722 2 6.94975 2C7.33642 2 7.52976 2 7.71557 2.01738C8.51665 2.09229 9.27652 2.40704 9.89594 2.92051C10.0396 3.03961 10.1763 3.17633 10.4497 3.44975L11 4C11.8158 4.81578 12.2237 5.22367 12.7121 5.49543C12.9804 5.64471 13.2651 5.7626 13.5604 5.84678C14.0979 6 14.6747 6 15.8284 6H16.2021C18.8345 6 20.1506 6 21.0062 6.76946C21.0849 6.84024 21.1598 6.91514 21.2305 6.99383C22 7.84935 22 9.16554 22 11.7979V14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14V6.94975Z" stroke="currentColor" strokeWidth="1.5"></path>
                          </svg>
                        ) : (
                          <div className="text-primary">
                            {item.type?.includes('image/') ? '🖼️' : 
                             item.type?.includes('pdf') ? '📄' :
                             item.type?.includes('document') || item.type?.includes('word') ? '📝' :
                             item.type?.includes('spreadsheet') || item.type?.includes('excel') ? '📊' :
                             '📁'}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {item.item_type === 'file' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditItem(item);
                            }}
                            className="text-gray-400 hover:text-blue-500"
                          >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h6 className="text-base font-medium">{item.name}</h6>
                      <p className="text-xs text-gray-500 mt-1">
                        Modified: {new Date(item.updated_at).toLocaleDateString()}
                      </p>
                      {item.size && <p className="text-xs text-gray-500 mt-1">Size: {item.size}</p>}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {renderDocumentCreationModal()}
      {renderSpreadsheetCreationModal()}
      {renderPresentationCreationModal()}
      {renderDeepCleanupModal()}
      {renderFolderModal()}
    </div>
  );
};

export default Drive;