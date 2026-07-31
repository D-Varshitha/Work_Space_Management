import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';

const EmployeeAttendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    try {
      const response = await api.get('/attendance/my');
      setAttendance(response.data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const getDayStatus = (day) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
    const record = attendance.find(a => new Date(a.date).toDateString() === dateStr);
    return record ? record.status : null;
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const markPresent = async () => {
    setLoading(true);
    try {
      // No status sent — server auto-detects based on check-in time
      const res = await api.post('/attendance/checkin');
      const { autoStatus, checkedInAt, cutoff } = res.data;
      const timeStr = new Date(checkedInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      await fetchAttendance();
      if (autoStatus === 'late') {
        toast(`Checked in at ${timeStr} — marked LATE (cutoff ${cutoff}) ⏰`, { icon: '🕐' });
      } else {
        toast.success(`Checked in at ${timeStr} — marked PRESENT ✅`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Check-in failed');
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading attendance...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-gray-500">View your monthly attendance log and leave balance.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-100 text-center">
            <p className="text-[10px] text-green-600 uppercase font-bold">Used</p>
            <p className="text-xl font-bold text-green-700">{user.usedLeaves || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition"><ChevronLeft /></button>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition"><ChevronRight /></button>
          </div>
        </div>

        <div className="flex justify-end mb-6">
          <button
            onClick={markPresent}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold shadow-sm"
          >
            Check In for Today
          </button>
        </div>

        <div className="grid grid-cols-7 gap-4 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-bold text-gray-400 uppercase tracking-wider">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-4">
          {[...Array(firstDayOfMonth)].map((_, i) => <div key={`empty-${i}`} />)}
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            const status = getDayStatus(day);
            return (
              <div key={day} className="relative group">
                <div className={`aspect-square flex flex-col items-center justify-center rounded-xl border-2 transition-all ${
                  status === 'present' ? 'bg-green-50 border-green-200 text-green-700' :
                  status === 'late' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                  status === 'absent' ? 'bg-red-50 border-red-200 text-red-700' :
                  'bg-gray-50 border-transparent text-gray-400'
                }`}>
                  <span className="text-lg font-bold">{day}</span>
                  {status && (
                    <span className="text-[8px] uppercase font-black tracking-tighter mt-1">{status}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap gap-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span>Present</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded"></div>
            <span>Late</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span>Absent / Leave</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendance;
