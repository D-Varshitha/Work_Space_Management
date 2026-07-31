import { useState, useEffect } from 'react';
import { ClipboardList, User, Calendar, X } from 'lucide-react';
import api from '../../api/axios';

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

  if (loading) return <div className="p-8">Loading attendance...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Today's Attendance</h1>
        <p className="text-gray-500">Monitor daily attendance across the organization.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-sm text-gray-500 border-b">
                <th className="px-6 py-4 font-medium">Employee</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="font-bold">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{emp.department}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      emp.status === 'present' ? 'bg-green-100 text-green-700' :
                      emp.status === 'late' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {emp.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleEmployeeClick(emp)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      View Monthly Log
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl p-8 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold">Attendance Log: {selectedEmployee.name}</h2>
                <p className="text-gray-500">{selectedEmployee.department}</p>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {loadingAttendance ? (
              <p>Loading log...</p>
            ) : (
              <div className="space-y-4">
                {employeeAttendance.length === 0 ? (
                  <p className="text-center py-8 text-gray-500 italic">No attendance records found.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {employeeAttendance.map((record, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <span className="font-medium">{new Date(record.date).toLocaleDateString()}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                          record.status === 'present' ? 'bg-green-100 text-green-700' :
                          record.status === 'late' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {record.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendance;
