import { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import IconLoader from '../../components/Icon/IconLoader';
import { API_BASE_URL } from '../../config/api';

interface User {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    created_at: string;
}

const ManageUsers = () => {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire({
                title: 'Authentication Error',
                text: 'Please login again',
                icon: 'error',
            });
            // Redirect to login or handle as needed
            return;
        }

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setCurrentUser(parsedUser);
            if (parsedUser.is_admin) {
                fetchUsers();
            }
        }
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const response = await axios.get(`${API_BASE_URL}/api/user-management`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Handle both response formats
            const usersData = response.data.success ? response.data.data : response.data;

            if (!usersData) {
                throw new Error('No user data received');
            }

            setUsers(usersData);
        } catch (error: any) {
            console.error('Error details:', error);

            let errorMessage = 'Failed to fetch users';
            if (error.response) {
                errorMessage = error.response.data?.error || error.response.data?.message || 'Server error';
            } else if (error.request) {
                errorMessage = 'No response from server';
            } else {
                errorMessage = error.message;
            }

            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleAdminStatus = async (userId: number, currentStatus: boolean) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_BASE_URL}/api/user-management/${userId}/admin-status`, { is_admin: !currentStatus }, { headers: { Authorization: `Bearer ${token}` } });
            fetchUsers();
            Swal.fire('Success', `User role updated to ${!currentStatus ? 'Admin' : 'User'}`, 'success');
        } catch (error: any) {
            console.error('Error updating admin status:', error);
            Swal.fire({
                title: 'Error',
                text: error.response?.data?.error || error.message,
                icon: 'error',
            });
        }
    };

    const handleDeleteUser = async (userId: number) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_BASE_URL}/api/user-management/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
                fetchUsers();
                Swal.fire('Deleted!', 'User has been deleted.', 'success');
            } catch (error: any) {
                console.error('Error deleting user:', error);
                Swal.fire({
                    title: 'Error',
                    text: error.response?.data?.error || error.message,
                    icon: 'error',
                });
            }
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    if (!currentUser?.is_admin) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Unauthorized Access</h2>
                    <p className="text-gray-600 mt-2">You don't have permission to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Manage Users</h1>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <IconLoader className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b bg-gray-100">
                                <th className="p-3 text-left">ID</th>
                                <th className="p-3 text-left">Name</th>
                                <th className="p-3 text-left">Email</th>
                                <th className="p-3 text-left">Role</th>
                                <th className="p-3 text-left">Joined</th>
                                <th className="p-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3">{user.id}</td>
                                    <td className="p-3 font-medium">{user.name}</td>
                                    <td className="p-3">{user.email}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${user.is_admin ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {user.is_admin ? 'Admin' : 'User'}
                                            </span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={user.is_admin}
                                                    onChange={() => toggleAdminStatus(user.id, user.is_admin)}
                                                    className="sr-only peer"
                                                    disabled={user.id === currentUser?.id}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </td>
                                    <td className="p-3">{formatDate(user.created_at)}</td>
                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-1 text-red-600 hover:text-red-800 rounded hover:bg-red-50"
                                                title="Delete"
                                                disabled={user.id === currentUser?.id}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;
