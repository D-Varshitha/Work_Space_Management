import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, Calendar,
  ClipboardList, MessageSquare, Bell, LogOut,
  Building2, Heart, Megaphone, ChevronLeft, ChevronRight,
  AlertTriangle, MapPin, Package
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const menuItems = {
  admin: [
    { name: 'Dashboard',         icon: LayoutDashboard, path: '/admin' },
    { name: 'Employees',         icon: Users,           path: '/admin/employees' },
    { name: 'Projects',          icon: Briefcase,       path: '/admin/projects' },
    { name: 'Attendance',        icon: ClipboardList,   path: '/admin/attendance' },
    { name: 'Leave Requests',    icon: Calendar,        path: '/admin/leaves' },
    { name: 'Feedback',          icon: MessageSquare,   path: '/admin/feedback' },
    { name: 'Assets',            icon: Package,         path: '/admin/assets' },
    { name: 'Overwork Risks',    icon: AlertTriangle,   path: '/admin/overwork-risks' },
    { name: 'Seating',           icon: MapPin,          path: '/seating' },
    { name: 'Notifications',     icon: Bell,            path: '/notifications' },
  ],
  manager: [
    { name: 'Dashboard',         icon: LayoutDashboard, path: '/manager' },
    { name: 'My Team',           icon: Users,           path: '/manager/team' },
    { name: 'Projects',          icon: Briefcase,       path: '/manager/projects' },
    { name: 'Leave Requests',    icon: Calendar,        path: '/manager/leaves' },
    { name: 'Facilities',        icon: Building2,       path: '/manager/facilities' },
    { name: 'Attendance',        icon: ClipboardList,   path: '/manager/attendance' },
    { name: 'Wellness',          icon: Heart,           path: '/manager/wellness' },
    { name: 'Announcements',     icon: Megaphone,       path: '/manager/announcements' },
    { name: 'Seating',           icon: MapPin,          path: '/seating' },
    { name: 'Notifications',     icon: Bell,            path: '/notifications' },
  ],
  employee: [
    { name: 'Dashboard',         icon: LayoutDashboard, path: '/employee' },
    { name: 'Projects',          icon: Briefcase,       path: '/employee/projects' },
    { name: 'Tasks',             icon: ClipboardList,   path: '/employee/tasks' },
    { name: 'Request Leave',     icon: Calendar,        path: '/employee/leaves' },
    { name: 'Attendance',        icon: ClipboardList,   path: '/employee/attendance' },
    { name: 'Facilities',        icon: Building2,       path: '/employee/facilities' },
    { name: 'Feedback',          icon: MessageSquare,   path: '/employee/feedback' },
    { name: 'My Assets',         icon: Package,         path: '/employee/assets' },
    { name: 'Wellness',          icon: Heart,           path: '/employee/wellness' },
    { name: 'Seating',           icon: MapPin,          path: '/seating' },
    { name: 'Notifications',     icon: Bell,            path: '/notifications' },
  ],
};

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const items = menuItems[user?.role] || [];

  return (
    <div
      className={`
        ${collapsed ? 'w-16' : 'w-64'}
        bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800
        h-screen fixed left-0 top-0 flex flex-col
        transition-all duration-300 ease-in-out z-20
      `}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-gray-100 dark:border-gray-800 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-black text-gray-900 dark:text-white">WorkSphere</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${collapsed ? 'absolute -right-3 top-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm rounded-full p-1' : ''}`}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role Badge */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
            user?.role === 'admin'    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' :
            user?.role === 'manager' ? 'bg-blue-100   text-blue-700   dark:bg-blue-900/40   dark:text-blue-400'   :
                                       'bg-green-100  text-green-700  dark:bg-green-900/40  dark:text-green-400'
          }`}>
            {user?.role}
          </span>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.name : undefined}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-none'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={logout}
          title={collapsed ? 'Sign Out' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
