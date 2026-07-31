import { useEffect, useState } from 'react';
import { AlertTriangle, Users } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

const AdminOverworkRisks = () => {
  const { user } = useAuth();
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRisks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/workload/risks');
      setRisks(res.data?.risks || []);
    } catch (e) {
      console.error('Failed to fetch overwork risks', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchRisks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="bg-red-100 p-3 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overwork Risks</h1>
          <p className="text-gray-500">Flagged employees based on overdue/active workload.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading risks...</div>
      ) : risks.length === 0 ? (
        <div className="p-12 text-center text-gray-400 border-2 border-dashed rounded-xl bg-gray-50">
          No overwork risks detected.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-sm text-gray-500 border-b">
                <th className="px-6 py-4 font-medium">Employee</th>
                <th className="px-6 py-4 font-medium">Active Tasks</th>
                <th className="px-6 py-4 font-medium">Overdue Tasks</th>
                <th className="px-6 py-4 font-medium">Workload Score</th>
              </tr>
            </thead>
            <tbody>
              {risks.map((r) => (
                <tr key={r.userId} className="border-b hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                        <Users className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{r.name}</div>
                        <div className="text-xs text-gray-500">ID: {String(r.userId).slice(0, 6)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">{r.activeTasks}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">{r.overdueTasks}</td>
                  <td className="px-6 py-4 text-sm font-bold text-red-700">{r.workloadScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOverworkRisks;

