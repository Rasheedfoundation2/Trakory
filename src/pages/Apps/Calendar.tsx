import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Fragment, useEffect, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconPlus from '../../components/Icon/IconPlus';
import IconX from '../../components/Icon/IconX';
import axios from 'axios';
import { config } from '@fullcalendar/core/internal';

// for the custome select option 

const MultiSelect = ({ options, selected, onChange, placeholder }: { options: any[], selected: string[], onChange: (selected: string[]) => void, placeholder: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const toggleOption = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter(item => item !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    return (
        <div className="relative">
            <div 
                className="form-input flex items-center justify-between cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex flex-wrap gap-1">
                    {selected.length > 0 ? (
                        selected.map(item => (
                            <span key={item} className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">
                                {item}
                            </span>
                        ))
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg max-h-60 overflow-auto">
                    {options.map(option => (
                        <div
                            key={option.id}
                            className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${selected.includes(option.name) ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
                            onClick={() => toggleOption(option.name)}
                        >
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="form-checkbox rounded"
                                    checked={selected.includes(option.name)}
                                    readOnly
                                />
                                <span className="ml-2">{option.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const Calendar = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Calendar'));
    }, [dispatch]);

    const [events, setEvents] = useState<any>([]);
    const [isAddEventModal, setIsAddEventModal] = useState(false);
    const [minStartDate, setMinStartDate] = useState<any>('');
    const [minEndDate, setMinEndDate] = useState<any>('');
  const defaultParams = { 
    id: null, 
    title: '', 
    start: '', 
    end: '', 
    description: '', 
    type: 'primary',
    assignees: [] as string[] // Changed to array for multiple select
};
    const [params, setParams] = useState<any>(defaultParams);
    const [isLoading, setIsLoading] = useState(true);
    const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);

    // Fetch events from backend
    useEffect(() => {
        fetchEvents();
    }, []);

   const fetchEvents = async () => {
    try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const config = {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
        const response = await axios.get('http://localhost:5000/api/events', config);
        setEvents(response.data.map((event: any) => ({
            id: event.id,
            title: event.title,
            start: event.start,
            end: event.end,
            description: event.description,
            className: event.type,
            sender: event.sender_name,  // Now using sender_name instead of ID
            assignees: event.assignees ? event.assignees.split(',') : []  // Convert comma-separated string to array
        })));
        setIsLoading(false);
    } catch (error) {
        setIsLoading(false);
        console.error('Error fetching events:', error);
    }
};
    const dateFormat = (dt: any) => {
        dt = new Date(dt);
        const month = dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1;
        const date = dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate();
        const hours = dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours();
        const mins = dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes();
        return dt.getFullYear() + '-' + month + '-' + date + 'T' + hours + ':' + mins;
    };

   const editEvent = (data: any = null) => {
    let params = JSON.parse(JSON.stringify(defaultParams));
    setParams(params);
    if (data) {
        let obj = JSON.parse(JSON.stringify(data.event));
        setParams({
            id: obj.id,
            title: obj.title,
            start: dateFormat(obj.start),
            end: dateFormat(obj.end),
            type: obj.classNames ? obj.classNames[0] : 'primary',
            description: obj.extendedProps?.description || '',
            assignees: obj.extendedProps?.assignees || []
        });
        setMinStartDate(new Date());
        setMinEndDate(dateFormat(obj.start));
    } else {
        setMinStartDate(new Date());
        setMinEndDate(new Date());
    }
    setIsAddEventModal(true);
};

    const editDate = (data: any) => {
        let obj = {
            event: {
                start: data.start,
                end: data.end,
            },
        };
        editEvent(obj);
    };

const saveEvent = async () => {
    if (!params.title || !params.start || !params.end) {
        showMessage('Please fill all required fields', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const eventData = {
            title: params.title,
            description: params.description,
            start: params.start,
            end: params.end,
            type: params.type || 'primary',
            assignees: params.assignees || []
        };

        const config = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        let response;
        if (params.id) {
            response = await axios.put(`http://localhost:5000/api/events/${params.id}`, eventData, config);
        } else {
            response = await axios.post('http://localhost:5000/api/events', eventData, config);
        }

        showMessage(params.id ? 'Event updated successfully' : 'Event created successfully');
        setIsAddEventModal(false);
        await fetchEvents();
    } catch (error: any) {
        console.error('Error saving event:', error);
        let errorMessage = 'Failed to save event';
        if (error.response && error.response.data && error.response.data.error) {
            errorMessage = error.response.data.error;
        }
        showMessage(errorMessage, 'error');
    }
};


    const startDateChange = (event: any) => {
        const dateStr = event.target.value;
        if (dateStr) {
            setMinEndDate(dateFormat(dateStr));
            setParams({ ...params, start: dateStr, end: '' });
        }
    };
const changeValue = (e: any) => {
    const { value, id } = e.target;
    setParams({ ...params, [id]: value });
};

    const showMessage = (msg = '', type = 'success') => {
        const toast: any = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
            customClass: { container: 'toast' },
        });
        toast.fire({
            icon: type,
            title: msg,
            padding: '10px 20px',
        });
    };

    const [users, setUsers] = useState<any[]>([]);
    // Add this useEffect to fetch users
useEffect(() => {
    const fetchUsers = async () => {
        try {
            // Get the logged-in user's ID
            const userId = localStorage.getItem('userId');
            setLoggedInUserId(userId);
            
            // Get the token for authorization
            const token = localStorage.getItem('token');
            
            const response = await axios.get('http://localhost:5000/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };
    fetchUsers();
}, []);

    return (
        <div>
            <div className="panel mb-5">
                <div className="mb-4 flex items-center sm:flex-row flex-col sm:justify-between justify-center">
                    <div className="sm:mb-0 mb-4">
                        <div className="text-lg font-semibold ltr:sm:text-left rtl:sm:text-right text-center">Calendar</div>
                        <div className="flex items-center mt-2 flex-wrap sm:justify-start justify-center">
                            <div className="flex items-center ltr:mr-4 rtl:ml-4">
                                <div className="h-2.5 w-2.5 rounded-sm ltr:mr-2 rtl:ml-2 bg-primary"></div>
                                <div>Work</div>
                            </div>
                            <div className="flex items-center ltr:mr-4 rtl:ml-4">
                                <div className="h-2.5 w-2.5 rounded-sm ltr:mr-2 rtl:ml-2 bg-yellow-500"></div>
                                <div>Travel</div>
                            </div>
                            <div className="flex items-center ltr:mr-4 rtl:ml-4">
                                <div className="h-2.5 w-2.5 rounded-sm ltr:mr-2 rtl:ml-2 bg-success"></div>
                                <div>Personal</div>
                            </div>
                            <div className="flex items-center">
                                <div className="h-2.5 w-2.5 rounded-sm ltr:mr-2 rtl:ml-2 bg-danger"></div>
                                <div>Important</div>
                            </div>
                        </div>
                    </div>
                    <button type="button" className="btn btn-primary" onClick={() => editEvent()}>
                        <IconPlus className="ltr:mr-2 rtl:ml-2" />
                        Create Event
                    </button>
                </div>
                <div className="calendar-wrapper">
                    {isLoading ? (
                        <div className="text-center py-4">Loading calendar...</div>
                    ) : (
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay',
                            }}
                            editable={true}
                            dayMaxEvents={true}
                            selectable={true}
                            droppable={true}
                            eventClick={(event: any) => editEvent(event)}
                            select={(event: any) => editDate(event)}
                            events={events}
                        />
                    )}
                </div>
            </div>

            {/* Add Event Modal */}
            <Transition appear show={isAddEventModal} as={Fragment}>
                <Dialog as="div" onClose={() => setIsAddEventModal(false)} open={isAddEventModal} className="relative z-[51]">
                    <TransitionChild
                        as={Fragment}
                        enter="duration-300 ease-out"
                        enter-from="opacity-0"
                        enter-to="opacity-100"
                        leave="duration-200 ease-in"
                        leave-from="opacity-100"
                        leave-to="opacity-0"
                    >
                        <DialogBackdrop className="fixed inset-0 bg-[black]/60" />
                    </TransitionChild>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center px-4 py-8">
                            <TransitionChild
                                as={Fragment}
                                enter="duration-300 ease-out"
                                enter-from="opacity-0 scale-95"
                                enter-to="opacity-100 scale-100"
                                leave="duration-200 ease-in"
                                leave-from="opacity-100 scale-100"
                                leave-to="opacity-0 scale-95"
                            >
                                <DialogPanel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg text-black dark:text-white-dark">
                                    <button
                                        type="button"
                                        className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                                        onClick={() => setIsAddEventModal(false)}
                                    >
                                        <IconX />
                                    </button>
                                    <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                                        {params.id ? 'Edit Event' : 'Add Event'}
                                    </div>
                                    <div className="p-5">
                                        <form className="space-y-5">
                                            <div>
                                                <label htmlFor="title">Event Title :</label>
                                                <input
                                                    id="title"
                                                    type="text"
                                                    name="title"
                                                    className="form-input"
                                                    placeholder="Enter Event Title"
                                                    value={params.title || ''}
                                                    onChange={(e) => changeValue(e)}
                                                    required
                                                />
                                            </div>

        <div>
    <label>Select Assignees:</label>
    <MultiSelect
        options={users}
        selected={params.assignees || []}
        onChange={(selected) => setParams({ ...params, assignees: selected })}
        placeholder="Select assignees..."
    />
</div>
                                            <div>
                                                <label htmlFor="dateStart">From :</label>
                                                <input
                                                    id="start"
                                                    type="datetime-local"
                                                    name="start"
                                                    className="form-input"
                                                    placeholder="Event Start Date"
                                                    value={params.start || ''}
                                                    min={minStartDate}
                                                    onChange={(event: any) => startDateChange(event)}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="dateEnd">To :</label>
                                                <input
                                                    id="end"
                                                    type="datetime-local"
                                                    name="end"
                                                    className="form-input"
                                                    placeholder="Event End Date"
                                                    value={params.end || ''}
                                                    min={minEndDate}
                                                    onChange={(e) => changeValue(e)}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="description">Event Description :</label>
                                                <textarea
                                                    id="description"
                                                    name="description"
                                                    className="form-textarea min-h-[130px]"
                                                    placeholder="Enter Event Description"
                                                    value={params.description || ''}
                                                    onChange={(e) => changeValue(e)}
                                                ></textarea>
                                            </div>
                                            <div>
                                                <label>Badge:</label>
                                                <div className="mt-3">
                                                    <label className="inline-flex cursor-pointer ltr:mr-3 rtl:ml-3">
                                                        <input
                                                            type="radio"
                                                            className="form-radio"
                                                            name="type"
                                                            value="primary"
                                                            checked={params.type === 'primary'}
                                                            onChange={(e) => setParams({ ...params, type: e.target.value })}
                                                        />
                                                        <span className="ltr:pl-2 rtl:pr-2">Work</span>
                                                    </label>
                                                    <label className="inline-flex cursor-pointer ltr:mr-3 rtl:ml-3">
                                                        <input
                                                            type="radio"
                                                            className="form-radio text-yellow-500"
                                                            name="type"
                                                            value="info"
                                                            checked={params.type === 'info'}
                                                            onChange={(e) => setParams({ ...params, type: e.target.value })}
                                                        />
                                                        <span className="ltr:pl-2 rtl:pr-2">Travel</span>
                                                    </label>
                                                    <label className="inline-flex cursor-pointer ltr:mr-3 rtl:ml-3">
                                                        <input
                                                            type="radio"
                                                            className="form-radio text-success"
                                                            name="type"
                                                            value="success"
                                                            checked={params.type === 'success'}
                                                            onChange={(e) => setParams({ ...params, type: e.target.value })}
                                                        />
                                                        <span className="ltr:pl-2 rtl:pr-2">Personal</span>
                                                    </label>
                                                    <label className="inline-flex cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            className="form-radio text-danger"
                                                            name="type"
                                                            value="danger"
                                                            checked={params.type === 'danger'}
                                                            onChange={(e) => setParams({ ...params, type: e.target.value })}
                                                        />
                                                        <span className="ltr:pl-2 rtl:pr-2">Important</span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="flex justify-end items-center !mt-8">
                                                <button type="button" className="btn btn-outline-danger" onClick={() => setIsAddEventModal(false)}>
                                                    Cancel
                                                </button>
                                                <button type="button" onClick={saveEvent} className="btn btn-primary ltr:ml-4 rtl:mr-4">
                                                    {params.id ? 'Update Event' : 'Create Event'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default Calendar;