import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';

const About = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('About'));
    });

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-t from-[#c39be3] to-[#f2e7d5]">
            <div className="p-5 text-center font-semibold">
                <div className="panel mx-auto w-full max-w-4xl">
                    <div className="mb-10">
                        <h1 className="mb-4 text-4xl font-bold text-primary">About Trakory</h1>
                        <p className="text-lg text-white-dark">
                            Your comprehensive project management and time tracking solution
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="space-y-6">
                            <div className="text-left">
                                <h2 className="mb-4 text-2xl font-semibold text-primary">Our Mission</h2>
                                <p className="text-white-dark leading-relaxed">
                                    Trakory is designed to streamline project management and time tracking for teams of all sizes. 
                                    We believe in providing intuitive tools that help organizations stay organized, productive, 
                                    and focused on what matters most.
                                </p>
                            </div>

                            <div className="text-left">
                                <h2 className="mb-4 text-2xl font-semibold text-primary">Key Features</h2>
                                <ul className="space-y-2 text-white-dark">
                                    <li className="flex items-center">
                                        <svg className="mr-2 h-5 w-5 text-success" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                        </svg>
                                        Time Tracking & Attendance Management
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="mr-2 h-5 w-5 text-success" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                        </svg>
                                        Project Management & Collaboration
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="mr-2 h-5 w-5 text-success" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                        </svg>
                                        Team Communication & Chat
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="mr-2 h-5 w-5 text-success" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                        </svg>
                                        File Management & Drive Integration
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="mr-2 h-5 w-5 text-success" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                        </svg>
                                        Approval Workflows & Admin Controls
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="text-left">
                                <h2 className="mb-4 text-2xl font-semibold text-primary">Why Choose Trakory?</h2>
                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <div className="mr-3 mt-1 h-2 w-2 rounded-full bg-primary"></div>
                                        <div>
                                            <h3 className="font-semibold text-dark dark:text-white">User-Friendly Interface</h3>
                                            <p className="text-sm text-white-dark">Intuitive design that's easy to learn and use</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="mr-3 mt-1 h-2 w-2 rounded-full bg-primary"></div>
                                        <div>
                                            <h3 className="font-semibold text-dark dark:text-white">Real-time Collaboration</h3>
                                            <p className="text-sm text-white-dark">Work together seamlessly with your team</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="mr-3 mt-1 h-2 w-2 rounded-full bg-primary"></div>
                                        <div>
                                            <h3 className="font-semibold text-dark dark:text-white">Comprehensive Reporting</h3>
                                            <p className="text-sm text-white-dark">Detailed insights and analytics for better decisions</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="mr-3 mt-1 h-2 w-2 rounded-full bg-primary"></div>
                                        <div>
                                            <h3 className="font-semibold text-dark dark:text-white">Scalable Solution</h3>
                                            <p className="text-sm text-white-dark">Grows with your organization's needs</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-left">
                                <h2 className="mb-4 text-2xl font-semibold text-primary">Get Started</h2>
                                <p className="mb-4 text-white-dark">
                                    Ready to boost your team's productivity? Start your journey with Trakory today.
                                </p>
                                <div className="flex space-x-4">
                                    <button type="button" className="btn btn-primary">
                                        Start Free Trial
                                    </button>
                                    <button type="button" className="btn btn-outline-primary">
                                        Contact Sales
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 border-t border-white-light pt-8 dark:border-white-dark">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <div className="text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                    <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 font-semibold text-dark dark:text-white">Secure & Reliable</h3>
                                <p className="text-sm text-white-dark">Enterprise-grade security to protect your data</p>
                            </div>
                            <div className="text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                    <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 font-semibold text-dark dark:text-white">24/7 Support</h3>
                                <p className="text-sm text-white-dark">Round-the-clock assistance when you need it</p>
                            </div>
                            <div className="text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                    <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 font-semibold text-dark dark:text-white">Fast Performance</h3>
                                <p className="text-sm text-white-dark">Optimized for speed and efficiency</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-white-dark">
                            © 2024 Trakory. All rights reserved. | 
                            <a href="#" className="text-primary hover:underline"> Privacy Policy</a> | 
                            <a href="#" className="text-primary hover:underline"> Terms of Service</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
