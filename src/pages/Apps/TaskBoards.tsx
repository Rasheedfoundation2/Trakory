import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconPlus from '../../components/Icon/IconPlus';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconEdit from '../../components/Icon/IconEdit';
import IconX from '../../components/Icon/IconX';
import IconSearch from '../../components/Icon/IconSearch';
import IconListCheck from '../../components/Icon/IconListCheck';
import IconCalendar from '../../components/Icon/IconCalendar';
import IconHorizontalDots from '../../components/Icon/IconHorizontalDots';

const API_BASE = 'http://localhost:5000/api/task-boards';

type Status = 'not_started' | 'working_on_it' | 'stuck' | 'done';
type Priority = 'low' | 'medium' | 'high' | 'critical';

interface BoardSummary {
    id: number;
    name: string;
    description: string | null;
    ownerId: number;
    ownerName: string | null;
    itemCount: number;
}

interface UserOption {
    id: number;
    name: string;
    email: string;
}

interface BoardItem {
    id: number;
    groupId: number;
    title: string;
    status: Status;
    ownerId: number | null;
    ownerName: string | null;
    dueDate: string | null;
    priority: Priority;
    notes: string | null;
    position: number;
}

interface BoardGroup {
    id: number;
    name: string;
    color: string;
    position: number;
    items: BoardItem[];
}

interface FullBoard {
    board: { id: number; name: string; description: string | null };
    groups: BoardGroup[];
}

const STATUS_META: Record<Status, { label: string; color: string }> = {
    not_started: { label: 'Not Started', color: '#c4c4c4' },
    working_on_it: { label: 'Working on it', color: '#fdab3d' },
    stuck: { label: 'Stuck', color: '#e2445c' },
    done: { label: 'Done', color: '#00c875' },
};

const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
    low: { label: 'Low', color: '#9aadbd' },
    medium: { label: 'Medium', color: '#579bfc' },
    high: { label: 'High', color: '#fdab3d' },
    critical: { label: 'Critical', color: '#e2445c' },
};

const GROUP_COLORS = ['#0073ea', '#fdab3d', '#00c875', '#e2445c', '#a25ddc', '#037f4c', '#bb3354', '#579bfc'];

const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const formatDate = (iso: string | null): string => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
};

const TaskBoards = () => {
    const dispatch = useDispatch();
    const [boards, setBoards] = useState<BoardSummary[]>([]);
    const [activeBoardId, setActiveBoardId] = useState<number | null>(null);
    const [board, setBoard] = useState<FullBoard | null>(null);
    const [users, setUsers] = useState<UserOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [showCreateBoard, setShowCreateBoard] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [newBoardDesc, setNewBoardDesc] = useState('');
    const [editingItem, setEditingItem] = useState<BoardItem | null>(null);
    const [updatesItem, setUpdatesItem] = useState<BoardItem | null>(null);
    const [updates, setUpdates] = useState<{ id: number; content: string; createdAt: string; userName: string }[]>([]);
    const [updateText, setUpdateText] = useState('');
    const [newRowDrafts, setNewRowDrafts] = useState<Record<number, string>>({});

    useEffect(() => {
        dispatch(setPageTitle('Task Boards'));
    }, [dispatch]);

    useEffect(() => {
        loadBoards();
        loadUsers();
    }, []);

    useEffect(() => {
        if (activeBoardId != null) loadBoard(activeBoardId);
    }, [activeBoardId]);

    const loadBoards = async () => {
        try {
            const res = await fetch(`${API_BASE}/boards`, { headers: authHeaders() });
            const json = await res.json();
            if (json.success) {
                setBoards(json.data);
                if (json.data.length && activeBoardId == null) setActiveBoardId(json.data[0].id);
            }
        } catch (e) {
            console.error('Failed to load boards', e);
        }
    };

    const loadUsers = async () => {
        try {
            const res = await fetch(`${API_BASE}/assignable-users`, { headers: authHeaders() });
            const json = await res.json();
            if (json.success) setUsers(json.data);
        } catch (e) {
            console.error('Failed to load users', e);
        }
    };

    const loadBoard = async (id: number) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/boards/${id}/full`, { headers: authHeaders() });
            const json = await res.json();
            if (json.success) setBoard(json.data);
        } catch (e) {
            console.error('Failed to load board', e);
        } finally {
            setLoading(false);
        }
    };

    const createBoard = async () => {
        if (!newBoardName.trim()) return;
        const res = await fetch(`${API_BASE}/boards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ name: newBoardName.trim(), description: newBoardDesc.trim() }),
        });
        const json = await res.json();
        if (json.success) {
            setShowCreateBoard(false);
            setNewBoardName('');
            setNewBoardDesc('');
            await loadBoards();
            setActiveBoardId(json.data.id);
        }
    };

    const deleteBoard = async (id: number) => {
        const confirm = await Swal.fire({
            title: 'Delete this board?',
            text: 'All groups and items inside will be removed.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            confirmButtonColor: '#e2445c',
        });
        if (!confirm.isConfirmed) return;
        await fetch(`${API_BASE}/boards/${id}`, { method: 'DELETE', headers: authHeaders() });
        const remaining = boards.filter((b) => b.id !== id);
        setBoards(remaining);
        setActiveBoardId(remaining[0]?.id ?? null);
        if (!remaining.length) setBoard(null);
    };

    const addGroup = async () => {
        if (!board) return;
        const { value: name } = await Swal.fire({
            title: 'New group',
            input: 'text',
            inputLabel: 'Group name',
            showCancelButton: true,
            confirmButtonText: 'Create',
        });
        if (!name) return;
        const color = GROUP_COLORS[board.groups.length % GROUP_COLORS.length];
        const res = await fetch(`${API_BASE}/boards/${board.board.id}/groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ name, color }),
        });
        const json = await res.json();
        if (json.success) {
            setBoard({ ...board, groups: [...board.groups, { ...json.data, items: [] }] });
        }
    };

    const renameGroup = async (group: BoardGroup) => {
        const { value: name } = await Swal.fire({
            title: 'Rename group',
            input: 'text',
            inputValue: group.name,
            showCancelButton: true,
        });
        if (!name) return;
        await fetch(`${API_BASE}/groups/${group.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ name, color: group.color }),
        });
        if (!board) return;
        setBoard({
            ...board,
            groups: board.groups.map((g) => (g.id === group.id ? { ...g, name } : g)),
        });
    };

    const deleteGroup = async (group: BoardGroup) => {
        const confirm = await Swal.fire({
            title: `Delete "${group.name}"?`,
            text: 'All items in this group will be deleted.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e2445c',
        });
        if (!confirm.isConfirmed) return;
        await fetch(`${API_BASE}/groups/${group.id}`, { method: 'DELETE', headers: authHeaders() });
        if (!board) return;
        setBoard({ ...board, groups: board.groups.filter((g) => g.id !== group.id) });
    };

    const addItem = async (groupId: number) => {
        const title = (newRowDrafts[groupId] ?? '').trim();
        if (!title) return;
        const res = await fetch(`${API_BASE}/groups/${groupId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ title }),
        });
        const json = await res.json();
        if (json.success && board) {
            setBoard({
                ...board,
                groups: board.groups.map((g) =>
                    g.id === groupId ? { ...g, items: [...g.items, json.data] } : g
                ),
            });
            setNewRowDrafts({ ...newRowDrafts, [groupId]: '' });
        }
    };

    const updateItem = async (item: BoardItem, patch: Partial<BoardItem>) => {
        const body: Record<string, any> = {};
        if (patch.title !== undefined) body.title = patch.title;
        if (patch.status !== undefined) body.status = patch.status;
        if (patch.ownerId !== undefined) body.ownerId = patch.ownerId;
        if (patch.dueDate !== undefined) body.dueDate = patch.dueDate;
        if (patch.priority !== undefined) body.priority = patch.priority;
        if (patch.notes !== undefined) body.notes = patch.notes;

        await fetch(`${API_BASE}/items/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify(body),
        });

        if (!board) return;
        const ownerName =
            patch.ownerId !== undefined
                ? users.find((u) => u.id === patch.ownerId)?.name ?? null
                : item.ownerName;
        setBoard({
            ...board,
            groups: board.groups.map((g) => ({
                ...g,
                items: g.items.map((i) =>
                    i.id === item.id ? { ...i, ...patch, ownerName } : i
                ),
            })),
        });
    };

    const deleteItem = async (item: BoardItem) => {
        const confirm = await Swal.fire({
            title: 'Delete this item?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e2445c',
        });
        if (!confirm.isConfirmed) return;
        await fetch(`${API_BASE}/items/${item.id}`, { method: 'DELETE', headers: authHeaders() });
        if (!board) return;
        setBoard({
            ...board,
            groups: board.groups.map((g) => ({ ...g, items: g.items.filter((i) => i.id !== item.id) })),
        });
    };

    const openUpdates = async (item: BoardItem) => {
        setUpdatesItem(item);
        setUpdates([]);
        setUpdateText('');
        try {
            const res = await fetch(`${API_BASE}/items/${item.id}/updates`, { headers: authHeaders() });
            const json = await res.json();
            if (json.success) setUpdates(json.data);
        } catch (e) {
            console.error('Failed to load updates', e);
        }
    };

    const postUpdate = async () => {
        if (!updatesItem || !updateText.trim()) return;
        const res = await fetch(`${API_BASE}/items/${updatesItem.id}/updates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ content: updateText.trim() }),
        });
        const json = await res.json();
        if (json.success) {
            setUpdates([json.data, ...updates]);
            setUpdateText('');
        }
    };

    const filteredGroups = useMemo(() => {
        if (!board) return [];
        if (!search.trim()) return board.groups;
        const needle = search.toLowerCase();
        return board.groups
            .map((g) => ({ ...g, items: g.items.filter((i) => i.title.toLowerCase().includes(needle)) }))
            .filter((g) => g.items.length > 0);
    }, [board, search]);

    const totalItems = board?.groups.reduce((acc, g) => acc + g.items.length, 0) ?? 0;
    const doneItems =
        board?.groups.reduce((acc, g) => acc + g.items.filter((i) => i.status === 'done').length, 0) ?? 0;
    const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

    return (
        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-100px)]">
            {/* Boards sidebar */}
            <div className="w-full lg:w-64 flex-shrink-0 bg-white dark:bg-[#0e1726] rounded-md shadow p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-base">Boards</h3>
                    <button
                        type="button"
                        className="btn btn-primary btn-sm rounded-full p-1.5"
                        title="New board"
                        onClick={() => setShowCreateBoard(true)}
                    >
                        <IconPlus className="w-4 h-4" />
                    </button>
                </div>
                <div className="space-y-1">
                    {boards.length === 0 && <p className="text-xs text-gray-500">No boards yet — create one.</p>}
                    {boards.map((b) => (
                        <button
                            key={b.id}
                            type="button"
                            onClick={() => setActiveBoardId(b.id)}
                            className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between group ${
                                activeBoardId === b.id
                                    ? 'bg-primary text-white'
                                    : 'hover:bg-gray-100 dark:hover:bg-[#1b2e4b] text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            <span className="flex items-center gap-2 truncate">
                                <IconListCheck className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{b.name}</span>
                            </span>
                            <span
                                className={`text-xs opacity-0 group-hover:opacity-100 ${
                                    activeBoardId === b.id ? 'text-white' : 'text-red-500'
                                }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteBoard(b.id);
                                }}
                            >
                                <IconTrashLines className="w-4 h-4" />
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main board area */}
            <div className="flex-1 bg-white dark:bg-[#0e1726] rounded-md shadow p-4 overflow-y-auto">
                {!board && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <IconListCheck className="w-12 h-12 mb-3" />
                        <p>Select a board or create a new one to get started.</p>
                    </div>
                )}
                {loading && <p className="text-center text-gray-500 py-12">Loading…</p>}
                {board && !loading && (
                    <>
                        {/* Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">{board.board.name}</h2>
                                {board.board.description && (
                                    <p className="text-sm text-gray-500 mt-0.5">{board.board.description}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search items"
                                        className="form-input pl-9 py-1.5 text-sm w-56"
                                    />
                                    <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                </div>
                                <button type="button" className="btn btn-outline-primary btn-sm" onClick={addGroup}>
                                    <IconPlus className="w-4 h-4 mr-1" /> Group
                                </button>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="mb-5 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <span>
                                {doneItems} / {totalItems} done
                            </span>
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-[#1b2e4b] rounded">
                                <div
                                    className="h-2 rounded bg-green-500 transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span>{progress}%</span>
                        </div>

                        {/* Groups */}
                        <div className="space-y-6">
                            {filteredGroups.map((group) => (
                                <div key={group.id} className="border border-gray-200 dark:border-[#1b2e4b] rounded-md overflow-hidden">
                                    <div
                                        className="flex items-center justify-between px-4 py-2"
                                        style={{ background: `${group.color}1a`, borderLeft: `4px solid ${group.color}` }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-3 h-3 rounded-full"
                                                style={{ background: group.color }}
                                            />
                                            <h3 className="font-semibold">{group.name}</h3>
                                            <span className="text-xs text-gray-500">{group.items.length} items</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                className="p-1 hover:bg-white/40 dark:hover:bg-white/10 rounded"
                                                onClick={() => renameGroup(group)}
                                                title="Rename"
                                            >
                                                <IconEdit className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                className="p-1 hover:bg-white/40 dark:hover:bg-white/10 rounded text-red-600"
                                                onClick={() => deleteGroup(group)}
                                                title="Delete group"
                                            >
                                                <IconTrashLines className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 dark:bg-[#1b2e4b]/40 text-gray-600 dark:text-gray-400">
                                                <tr>
                                                    <th className="text-left px-4 py-2 font-medium w-1/3">Item</th>
                                                    <th className="text-left px-4 py-2 font-medium">Owner</th>
                                                    <th className="text-left px-4 py-2 font-medium">Status</th>
                                                    <th className="text-left px-4 py-2 font-medium">Due Date</th>
                                                    <th className="text-left px-4 py-2 font-medium">Priority</th>
                                                    <th className="text-right px-4 py-2 font-medium">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {group.items.map((item) => (
                                                    <tr
                                                        key={item.id}
                                                        className="border-t border-gray-100 dark:border-[#1b2e4b] hover:bg-gray-50 dark:hover:bg-[#1b2e4b]/30"
                                                    >
                                                        <td className="px-4 py-2">
                                                            <input
                                                                value={item.title}
                                                                onChange={(e) =>
                                                                    setBoard((prev) =>
                                                                        prev
                                                                            ? {
                                                                                  ...prev,
                                                                                  groups: prev.groups.map((g) => ({
                                                                                      ...g,
                                                                                      items: g.items.map((i) =>
                                                                                          i.id === item.id
                                                                                              ? { ...i, title: e.target.value }
                                                                                              : i
                                                                                      ),
                                                                                  })),
                                                                              }
                                                                            : prev
                                                                    )
                                                                }
                                                                onBlur={(e) => {
                                                                    if (e.target.value !== item.title)
                                                                        updateItem(item, { title: e.target.value });
                                                                }}
                                                                className="form-input h-8 text-sm bg-transparent border-transparent hover:border-gray-300 focus:border-primary"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <select
                                                                value={item.ownerId ?? ''}
                                                                onChange={(e) =>
                                                                    updateItem(item, {
                                                                        ownerId: e.target.value ? Number(e.target.value) : null,
                                                                    })
                                                                }
                                                                className="form-select h-8 text-sm"
                                                            >
                                                                <option value="">Unassigned</option>
                                                                {users.map((u) => (
                                                                    <option key={u.id} value={u.id}>
                                                                        {u.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <select
                                                                value={item.status}
                                                                onChange={(e) =>
                                                                    updateItem(item, { status: e.target.value as Status })
                                                                }
                                                                className="h-8 text-sm rounded text-white font-medium px-2 border-0 cursor-pointer"
                                                                style={{ background: STATUS_META[item.status].color }}
                                                            >
                                                                {Object.entries(STATUS_META).map(([k, v]) => (
                                                                    <option key={k} value={k} className="text-black">
                                                                        {v.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                                                                <IconCalendar className="w-4 h-4 opacity-60" />
                                                                <input
                                                                    type="date"
                                                                    value={formatDate(item.dueDate)}
                                                                    onChange={(e) =>
                                                                        updateItem(item, { dueDate: e.target.value || null })
                                                                    }
                                                                    className="form-input h-8 text-sm"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <select
                                                                value={item.priority}
                                                                onChange={(e) =>
                                                                    updateItem(item, { priority: e.target.value as Priority })
                                                                }
                                                                className="h-8 text-sm rounded text-white font-medium px-2 border-0 cursor-pointer"
                                                                style={{ background: PRIORITY_META[item.priority].color }}
                                                            >
                                                                {Object.entries(PRIORITY_META).map(([k, v]) => (
                                                                    <option key={k} value={k} className="text-black">
                                                                        {v.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-2 text-right">
                                                            <div className="inline-flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    className="p-1 hover:bg-gray-200 dark:hover:bg-[#1b2e4b] rounded"
                                                                    title="Edit details"
                                                                    onClick={() => setEditingItem(item)}
                                                                >
                                                                    <IconEdit className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="p-1 hover:bg-gray-200 dark:hover:bg-[#1b2e4b] rounded"
                                                                    title="Updates"
                                                                    onClick={() => openUpdates(item)}
                                                                >
                                                                    <IconHorizontalDots className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="p-1 hover:bg-gray-200 dark:hover:bg-[#1b2e4b] rounded text-red-600"
                                                                    title="Delete"
                                                                    onClick={() => deleteItem(item)}
                                                                >
                                                                    <IconTrashLines className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr className="border-t border-gray-100 dark:border-[#1b2e4b]">
                                                    <td colSpan={6} className="px-4 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                value={newRowDrafts[group.id] ?? ''}
                                                                onChange={(e) =>
                                                                    setNewRowDrafts({
                                                                        ...newRowDrafts,
                                                                        [group.id]: e.target.value,
                                                                    })
                                                                }
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') addItem(group.id);
                                                                }}
                                                                placeholder="+ Add item"
                                                                className="form-input h-8 text-sm flex-1"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => addItem(group.id)}
                                                                className="btn btn-primary btn-sm"
                                                            >
                                                                Add
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Create board modal */}
            {showCreateBoard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white dark:bg-[#0e1726] rounded-lg shadow-xl w-full max-w-md p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">New board</h3>
                            <button type="button" onClick={() => setShowCreateBoard(false)}>
                                <IconX className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">Name</label>
                                <input
                                    autoFocus
                                    className="form-input mt-1"
                                    value={newBoardName}
                                    onChange={(e) => setNewBoardName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Description (optional)</label>
                                <textarea
                                    rows={3}
                                    className="form-textarea mt-1"
                                    value={newBoardDesc}
                                    onChange={(e) => setNewBoardDesc(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCreateBoard(false)}>
                                Cancel
                            </button>
                            <button type="button" className="btn btn-primary" onClick={createBoard}>
                                Create board
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit item modal */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white dark:bg-[#0e1726] rounded-lg shadow-xl w-full max-w-lg p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Edit item</h3>
                            <button type="button" onClick={() => setEditingItem(null)}>
                                <IconX className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">Title</label>
                                <input
                                    className="form-input mt-1"
                                    value={editingItem.title}
                                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Notes</label>
                                <textarea
                                    rows={5}
                                    className="form-textarea mt-1"
                                    value={editingItem.notes ?? ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => setEditingItem(null)}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={async () => {
                                    await updateItem(editingItem, {
                                        title: editingItem.title,
                                        notes: editingItem.notes,
                                    });
                                    setEditingItem(null);
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Updates panel */}
            {updatesItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white dark:bg-[#0e1726] rounded-lg shadow-xl w-full max-w-lg p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Updates · {updatesItem.title}</h3>
                            <button type="button" onClick={() => setUpdatesItem(null)}>
                                <IconX className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-2 mb-3">
                            <textarea
                                rows={3}
                                className="form-textarea"
                                placeholder="Write an update…"
                                value={updateText}
                                onChange={(e) => setUpdateText(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <button type="button" className="btn btn-primary btn-sm" onClick={postUpdate}>
                                    Post update
                                </button>
                            </div>
                        </div>
                        <div className="space-y-3 max-h-72 overflow-y-auto">
                            {updates.length === 0 && <p className="text-sm text-gray-500">No updates yet.</p>}
                            {updates.map((u) => (
                                <div key={u.id} className="border border-gray-200 dark:border-[#1b2e4b] rounded p-3">
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{u.userName}</span>
                                        <span>{new Date(u.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{u.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskBoards;
