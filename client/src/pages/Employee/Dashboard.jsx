import { useState, useEffect } from 'react';
import { Briefcase, CheckCircle, Clock, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from '../../components/ui/StatCard';
import { SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, projectsRes, assetsRes] = await Promise.all([
          api.get('/tasks/my'),
          api.get('/projects'),
          api.get('/assets/my').catch(() => ({ data: [] }))
        ]);
        setTasks(tasksRes.data);
        setProjects(projectsRes.data);
        setAssets(assetsRes.data || []);
      } catch {
        toast.error('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const markPresent = async () => {
    setCheckingIn(true);
    try {
      // No status sent — server auto-detects based on check-in time
      const res = await api.post('/attendance/checkin');
      const { autoStatus, checkedInAt, cutoff } = res.data;
      const timeStr = new Date(checkedInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      if (autoStatus === 'late') {
        toast(`Checked in at ${timeStr} — marked LATE (cutoff was ${cutoff}) ⏰`, { icon: '🕐' });
      } else {
        toast.success(`Checked in at ${timeStr} — marked PRESENT ✅`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  const statCards = [
    { label: 'Assigned Tasks',  value: tasks.length,                                icon: Clock,        color: 'blue'   },
    { label: 'Completed Tasks', value: tasks.filter(t => t.status === 'done').length, icon: CheckCircle, color: 'green'  },
    { label: 'Active Projects', value: projects.length,                             icon: Briefcase,    color: 'purple' },
    { label: 'My Assets',       value: assets.length,                               icon: Calendar,     color: 'orange' },
  ];

  const taskBarData = [
    { name: 'Todo',       count: tasks.filter(t => t.status === 'todo').length,        fill: '#94a3b8' },
    { name: 'In Progress',count: tasks.filter(t => t.status === 'in-progress').length, fill: '#3b82f6' },
    { name: 'Done',       count: tasks.filter(t => t.status === 'done').length,        fill: '#22c55e' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Welcome, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Here's your workspace at a glance.
          </p>
        </div>
        <button
          onClick={markPresent}
          disabled={checkingIn}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-semibold text-sm shadow-sm transition-all"
        >
          <CheckCircle className="w-4 h-4" />
          {checkingIn ? 'Marking...' : "Mark Today's Attendance"}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => <StatCard key={card.label} {...card} />)}
      </div>

      {/* Charts + Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Task Progress Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">My Task Progress</h2>
          {tasks.length === 0 ? (
            <EmptyState title="No Tasks Assigned" description="Tasks assigned to you will appear here." />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={taskBarData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {taskBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Active Projects */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-gray-400" /> My Projects
          </h2>
          {projects.length === 0 ? (
            <EmptyState title="No Projects" description="You haven't been assigned to any projects yet." />
          ) : (
            <div className="space-y-3">
              {projects.map(p => (
                <div key={p.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate pr-2">{p.name}</p>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{p.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" /> Recent Tasks
          </h2>
          {tasks.length === 0 ? (
            <EmptyState title="No Tasks" description="Tasks assigned to you will appear here." />
          ) : (
            <div className="space-y-3">
              {tasks.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{t.title}</p>
                    <p className="text-xs text-gray-400">{t.Project?.name}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase flex-shrink-0 ${
                    t.status === 'done'        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                    t.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                                                 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>{t.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assets */}
      {assets.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">My Assigned Assets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {assets.map(a => (
              <div key={a.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{a.assetType}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Since {a.assignedDate ? new Date(a.assignedDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                  (a.status || '').toLowerCase() === 'assigned'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                }`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
