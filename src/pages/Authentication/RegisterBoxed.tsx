// import { Link, useNavigate } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import { IRootState } from '../../store';
// import { setPageTitle, toggleRTL } from '../../store/themeConfigSlice';
// import { useEffect, useState } from 'react';
// import Dropdown from '../../components/Dropdown';
// import i18next from 'i18next';
// import IconCaretDown from '../../components/Icon/IconCaretDown';
// import IconUser from '../../components/Icon/IconUser';
// import IconMail from '../../components/Icon/IconMail';
// import IconLockDots from '../../components/Icon/IconLockDots';
// import IconInstagram from '../../components/Icon/IconInstagram';
// import IconFacebookCircle from '../../components/Icon/IconFacebookCircle';
// import IconTwitter from '../../components/Icon/IconTwitter';
// import IconGoogle from '../../components/Icon/IconGoogle';
// import axios from 'axios';

// const RegisterBoxed = () => {
//     const dispatch = useDispatch();//The dispatch function is used to update the page title in the Redux store when the component mounts.
//     useEffect(() => {
//         dispatch(setPageTitle('Register Boxed'));
//     });
//     const navigate = useNavigate();//useNavigate(): Enables navigation after successful registration.

//    //useSelector(): Fetches theme configuration (isDark mode, isRtl for right-to-left support).
//     const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
//     const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;
//     const themeConfig = useSelector((state: IRootState) => state.themeConfig);
//     //Changes the layout direction RTL (right-to-left) for Arabic or LTR (left-to-right) for English.
//     const setLocale = (flag: string) => {
//         setFlag(flag);
//         if (flag.toLowerCase() === 'ae') {
//             dispatch(toggleRTL('rtl'));
//         } else {
//             dispatch(toggleRTL('ltr'));
//         }
//     };
//     const [flag, setFlag] = useState(themeConfig.locale);
//     // Form state
//     // formData: Tracks name, email, password, and newsletter subscription
//     const [formData, setFormData] = useState({
//         name: '',
//         email: '',
//         password: '',
//         newsletter: false
//     });
//     const [loading, setLoading] = useState(false);//loading: Tracks form submission state
//     const [error, setError] = useState('');

//     // Handle form input changes
//     const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const { id, value, type, checked } = e.target;
//         setFormData({
//             ...formData,
//             [id === 'Email' ? 'email' : id === 'Password' ? 'password' : id === 'Name' ? 'name' : id]: 
//                 type === 'checkbox' ? checked : value
//         });
//     };

//     const submitForm = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setError('');
//         setLoading(true);

//         try {
//             // Call the register API endpoint
//             const response = await axios.post('http://localhost:5000/register', {
//                 name: formData.name,
//                 email: formData.email,
//                 password: formData.password
//             });

//             setLoading(false);
            
//             // If registration is successful, redirect to login page
//             if (response.data.message) {
//                 navigate('/auth/boxed-signin');
//             }
//         } catch (err: any) {
//             setLoading(false);
//             setError(err.response?.data?.error || 'Registration failed. Please try again.');
//         }
//     };

//     return (
//         <div>
//             <div className="absolute inset-0">
//                 <img src="/assets/images/auth/bg-gradient.png" alt="image" className="h-full w-full object-cover" />
//             </div>

//             <div className="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
//                 <img src="/assets/images/auth/coming-soon-object1.png" alt="image" className="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2" />
//                 <img src="/assets/images/auth/coming-soon-object2.png" alt="image" className="absolute left-24 top-0 h-40 md:left-[30%]" />
//                 <img src="/assets/images/auth/coming-soon-object3.png" alt="image" className="absolute right-0 top-0 h-[300px]" />
//                 <img src="/assets/images/auth/polygon-object.svg" alt="image" className="absolute bottom-0 end-[28%]" />
//                 <div className="relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0E1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,rgba(14,23,38,0)_80.07%,#0E1726_100%)]">
//                     <div className="relative flex flex-col justify-center rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 px-6 lg:min-h-[758px] py-20">
//                         <div className="absolute top-6 end-6">
//                             <div className="dropdown">
//                                 <Dropdown
//                                     offset={[0, 8]}
//                                     placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
//                                     btnClassName="flex items-center gap-2.5 rounded-lg border border-white-dark/30 bg-white px-2 py-1.5 text-white-dark hover:border-primary hover:text-primary dark:bg-black"
//                                     button={
//                                         <>
//                                             <div>
//                                                 <img src={`/assets/images/flags/${flag.toUpperCase()}.svg`} alt="image" className="h-5 w-5 rounded-full object-cover" />
//                                             </div>
//                                             <div className="text-base font-bold uppercase">{flag}</div>
//                                             <span className="shrink-0">
//                                                 <IconCaretDown />
//                                             </span>
//                                         </>
//                                     }
//                                 >
//                                     <ul className="!px-2 text-dark dark:text-white-dark grid grid-cols-2 gap-2 font-semibold dark:text-white-light/90 w-[280px]">
//                                         {themeConfig.languageList.map((item: any) => {
//                                             return (
//                                                 <li key={item.code}>
//                                                     <button
//                                                         type="button"
//                                                         className={`flex w-full hover:text-primary rounded-lg ${flag === item.code ? 'bg-primary/10 text-primary' : ''}`}
//                                                         onClick={() => {
//                                                             i18next.changeLanguage(item.code);
//                                                             setLocale(item.code);
//                                                         }}
//                                                     >
//                                                         <img src={`/assets/images/flags/${item.code.toUpperCase()}.svg`} alt="flag" className="w-5 h-5 object-cover rounded-full" />
//                                                         <span className="ltr:ml-3 rtl:mr-3">{item.name}</span>
//                                                     </button>
//                                                 </li>
//                                             );
//                                         })}
//                                     </ul>
//                                 </Dropdown>
//                             </div>
//                         </div>
//                         <div className="mx-auto w-full max-w-[440px]">
//                             <div className="mb-10">
//                                 <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">Sign Up</h1>
//                                 <p className="text-base font-bold leading-normal text-white-dark">Enter your email and password to register</p>
//                             </div>
//                             {error && (
//                                 <div className="mb-5 rounded-md bg-red-100 p-3 text-sm font-medium text-red-600 dark:bg-red-600/20 dark:text-red-400">
//                                     {error}
//                                 </div>
//                             )}
//                             <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
//                                 <div>
//                                     <label htmlFor="Name">Name</label>
//                                     <div className="relative text-white-dark">
//                                         <input 
//                                             id="Name" 
//                                             type="text" 
//                                             placeholder="Enter Name" 
//                                             className="form-input ps-10 placeholder:text-white-dark"
//                                             value={formData.name}
//                                             onChange={handleChange}
//                                             required
//                                         />
//                                         <span className="absolute start-4 top-1/2 -translate-y-1/2">
//                                             <IconUser fill={true} />
//                                         </span>
//                                     </div>
//                                 </div>
//                                 <div>
//                                     <label htmlFor="Email">Email</label>
//                                     <div className="relative text-white-dark">
//                                         <input 
//                                             id="Email" 
//                                             type="email" 
//                                             placeholder="Enter Email" 
//                                             className="form-input ps-10 placeholder:text-white-dark"
//                                             value={formData.email}
//                                             onChange={handleChange}
//                                             required
//                                         />
//                                         <span className="absolute start-4 top-1/2 -translate-y-1/2">
//                                             <IconMail fill={true} />
//                                         </span>
//                                     </div>
//                                 </div>
//                                 <div>
//                                     <label htmlFor="Password">Password</label>
//                                     <div className="relative text-white-dark">
//                                         <input 
//                                             id="Password" 
//                                             type="password" 
//                                             placeholder="Enter Password" 
//                                             className="form-input ps-10 placeholder:text-white-dark"
//                                             value={formData.password}
//                                             onChange={handleChange}
//                                             required
//                                         />
//                                         <span className="absolute start-4 top-1/2 -translate-y-1/2">
//                                             <IconLockDots fill={true} />
//                                         </span>
//                                     </div>
//                                 </div>
//                                 <div>
//                                     <label className="flex cursor-pointer items-center">
//                                         <input 
//                                             type="checkbox" 
//                                             className="form-checkbox bg-white dark:bg-black"
//                                             checked={formData.newsletter}
//                                             onChange={handleChange}
//                                         />
//                                         <span className="text-white-dark">Subscribe to weekly newsletter</span>
//                                     </label>
//                                 </div>
//                                 <button 
//                                     type="submit" 
//                                     className="btn btn-gradient !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]"
//                                     disabled={loading}
//                                 >
//                                     {loading ? 'Creating Account...' : 'Sign Up'}
//                                 </button>
//                             </form>
//                             <div className="relative my-7 text-center md:mb-9">
//                                 <span className="absolute inset-x-0 top-1/2 h-px w-full -translate-y-1/2 bg-white-light dark:bg-white-dark"></span>
//                                 <span className="relative bg-white px-2 font-bold uppercase text-white-dark dark:bg-dark dark:text-white-light">or</span>
//                             </div>
//                             <div className="mb-10 md:mb-[60px]">
//                                 <ul className="flex justify-center gap-3.5 text-white">
//                                     <li>
//                                         <Link
//                                             to="#"
//                                             className="inline-flex h-8 w-8 items-center justify-center rounded-full p-0 transition hover:scale-110"
//                                             style={{ background: 'linear-gradient(135deg, rgba(239, 18, 98, 1) 0%, rgba(67, 97, 238, 1) 100%)' }}
//                                         >
//                                             <IconInstagram />
//                                         </Link>
//                                     </li>
//                                     <li>
//                                         <Link
//                                             to="#"
//                                             className="inline-flex h-8 w-8 items-center justify-center rounded-full p-0 transition hover:scale-110"
//                                             style={{ background: 'linear-gradient(135deg, rgba(239, 18, 98, 1) 0%, rgba(67, 97, 238, 1) 100%)' }}
//                                         >
//                                             <IconFacebookCircle />
//                                         </Link>
//                                     </li>
//                                     <li>
//                                         <Link
//                                             to="#"
//                                             className="inline-flex h-8 w-8 items-center justify-center rounded-full p-0 transition hover:scale-110"
//                                             style={{ background: 'linear-gradient(135deg, rgba(239, 18, 98, 1) 0%, rgba(67, 97, 238, 1) 100%)' }}
//                                         >
//                                             <IconTwitter fill={true} />
//                                         </Link>
//                                     </li>
//                                     <li>
//                                         <Link
//                                             to="#"
//                                             className="inline-flex h-8 w-8 items-center justify-center rounded-full p-0 transition hover:scale-110"
//                                             style={{ background: 'linear-gradient(135deg, rgba(239, 18, 98, 1) 0%, rgba(67, 97, 238, 1) 100%)' }}
//                                         >
//                                             <IconGoogle />
//                                         </Link>
//                                     </li>
//                                 </ul>
//                             </div>
//                             <div className="text-center dark:text-white">
//                                 Already have an account ?&nbsp;
//                                 <Link to="/auth/boxed-signin" className="uppercase text-primary underline transition hover:text-black dark:hover:text-white">
//                                     SIGN IN
//                                 </Link>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default RegisterBoxed;
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { setPageTitle, toggleRTL } from '../../store/themeConfigSlice';
import { useEffect, useState } from 'react';
import Dropdown from '../../components/Dropdown';
import i18next from 'i18next';
import IconCaretDown from '../../components/Icon/IconCaretDown';
import IconUser from '../../components/Icon/IconUser';
import IconMail from '../../components/Icon/IconMail';
import IconLockDots from '../../components/Icon/IconLockDots';
import axios from 'axios';

const RegisterBoxed = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Register Boxed'));
    }, [dispatch]);

    const navigate = useNavigate();

    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);

    const setLocale = (flag: string) => {
        setFlag(flag);
        if (flag.toLowerCase() === 'ae') {
            dispatch(toggleRTL('rtl'));
        } else {
            dispatch(toggleRTL('ltr'));
        }
    };
    const [flag, setFlag] = useState(themeConfig.locale);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        newsletter: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Handle form input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [id === 'Email' ? 'email' : id === 'Password' ? 'password' : id === 'Name' ? 'name' : id]: 
                type === 'checkbox' ? checked : value
        });
    };

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Call the register API endpoint
            const response = await axios.post('http://localhost:5000/register', {
                name: formData.name,
                email: formData.email,
                password: formData.password
            });

            setLoading(false);

            // If registration is successful, redirect to login page
            if (response.data.message) {
                navigate('/auth/boxed-signin');
            }
        } catch (err: any) {
            setLoading(false);
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        }
    };

    return (
        <div>
            <div className="absolute inset-0">
                <img src="/assets/images/auth/bg-gradient.png" alt="image" className="h-full w-full object-cover" />
            </div>

            <div className="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
                <img src="/assets/images/auth/coming-soon-object1.png" alt="image" className="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2" />
                <img src="/assets/images/auth/coming-soon-object2.png" alt="image" className="absolute left-24 top-0 h-40 md:left-[30%]" />
                <img src="/assets/images/auth/coming-soon-object3.png" alt="image" className="absolute right-0 top-0 h-[300px]" />
                <img src="/assets/images/auth/polygon-object.svg" alt="image" className="absolute bottom-0 end-[28%]" />
                <div className="relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0E1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,rgba(14,23,38,0)_80.07%,#0E1726_100%)]">
                    <div className="relative flex flex-col justify-center rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 px-6 lg:min-h-[758px] py-20">
                        <div className="absolute top-6 end-6">
                            <div className="dropdown">
                                <Dropdown
                                    offset={[0, 8]}
                                    placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                    btnClassName="flex items-center gap-2.5 rounded-lg border border-white-dark/30 bg-white px-2 py-1.5 text-white-dark hover:border-primary hover:text-primary dark:bg-black"
                                    button={
                                        <>
                                            <div>
                                                <img src={`/assets/images/flags/${flag.toUpperCase()}.svg`} alt="image" className="h-5 w-5 rounded-full object-cover" />
                                            </div>
                                            <div className="text-base font-bold uppercase">{flag}</div>
                                            <span className="shrink-0">
                                                <IconCaretDown />
                                            </span>
                                        </>
                                    }
                                >
                                    <ul className="!px-2 text-dark dark:text-white-dark grid grid-cols-2 gap-2 font-semibold dark:text-white-light/90 w-[280px]">
                                        {themeConfig.languageList.map((item: any) => {
                                            return (
                                                <li key={item.code}>
                                                    <button
                                                        type="button"
                                                        className={`flex w-full hover:text-primary rounded-lg ${flag === item.code ? 'bg-primary/10 text-primary' : ''}`}
                                                        onClick={() => {
                                                            i18next.changeLanguage(item.code);
                                                            setLocale(item.code);
                                                        }}
                                                    >
                                                        <img src={`/assets/images/flags/${item.code.toUpperCase()}.svg`} alt="flag" className="w-5 h-5 object-cover rounded-full" />
                                                        <span className="ltr:ml-3 rtl:mr-3">{item.name}</span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </Dropdown>
                            </div>
                        </div>
                        <div className="mx-auto w-full max-w-[440px]">
                            <div className="mb-10">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">Sign Up</h1>
                                <p className="text-base font-bold leading-normal text-white-dark">Enter your email and password to register</p>
                            </div>
                            {error && (
                                <div className="mb-5 rounded-md bg-red-100 p-3 text-sm font-medium text-red-600 dark:bg-red-600/20 dark:text-red-400">
                                    {error}
                                </div>
                            )}
                            <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
                                <div>
                                    <label htmlFor="Name">Name</label>
                                    <div className="relative text-white-dark">
                                        <input 
                                            id="Name" 
                                            type="text" 
                                            placeholder="Enter Name" 
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <IconUser fill={true} />
                                        </span>
                                    </div>
                                </div>
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
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input 
                                            id="newsletter" 
                                            type="checkbox" 
                                            checked={formData.newsletter} 
                                            onChange={handleChange}
                                            className="form-checkbox"
                                        />
                                        <label htmlFor="newsletter" className="ms-2">Subscribe to newsletter</label>
                                    </div>
                                    <Link to="/auth/boxed-signin" className="text-sm text-primary hover:underline">
                                        Already have an account? Sign In
                                    </Link>
                                </div>
                                <div className="space-x-3">
                                    <button 
                                        type="submit" 
                                        className="btn w-full btn-primary"
                                        disabled={loading}
                                    >
                                        {loading ? 'Signing up...' : 'Sign Up'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterBoxed;
