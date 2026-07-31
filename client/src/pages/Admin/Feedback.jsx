import { useState, useEffect } from 'react';
import { MessageSquare, User, Calendar, Tag } from 'lucide-react';
import api from '../../api/axios';

const AdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await api.get('/admin/feedback');
        setFeedbacks(response.data);
      } catch (error) {
        console.error('Error fetching feedback:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedbacks();
  }, []);

  if (loading) return <div className="p-8">Loading feedback...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Employee Feedback</h1>
        <p className="text-gray-500">Monitor suggestions, incidents, and general feedback from the team.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {feedbacks.map((fb) => (
          <div key={fb.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{fb.CreatedBy?.name || 'Anonymous'}</h3>
                    <p className="text-xs text-gray-500">{fb.CreatedBy?.role} • {fb.CreatedBy?.department}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                  fb.type === 'incident' ? 'bg-red-100 text-red-700' :
                  fb.type === 'suggestion' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {fb.type}
                </span>
              </div>
              <p className="text-gray-600 text-sm italic mb-6">"{fb.message}"</p>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                <span>ID: {String(fb.id).padStart(6, '0')}</span>
              </div>
            </div>
          </div>
        ))}

        {feedbacks.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">No feedback submissions found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFeedback;
