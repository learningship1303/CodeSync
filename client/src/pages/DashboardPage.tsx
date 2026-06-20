import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, FolderGit2, ShieldCheck, LogOut, Terminal, Sparkles, Layers, Copy } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

interface RoomData {
  _id: string;
  roomId: string;
  name: string;
  roomType: 'personal' | 'project';
  admin?: string | {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // 1. Core State
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');


  // 2. Modal/Creation State
  const [showModal, setShowModal] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<'personal' | 'project'>('personal');
  const [roomPassword, setRoomPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const generatePassword = () => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let pwd = '';

    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(
        Math.floor(Math.random() * chars.length)
      );
    }

    setRoomPassword(pwd);
  };
  const copyToClipboard = async (value: string, label: string) => {
    if (!value) {
      toast.error(`${label} is empty`);
      return;
    }

    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };
  useEffect(() => {
    const fetchUserWorkspaces = async () => {
      try {
        const response = await API.get('/rooms/my-rooms');
        if (response.status === 200) setRooms(response.data);
      } catch (error: any) {
        if (error.response?.status === 401) {
          logout();
          navigate('/', { replace: true });
          return;
        }
        toast.error('Could not sync workspace inventory.');
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchUserWorkspaces();
  }, [logout, navigate]);

  const generateUniqueRoomId = () => {
    const generatedHex = 'cs-' + Math.random().toString(36).substring(2, 9);
    setRoomId(generatedHex);
  };

  const handleCreateRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim() || !roomName.trim()) return toast.error('Fill all fields!');

    setIsCreating(true);
    const toastId = toast.loading('Instantiating workspace cluster...');

    try {
      const response = await API.post('/rooms/create', {
        roomId: roomId.trim(),
        name: roomName.trim(),
        roomType,
        password: roomType === 'project' ? roomPassword : undefined
      });

      if (response.status === 201) {
        toast.success(
          `Room Created

Room ID: ${roomId}

Password: ${roomType === 'project'
            ? roomPassword
            : 'No Password'
          }`,
          {
            id: toastId,
          }
        );

        // Phase 2.1: persist project room credentials locally for copy-after-refresh UX (no backend exposure)
        if (roomType === 'project' && roomPassword) {
          try {
            localStorage.setItem(`codesync_room_password_${roomId.trim()}`, roomPassword);
          } catch {
            // no-op (localStorage may be unavailable)
          }
        }

        setRooms((prev) => [response.data.room, ...prev]);
        setShowModal(false);
        setRoomName('');
        setRoomId('');
        setRoomPassword('');
        setRoomType('personal');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Creation failed.', { id: toastId });
    } finally {
      setIsCreating(false);
    }
  };
  const handleJoinRoom = async () => {
    if (!joinRoomId.trim()) {
      toast.error('Enter Room ID');
      return;
    }

    try {
      await API.post('/rooms/verify', {
        roomId: joinRoomId.trim(),
        password: joinPassword
      });

      navigate(`/room/${joinRoomId.trim()}`);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Unable to join room'
      );
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 pt-24 transition-all">
      {/* Navbar */}
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-2">
          <Terminal className="h-6 w-6 text-indigo-500" />
          <span className="font-black text-lg tracking-tight">code<span className="text-indigo-500">sync</span>/dashboard</span>
        </div>
        <button onClick={logout} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <main className="max-w-6xl mx-auto">
        {/* Controls Panel */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black">Control Console Panel</h1>
            <p className="text-sm text-slate-400">Welcome back, {user?.name}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="text"
                placeholder="Room ID"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
              />

              <input
                type="password"
                placeholder="Password (if required)"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
              />

              <button
                onClick={handleJoinRoom}
                className="bg-indigo-600 px-4 py-2 text-white font-bold text-xs rounded-xl hover:bg-indigo-500"
              >
                Join
              </button>
            </div>

            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-500 shadow-lg shadow-indigo-600/20">
              <Plus className="h-4 w-4" /> Instantiate Room
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Profile
            </div>
            <p className="font-bold truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
              <FolderGit2 className="h-4 w-4 text-indigo-500" /> Room Count
            </div>
            <p className="text-3xl font-black">{rooms.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
              <Sparkles className="h-4 w-4 text-amber-500" /> Recent Room
            </div>
            <p className="font-bold truncate">{rooms[0]?.name || 'No rooms yet'}</p>
            <p className="text-xs text-slate-500 truncate">{rooms[0]?.roomId || 'Create or join a workspace'}</p>
          </div>
        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loadingRooms ? (
            <p className="text-sm text-slate-500">Syncing workspaces...</p>
          ) : rooms.length === 0 ? (
            <p className="text-sm text-slate-500">No active clusters found.</p>
          ) : (
            rooms.map((room) => (
              <div key={room._id} onClick={() => navigate(`/room/${room.roomId}`)}
                className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-indigo-500 transition-all group">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold group-hover:text-indigo-400 transition-colors">{room.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">{room.roomId}</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {room.roomType}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  Created {new Date(room.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Owner: {
                    typeof room.admin === 'object'
                      ? room.admin.name
                      : room.admin === user?._id
                        ? user?.name || 'You'
                        : 'Room owner'
                  }
                </p>
              </div>
            ))
          )}
        </div>
      </main>


      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-md border border-slate-800 shadow-2xl">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-500" />
              Instantiate Workspace
            </h2>

            <form onSubmit={handleCreateRoomSubmit} className="space-y-4">

              <input
                required
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Workspace Name"
                className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex gap-2">
                <input
                  required
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Room ID"
                  className="flex-1 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl outline-none"
                />

                <button
                  type="button"
                  onClick={generateUniqueRoomId}
                  className="px-4 bg-slate-200 dark:bg-slate-700 rounded-xl text-xs font-bold"
                >
                  Gen
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(roomId, 'Room ID')}
                  className="px-3 bg-slate-200 dark:bg-slate-700 rounded-xl text-xs font-bold"
                  title="Copy Room ID"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <select
                value={roomType}
                onChange={(e) =>
                  setRoomType(e.target.value as 'personal' | 'project')
                }
                className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl outline-none"
              >
                <option value="personal">Personal Workspace</option>
                <option value="project">Project Workspace</option>
              </select>

              {roomType === 'project' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    placeholder="Workspace Password"
                    className="flex-1 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl"
                  />

                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-4 bg-slate-200 dark:bg-slate-700 rounded-xl text-xs font-bold"
                  >
                    Generate
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(roomPassword, 'Password')}
                    className="px-3 bg-slate-200 dark:bg-slate-700 rounded-xl text-xs font-bold"
                    title="Copy Password"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>

                <button
                  disabled={isCreating}
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Confirm Cluster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
