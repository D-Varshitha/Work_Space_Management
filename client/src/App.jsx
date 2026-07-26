import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Notifications from './pages/Notifications';

import AdminAssetMaintenance from './pages/Admin/AssetMaintenance';
import AdminOverworkRisks from './pages/Admin/OverworkRisks';

import EmployeeAssets from './pages/Employee/Assets';
import EmployeeWellness from './pages/Employee/Wellness';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import AdminEmployees from './pages/Admin/Employees';
import AdminProjects from './pages/Admin/Projects';
import AdminAttendance from './pages/Admin/Attendance';
import AdminFeedback from './pages/Admin/Feedback';

// Manager Pages
import ManagerDashboard from './pages/Manager/Dashboard';
import ManagerTeams from './pages/Manager/Teams';
import ManagerProjects from './pages/Manager/Projects';
import ManagerAttendance from './pages/Manager/Attendance';
import ManagerWellness from './pages/Manager/Wellness';
import ManagerAnnouncements from './pages/Manager/Announcements';

// Employee Pages
import EmployeeDashboard from './pages/Employee/Dashboard';
import EmployeeProjects from './pages/Employee/Projects';
import EmployeeTasks from './pages/Employee/Tasks';
import EmployeeAttendance from './pages/Employee/Attendance';
import EmployeeFeedback from './pages/Employee/Feedback';

// Shared Pages
import Leaves from './pages/Shared/Leaves';
import Facilities from './pages/Shared/Facilities';
import Seating from './pages/Shared/Seating';

import './index.css';

const RoleBasedRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'employee':
      return <EmployeeDashboard />;
    default:
      return <Navigate to="/login" />;
  }
};

const RequireRole = ({ roles, children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
};

// Redirect already-authenticated users away from public routes (e.g. /login)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<RoleBasedRoute />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<RequireRole roles={['admin']}><AdminDashboard /></RequireRole>} />
            <Route path="/admin/employees" element={<RequireRole roles={['admin']}><AdminEmployees /></RequireRole>} />
            <Route path="/admin/projects" element={<RequireRole roles={['admin']}><AdminProjects /></RequireRole>} />
            <Route path="/admin/attendance" element={<RequireRole roles={['admin']}><AdminAttendance /></RequireRole>} />
            <Route path="/admin/feedback" element={<RequireRole roles={['admin']}><AdminFeedback /></RequireRole>} />
            <Route path="/admin/leaves" element={<RequireRole roles={['admin']}><Leaves /></RequireRole>} />
            <Route path="/admin/assets" element={<RequireRole roles={['admin']}><AdminAssetMaintenance /></RequireRole>} />
            <Route path="/admin/overwork-risks" element={<RequireRole roles={['admin']}><AdminOverworkRisks /></RequireRole>} />
            
            {/* Manager Routes */}
            <Route path="/manager" element={<RequireRole roles={['manager']}><ManagerDashboard /></RequireRole>} />
            <Route path="/manager/team" element={<RequireRole roles={['manager']}><ManagerTeams /></RequireRole>} />
            <Route path="/manager/projects" element={<RequireRole roles={['manager']}><ManagerProjects /></RequireRole>} />
            <Route path="/manager/leaves" element={<RequireRole roles={['manager', 'admin']}><Leaves /></RequireRole>} />
            <Route path="/manager/facilities" element={<RequireRole roles={['manager', 'admin']}><Facilities /></RequireRole>} />
            <Route path="/manager/attendance" element={<RequireRole roles={['manager']}><ManagerAttendance /></RequireRole>} />
            <Route path="/manager/wellness" element={<RequireRole roles={['manager']}><ManagerWellness /></RequireRole>} />
            <Route path="/manager/announcements" element={<RequireRole roles={['manager']}><ManagerAnnouncements /></RequireRole>} />
            
            {/* Employee Routes */}
            <Route path="/employee" element={<RequireRole roles={['employee']}><EmployeeDashboard /></RequireRole>} />
            <Route path="/employee/projects" element={<RequireRole roles={['employee']}><EmployeeProjects /></RequireRole>} />
            <Route path="/employee/tasks" element={<RequireRole roles={['employee']}><EmployeeTasks /></RequireRole>} />
            <Route path="/employee/leaves" element={<RequireRole roles={['employee']}><Leaves /></RequireRole>} />
            <Route path="/employee/attendance" element={<RequireRole roles={['employee']}><EmployeeAttendance /></RequireRole>} />
            <Route path="/employee/feedback" element={<RequireRole roles={['employee']}><EmployeeFeedback /></RequireRole>} />
            <Route path="/employee/facilities" element={<RequireRole roles={['employee']}><Facilities /></RequireRole>} />
            <Route path="/employee/assets" element={<RequireRole roles={['employee']}><EmployeeAssets /></RequireRole>} />
            <Route path="/employee/wellness" element={<RequireRole roles={['employee']}><EmployeeWellness /></RequireRole>} />
            
            {/* Shared */}
            <Route path="/leaves" element={<RequireRole roles={['employee', 'manager', 'admin']}><Leaves /></RequireRole>} />
            <Route path="/facilities" element={<RequireRole roles={['employee', 'manager', 'admin']}><Facilities /></RequireRole>} />
            <Route path="/seating" element={<RequireRole roles={['employee', 'manager', 'admin']}><Seating /></RequireRole>} />

            {/* Notifications: visible to all roles */}
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
