// Feed.tsx - Main component for creating different types of posts (messages, tasks, files, etc.)
import { gapi } from 'gapi-script';
import { signInWithGoogle, createGoogleFile, getGoogleFileURL } from '../GoogleAuth';
import { fetchUserNames } from '../Pages/api';
import React, { useState } from 'react';
import { useEffect, useRef } from 'react'; // Already might be there, but ensure
import { ChevronDown, Paperclip, FileText, AtSign, Send, ThumbsUp, CheckSquare, ListPlus } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';

// Tab names for primary options
const tabs = ['Message', 'Task', 'Event'];

function Feed() {
    // State management for various UI and form controls
    const [activeTab, setActiveTab] = useState(''); // Currently selected tab
    const [formVisible, setFormVisible] = useState(false); // Controls form visibility
    const [taskName, setTaskName] = useState(''); // Task name input
    const [taskDescription, setTaskDescription] = useState(''); // Task description
    const [message, setMessage] = useState(''); // Message content
    const [Appreciationmessage, setAppreciation] = useState(''); // Appreciation content
    const [showCreatedBy, setShowCreatedBy] = useState(false); // Task creator field visibility
    const [showParticipants, setShowParticipants] = useState(false); // Task participants field
    const [showObservers, setShowObservers] = useState(false); // Task observers field
    const [showCreateDocOptions, setShowCreateDocOptions] = useState(false); // Document creation options
    const [showMentionDropdown, setShowMentionDropdown] = useState(false); // for the mention in the feed
    const mentionDropdownRef = useRef<HTMLDivElement>(null);
    //for the projects in the task
    const [mentionSearch, setMentionSearch] = useState('');
    const [showProjectSelector, setShowProjectSelector] = useState(false);
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const [projectNames, setProjectNames] = useState<string[]>([]);
    const projectSelectorRef = useRef<HTMLDivElement>(null);

    const [showFileForm, setShowFileForm] = useState(false); //file in the option
    // const [showTagInput, setShowTagInput] = useState(false); // for showing the small form
    // const [tagInputValue, setTagInputValue] = useState(''); // for typing new tag
    // const [tags, setTags] = useState<string[]>([]); // to store all added tags
    const [showTagInput, setShowTagInput] = useState(false);
    const [tagInputValue, setTagInputValue] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const tagInputRef = useRef<HTMLDivElement>(null);

    // State for Assignee selection popup
    const [showAssigneeSelector, setShowAssigneeSelector] = useState(false);

    //for the deadline getting saved in the datbase
    const [taskDeadlineDate, setTaskDeadlineDate] = useState('');

    // State for selected Assignees
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

    // Ref to detect outside click for assignee selector
    const assigneeSelectorRef = useRef<HTMLDivElement>(null);

    const [showUserSelector, setShowUserSelector] = useState(false); // State for showing the user selection popup for "To:" field
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]); // State for selected users list

    const userSelectorRef = useRef<HTMLDivElement>(null); // Ref to detect outside click for user selector

    const [feedMessages, setFeedMessages] = useState<
        Array<{
            id: number;
            sender: string;
            recipients: string[] | string; // Can be array or string
            message: string;
            file_name: string[] | string; // Can be array or string
            file_path: string[] | string; // Can be array or string
            tags: string[] | string; // Can be array or string
            timestamp: string;
        }>
    >([]); // for feed message

    const [activeFeedFileMenu, setActiveFeedFileMenu] = useState<string | null>(null);

    // for the feed_tasks
    const [feedTasks, setFeedTasks] = useState<
        Array<{
            projects(projects: any): unknown;
            id: number;
            sender: string;
            task_name: string;
            task_description: string;
            assignees: string[] | string;
            created_by: string[] | string;
            participants: string[] | string;
            observers: string[] | string;
            deadline: string;
            file_name: string[] | string;
            file_path: string[] | string;
            timestamp: string;
        }>
    >([]);

    const [feedEvents, setFeedEvents] = useState<
        Array<{
            updated_at: string | number | Date;
            sender_name: React.ReactNode | Iterable<React.ReactNode>;
            EventTitle: React.ReactNode | Iterable<React.ReactNode>;
            EventDescription: React.ReactNode | Iterable<React.ReactNode>;

            StartDate: string | number | Date;
            EndDate: string | number | Date;
            id: number;
            sender: string;
            title: string;
            description: string;
            start: string;
            end: string;
            assignees: string[] | string;
            type: string;
            created_at: string;
        }>
    >([]);

    // Upload handling
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

    // To track which file's menu is open (for 3 dots ⋯)
    const [activeFileMenu, setActiveFileMenu] = useState<number | null>(null);

    // To track which file is in rename mode
    const [renamingFileIndex, setRenamingFileIndex] = useState<number | null>(null);

    // To track rename input text
    const [renameInput, setRenameInput] = useState('');

    // To handel the Created by, participents , observer.
    const [createdBy, setCreatedBy] = useState<string[]>([]);
    const [participants, setParticipants] = useState<string[]>([]);
    const [observers, setObservers] = useState<string[]>([]);

    const [showCreatedBySelector, setShowCreatedBySelector] = useState(false);
    const [showParticipantsSelector, setShowParticipantsSelector] = useState(false);
    const [showObserversSelector, setShowObserversSelector] = useState(false);

    const createdByRef = useRef<HTMLDivElement>(null);
    const participantsRef = useRef<HTMLDivElement>(null);
    const observersRef = useRef<HTMLDivElement>(null);

    const fileMenuRef = useRef<HTMLDivElement>(null);
    // for create document option
    const [docTypeToCreate, setDocTypeToCreate] = useState<null | 'doc' | 'sheet' | 'ppt'>(null);
    const [showSavePromptModal, setShowSavePromptModal] = useState(false);
    const [showSavingModal, setShowSavingModal] = useState(false);
    const [showFileNameModal, setShowFileNameModal] = useState(false);
    const [tempDocName, setTempDocName] = useState('');

    //for TimePlanning
    const [showTimePlanning, setShowTimePlanning] = useState(false);
    // const [startTaskOn, setStartTaskOn] = useState('');
    // const [finishTaskOn, setFinishTaskOn] = useState('');
    const [duration, setDuration] = useState('');

    // for Time planning (Duration) timer
    const [startDateTime, setStartDateTime] = useState('');
    const [finishDateTime, setFinishDateTime] = useState('');
    const [durationUnit, setDurationUnit] = useState<'days' | 'hours' | 'minutes'>('days');
    const [calculatedDuration, setCalculatedDuration] = useState('');

    //handel the file upload drop your file here
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // for the success message of the sending message in the feed
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    // handel the file ( in more option)
    const [messageText, setMessageText] = useState<string>(''); // needed for Add to Text

    // to handle the refresh state of the feed after the message is sent
    const [refreshKey, setRefreshKey] = useState(0);

    // for handling the downloading option.

    const downloadFeedFile = (url: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // handel the file ( in more option)
    const handleAddToText = (file: File) => {
        const textToAdd = `\n[File: ${file.name}]\n`;
        setMessageText((prev) => prev + textToAdd);
        setActiveFileMenu(null); // close dropdown
    };

    const handleDownload = (file: File) => {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setActiveFileMenu(null);
    };

    const handleDeleteFile = (index: number) => {
        const updatedFiles = [...selectedFiles];
        updatedFiles.splice(index, 1);
        setSelectedFiles(updatedFiles);
        setActiveFileMenu(null);
    };

    const handleRenameFile = (index: number) => {
        const newName = prompt('Enter new file name:', selectedFiles[index].name);
        if (newName) {
            const updatedFiles = [...selectedFiles];
            const oldFile = updatedFiles[index];

            // Create a new File with same content but new name
            const renamedFile = new File([oldFile], newName, { type: oldFile.type });
            updatedFiles[index] = renamedFile;

            setSelectedFiles(updatedFiles);
        }
        setActiveFileMenu(null);
    };

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const newFiles = Array.from(files);
            setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);
        }
    };
    // for handling the feed upload messages in the datbase

    const handleSend = async () => {
        if (!message.trim() && selectedUsers.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'The message text is empty and no recipients selected.',
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
            });
            return;
        }

        if (!message.trim()) {
            Swal.fire({
                icon: 'error',
                title: 'The message text is empty.',
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
            });
            return;
        }

        if (selectedUsers.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Select message recipients.',
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
            });
            return;
        }

        const formData = new FormData();
        formData.append('sender', localStorage.getItem('userName') || 'Unknown');
        formData.append('tags', JSON.stringify(tags));
        formData.append('recipients', JSON.stringify(selectedUsers));
        formData.append('message', message);

        uploadedFiles.forEach((file) => {
            formData.append('files', file);
        });

        try {
            const res = await axios.post('http://localhost:5000/api/feed', formData);
            setMessage('');
            setUploadedFiles([]);
            setSelectedUsers([]);
            setTags([]);
            setFormVisible(false);
            setActiveTab('');
            setRefreshKey((prev) => prev + 1);
            Swal.fire({
                icon: 'success',
                title: 'Message sent successfully!',
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
            });
        } catch (err) {
            console.error('Send failed', err);
            Swal.fire({
                icon: 'error',
                title: 'Failed to send message',
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 1500,
                timerProgressBar: true,
            });
        }
    };

    // for handling the task send button to show the empty task name and empty deadline message
    const handleTaskSend = async () => {
        if (!taskName.trim()) {
            Swal.fire({
                icon: 'error',
                title: 'The task name is not specified.',
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
            });
            return;
        }

        if (!taskDeadlineDate.trim()) {
            Swal.fire({
                icon: 'error',
                title: 'The deadline is not specified.',
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
            });
            return;
        }

        if (selectedProjects.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'The project is not specified.',
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
            });
            return;
        }

        const formData = new FormData();
        formData.append('sender', localStorage.getItem('userName') || 'Unknown');
        formData.append('taskName', taskName);
        formData.append('taskDescription', taskDescription);
        formData.append('assignees', JSON.stringify(selectedAssignees));
        formData.append('createdBy', JSON.stringify(createdBy));
        formData.append('participants', JSON.stringify(participants));
        formData.append('observers', JSON.stringify(observers));
        formData.append('deadline', taskDeadlineDate); // ✅ this is the only date we want
        formData.append('projects', JSON.stringify(selectedProjects));

        uploadedFiles.forEach((file) => {
            formData.append('files', file);
        });

        try {
            const res = await axios.post('http://localhost:5000/api/feed/task', formData);

            Swal.fire({
                icon: 'success',
                title: 'Task sent successfully!',
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
            });

            // Reset task form
            setTaskName('');
            setTaskDescription('');
            setTaskDeadlineDate('');
            setFinishDateTime('');
            setStartDateTime('');
            setSelectedAssignees([]);
            setUploadedFiles([]);
            setCreatedBy([]);
            setParticipants([]);
            setObservers([]);
            setFormVisible(false);
            setActiveTab('');
            setRefreshKey((prev) => prev + 1);
        } catch (err) {
            console.error('Failed to send task', err);
            Swal.fire({
                icon: 'error',
                title: 'Failed to send task',
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 1500,
                timerProgressBar: true,
            });
        }
    };

    // Add this useEffect block with other similar effects for the project in feed
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (projectSelectorRef.current && !projectSelectorRef.current.contains(event.target as Node)) {
                setShowProjectSelector(false);
            }
        };

        if (showProjectSelector) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProjectSelector]);

    const fetchFeedMessages = async () => {
        try {
            const userName = localStorage.getItem('userName');
            const response = await axios.get(`http://localhost:5000/api/feed/${userName}`);

            setFeedMessages(response.data);
        } catch (error) {
            console.error('Failed to fetch feed messages', error);
        }
    };

    const safeParseJson = (input: any) => {
        try {
            if (Array.isArray(input)) return input;
            if (typeof input === 'string') {
                return JSON.parse(input);
            }
            return [];
        } catch (e) {
            return [];
        }
    };

    // handle the get task on the frontend
    const fetchFeedTasks = async () => {
        try {
            const userName = localStorage.getItem('userName');
            const response = await axios.get(`http://localhost:5000/api/feed/task/${userName}`);
            setFeedTasks(response.data);
        } catch (error) {
            console.error('Failed to fetch feed tasks', error);
        }
    };

    useEffect(() => {
        fetchFeedMessages(); // refetch whenever refreshKey changes
        fetchFeedTasks();
        fetchFeedEvents();
    }, [refreshKey]);

    // Add this function in Feed.tsx
    const fetchProjects = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/project/task');
            const projectNames = response.data.map((project: { name: any }) => project.name); // 👈 Make sure you're mapping just names
            return projectNames;
        } catch (error) {
            console.error('Failed to fetch projects', error);
            return [];
        }
    };

    // Add this useEffect to load projects when component mounts
    useEffect(() => {
        const loadProjects = async () => {
            const projects = await fetchProjects();
            setProjectNames(projects);
        };
        loadProjects();
    }, []);

    // for handling fetch events
    const fetchFeedEvents = async () => {
        try {
            const userName = localStorage.getItem('userName');
            const token = localStorage.getItem('token');

            const response = await axios.get('http://localhost:5000/api/events', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Filter events where current user is an assignee or creator
            const userEvents = response.data.filter((event: any) => {
                const assignees = event.assignees ? event.assignees.split(',') : [];
                return assignees.includes(userName) || event.sender_name === userName;
            });

            setFeedEvents(userEvents);
        } catch (error) {
            console.error('Failed to fetch feed events', error);
        }
    };

    // for appreciation recipients
    const [appreciationRecipients, setAppreciationRecipients] = useState<string[]>([]);
    const [showAppreciationRecipientSelector, setShowAppreciationRecipientSelector] = useState(false);
    const appreciationRecipientRef = useRef<HTMLDivElement>(null);

    // to handle the appreciation recipients add employees
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (appreciationRecipientRef.current && !appreciationRecipientRef.current.contains(event.target as Node)) {
                setShowAppreciationRecipientSelector(false);
            }
        };

        if (showAppreciationRecipientSelector) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAppreciationRecipientSelector]);

    // handel that time planning duration
    useEffect(() => {
        if (startDateTime && finishDateTime) {
            const start = new Date(startDateTime);
            const finish = new Date(finishDateTime);
            const diffMs = finish.getTime() - start.getTime();

            if (diffMs >= 0) {
                const diffMinutes = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMinutes / 60);
                const diffDays = Math.floor(diffHours / 24);

                switch (durationUnit) {
                    case 'days':
                        setCalculatedDuration(`${diffDays}d`);
                        break;
                    case 'hours':
                        setCalculatedDuration(`${diffHours}h`);
                        break;
                    case 'minutes':
                        setCalculatedDuration(`${diffMinutes}m`);
                        break;
                }
            } else {
                setCalculatedDuration('');
            }
        }
    }, [startDateTime, finishDateTime, durationUnit]);

    // handle the create doc option

    // In Feed.tsx, replace the handleDocOpen function with this:

    const handleDocOpen = async (type: 'doc' | 'sheet' | 'ppt') => {
        try {
            // First sign in with Google
            await signInWithGoogle();

            // Create a blank popup window immediately
            const popup = window.open('', '_blank', 'width=1024,height=600');

            if (!popup) {
                alert('Please allow pop-ups for this site in your browser settings.');
                return;
            }

            // Show loading message in popup
            popup.document.write('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;"><h2>Loading document...</h2></body></html>');

            // Create the file in user's Google Drive
            const mimeTypeMap = {
                doc: 'application/vnd.google-apps.document',
                sheet: 'application/vnd.google-apps.spreadsheet',
                ppt: 'application/vnd.google-apps.presentation',
            };

            const fileId = await createGoogleFile(mimeTypeMap[type], `New ${type}`);
            const fileUrl = getGoogleFileURL(fileId, type);

            // Now inject the Google Docs iframe into our popup
            popup.document.write(`
            <html>
                <head><title>Google ${type.toUpperCase()}</title></head>
                <body style="margin:0;padding:0;">
                    <iframe 
                        src="${fileUrl}" 
                        frameborder="0" 
                        style="width:100%;height:100vh;"
                        allow="autoplay; fullscreen"
                    ></iframe>
                </body>
            </html>
        `);
        } catch (err) {
            console.error('Error creating document:', err);
            alert('Failed to create document. Please try again.');
        }
    };

    // Handle outside click to close the "Add more" user selector popup
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tagInputRef.current && !tagInputRef.current.contains(event.target as Node)) {
                setShowTagInput(false);
                setTagInputValue('');
            }
        };

        if (showTagInput) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showTagInput]);

    // Handle outside click to close the "Add more" user selector popup
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userSelectorRef.current && !userSelectorRef.current.contains(event.target as Node)) {
                setShowUserSelector(false);
            }
        };

        if (showUserSelector) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserSelector]);

    // Handle outside click to close Assignee selector popup
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (assigneeSelectorRef.current && !assigneeSelectorRef.current.contains(event.target as Node)) {
                setShowAssigneeSelector(false);
            }
        };

        if (showAssigneeSelector) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAssigneeSelector]);

    useEffect(() => {
        const handleClickOutsideFileMenu = (event: MouseEvent) => {
            if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
                setActiveFileMenu(null);
            }
        };

        if (activeFileMenu !== null) {
            document.addEventListener('mousedown', handleClickOutsideFileMenu);
        } else {
            document.removeEventListener('mousedown', handleClickOutsideFileMenu);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutsideFileMenu);
        };
    }, [activeFileMenu]);

    // Handle outside click to close the file form

    useEffect(() => {
        const handleClickOutsideFileMenu = (event: MouseEvent) => {
            if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
                setActiveFileMenu(null);
            }
        };

        if (activeFileMenu !== null) {
            document.addEventListener('mousedown', handleClickOutsideFileMenu);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutsideFileMenu);
        };
    }, [activeFileMenu]);

    // handel the outside click for the participt, observer, created by form
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (createdByRef.current && !createdByRef.current.contains(event.target as Node)) {
                setShowCreatedBySelector(false);
            }

            if (participantsRef.current && !participantsRef.current.contains(event.target as Node)) {
                setShowParticipantsSelector(false);
            }

            if (observersRef.current && !observersRef.current.contains(event.target as Node)) {
                setShowObserversSelector(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const [userNames, setUserNames] = useState<string[]>([]);

    // Add this useEffect to fetch users when component mounts
    useEffect(() => {
        const loadUsers = async () => {
            const names = await fetchUserNames();
            setUserNames(names);
        };
        loadUsers();
    }, []);

    // Handle tab selection from main tabs
    const handleTabClick = (tab: React.SetStateAction<string>) => {
        setActiveTab(tab);
        setFormVisible(true);
        setShowCreateDocOptions(false);

        // 👇 Auto-fill "Created by" for Task
        if (tab === 'Task') {
            const loggedInUser = localStorage.getItem('userName');
            if (loggedInUser && !createdBy.includes(loggedInUser)) {
                setCreatedBy([loggedInUser]); // set the logged-in user
            }
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            setUploadedFiles((prev) => [...prev, ...Array.from(files)]);
        }
    };

    // Handle selection from More dropdown
    const handleDropdownSelect = (option: React.SetStateAction<string>) => {
        setActiveTab(option);
        setFormVisible(true);
        setShowCreateDocOptions(false);
    };

    // Handle click on placeholder to start a message
    const handlePlaceholderClick = () => {
        setActiveTab('Message');
        setFormVisible(true);
    };

    // Render document creation options (Document, Spreadsheet, Presentation)
    const renderCreateDocOptions = () => {
        const handleDocOpen = (type: 'doc' | 'sheet' | 'ppt') => {
            setDocTypeToCreate(type);
            window.open(
                type === 'doc' ? 'https://docs.google.com/document/create' : type === 'sheet' ? 'https://docs.google.com/spreadsheets/create' : 'https://docs.google.com/presentation/create',
                '_blank'
            );
            setShowSavePromptModal(true); // show first modal
        };

        return (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { type: 'Document', ext: 'DOC', color: 'bg-blue-500', tag: 'doc' },
                    { type: 'Spreadsheet', ext: 'XLSX', color: 'bg-green-500', tag: 'sheet' },
                    { type: 'Presentation', ext: 'PPT', color: 'bg-yellow-500', tag: 'ppt' },
                ].map(({ type, ext, color, tag }) => (
                    <div
                        key={type}
                        className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-100 dark:bg-gray-800 shadow hover:shadow-md transition cursor-pointer"
                        onClick={() => {
                            setShowCreateDocOptions(false); // close options
                            handleDocOpen(tag as 'doc' | 'sheet' | 'ppt');
                        }}
                    >
                        <div className="relative w-12 h-14 flex flex-col items-center">
                            <div className="w-12 h-14 bg-white dark:bg-gray-700 rounded-md border flex items-center justify-center font-bold text-sm text-gray-700 dark:text-white">{ext}</div>
                            <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full ${color} text-white flex items-center justify-center text-sm`}>+</div>
                        </div>
                        <div className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-200">{type}</div>
                    </div>
                ))}
                <p className="col-span-full text-sm text-gray-500 dark:text-gray-400 text-center">
                    Use <a className="text-blue-500 underline cursor-pointer">Google Docs</a> to create documents
                </p>
            </div>
        );
    };

    // Render Mention Dropdown
    const renderMentionDropdown = () => (
        <div ref={mentionDropdownRef} className="absolute top-full mt-2 left-0 w-64 z-20 bg-white dark:bg-gray-800 border rounded-md shadow-md">
            <input
                type="text"
                placeholder="Search..."
                value={mentionSearch}
                onChange={(e) => setMentionSearch(e.target.value)}
                className="w-full px-3 py-2 border-b dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
            <ul>
                {userNames
                    .filter((name) => name.toLowerCase().includes(mentionSearch.toLowerCase()))
                    .map((name, index) => (
                        <li
                            key={index}
                            onClick={() => {
                                if (activeTab === 'Task') {
                                    if (!selectedAssignees.includes(name)) {
                                        setSelectedAssignees([...selectedAssignees, name]);
                                    }
                                } else if (activeTab === 'Appreciation') {
                                    if (!appreciationRecipients.includes(name)) {
                                        setAppreciationRecipients([...appreciationRecipients, name]);
                                    }
                                } else {
                                    // Default to Message tab
                                    if (!selectedUsers.includes(name)) {
                                        setSelectedUsers([...selectedUsers, name]);
                                    }
                                }

                                setShowMentionDropdown(false);
                                setMentionSearch('');
                            }}
                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                        >
                            <span className="rounded-full bg-gray-200 dark:bg-gray-600 p-1">👤</span>
                            {name}
                        </li>
                    ))}
            </ul>
        </div>
    );

    // Render toolbar with various formatting and attachment options
    const renderToolbar = () => (
        <div className="flex flex-wrap items-center gap-6 text-gray-600 dark:text-gray-300 mt-4">
            <div className="relative flex items-center gap-2 cursor-pointer">
                <label htmlFor="file-upload" className="flex items-center gap-2 cursor-pointer">
                    <Paperclip size={18} /> File
                </label>
                <input id="file-upload" type="file" multiple onChange={handleFileUpload} className="hidden" />
            </div>

            <div onClick={() => setShowCreateDocOptions(!showCreateDocOptions)} className="flex items-center gap-2 cursor-pointer">
                <FileText size={18} /> Create document
            </div>
            {/* for metion size  */}
            <div className="relative">
                <div
                    onClick={() => {
                        setShowMentionDropdown(!showMentionDropdown);
                        setShowCreateDocOptions(false); // close document options if open
                    }}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <AtSign size={18} /> Mention
                </div>
                {showMentionDropdown && renderMentionDropdown()}
            </div>
        </div>
    );

    // Render tags section with add more option
    const renderTags = () => (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mt-4 w-full relative">
            <label className="text-sm text-gray-700 dark:text-gray-300 w-12 sm:w-auto">Tags:</label>
            <div className="flex-1 relative">
                <div className="w-full min-h-[40px] border px-3 py-2 rounded-md dark:border-gray-600 bg-gray-100 dark:bg-gray-900 flex flex-wrap items-center gap-2">
                    {/* Existing Tags */}
                    {tags.map((tag, index) => (
                        <div key={index} className="bg-gray-300 dark:bg-gray-700 flex items-center px-2 py-1 rounded text-sm text-gray-800 dark:text-white">
                            {tag}
                            <button
                                onClick={() => {
                                    const updatedTags = [...tags];
                                    updatedTags.splice(index, 1);
                                    setTags(updatedTags);
                                }}
                                className="ml-2 text-gray-600 hover:text-red-500 dark:text-gray-300 dark:hover:text-red-400"
                            >
                                &times;
                            </button>
                        </div>
                    ))}

                    {/* + Add more should always be visible */}
                    <span className="text-blue-500 cursor-pointer text-sm" onClick={() => setShowTagInput(true)}>
                        + Add more
                    </span>
                </div>

                {/* Tag Input Form */}
                {showTagInput && (
                    <div ref={tagInputRef} className="absolute left-0 top-full mt-2 bg-white dark:bg-gray-800 shadow-lg rounded-md p-3 w-64 z-50">
                        <input
                            type="text"
                            value={tagInputValue}
                            onChange={(e) => setTagInputValue(e.target.value)}
                            className="w-full border p-2 rounded-md mb-2 dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                            placeholder="Enter tag"
                        />
                        <button
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md text-sm"
                            onClick={() => {
                                if (tagInputValue.trim() !== '') {
                                    setTags([...tags, tagInputValue.trim()]);
                                    setTagInputValue('');
                                    setShowTagInput(false);
                                }
                            }}
                        >
                            Add
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    // Render recipients section with default "All employees" and add more option
    const renderRecipients = () => (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mt-4 relative">
            <label className="text-sm text-gray-700 dark:text-gray-300 w-12 sm:w-auto">To:</label>
            <div className="flex-1 border px-3 py-2 rounded-md dark:border-gray-600 bg-gray-100 dark:bg-gray-900 flex flex-wrap items-center gap-2 relative">
                {/* Render selected users */}
                {selectedUsers.map((user, index) => (
                    <div key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center text-sm">
                        {user}
                        <button
                            onClick={() => {
                                const updatedUsers = [...selectedUsers];
                                updatedUsers.splice(index, 1);
                                setSelectedUsers(updatedUsers);
                            }}
                            className="ml-2 text-gray-500 hover:text-red-500"
                        >
                            &times;
                        </button>
                    </div>
                ))}

                {/* + Add more button */}
                <span className="text-blue-500 cursor-pointer text-sm" onClick={() => setShowUserSelector(true)}>
                    + Add more
                </span>

                {/* Popup form to select users */}
                {showUserSelector && (
                    <div ref={userSelectorRef} className="absolute top-full mt-2 left-0 w-64 bg-white dark:bg-gray-800 border rounded-md shadow-lg p-3 z-50">
                        <ul>
                            {userNames.map((name, index) => (
                                <li
                                    key={index}
                                    onClick={() => {
                                        if (!selectedUsers.includes(name)) {
                                            setSelectedUsers([...selectedUsers, name]);
                                        }
                                        setShowUserSelector(false);
                                    }}
                                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded"
                                >
                                    {name}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );

    // handel showMentionDropdown:

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mentionDropdownRef.current && !mentionDropdownRef.current.contains(event.target as Node)) {
                setShowMentionDropdown(false);
            }
        };

        if (showMentionDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMentionDropdown]);

    // Render message form with textarea, toolbar, and recipient options
    const renderMessageForm = () => (
        <>
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="w-full h-40 p-4 border rounded-md bg-white dark:bg-gray-900 dark:border-gray-600 text-gray-700 dark:text-white resize-none"
            />
            {renderToolbar()}
            {showCreateDocOptions && renderCreateDocOptions()}

            {/* Uploaded Files Preview */}
            {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-4">
                    {uploadedFiles.map((file, index) => (
                        <div key={index} className="relative border rounded-md p-3 bg-gray-100 dark:bg-gray-800 w-40 h-40 flex flex-col justify-between">
                            {/* Top Cross X to delete */}
                            <button
                                onClick={() => {
                                    const updated = [...uploadedFiles];
                                    updated.splice(index, 1);
                                    setUploadedFiles(updated);
                                }}
                                className="absolute top-1 left-1 text-gray-500 hover:text-red-500"
                            >
                                &times;
                            </button>

                            {/* File Icon and Name */}
                            <div className="flex flex-col items-center justify-center flex-1">
                                <div className="text-4xl">📄</div>
                                {renamingFileIndex === index ? (
                                    <input
                                        type="text"
                                        value={renameInput}
                                        onChange={(e) => setRenameInput(e.target.value)}
                                        onBlur={() => {
                                            if (renameInput.trim()) {
                                                const renamed = new File([file], renameInput, { type: file.type });
                                                const updated = [...uploadedFiles];
                                                updated[index] = renamed;
                                                setUploadedFiles(updated);
                                            }
                                            setRenamingFileIndex(null);
                                        }}
                                        autoFocus
                                        className="mt-2 p-1 rounded-md text-center bg-white dark:bg-gray-700"
                                    />
                                ) : (
                                    <p className="mt-2 text-sm text-center break-all">{file.name}</p>
                                )}
                            </div>

                            {/* 3 Dots Menu */}
                            <button onClick={() => setActiveFileMenu(activeFileMenu === index ? null : index)} className="absolute top-1 right-1 text-gray-500 hover:text-black dark:hover:text-white">
                                ⋯
                            </button>

                            {/* File Options Menu */}
                            {activeFileMenu === index && (
                                <div ref={fileMenuRef} className="absolute top-7 right-0 w-48 bg-white dark:bg-gray-800 border rounded-md shadow-lg z-50">
                                    <div className="px-4 py-2 text-xs text-gray-500">File size: {(file.size / 1024).toFixed(2)} KB</div>
                                    <div
                                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                                        onClick={() => {
                                            setMessage((prev) => `${prev} [${uploadedFiles[index].name}] `);
                                            setActiveFileMenu(null);
                                        }}
                                    >
                                        Add to text
                                    </div>
                                    <div
                                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = URL.createObjectURL(file);
                                            link.download = file.name;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }}
                                    >
                                        Download
                                    </div>
                                    <div
                                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                                        onClick={() => {
                                            const updated = [...uploadedFiles];
                                            updated.splice(index, 1);
                                            setUploadedFiles(updated);
                                            setActiveFileMenu(null);
                                        }}
                                    >
                                        Delete
                                    </div>
                                    <div
                                        className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                                        onClick={() => {
                                            setRenamingFileIndex(index);
                                            setRenameInput(file.name);
                                            setActiveFileMenu(null);
                                        }}
                                    >
                                        Rename <span>➔</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showFileForm && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
                    {['Upload', 'My Drive', 'Google Docs'].map((label) => (
                        <div key={label} className="flex flex-col items-center justify-center border p-4 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                            <div className="text-2xl">📁</div>
                            <div className="mt-2 text-sm">{label}</div>
                        </div>
                    ))}
                    <div className="col-span-full border border-dashed px-4 py-8 text-center rounded-md text-gray-500 dark:text-gray-300 mt-4">Drop your files here</div>
                </div>
            )}

            {renderTags()}
            {renderRecipients()}
        </>
    );

    {
        /* Display selected files */
    }
    <div className="flex flex-wrap gap-4 mb-4">
        {selectedFiles.map((file, index) => (
            <div key={index} className="flex flex-col items-center justify-center border p-4 rounded-md shadow bg-white dark:bg-gray-700">
                <div className="text-4xl">📄</div>
                <div className="mt-2 text-sm break-all max-w-[120px] text-center">{file.name}</div>
            </div>
        ))}
    </div>;

    // Render file upload form with various source options
    const renderFileForm = () => (
        <>
            {/* Upload Options */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {['Upload', 'My Drive', 'Google Docs'].map((label) => (
                    <div
                        key={label}
                        className="flex flex-col items-center justify-center border p-4 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 cursor-pointer"
                        onClick={label === 'Upload' ? handleUploadClick : undefined}
                    >
                        <div className="text-2xl">📁</div>
                        <div className="mt-2 text-sm">{label}</div>
                    </div>
                ))}
            </div>

            {/* Drop zone */}
            <div className="col-span-full border border-dashed px-4 py-8 text-center rounded-md text-gray-500 dark:text-gray-300 mt-4 cursor-pointer" onClick={handleUploadClick}>
                Drop your files here
            </div>

            {/* Hidden file input */}
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} multiple />

            {/* Uploaded file previews */}
            {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-4 relative">
                    {selectedFiles.map((file, index) => (
                        <div key={index} className="relative border rounded-md p-3 bg-gray-100 dark:bg-gray-800 w-40 h-40 flex flex-col justify-between">
                            {/* X button */}
                            <button
                                onClick={() => {
                                    const updated = [...selectedFiles];
                                    updated.splice(index, 1);
                                    setSelectedFiles(updated);
                                }}
                                className="absolute top-1 left-1 text-gray-500 hover:text-red-500"
                            >
                                &times;
                            </button>

                            {/* Three Dots */}
                            <div className="absolute top-1 right-1">
                                <button onClick={() => setActiveFileMenu(activeFileMenu === index ? null : index)} className="text-gray-500 hover:text-black dark:hover:text-white">
                                    ⋯
                                </button>

                                {/* Dropdown Menu */}
                                {activeFileMenu === index && (
                                    <div ref={fileMenuRef} className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 border rounded-md shadow-lg z-50">
                                        <ul className="text-sm text-gray-700 dark:text-gray-200">
                                            <li className="px-4 py-2 text-xs text-gray-500 border-b dark:border-gray-700">File size: {(file.size / 1024).toFixed(2)} KB</li>

                                            <li
                                                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                                onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = URL.createObjectURL(file);
                                                    link.download = file.name;
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                    URL.revokeObjectURL(link.href);
                                                    setActiveFileMenu(null);
                                                }}
                                            >
                                                Download
                                            </li>

                                            <li
                                                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                                onClick={() => {
                                                    const updated = [...selectedFiles];
                                                    updated.splice(index, 1);
                                                    setSelectedFiles(updated);
                                                    setActiveFileMenu(null);
                                                }}
                                            >
                                                Delete
                                            </li>

                                            <li
                                                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex justify-between"
                                                onClick={() => {
                                                    setRenamingFileIndex(index);
                                                    setRenameInput(file.name);
                                                    setActiveFileMenu(null);
                                                }}
                                            >
                                                <span>Rename</span> <span>➔</span>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* File icon and name */}
                            <div className="flex flex-col items-center justify-center flex-1">
                                <div className="text-4xl">📄</div>
                                {renamingFileIndex === index ? (
                                    <input
                                        type="text"
                                        value={renameInput}
                                        onChange={(e) => setRenameInput(e.target.value)}
                                        onBlur={() => {
                                            if (renameInput.trim()) {
                                                const renamed = new File([file], renameInput, { type: file.type });
                                                const updated = [...selectedFiles];
                                                updated[index] = renamed;
                                                setSelectedFiles(updated);
                                            }
                                            setRenamingFileIndex(null);
                                        }}
                                        autoFocus
                                        className="mt-2 p-1 rounded-md text-center bg-white dark:bg-gray-700"
                                    />
                                ) : (
                                    <p className="mt-2 text-sm text-center break-all">{file.name}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {renderTags()}
            {renderRecipients()}
        </>
    );

    // Render appreciation form with special recipient selector
    const renderAppreciationForm = () => (
        <>
            <textarea
                value={Appreciationmessage}
                onChange={(e) => setAppreciation(e.target.value)}
                placeholder="Type your message here..."
                className="w-full h-40 p-4 border rounded-md bg-white dark:bg-gray-900 dark:border-gray-600 text-gray-700 dark:text-white resize-none"
            />
            {renderToolbar()}
            {showCreateDocOptions && renderCreateDocOptions()}

            {/* Uploaded Files Preview */}
            {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-4">
                    {uploadedFiles.map((file, index) => (
                        <div key={index} className="relative border rounded-md p-3 bg-gray-100 dark:bg-gray-800 w-40 h-40 flex flex-col justify-between">
                            {/* Top Cross X to delete */}
                            <button
                                onClick={() => {
                                    const updated = [...uploadedFiles];
                                    updated.splice(index, 1);
                                    setUploadedFiles(updated);
                                }}
                                className="absolute top-1 left-1 text-gray-500 hover:text-red-500"
                            >
                                &times;
                            </button>

                            {/* File Icon and Name */}
                            <div className="flex flex-col items-center justify-center flex-1">
                                <div className="text-4xl">📄</div>
                                {renamingFileIndex === index ? (
                                    <input
                                        type="text"
                                        value={renameInput}
                                        onChange={(e) => setRenameInput(e.target.value)}
                                        onBlur={() => {
                                            if (renameInput.trim()) {
                                                const renamed = new File([file], renameInput, { type: file.type });
                                                const updated = [...uploadedFiles];
                                                updated[index] = renamed;
                                                setUploadedFiles(updated);
                                            }
                                            setRenamingFileIndex(null);
                                        }}
                                        autoFocus
                                        className="mt-2 p-1 rounded-md text-center bg-white dark:bg-gray-700"
                                    />
                                ) : (
                                    <p className="mt-2 text-sm text-center break-all">{file.name}</p>
                                )}
                            </div>

                            {/* 3 Dots Menu */}
                            <button onClick={() => setActiveFileMenu(activeFileMenu === index ? null : index)} className="absolute top-1 right-1 text-gray-500 hover:text-black dark:hover:text-white">
                                ⋯
                            </button>

                            {/* File Options Menu */}
                            {activeFileMenu === index && (
                                <div ref={fileMenuRef} className="absolute top-7 right-0 mb-2 w-48 bg-white dark:bg-gray-800 border rounded-md shadow-lg z-50">
                                    <div className="px-4 py-2 text-xs text-gray-500">File size: {(file.size / 1024).toFixed(2)} KB</div>
                                    <div
                                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                                        onClick={() => {
                                            setAppreciation((prev) => `${prev} [${uploadedFiles[index].name}] `);
                                            setActiveFileMenu(null);
                                        }}
                                    >
                                        Add to text
                                    </div>
                                    <div
                                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = URL.createObjectURL(file);
                                            link.download = file.name;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }}
                                    >
                                        Download
                                    </div>
                                    <div
                                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                                        onClick={() => {
                                            const updated = [...uploadedFiles];
                                            updated.splice(index, 1);
                                            setUploadedFiles(updated);
                                            setActiveFileMenu(null);
                                        }}
                                    >
                                        Delete
                                    </div>
                                    <div
                                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                                        onClick={() => {
                                            setRenamingFileIndex(index);
                                            setRenameInput(file.name);
                                            setActiveFileMenu(null);
                                        }}
                                    >
                                        Rename <span>➔</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showFileForm && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
                    {['Upload', 'My Drive', 'Google Docs'].map((label) => (
                        <div key={label} className="flex flex-col items-center justify-center border p-4 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                            <div className="text-2xl">📁</div>
                            <div className="mt-2 text-sm">{label}</div>
                        </div>
                    ))}
                    <div className="col-span-full border border-dashed px-4 py-8 text-center rounded-md text-gray-500 dark:text-gray-300 mt-4">Drop your files here</div>
                </div>
            )}

            {renderTags()}
            {renderRecipients()}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center mt-4 relative">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <ThumbsUp size={24} className="text-purple-500" />
                    <span>Recipient:</span>
                </div>
                <div className="flex-1 border px-3 py-2 rounded-md dark:border-gray-600 bg-gray-100 dark:bg-gray-900 flex flex-wrap items-center gap-2 relative">
                    {appreciationRecipients.map((user, index) => (
                        <div key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center text-sm">
                            {user}
                            <button
                                onClick={() => {
                                    const updated = [...appreciationRecipients];
                                    updated.splice(index, 1);
                                    setAppreciationRecipients(updated);
                                }}
                                className="ml-2 text-gray-500 hover:text-red-500"
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                    <span className="text-blue-500 cursor-pointer text-sm" onClick={() => setShowAppreciationRecipientSelector(true)}>
                        + Add employees
                    </span>

                    {showAppreciationRecipientSelector && (
                        <div ref={appreciationRecipientRef} className="absolute top-full mt-2 left-0 w-64 bg-white dark:bg-gray-800 border rounded-md shadow-lg p-3 z-50">
                            <ul>
                                {userNames.map((name, index) => (
                                    <li
                                        key={index}
                                        onClick={() => {
                                            if (!appreciationRecipients.includes(name)) {
                                                setAppreciationRecipients([...appreciationRecipients, name]);
                                            }
                                            setShowAppreciationRecipientSelector(false);
                                        }}
                                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded"
                                    >
                                        {name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
    // Render project task form with detailed task management options

    // Move this to be with your other render functions (around line 200 or so)
    const renderProjectSelector = () => (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mt-4 relative">
            <label className="text-sm text-gray-700 dark:text-gray-300 w-16 sm:w-auto">Projects:</label>
            <div className="flex-1 flex flex-wrap gap-2 border px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-900 dark:border-gray-600 relative">
                {/* Render selected projects */}
                {selectedProjects.map((project, index) => (
                    <div key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center text-sm">
                        {project}
                        <button
                            onClick={() => {
                                const updatedProjects = [...selectedProjects];
                                updatedProjects.splice(index, 1);
                                setSelectedProjects(updatedProjects);
                            }}
                            className="ml-2 text-gray-500 hover:text-red-500"
                        >
                            &times;
                        </button>
                    </div>
                ))}

                {/* + Add more button */}
                <span className="text-blue-500 cursor-pointer text-sm" onClick={() => setShowProjectSelector(true)}>
                    + Add more
                </span>

                {/* Project selector popup */}
                {showProjectSelector && (
                    <div ref={projectSelectorRef} className="absolute top-full mt-2 left-0 w-64 bg-white dark:bg-gray-800 border rounded-md shadow-lg p-3 z-50">
                        <input
                            type="text"
                            placeholder="Search projects..."
                            className="w-full px-3 py-2 border-b dark:border-gray-600 dark:bg-gray-900 dark:text-white mb-2"
                            onChange={(e) => setMentionSearch(e.target.value)}
                        />
                        <ul className="max-h-60 overflow-y-auto">
                            {projectNames
                                .filter((project) => project.toLowerCase().includes(mentionSearch.toLowerCase()))
                                .map((project, index) => (
                                    <li
                                        key={index}
                                        onClick={() => {
                                            if (!selectedProjects.includes(project)) {
                                                setSelectedProjects([...selectedProjects, project]);
                                            }
                                            setShowProjectSelector(false);
                                            setMentionSearch('');
                                        }}
                                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded"
                                    >
                                        {project}
                                    </li>
                                ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );

    // Render task form with detailed task management options
    const renderTaskForm = () => (
        <>
            <input
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Enter task name"
                className="w-full border-b-2 border-gray-300 dark:border-gray-600 p-2 text-lg font-medium bg-transparent dark:text-white"
            />

            <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Type @ to mention someone, or Space to use CoPilot"
                className="w-full h-28 mt-4 p-4 border rounded-md bg-white dark:bg-gray-900 dark:border-gray-600 text-gray-700 dark:text-white resize-none"
            />
            {renderToolbar()}
            {showCreateDocOptions && renderCreateDocOptions()}

            {/* Uploaded Files Preview */}
            {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-4">
                    {uploadedFiles.map((file, index) => (
                        <div key={index} className="relative border rounded-md p-3 bg-gray-100 dark:bg-gray-800 w-40 h-40 flex flex-col justify-between">
                            {/* Top Cross X to delete */}
                            <button
                                onClick={() => {
                                    const updated = [...uploadedFiles];
                                    updated.splice(index, 1);
                                    setUploadedFiles(updated);
                                }}
                                className="absolute top-1 left-1 text-gray-500 hover:text-red-500"
                            >
                                &times;
                            </button>

                            {/* File Icon and Name */}
                            <div className="flex flex-col items-center justify-center flex-1">
                                <div className="text-4xl">📄</div>
                                {renamingFileIndex === index ? (
                                    <input
                                        type="text"
                                        value={renameInput}
                                        onChange={(e) => setRenameInput(e.target.value)}
                                        onBlur={() => {
                                            if (renameInput.trim()) {
                                                const renamed = new File([file], renameInput, { type: file.type });
                                                const updated = [...uploadedFiles];
                                                updated[index] = renamed;
                                                setUploadedFiles(updated);
                                            }
                                            setRenamingFileIndex(null);
                                        }}
                                        autoFocus
                                        className="mt-2 p-1 rounded-md text-center bg-white dark:bg-gray-700"
                                    />
                                ) : (
                                    <p className="mt-2 text-sm text-center break-all">{file.name}</p>
                                )}
                            </div>

                            {/* 3 Dots Menu */}
                            <button onClick={() => setActiveFileMenu(activeFileMenu === index ? null : index)} className="absolute top-1 right-1 text-gray-500 hover:text-black dark:hover:text-white">
                                ⋯
                            </button>

                            {/* File Options Menu */}
                            {activeFileMenu === index && (
                                <div ref={fileMenuRef} className="absolute top-7 right-0  w-48 bg-white dark:bg-gray-800 border rounded-md shadow-lg z-50">
                                    <div className="px-4 py-2 text-xs text-gray-500">File size: {(file.size / 1024).toFixed(2)} KB</div>
                                    <div
                                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                                        onClick={() => {
                                            setTaskDescription((prev) => `${prev} [${uploadedFiles[index].name}] `);
                                            setActiveFileMenu(null);
                                        }}
                                    >
                                        Add to text
                                    </div>
                                    <div
                                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = URL.createObjectURL(file);
                                            link.download = file.name;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }}
                                    >
                                        Download
                                    </div>
                                    <div
                                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                                        onClick={() => {
                                            const updated = [...uploadedFiles];
                                            updated.splice(index, 1);
                                            setUploadedFiles(updated);
                                            setActiveFileMenu(null);
                                        }}
                                    >
                                        Delete
                                    </div>
                                    <div
                                        className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                                        onClick={() => {
                                            setRenamingFileIndex(index);
                                            setRenameInput(file.name);
                                            setActiveFileMenu(null);
                                        }}
                                    >
                                        Rename <span>➔</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showFileForm && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
                    {['Upload', 'My Drive', 'Google Docs'].map((label) => (
                        <div key={label} className="flex flex-col items-center justify-center border p-4 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                            <div className="text-2xl">📁</div>
                            <div className="mt-2 text-sm">{label}</div>
                        </div>
                    ))}
                    <div className="col-span-full border border-dashed px-4 py-8 text-center rounded-md text-gray-500 dark:text-gray-300 mt-4">Drop your files here</div>
                </div>
            )}

            {/* for the project in the task card  */}
            {renderProjectSelector()}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center mt-4 relative">
                <label className="text-sm text-gray-700 dark:text-gray-300 w-16 sm:w-auto">Assignee:</label>
                <div className="flex-1 flex flex-wrap gap-2 border px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-900 dark:border-gray-600 relative">
                    {/* Render selected Assignees */}
                    {selectedAssignees.map((assignee, index) => (
                        <div key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center text-sm">
                            {assignee}
                            <button
                                onClick={() => {
                                    const updatedAssignees = [...selectedAssignees];
                                    updatedAssignees.splice(index, 1);
                                    setSelectedAssignees(updatedAssignees);
                                }}
                                className="ml-2 text-gray-500 hover:text-red-500"
                            >
                                &times;
                            </button>
                        </div>
                    ))}

                    {/* + Add more button */}
                    <span className="text-blue-500 cursor-pointer text-sm" onClick={() => setShowAssigneeSelector(true)}>
                        + Add more
                    </span>

                    {/* Assignee Popup form */}
                    {showAssigneeSelector && (
                        <div ref={assigneeSelectorRef} className="absolute top-full mt-2 left-0 w-64 bg-white dark:bg-gray-800 border rounded-md shadow-lg p-3 z-50">
                            <ul>
                                {userNames.map((name, index) => (
                                    <li
                                        key={index}
                                        onClick={() => {
                                            if (!selectedAssignees.includes(name)) {
                                                setSelectedAssignees([...selectedAssignees, name]);
                                            }
                                            setShowAssigneeSelector(false);
                                        }}
                                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded"
                                    >
                                        {name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Toggle Labels */}
            <div className="flex gap-6 text-sm text-blue-500 cursor-pointer mt-6">
                <span onClick={() => setShowCreatedBy(!showCreatedBy)}>Created by</span>
                <span onClick={() => setShowParticipants(!showParticipants)}>Participants</span>
                <span onClick={() => setShowObservers(!showObservers)}>Observers</span>
            </div>

            {/* Created by field - only visible when toggled */}
            {showCreatedBy && (
                <div className="mt-3">
                    <label className="text-sm text-gray-700 dark:text-gray-300">Created by:</label>
                    <div ref={createdByRef} className="flex items-center flex-wrap gap-2 border px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-900 dark:border-gray-600 relative">
                        {createdBy.map((user, index) => (
                            <div key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center text-sm">
                                {user}
                                <button
                                    onClick={() => {
                                        const updated = [...createdBy];
                                        updated.splice(index, 1);
                                        setCreatedBy(updated);
                                    }}
                                    className="ml-2 text-gray-500 hover:text-red-500"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                        <span className="text-blue-500 cursor-pointer text-sm" onClick={() => setShowCreatedBySelector(true)}>
                            + Add
                        </span>
                        {showCreatedBySelector && (
                            <div className="absolute top-full mt-2 left-0 w-64 bg-white dark:bg-gray-800 border rounded-md shadow-lg p-3 z-50">
                                {userNames.map((name, index) => (
                                    <div
                                        key={index}
                                        onClick={() => {
                                            if (!createdBy.includes(name)) {
                                                setCreatedBy([...createdBy, name]);
                                            }
                                            setShowCreatedBySelector(false);
                                        }}
                                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 text-sm rounded"
                                    >
                                        {name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Participants */}
            {showParticipants && (
                <div className="mt-3">
                    <label className="text-sm text-gray-700 dark:text-gray-300">Participants:</label>
                    <div ref={participantsRef} className="flex flex-wrap gap-2 border px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-900 dark:border-gray-600 relative">
                        {participants.map((user, index) => (
                            <div key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center text-sm">
                                {user}
                                <button
                                    onClick={() => {
                                        const updated = [...participants];
                                        updated.splice(index, 1);
                                        setParticipants(updated);
                                    }}
                                    className="ml-2 text-gray-500 hover:text-red-500"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                        <span className="text-blue-500 cursor-pointer text-sm" onClick={() => setShowParticipantsSelector(true)}>
                            + Add
                        </span>
                        {showParticipantsSelector && (
                            <div className="absolute top-full mt-2 left-0 w-64 bg-white dark:bg-gray-800 border rounded-md shadow-lg p-3 z-50">
                                {userNames.map((name, index) => (
                                    <div
                                        key={index}
                                        onClick={() => {
                                            if (!participants.includes(name)) {
                                                setParticipants([...participants, name]);
                                            }
                                            setShowParticipantsSelector(false);
                                        }}
                                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 text-sm rounded"
                                    >
                                        {name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Observers */}
            {showObservers && (
                <div className="mt-3">
                    <label className="text-sm text-gray-700 dark:text-gray-300">Observers:</label>
                    <div ref={observersRef} className="flex flex-wrap gap-2 border px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-900 dark:border-gray-600 relative">
                        {observers.map((user, index) => (
                            <div key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center text-sm">
                                {user}
                                <button
                                    onClick={() => {
                                        const updated = [...observers];
                                        updated.splice(index, 1);
                                        setObservers(updated);
                                    }}
                                    className="ml-2 text-gray-500 hover:text-red-500"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                        <span className="text-blue-500 cursor-pointer text-sm" onClick={() => setShowObserversSelector(true)}>
                            + Add
                        </span>
                        {showObserversSelector && (
                            <div className="absolute top-full mt-2 left-0 w-64 bg-white dark:bg-gray-800 border rounded-md shadow-lg p-3 z-50">
                                {userNames.map((name, index) => (
                                    <div
                                        key={index}
                                        onClick={() => {
                                            if (!observers.includes(name)) {
                                                setObservers([...observers, name]);
                                            }
                                            setShowObserversSelector(false);
                                        }}
                                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 text-sm rounded"
                                    >
                                        {name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {/* Row for Deadline and Time Planning Link */}
                <div className="flex items-center gap-4">
                    <label>Deadline:</label>
                    <input type="date" className="border p-1" value={taskDeadlineDate} onChange={(e) => setTaskDeadlineDate(e.target.value)} />

                    <button type="button" onClick={() => setShowTimePlanning(!showTimePlanning)} className="text-blue-500 underline">
                        Time planning
                    </button>
                </div>

                {/* Row for Time Planning Fields (conditionally visible) */}
                {showTimePlanning && (
                    <div className="flex flex-col gap-2 mt-2">
                        {/* Start task on + Duration in one row */}
                        <div className="flex gap-4">
                            {/* Start task on */}
                            <div className="flex flex-col w-1/2">
                                <label className="text-sm">Start task on:</label>
                                <input type="datetime-local" className="border p-1" value={startDateTime} onChange={(e) => setStartDateTime(e.target.value)} />
                            </div>

                            {/* Duration */}
                            <div className="flex flex-col w-1/2">
                                <label className="text-sm">Duration:</label>
                                <div className="flex flex-col w-full">
                                    <input type="text" className="border p-1 w-full" value={calculatedDuration} readOnly placeholder="Duration" />
                                    <div className="flex gap-2 mt-1">
                                        <button
                                            type="button"
                                            className={`text-xs border px-2 py-1 rounded ${durationUnit === 'days' ? 'bg-blue-500 text-white' : ''}`}
                                            onClick={() => setDurationUnit('days')}
                                        >
                                            Days
                                        </button>
                                        <button
                                            type="button"
                                            className={`text-xs border px-2 py-1 rounded ${durationUnit === 'hours' ? 'bg-blue-500 text-white' : ''}`}
                                            onClick={() => setDurationUnit('hours')}
                                        >
                                            Hours
                                        </button>
                                        <button
                                            type="button"
                                            className={`text-xs border px-2 py-1 rounded ${durationUnit === 'minutes' ? 'bg-blue-500 text-white' : ''}`}
                                            onClick={() => setDurationUnit('minutes')}
                                        >
                                            Minutes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex" style={{ marginLeft: 0, width: 'calc(50% - 0.5rem)' }}>
                            <div className="flex flex-col w-full">
                                <label className="text-sm">Finish:</label>
                                <input type="datetime-local" className="border p-1" value={finishDateTime} onChange={(e) => setFinishDateTime(e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );

    // Switch to render appropriate form based on active tab
    const renderFormContent = () => {
        switch (activeTab) {
            case 'Message':
                return renderMessageForm();
            case 'Task':
                return renderTaskForm();
            default:
                return null;
        }
    };

    return (
        <div className="ml-5 mt-6 w-[75%] max-w-[1100px] rounded-lg shadow-md p-4 bg-white dark:bg-gray-800">
            {/* Main tab navigation */}
            <div
                key={refreshKey} // 👈 this will force a full re-mount on change
                className="flex border-b dark:border-gray-600 relative"
            >
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => handleTabClick(tab)}
                        className={`px-4 py-2 font-medium text-sm ${
                            activeTab === tab && formVisible
                                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                                : 'text-gray-500 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400'
                        }`}
                    >
                        {tab.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Placeholder prompt when no form is visible */}
            {!formVisible && (
                <div onClick={handlePlaceholderClick} className="mt-4 border rounded-md px-4 py-3 text-gray-400 cursor-text bg-white dark:bg-gray-900 dark:border-gray-600 dark:text-gray-400">
                    Send message...
                </div>
            )}

            {/* Render active form when visible */}
            {formVisible && (
                <div className="mt-6 space-y-4">
                    {renderFormContent()}
                    <div className="flex gap-4 pt-2">
                        <button
                            onClick={() => {
                                if (activeTab === 'Task') {
                                    handleTaskSend();
                                } else {
                                    handleSend();
                                }
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md text-sm flex items-center gap-2"
                        >
                            <Send size={16} /> SEND
                        </button>

                        <button
                            className="text-gray-500 dark:text-gray-300 text-sm"
                            onClick={() => {
                                setFormVisible(false);
                                setActiveTab('');
                                setShowCreateDocOptions(false);
                            }}
                        >
                            CANCEL
                        </button>
                    </div>
                </div>
            )}

            {showSuccessMessage && <div className="mt-2 text-green-600 text-sm animate-fade-in-out">Message sent!</div>}

            {(!activeTab || activeTab === 'Message') && feedMessages.length > 0 && (
                <div className="mt-8">
                    {feedMessages.map((msg, msgIndex) => (
                        <div key={msg.id} className="border p-4 mb-4 rounded-md bg-gray-50 dark:bg-gray-700">
                            <div className="font-semibold text-blue-600 dark:text-blue-300">
                                {msg.sender} ➝ {safeParseJson(msg.recipients).join(', ')}
                            </div>

                            <div className="text-xs text-gray-400 mt-1">{new Date(msg.timestamp).toLocaleString()}</div>
                            <div className="mt-2 text-gray-800 dark:text-gray-100">{msg.message}</div>
                            {msg.tags && (
                                <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                    <strong>Tags:</strong> {Array.isArray(msg.tags) ? msg.tags.join(', ') : JSON.parse(msg.tags || '[]').join(', ')}
                                </div>
                            )}

                            {msg.file_name &&
                                msg.file_path &&
                                (() => {
                                    let names: string[] = [];
                                    let paths: string[] = [];

                                    try {
                                        // Handle cases where file_name/file_path might be string or string[]
                                        const rawFileName = Array.isArray(msg.file_name) ? JSON.stringify(msg.file_name) : msg.file_name;
                                        const rawFilePath = Array.isArray(msg.file_path) ? JSON.stringify(msg.file_path) : msg.file_path;

                                        names = typeof rawFileName === 'string' ? JSON.parse(rawFileName) : [];
                                        paths = typeof rawFilePath === 'string' ? JSON.parse(rawFilePath) : [];
                                    } catch (err) {
                                        console.error('Failed to parse file_name or file_path:', msg.file_name, msg.file_path);
                                        return <div className="text-red-500 text-sm">Error loading attachments</div>;
                                    }

                                    return (
                                        <div className="mt-2 space-y-1">
                                            {names.map((name: string, fileIndex: number) => (
                                                <div key={`${msg.id}-${fileIndex}`} className="flex items-center mb-2 group relative">
                                                    <div className="text-sm flex items-center">
                                                        <span className="mr-1">📎</span>
                                                        <a
                                                            href={`http://localhost:5000/${paths[fileIndex]}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-500 hover:text-blue-700 underline"
                                                        >
                                                            {name}
                                                        </a>
                                                    </div>

                                                    {/* Dropdown Button */}
                                                    <div className="relative ml-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                const uniqueId = `${msg.id}-${fileIndex}`;
                                                                setActiveFeedFileMenu(activeFeedFileMenu === uniqueId ? null : uniqueId);
                                                            }}
                                                        >
                                                            <ChevronDown size={16} />
                                                        </button>
                                                        {/* Dropdown Menu */}
                                                        {activeFeedFileMenu === `${msg.id}-${fileIndex}` && (
                                                            <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                                                                <button
                                                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        downloadFeedFile(`http://localhost:5000/${paths[fileIndex]}`, name);
                                                                        setActiveFeedFileMenu(null);
                                                                    }}
                                                                >
                                                                    Download
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'Task' && feedTasks.length > 0 && (
                <div className="mt-8">
                    {feedTasks.map((task) => {
                        const assignees = safeParseJson(task.assignees);
                        const createdBy = safeParseJson(task.created_by);
                        const participants = safeParseJson(task.participants);
                        const observers = safeParseJson(task.observers);
                        const fileNames = safeParseJson(task.file_name);
                        const filePaths = safeParseJson(task.file_path);

                        return (
                            <div key={task.id} className="border p-4 mb-4 rounded-md bg-gray-50 dark:bg-gray-700">
                                <div className="font-semibold text-blue-600 dark:text-blue-300">
                                    {task.sender} → {assignees.join(', ')}
                                </div>
                                <div className="text-xs dark:text-gray-400 mt-1">{new Date(task.timestamp).toLocaleString()}</div>

                                <div>
                                    <div className="text-gray-800 dark:text-gray-100 font-medium">Project:</div>
                                    <div>{safeParseJson(task.projects).join(', ')}</div>
                                </div>

                                <div className="mt-3">
                                    <div className="text-gray-800 dark:text-gray-100 font-medium text-lg">Task : {task.task_name}</div>
                                    <div className="text-lg mt-1">Description : {task.task_description}</div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm">
                                    <div>
                                        <div className="font-medium">Created by:</div>
                                        <div>{createdBy.join(', ')}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium">Participants:</div>
                                        <div>{participants.join(', ')}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium">Observers:</div>
                                        <div>{observers.join(', ')}</div>
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <div className="font-medium">Deadline:</div>
                                    <div>{new Date(task.deadline).toLocaleDateString()}</div>
                                </div>

                                {fileNames && filePaths && fileNames.length > 0 && (
                                    <div className="mt-3">
                                        <div className="font-medium">Attachments:</div>
                                        <div className="space-y-1">
                                            {fileNames.map((name: string, index: number) => (
                                                <div key={index} className="flex items-center">
                                                    <span className="mr-1">📎</span>
                                                    <a
                                                        href={`http://localhost:5000/${filePaths[index]}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-500 hover:text-blue-700 underline"
                                                    >
                                                        {name}
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* for displaying the event in the frontend  */}

            {activeTab === 'Event' && feedEvents.length > 0 && (
                <div className="mt-8">
                    {feedEvents.map((event) => {
                        const assignees = typeof event.assignees === 'string' ? event.assignees.split(',') : event.assignees || [];
                        const startDate = new Date(event.start || event.StartDate);
                        const endDate = new Date(event.end || event.EndDate);
                        // const createdAt = new Date(event.created_at);
                        // const updatedAt = new Date(event.updated_at);

                        return (
                            <div key={event.id} className="border p-4 mb-4 rounded-md bg-gray-50 dark:bg-gray-700">
                                {/* Header with sender and assignees */}
                                <div className="font-semibold text-blue-600 dark:text-blue-300">
                                    {event.sender || event.sender_name} → {assignees.join(', ')}
                                </div>

                                {/* Timestamp */}
                                {/* <div className="text-xs text-gray-400 mt-1">
                        <div>Created At: {createdAt.toLocaleString()}</div>
                        <div>Updated At: {updatedAt.toLocaleString()}</div>
                    </div> */}

                                {/* Rest of the event display code remains the same */}
                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex flex-col items-center border rounded p-2 w-16">
                                        <div className="text-xs uppercase">{startDate.toLocaleString('default', { month: 'short' })}</div>
                                        <div className="text-2xl font-bold">{startDate.getDate()}</div>
                                        <div className="text-xs">{startDate.toLocaleString('default', { weekday: 'short' })}</div>
                                    </div>

                                    {/* Event details */}
                                    <div className="flex-1">
                                        <div className="font-medium text-lg">Event : {event.title || event.EventTitle}</div>
                                        <div className="font-medium text-lg"> Event Description: {event.description || event.EventDescription}</div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                                            <div>
                                                <div className="font-medium">Starts:</div>
                                                <div>{startDate.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div className="font-medium">Ends:</div>
                                                <div>{endDate.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const safeParseJson = (input: any): string[] => {
    try {
        if (Array.isArray(input)) return input;
        if (typeof input === 'string') {
            return JSON.parse(input);
        }
        return [];
    } catch (e) {
        return [];
    }
};

export default Feed;
