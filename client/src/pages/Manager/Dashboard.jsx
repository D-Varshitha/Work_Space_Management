import { useState, useEffect } from 'react';
import {
  Users, Briefcase, CheckCircle, Clock, Calendar,
  Activity, Heart, AlertCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../api/axios';
import StatCard from '../../components/ui/StatCard';
import { SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { useAuth } from '../../contexts/AuthContext';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444'];

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/manager/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Manager stats error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const taskChartData = stats ? [
    { name: 'Open', value: stats.openTasks },
    { name: 'Done', value: stats.completedTasks },
  ] : [];

  const attendanceData = stats ? [
    { name: 'Present', value: stats.attendanceToday },
    { name: 'Absent',  value: Math.max(0, stats.teamSize - stats.attendanceToday) },
  ] : [];

  const statCards = stats ? [
    { label: 'Team Members',       value: stats.teamSize,         icon: Users,        color: 'blue'   },
    { label: 'Active Projects',    value: stats.activeProjects,   icon: Briefcase,    color: 'purple' },
    { label: 'Pending Leave Reqs', value: stats.pendingLeaves,    icon: Calendar,     color: 'orange',
      ...(stats.pendingLeaves > 0 ? { trend: { direction: 'up', value: `${stats.pendingLeaves} new` } } : {}) },
    { label: 'Open Tasks',         value: stats.openTasks,        icon: Clock,        color: 'red'    },
    { label: 'Completed Tasks',    value: stats.completedTasks,   icon: CheckCircle,  color: 'green'  },
    { label: 'Present Today',      value: stats.attendanceToday,  icon: Activity,     color: 'teal'   },
    {
      label: 'Team Wellness Score',
      value: stats.wellnessScore !== null ? `${stats.wellnessScore}%` : 'N/A',
      icon: Heart,
      color: stats.wellnessScore !== null && stats.wellnessScore < 50 ? 'red' : 'green',
      subtitle: stats.wellnessScore === null ? 'No check-ins yet' : undefined,
    },
  ] : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          Manager Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Hi, {user?.name}! Here's your team at a glance.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => <StatCard key={card.label} {...card} />)}
      </div>

      {/* Alerts */}
      {stats?.pendingLeaves > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            You have <strong>{stats.pendingLeaves}</strong> pending leave request{stats.pendingLeaves > 1 ? 's' : ''} waiting for your approval.
          </p>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Task Status Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Team Task Status</h2>
          {taskChartData.every(d => d.value === 0) ? (
            <EmptyState title="No Tasks Yet" description="Tasks will appear here once assigned." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={taskChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={5} dataKey="value">
                  {taskChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Attendance Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Today's Team Attendance</h2>
          {stats?.teamSize === 0 ? (
            <EmptyState title="No Team Members" description="Add team members to see attendance." icon="users" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {attendanceData.map((entry, i) => (
                    <Cell key={i} fill={i === 0 ? '#22c55e' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
