import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
// import { useState } from 'react';
// import axios from 'axios';
import { useState } from 'react';
import axios from 'axios';
import IconMail from '../../components/Icon/IconMail';
import IconLockDots from '../../components/Icon/IconLockDots';
import IconInstagram from '../../components/Icon/IconInstagram';
import IconFacebookCircle from '../../components/Icon/IconFacebookCircle';
import IconTwitter from '../../components/Icon/IconTwitter';
import IconGoogle from '../../components/Icon/IconGoogle';

const LoginBoxed = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id.toLowerCase()]: value });
    };

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/login`, {
                email: formData.email,
                password: formData.password
            });

        

            setLoading(false);

          if (response.data.token && response.data.user) {
    // Store token and user role
    const { user } = response.data;
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('isAdmin', JSON.stringify(response.data.isAdmin));
    localStorage.setItem('userName', response.data.user.name);
    localStorage.setItem('userId', response.data.user.id); 

    localStorage.setItem('user', JSON.stringify(user));

    // Redirect based on role
    if (response.data.isAdmin) {
        navigate('/'); // Redirect admin
    } else {
        navigate('/apps/feed'); // Redirect user
    }
}

        } catch (err: any) {
            setLoading(false);
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
            <div className="relative w-full max-w-[870px] rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 p-6">
                <div className="mx-auto w-full max-w-[440px]">
                    <h1 className="text-3xl font-extrabold uppercase text-primary md:text-4xl">Sign in</h1>
                    <p className="text-base font-bold text-white-dark">Enter your email and password to login</p>

                    {error && <div className="mb-5 text-red-500 font-medium">{error}</div>}

                    <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
                        <div>
                            <label htmlFor="Email">Email</label>
                            <div className="relative text-white-dark">
                                <input
                                    id="Email"
                                    type="email"
                                    placeholder="Enter Email"
                                    className="form-input ps-10 placeholder:text-white-dark"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                                <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                    <IconMail fill={true} />
                                </span>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="Password">Password</label>
                            <div className="relative text-white-dark">
                                <input
                                    id="Password"
                                    type="password"
                                    placeholder="Enter Password"
                                    className="form-input ps-10 placeholder:text-white-dark"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                    <IconLockDots fill={true} />
                                </span>
                            </div>
                        </div>
                        
                        <div className="text-right mt-3">
                            <Link 
                                to="/auth/forgot-password" 
                                className="text-primary text-sm hover:underline"
                            >
                                Forgot Password?
                            </Link>
                        </div>
                        
                        <button
                            type="submit"
                            className="btn btn-gradient w-full mt-6"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <div className="my-7 text-center md:mb-9">
                        <span className="relative bg-white px-2 font-bold uppercase text-white-dark dark:bg-dark dark:text-white-light">or</span>
                    </div>

                    <div className="flex justify-center gap-3.5">
                        <Link to="#" className="social-icon"><IconInstagram /></Link>
                        <Link to="#" className="social-icon"><IconFacebookCircle /></Link>
                        <Link to="#" className="social-icon"><IconTwitter /></Link>
                        <Link to="#" className="social-icon"><IconGoogle /></Link>
                    </div>

                    <div className="text-center dark:text-white mt-4">
                        Don't have an account?{' '}
                        <Link to="/auth/boxed-signup" className="text-primary underline">
                            SIGN UP
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginBoxed;