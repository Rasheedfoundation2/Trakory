import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import axios from 'axios';

const ForgotPassword = () => {
    const dispatch = useDispatch();
    
    useEffect(() => {
        dispatch(setPageTitle('Forgot Password'));
    });

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [emailSent, setEmailSent] = useState(false);

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/forgot-password', {
                email: email.trim()
            });

            setMessage(response.data.message);
            setEmailSent(true);
            setLoading(false);
        } catch (err: any) {
            setLoading(false);
            setError(err.response?.data?.error || 'Failed to send reset email. Please try again.');
        }
    };

    if (emailSent) {
        return (
            <div className="relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16"
                style={{
                    backgroundImage: `url(/assets/images/auth/bg-gradient.png)`,
                }}>
                <img
                    src="/assets/images/auth/coming-soon-object1.png"
                    alt=""
                    className="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2"
                />
                <img
                    src="/assets/images/auth/coming-soon-object2.png"
                    alt=""
                    className="absolute left-24 top-0 h-40 md:left-[30%]"
                />
                <img
                    src="/assets/images/auth/coming-soon-object3.png"
                    alt=""
                    className="absolute right-0 top-0 h-[300px]"
                />
                <img
                    src="/assets/images/auth/polygon-object.svg"
                    alt=""
                    className="absolute bottom-0 end-[28%]"
                />
                
                <div className="relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0E1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,rgba(14,23,38,0)_80.07%,#0E1726_100%)]">
                    <div className="relative flex flex-col justify-center rounded-md bg-white/60 px-6 py-20 backdrop-blur-lg dark:bg-black/50 lg:min-h-[758px]">
                        <div className="mx-auto w-full max-w-[440px]">
                            <div className="mb-10 text-center">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">
                                    Email Sent!
                                </h1>
                                <p className="text-base font-bold leading-normal text-white-dark">
                                    Check your email for reset instructions
                                </p>
                            </div>
                            
                            <div className="mb-10 space-y-5">
                                <div className="text-center">
                                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                                        <svg className="h-10 w-10 text-success" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                        </svg>
                                    </div>
                                    <div className="mb-6 rounded-lg bg-success-light p-4 text-success dark:bg-success/10">
                                        <p className="font-semibold">{message}</p>
                                    </div>
                                    <div className="space-y-3 text-left text-sm text-white-dark">
                                        <p>📧 <strong>Check your email:</strong> We've sent a password reset link to <strong>{email}</strong></p>
                                        <p>⏰ <strong>Link expires:</strong> The reset link is valid for 1 hour</p>
                                        <p>📁 <strong>Check spam folder:</strong> If you don't see the email, check your spam or junk folder</p>
                                        <p>🔄 <strong>Didn't receive it?</strong> You can request another reset email below</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col space-y-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEmailSent(false);
                                        setMessage('');
                                        setEmail('');
                                    }}
                                    className="btn btn-primary w-full gap-2"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Send Another Email
                                </button>
                                
                                <Link to="/auth/boxed-signin" className="btn btn-outline-primary w-full">
                                    Back to Login
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16"
            style={{
                backgroundImage: `url(/assets/images/auth/bg-gradient.png)`,
            }}>
            <img
                src="/assets/images/auth/coming-soon-object1.png"
                alt=""
                className="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2"
            />
            <img
                src="/assets/images/auth/coming-soon-object2.png"
                alt=""
                className="absolute left-24 top-0 h-40 md:left-[30%]"
            />
            <img
                src="/assets/images/auth/coming-soon-object3.png"
                alt=""
                className="absolute right-0 top-0 h-[300px]"
            />
            <img
                src="/assets/images/auth/polygon-object.svg"
                alt=""
                className="absolute bottom-0 end-[28%]"
            />
            
            <div className="relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0E1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,rgba(14,23,38,0)_80.07%,#0E1726_100%)]">
                <div className="relative flex flex-col justify-center rounded-md bg-white/60 px-6 py-20 backdrop-blur-lg dark:bg-black/50 lg:min-h-[758px]">
                    <div className="mx-auto w-full max-w-[440px]">
                        <div className="mb-10 text-center">
                            <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">
                                Forgot Password?
                            </h1>
                            <p className="text-base font-bold leading-normal text-white-dark">
                                Enter your email to reset your password
                            </p>
                        </div>
                        
                        <form className="space-y-5" onSubmit={submitForm}>
                            <div>
                                <label htmlFor="email" className="dark:text-white">
                                    Email Address
                                </label>
                                <div className="relative text-white-dark">
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        className="form-input ps-10 placeholder:text-white-dark"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                        required
                                    />
                                    <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                            <path
                                                opacity="0.5"
                                                d="M10.65 2.25H7.35C4.23873 2.25 2.6831 2.25 1.71655 3.23851C0.75 4.22703 0.75 5.81802 0.75 9C0.75 12.182 0.75 13.773 1.71655 14.7615C2.6831 15.75 4.23873 15.75 7.35 15.75H10.65C13.7613 15.75 15.3169 15.75 16.2835 14.7615C17.25 13.773 17.25 12.182 17.25 9C17.25 5.81802 17.25 4.22703 16.2835 3.23851C15.3169 2.25 13.7613 2.25 10.65 2.25Z"
                                                fill="currentColor"
                                            />
                                            <path
                                                d="M14.3465 5.02574C14.609 5.23282 14.6445 5.65394 14.4374 5.91648L11.5969 9.40885C10.7915 10.3696 9.2085 10.3696 8.40309 9.40885L5.56262 5.91648C5.3555 5.65394 5.39102 5.23282 5.65356 5.02574C5.91609 4.81865 6.33721 4.85418 6.54429 5.11671L9.38477 8.60909C9.47311 8.72078 9.52689 8.72078 9.61523 8.60909L12.4557 5.11671C12.6628 4.85418 13.0839 4.81865 13.3465 5.02574Z"
                                                fill="currentColor"
                                            />
                                        </svg>
                                    </span>
                                </div>
                            </div>
                            
                            {error && (
                                <div className="mb-5 rounded-lg bg-danger-light p-4 text-danger dark:bg-danger/10">
                                    <p className="font-semibold">{error}</p>
                                </div>
                            )}
                            
                            {message && (
                                <div className="mb-5 rounded-lg bg-success-light p-4 text-success dark:bg-success/10">
                                    <p className="font-semibold">{message}</p>
                                </div>
                            )}
                            
                            <button
                                type="submit"
                                className="btn btn-primary w-full gap-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                                            <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"/>
                                        </svg>
                                        Sending Email...
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Send Reset Email
                                    </>
                                )}
                            </button>
                        </form>
                        
                        <div className="relative my-7 text-center md:mb-9">
                            <span className="absolute inset-x-0 top-1/2 h-px w-full -translate-y-1/2 bg-white-light dark:bg-white-dark"></span>
                            <span className="relative bg-white px-2 font-bold uppercase text-white-dark dark:bg-dark dark:text-white-light">
                                OR
                            </span>
                        </div>
                        
                        <div className="text-center dark:text-white">
                            <p>
                                Remember your password?{' '}
                                <Link to="/auth/boxed-signin" className="uppercase text-primary underline transition hover:text-black dark:hover:text-white">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
