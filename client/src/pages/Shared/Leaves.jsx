import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';

const Leaves = () => {
  const { user, refreshUser } = useAuth();
  const [myLeaves, setMyLeaves] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRequest, setNewRequest] = useState({ startDate: '', endDate: '', reason: '' });
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionComment, setRejectionComment] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, [user]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);

      if (user.role === 'employee') {
        const myLeavesRes = await api.get('/leave/my');
        setMyLeaves(myLeavesRes.data || []);
        setPendingApprovals([]);
        return;
      }

      // admin + manager: show "my" leaves separately, plus team pending approvals separately
      const [myLeavesRes, pendingRes] = await Promise.all([
        api.get('/leave/my').catch(() => ({ data: [] })),
        api.get('/leave/pending').catch(() => ({ data: [] }))
      ]);

      setMyLeaves(myLeavesRes.data || []);
      setPendingApprovals(pendingRes.data || []);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leave', {
        ...newRequest,
        managerId: user.managerId || null
      });
      toast.success('Leave request submitted!');
      setNewRequest({ startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch {
      toast.error('Failed to submit request');
    }
  };

  const handleAction = async (id, status, comment = '') => {
    try {
      await api.put(`/leave/${id}`, { status, rejectionComment: comment });
      toast.success(`Leave request ${status}!`);
      setShowRejectionModal(false);
      setRejectionComment('');
      await refreshUser?.();
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const canApprove = (req) => {
    const approvals = req.LeaveApprovals || req.LeaveApproval || [];

    if (user.role === 'admin') {
      // Admin can approve their own HR step.
      // Admin/HR approves only the HR step.
      return approvals.some((a) => a.level === 'hr' && a.status === 'pending');
    }

    if (user.role === 'manager') {
      // Manager cannot approve their own requests.
      if (req.employeeId === user.id) return false;
      // Manager approves only the manager step.
      return approvals.some((a) => a.level === 'manager' && a.status === 'pending');
    }

    return false;
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading leave requests...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
            {user.role === 'employee' ? 'My Leave Requests' : 'Leave Management'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Track and manage leave applications.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {user.role !== 'admin' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm h-fit lg:sticky lg:top-8">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Apply for Leave</h2>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                <input
                  type="date" required
                  className="mt-1 block w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  value={newRequest.startDate}
                  onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                <input
                  type="date" required
                  className="mt-1 block w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  value={newRequest.endDate}
                  onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
                <textarea
                  required rows="3"
                  className="mt-1 block w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  placeholder="Reason for leave..."
                ></textarea>
              </div>
              <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold shadow-md">
                Submit Request
              </button>
            </form>
          </div>
        )}

        <div className={`space-y-8 ${user.role === 'admin' ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
          {/* My leaves */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold">
              {user.role === 'employee' ? 'My History' : 'My Leave Requests'}
            </h2>
            <div className="space-y-4">
              {myLeaves.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed rounded-xl p-12 text-center text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No leave requests found.</p>
                </div>
              ) : (
                myLeaves.map((req) => {
                  const isSelf = String(req.employeeId) === String(user.id);
                  const employeeName = req.user?.name || req.Employee?.name || 'Leave';
                  return (
                    <div key={req.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between shadow-sm hover:shadow-md transition border-l-4 border-l-blue-600">
                      <div className="flex items-center gap-6">
                        <div className={`p-4 rounded-xl ${req.status === 'approved' ? 'bg-green-100 text-green-600' : req.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-900 text-lg">
                              {employeeName} Request
                            </span>
                            {req.status === 'pending' && (
                              <span className="flex items-center gap-1 text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-black uppercase">
                                <Clock className="w-3 h-3" />
                                Awaiting
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 font-medium">
                            {new Date(req.startDate).toLocaleDateString()} — {new Date(req.endDate).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <MessageSquare className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-400 italic">"{req.reason}"</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-4">
                        <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${req.status === 'approved' ? 'bg-green-100 text-green-700' : req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                          {req.status}
                        </span>

                        {canApprove(req) && req.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAction(req.id, 'approved')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-xs font-bold"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setShowRejectionModal(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs font-bold"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Team / approvals */}
          {user.role !== 'employee' && (
            <section className="space-y-4">
              <h2 className="text-lg font-bold">
                {user.role === 'admin' ? 'HR Pending Approvals' : 'Team Pending Approvals'}
              </h2>
              <div className="space-y-4">
                {pendingApprovals
                  .filter((req) => String(req.employeeId) !== String(user.id))
                  .length === 0 ? (
                  <div className="bg-gray-50 border-2 border-dashed rounded-xl p-12 text-center text-gray-400">
                    <p>No pending approvals.</p>
                  </div>
                ) : (
                  pendingApprovals
                    .filter((req) => String(req.employeeId) !== String(user.id))
                    .map((req) => (
                  <div key={req.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between shadow-sm hover:shadow-md transition border-l-4 border-l-blue-600">
                  <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-xl ${
                      req.status === 'approved' ? 'bg-green-100 text-green-600' : 
                      req.status === 'rejected' ? 'bg-red-100 text-red-600' : 
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 text-lg">
                          {req.user?.name || req.Employee?.name || 'Leave'} Request
                        </span>
                        {req.status === 'pending' && (
                          <span className="flex items-center gap-1 text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-black uppercase">
                            <Clock className="w-3 h-3" />
                            Awaiting
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 font-medium">
                        {new Date(req.startDate).toLocaleDateString()} — {new Date(req.endDate).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                         <MessageSquare className="w-3 h-3 text-gray-400" />
                         <p className="text-xs text-gray-400 italic">"{req.reason}"</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-4">
                    <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                      req.status === 'approved' ? 'bg-green-100 text-green-700' : 
                      req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {req.status}
                    </span>
                    
                    {canApprove(req) && req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAction(req.id, 'approved')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-xs font-bold"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedRequest(req);
                            setShowRejectionModal(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs font-bold"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Reject Leave Request</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Please provide a reason for rejecting the leave request from <strong>{selectedRequest?.user?.name || selectedRequest?.Employee?.name}</strong>.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Manager's Comment</label>
                <textarea
                  className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                  rows="4"
                  placeholder="Explain why this request is being rejected..."
                  value={rejectionComment}
                  onChange={(e) => setRejectionComment(e.target.value)}
                ></textarea>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => { setShowRejectionModal(false); setRejectionComment(''); }}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(selectedRequest.id, 'rejected', rejectionComment)}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
