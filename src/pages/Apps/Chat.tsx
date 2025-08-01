import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, MessageCircle, X, Plus, Search } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface ChatRoom {
    id: number;
    name?: string;
    type: 'direct' | 'group';
    display_name: string;
    unread_count: number;
    created_at: string;
    updated_at: string;
}

interface Message {
    id: number;
    room_id: number;
    sender_id: number;
    content: string;
    message_type: 'text' | 'file' | 'image';
    sender_name: string;
    sender_email: string;
    created_at: string;
}

const Chat: React.FC = () => {
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [searchUsers, setSearchUsers] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<'chats' | 'users'>('chats');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagePollingRef = useRef<NodeJS.Timeout | null>(null);
    const lastMessageCountRef = useRef<number>(0);

    useEffect(() => {
        getCurrentUser();
        fetchChatRooms();
        fetchUsers();

        return () => {
            if (messagePollingRef.current) {
                clearInterval(messagePollingRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (selectedRoom) {
            fetchMessages(selectedRoom.id);
            markRoomAsRead(selectedRoom.id);

            // Poll for new messages every 3 seconds
            if (messagePollingRef.current) {
                clearInterval(messagePollingRef.current);
            }

            messagePollingRef.current = setInterval(() => {
                fetchMessages(selectedRoom.id);
            }, 3000);
        }

        return () => {
            if (messagePollingRef.current) {
                clearInterval(messagePollingRef.current);
            }
        };
    }, [selectedRoom]);

    useEffect(() => {
        scrollToBottom();

        // Check if new messages arrived (for updating sidebar with notifications)
        if (messages.length > lastMessageCountRef.current && messages.length > 0) {
            const latestMessage = messages[messages.length - 1];

            // Only update chat rooms if the latest message is from someone else
            if (latestMessage.sender_id !== currentUser?.id) {
                fetchChatRooms();
            }
        }

        lastMessageCountRef.current = messages.length;
    }, [messages, currentUser?.id]);
const getCurrentUser = () => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('Current user payload:', payload);
            setCurrentUser({ 
                id: payload.id, 
                name: payload.name || '', 
                email: payload.email || '' 
            });
        } catch (error) {
            console.error('Error parsing token:', error);
        }
    }
};

   const apiCall = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:5000/api/chat${url}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error; // Re-throw to be caught by the calling function
    }
};

    const fetchChatRooms = async () => {
        try {
            const rooms = await apiCall('/rooms');
            setChatRooms(rooms);
        } catch (error) {
            console.error('Error fetching chat rooms:', error);
        }
    };

  const fetchUsers = async () => {
    try {
        setLoading(true);
        const usersData = await apiCall('/users');
        console.log('Fetched users:', usersData);
        
        // Filter out the current user (just in case)
        const filteredUsers = usersData.filter((user: User) => user.id !== currentUser?.id);
        setUsers(filteredUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        setLoading(false);
    }
};
    const fetchMessages = async (roomId: number) => {
        try {
            const messagesData = await apiCall(`/room/${roomId}/messages`);
            setMessages(messagesData);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

   const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !currentUser) return;

    try {
        setLoading(true);
        const message = await apiCall(`/room/${selectedRoom.id}/message`, {
            method: 'POST',
            body: JSON.stringify({
                content: newMessage.trim(),
                messageType: 'text',
            }),
        });

        // Optimistically update the UI
        setMessages((prev) => [...prev, {
            ...message,
            sender_id: currentUser.id,
            sender_name: currentUser.name,
            sender_email: currentUser.email
        }]);
        
        setNewMessage('');
        
        // Update the room's timestamp
        setChatRooms((prevRooms) => 
            prevRooms.map((room) => 
                room.id === selectedRoom.id 
                    ? { ...room, updated_at: new Date().toISOString() } 
                    : room
            )
        );
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
    } finally {
        setLoading(false);
    }
};

    const startDirectChat = async (userId: number) => {
        try {
            const room = await apiCall(`/room/direct/${userId}`);

            // Find the room with display name
            await fetchChatRooms();
            const updatedRooms = await apiCall('/rooms');
            const newRoom = updatedRooms.find((r: ChatRoom) => r.id === room.id);

            if (newRoom) {
                setSelectedRoom(newRoom);
            }
            setActiveTab('chats'); // Switch to chats tab after starting a chat
        } catch (error) {
            console.error('Error starting direct chat:', error);
        }
    };

    const markRoomAsRead = async (roomId: number) => {
        try {
            await apiCall(`/room/${roomId}/mark-read`, { method: 'POST' });

            // Update the local state to clear unread count immediately
            setChatRooms((prevRooms) => prevRooms.map((room) => (room.id === roomId ? { ...room, unread_count: 0 } : room)));
        } catch (error) {
            console.error('Error marking room as read:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    };

   const filteredUsers = users.filter((user) => 
    user?.name?.toLowerCase().includes(searchUsers.toLowerCase()) || 
    user?.email?.toLowerCase().includes(searchUsers.toLowerCase())
);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="w-full h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-900 flex overflow-hidden">
            {/* Sidebar */}
            <div className="w-80 min-w-[320px] max-w-md panel flex flex-col m-2 mr-1">
                {/* Header with Tabs */}
                <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-1 mb-4">
                        <button
                            onClick={() => setActiveTab('chats')}
                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === 'chats' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                            <MessageCircle className="inline mr-2" size={16} />
                            Chats
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === 'users' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                            <Users className="inline mr-2" size={16} />
                            Users
                        </button>
                    </div>

                    {/* Search Bar - only show for users tab */}
                    {activeTab === 'users' && (
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={16} />
                            <input type="text" placeholder="Search users..." value={searchUsers} onChange={(e) => setSearchUsers(e.target.value)} className="form-input pl-10 w-full" />
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    {activeTab === 'chats' ? (
                        // Chat Rooms List
                        chatRooms.length === 0 ? (
                            <div className="p-4 text-center text-gray-600 dark:text-gray-400">No chats yet. Switch to Users tab to start a conversation!</div>
                        ) : (
                            <div className="space-y-1 p-2">
                                {chatRooms.map((room) => (
                                    <div
                                        key={room.id}
                                        onClick={() => setSelectedRoom(room)}
                                        className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                                            selectedRoom?.id === room.id ? 'bg-primary/10 border-primary text-primary dark:bg-primary/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h6 className="font-medium text-gray-900 dark:text-white-light truncate">{room.display_name}</h6>
                                                    {room.unread_count > 0 && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary text-white ml-2">{room.unread_count}</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{formatDate(room.updated_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : // Users List
                    filteredUsers.length === 0 ? (
                        <div className="p-4 text-center text-gray-600 dark:text-gray-400">No users found</div>
                    ) : (
                        <div className="space-y-2 p-2">
                            {filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    onClick={() => startDirectChat(user.id)}
                                    className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                >
                                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium mr-3 flex-shrink-0">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-800 dark:text-white-light truncate">{user.name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 min-w-0 panel m-2 ml-1 flex flex-col">
                {selectedRoom ? (
                    <>
                        {/* Chat Header */}
                        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
                            <h5 className="font-semibold text-lg dark:text-white-light">{selectedRoom.display_name}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRoom.type === 'direct' ? 'Direct Message' : 'Group Chat'}</p>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                            {messages.map((message) => (
                                <div key={message.id} className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                            message.sender_id === currentUser?.id ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white-light'
                                        }`}
                                    >
                                        {message.sender_id !== currentUser?.id && <p className="text-xs font-medium mb-1 opacity-70">{message.sender_name}</p>}
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                        <p className={`text-xs mt-1 ${message.sender_id === currentUser?.id ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {formatTime(message.created_at)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-end space-x-3">
                                <div className="flex-1">
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type a message..."
                                        className="form-input resize-none max-h-32 w-full"
                                        rows={1}
                                        disabled={loading}
                                    />
                                </div>
                                <button onClick={sendMessage} disabled={!newMessage.trim() || loading} className="btn btn-primary flex-shrink-0">
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center min-h-0">
                        <div className="text-center">
                            <MessageCircle size={64} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                            <h5 className="font-semibold text-lg dark:text-white-light mb-2">Select a chat to start messaging</h5>
                            <p className="text-gray-600 dark:text-gray-400">Choose an existing conversation or select a user to start a new chat</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
