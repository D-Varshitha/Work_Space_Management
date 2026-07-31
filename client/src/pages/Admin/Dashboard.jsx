import { useState, useEffect } from 'react';
import {
  Users, Briefcase, CheckCircle, Clock, AlertTriangle,
  UserCheck, CalendarOff, Package, Wrench, TrendingUp, Activity
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../../api/axios';
import StatCard from '../../components/ui/StatCard';
import { SkeletonCard, SkeletonTable } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, projectsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/projects'),
        ]);
        setStats(statsRes.data);
        setRecentProjects(projectsRes.data.slice(0, 6));
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Derived chart data from stats
  const taskChartData = stats ? [
    { name: 'Completed', value: stats.completedTasks },
    { name: 'In Progress / Todo', value: stats.pendingTasks },
  ] : [];

  const projectStatusData = recentProjects.length > 0 ? [
    { name: 'Planning',    value: recentProjects.filter(p => p.status === 'planning').length },
    { name: 'In Progress', value: recentProjects.filter(p => p.status === 'in-progress').length },
    { name: 'Completed',   value: recentProjects.filter(p => p.status === 'completed').length },
  ].filter(d => d.value > 0) : [];

  const attendanceBarData = stats ? [
    { name: 'Present Today', count: stats.attendanceToday },
    { name: 'On Leave',      count: stats.employeesOnLeave },
    { name: 'Active Staff',  count: stats.activeEmployees },
  ] : [];

  const statCards = stats ? [
    { label: 'Total Employees',   value: stats.totalEmployees,   icon: Users,       color: 'blue'   },
    { label: 'Active Staff',      value: stats.activeEmployees,  icon: UserCheck,   color: 'green'  },
    { label: 'Active Projects',   value: stats.activeProjects,   icon: Briefcase,   color: 'purple' },
    { label: 'Tasks Completed',   value: stats.completedTasks,   icon: CheckCircle, color: 'teal'   },
    { label: 'Pending Tasks',     value: stats.pendingTasks,     icon: Clock,       color: 'orange' },
    { label: 'Present Today',     value: stats.attendanceToday,  icon: Activity,    color: 'green'  },
    { label: 'On Leave Today',    value: stats.employeesOnLeave, icon: CalendarOff, color: 'orange' },
    { label: 'Assets Assigned',   value: stats.assetsAssigned,   icon: Package,     color: 'indigo' },
    { label: 'Maintenance Reqs',  value: stats.maintenanceRequests, icon: Wrench,   color: 'red'    },
    { label: 'Overdue Tasks',     value: stats.overworkRisks,    icon: AlertTriangle, color: 'red'  },
    { label: 'Completion Rate',   value: `${stats.taskCompletionRate}%`, icon: TrendingUp, color: 'teal' },
  ] : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonTable rows={4} cols={4} />
          <SkeletonTable rows={4} cols={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Live overview of your organization.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {statCards.map(card => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Task Distribution Pie */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Task Distribution</h2>
          {taskChartData.every(d => d.value === 0) ? (
            <EmptyState title="No Tasks Yet" description="Tasks will appear here once created." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={taskChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                  {taskChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Project Status Pie */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Projects by Status</h2>
          {projectStatusData.length === 0 ? (
            <EmptyState title="No Projects Yet" description="Projects will appear here once created." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={projectStatusData} cx="50%" cy="50%" outerRadius={85} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {projectStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Attendance Bar */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Attendance Snapshot</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attendanceBarData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Projects Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Recent Projects</h2>
        </div>
        {recentProjects.length === 0 ? (
          <EmptyState title="No Projects Yet" description="Create your first project to see it here." icon="projects" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3 font-semibold">Project</th>
                  <th className="px-6 py-3 font-semibold">Manager</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {recentProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-200 text-sm">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{p.Manager?.name || 'Unassigned'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        p.status === 'completed'  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                        p.status === 'in-progress'? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                                                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 min-w-[80px]">
                          <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400 w-8">{p.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
