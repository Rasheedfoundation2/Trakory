import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';

const KnowledgeBase = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Knowledge Base'));
    });

    return (
        <div>
            <div className="panel">
                <div className="mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Knowledge Base</h5>
                </div>
                <div className="mb-5">
                    <div className="text-center">
                        <div className="mb-5">
                            <img src="/assets/images/knowledge/find-solution.svg" alt="Knowledge Base" className="mx-auto h-40 w-40" />
                        </div>
                        <h4 className="mb-5 text-xl font-semibold dark:text-white">Find Solutions</h4>
                        <p className="text-white-dark">
                            Search through our comprehensive knowledge base to find answers to common questions and solutions to technical issues.
                        </p>
                    </div>
                </div>
                <div className="mb-5">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search knowledge base..."
                            className="form-input py-3 ltr:pr-11 rtl:pl-11"
                        />
                        <button type="button" className="btn btn-primary absolute ltr:right-1 rtl:left-1 inset-y-1 m-auto rounded-full w-9 h-9 p-0 flex items-center justify-center">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
                                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="panel">
                        <div className="mb-5">
                            <h6 className="text-lg font-semibold">Getting Started</h6>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <div className="text-primary ltr:mr-3 rtl:ml-3">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M7 3.338A9.954 9.954 0 0112 2C18.075 2 23 6.925 23 13S18.075 24 12 24 1 19.075 1 13C1 9.45 2.838 6.25 5.5 4.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div>How to create an account</div>
                            </div>
                            <div className="flex items-center">
                                <div className="text-primary ltr:mr-3 rtl:ml-3">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M7 3.338A9.954 9.954 0 0112 2C18.075 2 23 6.925 23 13S18.075 24 12 24 1 19.075 1 13C1 9.45 2.838 6.25 5.5 4.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div>Setting up your profile</div>
                            </div>
                            <div className="flex items-center">
                                <div className="text-primary ltr:mr-3 rtl:ml-3">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M7 3.338A9.954 9.954 0 0112 2C18.075 2 23 6.925 23 13S18.075 24 12 24 1 19.075 1 13C1 9.45 2.838 6.25 5.5 4.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div>First steps with Trakory</div>
                            </div>
                        </div>
                    </div>
                    <div className="panel">
                        <div className="mb-5">
                            <h6 className="text-lg font-semibold">Features</h6>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <div className="text-primary ltr:mr-3 rtl:ml-3">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M7 3.338A9.954 9.954 0 0112 2C18.075 2 23 6.925 23 13S18.075 24 12 24 1 19.075 1 13C1 9.45 2.838 6.25 5.5 4.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div>Time tracking guide</div>
                            </div>
                            <div className="flex items-center">
                                <div className="text-primary ltr:mr-3 rtl:ml-3">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M7 3.338A9.954 9.954 0 0112 2C18.075 2 23 6.925 23 13S18.075 24 12 24 1 19.075 1 13C1 9.45 2.838 6.25 5.5 4.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div>Project management</div>
                            </div>
                            <div className="flex items-center">
                                <div className="text-primary ltr:mr-3 rtl:ml-3">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M7 3.338A9.954 9.954 0 0112 2C18.075 2 23 6.925 23 13S18.075 24 12 24 1 19.075 1 13C1 9.45 2.838 6.25 5.5 4.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div>Team collaboration</div>
                            </div>
                        </div>
                    </div>
                    <div className="panel">
                        <div className="mb-5">
                            <h6 className="text-lg font-semibold">Troubleshooting</h6>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <div className="text-primary ltr:mr-3 rtl:ml-3">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M7 3.338A9.954 9.954 0 0112 2C18.075 2 23 6.925 23 13S18.075 24 12 24 1 19.075 1 13C1 9.45 2.838 6.25 5.5 4.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div>Common login issues</div>
                            </div>
                            <div className="flex items-center">
                                <div className="text-primary ltr:mr-3 rtl:ml-3">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M7 3.338A9.954 9.954 0 0112 2C18.075 2 23 6.925 23 13S18.075 24 12 24 1 19.075 1 13C1 9.45 2.838 6.25 5.5 4.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div>Browser compatibility</div>
                            </div>
                            <div className="flex items-center">
                                <div className="text-primary ltr:mr-3 rtl:ml-3">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M7 3.338A9.954 9.954 0 0112 2C18.075 2 23 6.925 23 13S18.075 24 12 24 1 19.075 1 13C1 9.45 2.838 6.25 5.5 4.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div>Performance optimization</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeBase;
