import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconPencilPaper from '../../components/Icon/IconPencilPaper';
import IconCoffee from '../../components/Icon/IconCoffee';
import IconCalendar from '../../components/Icon/IconCalendar';
import IconMapPin from '../../components/Icon/IconMapPin';
import IconMail from '../../components/Icon/IconMail';
import IconPhone from '../../components/Icon/IconPhone';
import IconTwitter from '../../components/Icon/IconTwitter';
import IconDribbble from '../../components/Icon/IconDribbble';
import IconGithub from '../../components/Icon/IconGithub';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  dob?: string;
  location?: string;
  phone?: string;
  is_admin: boolean;
}

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(setPageTitle('Profile'));
    fetchUserData();
  }, [dispatch]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth/boxed-signin');
        return;
      }

      const response = await axios.get('http://localhost:5000/user-info', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setUser({
        ...response.data,
        is_admin: response.data.is_admin === 1,
        role: response.data.is_admin ? 'Admin' : response.data.role || 'User'
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/auth/boxed-signin');
          toast.info('Session expired, please login again');
        } else {
          toast.error('Failed to fetch user data');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">User not found</h2>
          <button
            onClick={() => navigate('/auth/boxed-signin')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-5">
      <ul className="flex space-x-2 rtl:space-x-reverse mb-5">
        <li>
          <Link to="#" className="text-primary hover:underline">
            Users
          </Link>
        </li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <span>Profile</span>
        </li>
      </ul>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <div className="panel" style={{ width: '100%', maxWidth: '400px' }}>
          <div className="flex items-center justify-between mb-5">
            <h5 className="font-semibold text-lg dark:text-white-light">Profile</h5>
            <Link to="/users/user-account-settings" className="ltr:ml-auto rtl:mr-auto btn btn-primary p-2 rounded-full">
              <IconPencilPaper />
            </Link>
          </div>
          <div className="mb-5">
            <div className="flex flex-col justify-center items-center">
              <img 
                src={user.avatar || "/assets/images/profile-34.jpeg"} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover mb-5"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/images/profile-34.jpeg';
                }}
              />
              <p className="font-semibold text-primary text-xl">{user.name}</p>
            </div>
            <ul className="mt-5 flex flex-col max-w-[160px] m-auto space-y-4 font-semibold text-white-dark">
              <li className="flex items-center gap-2">
                <IconCoffee className="shrink-0" />
                {user.role}
              </li>
              {user.dob && (
                <li className="flex items-center gap-2">
                  <IconCalendar className="shrink-0" />
                  {user.dob}
                </li>
              )}
              {user.location && (
                <li className="flex items-center gap-2">
                  <IconMapPin className="shrink-0" />
                  {user.location}
                </li>
              )}
              <li>
                <button className="flex items-center gap-2">
                  <IconMail className="w-5 h-5 shrink-0" />
                  <span className="text-primary truncate">{user.email}</span>
                </button>
              </li>
              {user.phone && (
                <li className="flex items-center gap-2">
                  <IconPhone />
                  <span className="whitespace-nowrap" dir="ltr">
                    {user.phone}
                  </span>
                </li>
              )}
            </ul>
            <ul className="mt-7 flex items-center justify-center gap-2">
              <li>
                <button className="btn btn-info flex items-center justify-center rounded-full w-10 h-10 p-0">
                  <IconTwitter className="w-5 h-5" />
                </button>
              </li>
              <li>
                <button className="btn btn-danger flex items-center justify-center rounded-full w-10 h-10 p-0">
                  <IconDribbble />
                </button>
              </li>
              <li>
                <button className="btn btn-dark flex items-center justify-center rounded-full w-10 h-10 p-0">
                  <IconGithub />
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;