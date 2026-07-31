import { useState, useEffect } from 'react';
import { Briefcase, Users, Calendar, Search } from 'lucide-react';
import api from '../../api/axios';

const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects');
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8">Loading projects...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Projects</h1>
          <p className="text-gray-500">Overview of all active and planned projects across the organization.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search projects..."
            className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 text-gray-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex flex-col lg:flex-row justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">{project.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        project.status === 'completed' ? 'bg-green-100 text-green-700' :
                        project.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {project.status.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">• Controlled by: <span className="font-bold text-gray-700">{project.Manager?.name || 'Unassigned'}</span></span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mb-6">{project.description}</p>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">Overall Progress</span>
                    <span className="text-blue-600 font-bold">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="lg:w-80 border-t lg:border-t-0 lg:border-l lg:pl-6 pt-6 lg:pt-0">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Team Members ({project.TeamMembers?.length || 0})
                  </h4>
                  <div className="flex items-center gap-1 text-red-600 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span className="font-bold">{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'No Due Date'}</span>
                  </div>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {project.TeamMembers?.map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="text-sm font-bold">{member.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{member.ProjectMember?.role || 'member'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase">Progress</p>
                        <p className="text-xs font-bold text-blue-600">{project.progress}%</p>
                      </div>
                    </div>
                  ))}
                  {(!project.TeamMembers || project.TeamMembers.length === 0) && (
                    <p className="text-sm text-gray-500 italic">No members assigned yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
            <p className="text-gray-500 dark:text-gray-400">No projects found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProjects;
