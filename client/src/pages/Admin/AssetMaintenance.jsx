import { useEffect, useState } from 'react';
import { Wrench, ClipboardList, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

const AdminAssetMaintenance = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accountability, setAccountability] = useState([]);
  const [loadingAccountability, setLoadingAccountability] = useState(false);
  const [newAsset, setNewAsset] = useState({ assetType: 'Laptop', assignedTo: '', status: 'Available' });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/asset-maintenance-requests');
      setRequests(res.data || []);
    } catch (e) {
      console.error('Failed to fetch maintenance requests', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountability = async () => {
    try {
      setLoadingAccountability(true);
      const res = await api.get('/admin/assets/accountability');
      setAccountability(res.data || []);
    } catch (e) {
      console.error('Failed to fetch accountability', e);
    } finally {
      setLoadingAccountability(false);
    }
  };

  const fetchAssets = async () => {
    try {
      setLoadingAssets(true);
      const [assetsRes, usersRes] = await Promise.all([
        api.get('/assets'),
        api.get('/users')
      ]);
      setAssets(assetsRes.data || []);
      setUsers((usersRes.data || []).filter((u) => u.role === 'employee'));
    } catch (e) {
      console.error('Failed to fetch assets', e);
    } finally {
      setLoadingAssets(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAssets();
      fetchRequests();
      fetchAccountability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/asset-maintenance-requests/${id}`, { status });
      toast.success(`Request marked as ${status}`);
      await fetchRequests();
      await fetchAccountability();
      await fetchAssets();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update request');
    }
  };

  const createAsset = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assets', {
        assetType: newAsset.assetType,
        status: newAsset.status,
        assignedTo: newAsset.assignedTo || null
      });
      toast.success('Asset created successfully');
      setNewAsset({ assetType: 'Laptop', assignedTo: '', status: 'Available' });
      await fetchAssets();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create asset');
    }
  };

  const updateAsset = async (id, payload) => {
    try {
      await api.patch(`/assets/${id}`, payload);
      await fetchAssets();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update asset');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assets & Maintenance</h1>
        <p className="text-gray-500 dark:text-gray-400">Track maintenance requests and asset accountability.</p>
      </div>
        <div className="bg-blue-100 p-3 rounded-lg">
          <Wrench className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Asset Management</h2>
        </div>

        <form onSubmit={createAsset} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <select
            value={newAsset.assetType}
            onChange={(e) => setNewAsset({ ...newAsset, assetType: e.target.value })}
            className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
          >
            <option value="Laptop">Laptop</option>
            <option value="Monitor">Monitor</option>
            <option value="Keyboard">Keyboard</option>
            <option value="Mouse">Mouse</option>
          </select>
          <select
            value={newAsset.assignedTo}
            onChange={(e) => setNewAsset({ ...newAsset, assignedTo: e.target.value })}
            className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <select
            value={newAsset.status}
            onChange={(e) => setNewAsset({ ...newAsset, status: e.target.value })}
            className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
          >
            <option value="Assigned">Assigned</option>
            <option value="Available">Available</option>
            <option value="Under Maintenance">Under Maintenance</option>
          </select>
          <button className="py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
            Add Asset
          </button>
        </form>

        {loadingAssets ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading assets...</div>
        ) : assets.length === 0 ? (
          <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50">
            No assets found.
          </div>
        ) : (
          <div className="space-y-3">
            {assets.map((a) => (
              <div key={a.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{a.assetType}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Assigned: {a.AssignedEmployee?.name || 'Unassigned'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={a.status || 'Available'}
                    onChange={(e) => updateAsset(a.id, { status: e.target.value })}
                    className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                  >
                    <option value="Assigned">Assigned</option>
                    <option value="Available">Available</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                  </select>
                  <select
                    value={a.assignedTo || ''}
                    onChange={(e) => updateAsset(a.id, { assignedTo: e.target.value || null })}
                    className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <ClipboardList className="w-6 h-6 text-gray-400" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Maintenance Requests</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50">No maintenance requests.</div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white">{r.Asset?.assetType || 'Asset'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Requested by: {r.MaintenanceRequester?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 break-words">{r.issueDescription}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Status: {r.status}</p>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(r.id, 'completed')} className="p-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-700 hover:text-white rounded-lg transition" title="Resolve">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button onClick={() => updateStatus(r.id, 'rejected')} className="p-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-700 hover:text-white rounded-lg transition" title="Reject">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Asset Accountability</h2>
        {loadingAccountability ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
        ) : accountability.length === 0 ? (
          <div className="p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50">No accountability data.</div>
        ) : (
          <div className="space-y-3">
            {accountability.map((a) => (
              <div key={a.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{a.assetType}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Condition: {a.condition} | Assigned: {a.AssignedEmployee?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Custody duration: {a.custodyDays} days</p>
                  </div>
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full font-black uppercase tracking-widest">{a.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAssetMaintenance;

