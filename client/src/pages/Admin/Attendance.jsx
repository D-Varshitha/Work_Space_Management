import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import api from '../../api/axios';
import AttendanceDetailModal from '../../components/AttendanceDetailModal';

const AdminAttendance = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeAttendance, setEmployeeAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/admin/attendance');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeClick = async (employee) => {
    setSelectedEmployee(employee);
    setLoadingAttendance(true);
    try {
      const response = await api.get(`/admin/attendance/${employee.id}`);
      setEmployeeAttendance(response.data);
    } catch (error) {
      console.error('Error fetching employee attendance:', error);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedEmployee(null);
    setEmployeeAttendance([]);
  };

  if (loading) return <div className="p-8 text-gray-500 dark:text-gray-400">Loading attendance...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Today's Attendance</h1>
        <p className="text-gray-500 dark:text-gray-400">Monitor daily attendance across the organization.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4 font-semibold">Employee</th>
                <th className="px-6 py-4 font-semibold">Department</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50 dark:divide-gray-700">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 italic">
                    No attendance records for today.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{emp.department}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          emp.status === 'present'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                            : emp.status === 'late'
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                        }`}
                      >
                        {emp.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEmployeeClick(emp)}
                        className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
                      >
                        View Monthly Log
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── New enterprise attendance modal ── */}
      {selectedEmployee && (
        loadingAttendance ? (
          /* Loading overlay while fetching records */
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 flex flex-col items-center gap-4 shadow-2xl">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-700 dark:text-gray-300 font-semibold">Loading attendance log…</p>
            </div>
          </div>
        ) : (
          <AttendanceDetailModal
            employee={selectedEmployee}
            records={employeeAttendance}
            onClose={handleCloseModal}
          />
        )
      )}
    </div>
  );
};

export default AdminAttendance;
