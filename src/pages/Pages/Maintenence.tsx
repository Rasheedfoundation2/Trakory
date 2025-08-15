import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';

const Maintenence = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Maintenance'));
    });

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-t from-[#c39be3] to-[#f2e7d5]">
            <div className="p-5 text-center font-semibold">
                <h2 className="mb-8 text-3xl font-bold uppercase !leading-snug text-primary md:text-4xl">Under Maintenance</h2>
                <p className="text-base font-bold leading-normal text-white-dark">
                    Thank you for visiting us.
                    <br />
                    We are currently working on making some improvements
                    <br />
                    to give you better user experience.
                    <br />
                    Please visit us again shortly.
                </p>
                
                <div className="mx-auto mt-10 w-full max-w-[400px]">
                    <div className="panel">
                        <div className="mb-5">
                            <h5 className="mb-4 text-xl font-semibold dark:text-white-light">Get Notified</h5>
                            <p className="text-white-dark">Subscribe to get notified when we're back online</p>
                        </div>
                        <form className="space-y-5">
                            <div>
                                <input type="email" placeholder="Enter your email" className="form-input" />
                            </div>
                            <button type="submit" className="btn btn-primary w-full">
                                Notify Me
                            </button>
                        </form>
                    </div>
                </div>
                
                <div className="mt-10">
                    <div className="flex items-center justify-center space-x-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary" id="days">00</div>
                            <div className="text-xs text-white-dark">DAYS</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary" id="hours">00</div>
                            <div className="text-xs text-white-dark">HOURS</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary" id="minutes">00</div>
                            <div className="text-xs text-white-dark">MINUTES</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary" id="seconds">00</div>
                            <div className="text-xs text-white-dark">SECONDS</div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-10">
                    <p className="dark:text-white">
                        Follow us on social media for updates:
                    </p>
                    <div className="mt-4 flex items-center justify-center space-x-4">
                        <a href="#" className="btn btn-outline-primary btn-sm rounded-full">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M13.135 6H15.5V4H12.5C10.15 4 8.5 5.65 8.5 8V10H6.5V12H8.5V20H10.5V12H13.135L13.5 10H10.5V8C10.5 7.45 10.95 7 11.5 7H13.135V6Z"
                                    fill="currentColor"
                                />
                            </svg>
                        </a>
                        <a href="#" className="btn btn-outline-primary btn-sm rounded-full">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M19.05 4.91C18.21 4.05 17.17 3.64 16.06 3.64C14.95 3.64 13.91 4.05 13.07 4.91L12 5.98L10.93 4.91C10.09 4.05 9.05 3.64 7.94 3.64C6.83 3.64 5.79 4.05 4.95 4.91C3.19 6.67 3.19 9.51 4.95 11.27L12 18.32L19.05 11.27C20.81 9.51 20.81 6.67 19.05 4.91Z"
                                    fill="currentColor"
                                />
                            </svg>
                        </a>
                        <a href="#" className="btn btn-outline-primary btn-sm rounded-full">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M8.29 20.251C7.547 20.251 6.957 19.661 6.957 18.918C6.957 18.175 7.547 17.585 8.29 17.585C9.033 17.585 9.623 18.175 9.623 18.918C9.623 19.661 9.033 20.251 8.29 20.251ZM15.41 20.251C14.667 20.251 14.077 19.661 14.077 18.918C14.077 18.175 14.667 17.585 15.41 17.585C16.153 17.585 16.743 18.175 16.743 18.918C16.743 19.661 16.153 20.251 15.41 20.251Z"
                                    fill="currentColor"
                                />
                                <path
                                    d="M19.847 9.07C19.847 8.518 19.399 8.07 18.847 8.07H17.69L15.96 3.29C15.818 2.92 15.455 2.68 15.052 2.68H8.948C8.545 2.68 8.182 2.92 8.04 3.29L6.31 8.07H5.153C4.601 8.07 4.153 8.518 4.153 9.07C4.153 9.622 4.601 10.07 5.153 10.07H6.93L7.85 13.3C8.1 14.11 8.84 14.68 9.69 14.68H14.31C15.16 14.68 15.9 14.11 16.15 13.3L17.07 10.07H18.847C19.399 10.07 19.847 9.622 19.847 9.07Z"
                                    fill="currentColor"
                                />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Maintenence;
