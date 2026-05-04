
import Dropdown from '../../components/Dropdown';
import { useDispatch, useSelector } from 'react-redux';
import { ReactSortable } from 'react-sortablejs';
import { IRootState } from '../../store';
import { useState, Fragment, useEffect } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import Swal from 'sweetalert2';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconPlus from '../../components/Icon/IconPlus';
import IconPlusCircle from '../../components/Icon/IconPlusCircle';
import IconHorizontalDots from '../../components/Icon/IconHorizontalDots';
import IconTag from '../../components/Icon/IconTag';
import IconCalendar from '../../components/Icon/IconCalendar';
import IconEdit from '../../components/Icon/IconEdit';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconX from '../../components/Icon/IconX';
import { API_BASE_URL } from '../../config/api';

const Scrumboard = () => {
    const dispatch = useDispatch();
    const [projectList, setProjectList] = useState<any[]>([]);
   


    useEffect(() => {
        dispatch(setPageTitle('Scrumboard'));
    });

    // This function for fetching all the projects from the datbase in the Add Task 
    useEffect(() => {
    fetchProjectListFromDB();
}, []);

useEffect(() => {
    fetchStatusListFromDB();
}, []);


useEffect(() => {
    fetchColumnsFromDB(); // 🔥 Only runs once
}, []);


const fetchStatusListFromDB = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/columns`);
        const data = await response.json();
        setAllStatuses(data); // store statuses for dropdown
    } catch (err) {
        console.error('Failed to load statuses:', err);
    }
};





const [allProjects, setAllProjects] = useState<any[]>([]);
 const [allStatuses, setAllStatuses] = useState<any[]>([]);

const fetchProjectListFromDB = async () => {
    try {
        
        const response = await fetch(`${API_BASE_URL}/api/project_task`);
        const data = await response.json();
        setAllProjects(data); // ⬅️ store in state
    } catch (err) {
        console.error('Failed to load projects:', err);
    }
};


const fetchColumnsFromDB = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/columns-with-tasks`);
        const data = await response.json();
        setProjectList(data); // ✅ Includes tasks now
    } catch (err) {
        console.error('Failed to load columns:', err);
    }
};

    
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;
    const changeValue = (e: any) => {
        const { value, id } = e.target;
        setParams({ ...params, [id]: value });
    };
    const [params, setParams] = useState<any>({
        id: null,
        title: '',
        
    });
    const [paramsTask, setParamsTask] = useState<any>({
        projectId: null,
        id: null,
        title: '',
        description: '',
        tags: '',
        date: '',
    });

    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [isAddProjectModal, setIsAddProjectModal] = useState(false);
    const [isAddTaskModal, setIsAddTaskModal] = useState(false);
    const [isDeleteModal, setIsDeleteModal] = useState(false);

    const addEditProject = (project: any = null) => {
        setTimeout(() => {
            setParams({
                id: null,
                title: '',
            });
            if (project) {
                let projectData = JSON.parse(JSON.stringify(project));
                setParams(projectData);
            }
            setIsAddProjectModal(true);
        });
    };

 const showMessage = (msg = '', type: 'success' | 'error' | 'warning' | 'info' | 'question' = 'success') => {
    Swal.fire({
        icon: type,
        title: msg,
        toast: true,
        position: 'top',
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
    });
};



    const saveProject = async () => {
    if (!params.title) {
        showMessage('Title is required.', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/project_task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: params.title })
        });

        if (!response.ok) throw new Error('Failed to add project');

     await response.json(); // we no longer use this data to update the UI
     await fetchProjectListFromDB(); // ✅ Refresh project list in dropdown

        showMessage('Project added successfully!', 'success');
        setIsAddProjectModal(false);
    } catch (err) {
        showMessage('Error saving project.', 'error');
        console.error(err);
    }
};


    const deleteProject = (project: any) => {
        setProjectList(projectList.filter((d: any) => d.id !== project.id));
        showMessage('Project has been deleted successfully.');
    };

    const clearProjects = (project: any) => {
        setParamsTask((project.tasks = []));
    };

    const addTaskData = (e: any) => {
        const { value, id } = e.target;
        setParamsTask({ ...paramsTask, [id]: value });
    };

    const today = new Date();
const dd = String(today.getDate()).padStart(2, '0');
const mm = String(today.getMonth()); // January is 0!
const yyyy = today.getFullYear();
const monthNames: any = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formattedDate = dd + ' ' + monthNames[mm] + ', ' + yyyy;

   const addEditTask = (statusId: any, task: any = null) => {
    if (task) {
        let data = JSON.parse(JSON.stringify(task));
        data.statusId = statusId; // status is the column you're editing from
        data.tags = data.tags ? data.tags.toString() : '';
        setParamsTask(data);
    } else {
        setParamsTask({
            statusId: statusId,
            projectId: '',       // will be selected from dropdown
            id: null,
            title: '',
            description: '',
            tags: '',
            date: formattedDate,
        });
    }

    setIsAddTaskModal(true);
};


   const saveTask = async () => {
    if (!paramsTask.title || !paramsTask.projectId) {
        showMessage('Title and Project are required.', 'error');
        return;
    }

    const taskData = {
        title: paramsTask.title,
        description: paramsTask.description,
        tags: paramsTask.tags,
        date: paramsTask.date,
        projectId: paramsTask.projectId,
        statusId: paramsTask.statusId,
    };

    try {
        let response;
        if (paramsTask.id) {
            // Update existing task
            response = await fetch(`${API_BASE_URL}/api/tasks/${paramsTask.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData),
            });
        } else {
            // Create new task
            response = await fetch(`${API_BASE_URL}/api/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData),
            });
        }

        if (!response.ok) throw new Error('Failed to save task');

        await fetchColumnsFromDB(); // ✅ Refresh the UI
        showMessage(paramsTask.id ? 'Task updated!' : 'Task added!');
        setIsAddTaskModal(false);

        setParamsTask({
            projectId: null,
            id: null,
            title: '',
            description: '',
            tags: '',
            date: '',
            statusId: null,
        });
    } catch (err) {
        console.error(err);
        showMessage('Error saving task', 'error');
    }
};



    const deleteConfirmModal = (projectId: any, task: any = null) => {
        setSelectedTask(task);
        setTimeout(() => {
            setIsDeleteModal(true);
        }, 10);
    };
   const deleteTask = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/tasks/${selectedTask.id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete task');
        }

        // Remove task from UI after successful deletion
        let project = projectList.find((d: any) => d.id === selectedTask.projectId);
        project.tasks = project.tasks.filter((d: any) => d.id !== selectedTask.id);
        setProjectList([...projectList]); // ⬅️ force UI update
        setIsDeleteModal(false);
        showMessage('Task has been deleted successfully.');
    } catch (err) {
        console.error(err);
        showMessage('Error deleting task', 'error');
    }
};


    return (
        <div>
            <div>
                <button
                    type="button"
                    className="btn btn-primary flex"
                    onClick={() => {
                        addEditProject();
                    }}
                >
                    <IconPlus className="w-5 h-5 ltr:mr-3 rtl:ml-3" />
                    Add Project
                </button>
            </div>
            {/* project list  */}
            <div className="relative pt-5">
                <div className="perfect-scrollbar h-full -mx-2">
                    <div className="overflow-x-auto flex items-start flex-nowrap gap-5 pb-2 px-2">
                        {projectList.map((project: any) => {
                            return (
                                <div key={project.id} className="panel w-80 flex-none" data-group={project.id}>
                                    <div className="flex justify-between mb-5">
                                        <h4 className="text-base font-semibold">{project.title}</h4>

                                        <div className="flex items-center">
                                            <button onClick={() => addEditTask(project.id)} type="button" className="hover:text-primary ltr:mr-2 rtl:ml-2">
                                                <IconPlusCircle />
                                            </button>
                                            <div className="dropdown">
                                                <Dropdown
                                                    offset={[0, 5]}
                                                    placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                                    button={<IconHorizontalDots className="opacity-70 hover:opacity-100" />}
                                                >
                                                    <ul>
                                                        <li>
                                                            <button type="button" onClick={() => clearProjects(project)}>
                                                                Clear All
                                                            </button>
                                                        </li>
                                                    </ul>
                                                </Dropdown>
                                            </div>
                                        </div>
                                    </div>
                                    <ReactSortable
                                        list={project.tasks}
                                        setList={(newState, sortable) => {
                                            if (sortable) {
                                                const groupId: any = sortable.el.closest('[data-group]')?.getAttribute('data-group') || 0;
                                                const newList = projectList.map((task: any) => {
                                                    if (parseInt(task.id) === parseInt(groupId)) {
                                                        task.tasks = newState;
                                                    }

                                                    return task;
                                                });
                                                setProjectList(newList);
                                            }
                                        }}
                                        animation={200}
                                        group={{ name: 'shared', pull: true, put: true }}
                                        ghostClass="sortable-ghost"
                                        dragClass="sortable-drag"
                                        className="connect-sorting-content min-h-[150px]"
                                    >
                                        {project.tasks.map((task: any) => {
                                            return (
                                                <div className="sortable-list " key={project.id + '' + task.id}>
                                                    <div className="shadow bg-[#f4f4f4] dark:bg-white-dark/20 p-3 pb-5 rounded-md mb-5 space-y-3 cursor-move">
                                                        {task.image ? <img src="/assets/images/carousel1.jpeg" alt="images" className="h-32 w-full object-cover rounded-md" /> : ''}
                                                        {task.projectName && (
    <p className="text-xs font-semibold text-gray-600">
        Project: {task.projectName}
    </p>
)}

                                                        <div className="text-base font-medium">{task.title}</div>
                                                        <p className="break-all">{task.description}</p>
                                                        <div className="flex gap-2 items-center flex-wrap">
                                                            {task.tags?.length ? (
                                                                task.tags.map((tag: any, i: any) => {
                                                                    return (
                                                                        <div key={i} className="btn px-2 py-1 flex btn-outline-primary">
                                                                            <IconTag className="shrink-0" />
                                                                            <span className="ltr:ml-2 rtl:mr-2">{tag}</span>
                                                                        </div>
                                                                    );
                                                                })
                                                            ) : (
                                                                <div className="btn px-2 py-1 flex text-white-dark dark:border-white-dark/50 shadow-none">
                                                                    <IconTag className="shrink-0" />
                                                                    <span className="ltr:ml-2 rtl:mr-2">No Tags</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="font-medium flex items-center hover:text-primary">
                                                                <IconCalendar className="ltr:mr-3 rtl:ml-3 shrink-0" />
                                                                <span>{task.date}</span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <button onClick={() => addEditTask(project.id, task)} type="button" className="hover:text-info">
                                                                    <IconEdit className="ltr:mr-3 rtl:ml-3" />
                                                                </button>
                                                                <button onClick={() => deleteConfirmModal(project.id, task)} type="button" className="hover:text-danger">
                                                                    <IconTrashLines />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </ReactSortable>
                                    <div className="pt-3">
                                        <button type="button" className="btn btn-primary mx-auto" onClick={() => addEditTask(project.id)}>
                                            <IconPlus />
                                            Add Task
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {/* add project modal */}
            <Transition appear show={isAddProjectModal} as={Fragment}>
                <Dialog as="div" open={isAddProjectModal} onClose={() => setIsAddProjectModal(false)} className="relative z-[51]">
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-[black]/60" />
                    </TransitionChild>
                    <div className="fixed inset-0 z-[999] px-4 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen">
                            <TransitionChild
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <DialogPanel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg text-black dark:text-white-dark">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddProjectModal(false)}
                                        className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                                    >
                                        <IconX />
                                    </button>
                                    <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                                        {params.id ? 'Edit Project' : 'Add Project'}
                                    </div>
                                    <div className="p-5">
                                        <form
    onSubmit={(e) => {
        e.preventDefault();
        saveProject();
    }}
>

                                            <div className="grid gap-5">
                                                <div>
                                                    <label htmlFor="title">Name</label>
                                                    <input id="title" value={params.title} onChange={changeValue} type="text" className="form-input mt-1" placeholder="Enter Name" />
                                                </div>
                                            </div>

                                            <div className="flex justify-end items-center mt-8">
                                                <button type="button" className="btn btn-outline-danger" onClick={() => setIsAddProjectModal(false)}>
                                                    Cancel
                                                </button>
                                                <button type="submit" className="btn btn-primary ltr:ml-4 rtl:mr-4">
                                                    {params.id ? 'Update' : 'Add'}
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
            {/* add task modal */}
            <Transition appear show={isAddTaskModal} as={Fragment}>
                <Dialog as="div" open={isAddTaskModal} onClose={() => setIsAddTaskModal(false)} className="relative z-50">
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-[black]/60" />
                    </TransitionChild>
                    <div className="fixed inset-0 z-[999] overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4">
                            <DialogPanel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg text-black dark:text-white-dark">
                                <button onClick={() => setIsAddTaskModal(false)} type="button" className="absolute top-4 ltr:right-4 rtl:left-4 text-white-dark hover:text-dark">
                                    <IconX />
                                </button>
                                <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">{paramsTask.id ? 'Edit Task' : 'Add Task'}</div>
                                <div className="p-5">
                                    <form onSubmit={saveTask}>
                                        <div className="grid gap-5">
                                            {/* foe adding the projects name in the datbase to the dropdown  */}
                                            <div>
    <label htmlFor="projectId">Project Name</label>
    <select
        id="projectId"
        value={paramsTask.projectId || ''}
        onChange={(e) => setParamsTask({ ...paramsTask, projectId: parseInt(e.target.value) })}
        className="form-select"
    >
        <option value="">Select Project</option>
        {allProjects.map((proj) => (
            <option key={proj.id} value={proj.id}>
                {proj.name}
            </option>
        ))}
    </select>
</div>

<div>
    <label htmlFor="statusId">Project Status</label>
    <select
        id="statusId"
        value={paramsTask.statusId || ''}
        onChange={(e) => setParamsTask({ ...paramsTask, statusId: parseInt(e.target.value) })}
        className="form-select"
    >
        <option value="">Select Status</option>
        {allStatuses.map((status) => (
            <option key={status.id} value={status.id}>
                {status.name}
            </option>
        ))}
    </select>
</div>


                                            <div>
                                                <label htmlFor="taskTitle">Name</label>
                                                <input id="title" value={paramsTask.title} onChange={addTaskData} type="text" className="form-input" placeholder="Enter Name" />
                                            </div>
                                            <div>
                                                <label htmlFor="taskTag">Tag</label>
                                                <input id="tags" value={paramsTask.tags} onChange={addTaskData} type="text" className="form-input" placeholder="Enter Tag" />
                                            </div>
                                                                               <div>
    <label htmlFor="taskDate">Date</label>
    <input
        id="date"
        value={paramsTask.date}
        onChange={addTaskData}
        type="text"
        className="form-input"
        readOnly
    />
</div>
                                            <div>
                                                <label htmlFor="taskdesc">Description</label>
                                                <textarea
                                                    id="description"
                                                    value={paramsTask.description}
                                                    onChange={addTaskData}
                                                    className="form-textarea min-h-[130px]"
                                                    placeholder="Enter Description"
                                                ></textarea>
                                            </div>
                                        </div>
                                        <div className="flex justify-end items-center mt-8">
                                            <button onClick={() => setIsAddTaskModal(false)} type="button" className="btn btn-outline-danger">
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn btn-primary ltr:ml-4 rtl:mr-4">
                                                {paramsTask.id ? 'Update' : 'Add'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </DialogPanel>
                        </div>
                    </div>
                </Dialog>
            </Transition>
            {/* delete task modal */}
            <Transition appear show={isDeleteModal} as={Fragment}>
                <Dialog as="div" open={isDeleteModal} onClose={() => setIsDeleteModal(false)} className="relative z-[51]">
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-[black]/60" />
                    </TransitionChild>
                    <div className="fixed inset-0 z-[999] overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 ">
                            <TransitionChild
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <DialogPanel className="panel border-0 p-0 rounded-lg overflow-hidden md:w-full max-w-lg w-[90%] my-8">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsDeleteModal(false);
                                        }}
                                        className="absolute top-4 ltr:right-4 rtl:left-4 text-white-dark"
                                    >
                                        <IconX />
                                    </button>
                                    <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">Delete Task</div>
                                    <div className="p-5 text-center">
                                        <div className="text-white bg-danger ring-4 ring-danger/30 p-4 rounded-full w-fit mx-auto">
                                            <IconTrashLines />
                                        </div>
                                        <div className="text-base sm:w-3/4 mx-auto mt-5">Are you sure you want to delete Task?</div>

                                        <div className="flex justify-center items-center mt-8">
                                            <button
                                                onClick={() => {
                                                    setIsDeleteModal(false);
                                                }}
                                                type="button"
                                                className="btn btn-outline-danger"
                                            >
                                                Cancel
                                            </button>
                                            <button onClick={deleteTask} type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4">
                                                Delete
                                            </button>
                                        </div>
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
export default Scrumboard;




