import { useState, useEffect } from 'react';
import { Users, Briefcase, Plus, CheckCircle, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const ManagerTeams = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', assignedTo: '', dueDate: '' });
  const [projectTasks, setProjectTasks] = useState({});
  const [allEmployees, setAllEmployees] = useState([]);
  const [newMember, setNewMember] = useState({ userId: '', role: 'member' });
  const [isAddingMember, setIsAddingMember] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projRes, usersRes] = await Promise.all([
        api.get('/projects'),
        api.get('/users').catch(() => ({ data: [] }))
      ]);
      setProjects(projRes.data);
      
      // Filter employees for the dropdown
      const employees = usersRes.data.filter(u => u.role === 'employee');
      setAllEmployees(employees);
      
      // Fetch tasks for each project
      const tasksMap = {};
      for (const project of projRes.data) {
        try {
          const taskRes = await api.get(`/tasks/project/${project.id}`);
          tasksMap[project.id] = taskRes.data;
        } catch (e) {
          console.error(`Error tasks for ${project.id}`, e);
        }
      }
      setProjectTasks(tasksMap);
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', {
        ...newTask,
        projectId: selectedProject.id
      });
      toast.success('Task assigned successfully!');
      setShowTaskModal(false);
      setNewTask({ title: '', assignedTo: '', dueDate: '' });
      fetchData();
    } catch {
      toast.error('Failed to assign task');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMember.userId) return;
    
    setIsAddingMember(true);
    try {
      // Assuming endpoint exists for adding members
      await api.post(`/projects/${selectedProject.id}/members`, {
        userId: newMember.userId,
        role: newMember.role
      });
      toast.success('Member added to project!');
      setShowMemberModal(false);
      setNewMember({ userId: '', role: 'member' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member');
    } finally {
      setIsAddingMember(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading teams and tasks...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Project Teams</h1>
        <p className="text-gray-500">Manage your teams, view progress, and assign tasks.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {projects.map((project) => (
          <div key={project.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{project.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status: <span className="capitalize font-bold text-blue-600">{project.status}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setSelectedProject(project); setShowMemberModal(true); }}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-bold text-sm border border-gray-200 dark:border-gray-600"
                >
                  <Users className="w-4 h-4" />
                  Add Member
                </button>
                <button
                  onClick={() => { setSelectedProject(project); setShowTaskModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Assign Task
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Team Members */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  Team Members
                </h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {project.TeamMembers?.map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {member.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.ProjectMember?.role || 'member'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!project.TeamMembers || project.TeamMembers.length === 0) && (
                    <div className="text-center py-4 text-gray-400 italic text-sm">
                      No members in this project yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Tasks */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-400" />
                  Assigned Tasks
                </h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {projectTasks[project.id]?.map((task) => (
                    <div key={task.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-gray-800">{task.title}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          task.status === 'done' ? 'bg-green-100 text-green-700' :
                          task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{task.AssignedTo?.name || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!projectTasks[project.id] || projectTasks[project.id].length === 0) && (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <p className="text-gray-400 italic">No tasks assigned yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign Task: {selectedProject.name}</h2>
              <button onClick={() => setShowTaskModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAssignTask} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Task Title</label>
                <input
                  type="text" required
                  className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task description..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Assign To</label>
                <select
                  required
                  className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                >
                  <option value="">Select Member</option>
                  {selectedProject.TeamMembers?.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.ProjectMember?.role || 'member'})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Due Date</label>
                <input
                  type="date" required
                  className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowTaskModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Member to {selectedProject?.name}</h2>
              <button onClick={() => setShowMemberModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Select Employee</label>
                <select
                  required
                  className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  value={newMember.userId}
                  onChange={(e) => setNewMember({ ...newMember, userId: e.target.value })}
                >
                  <option value="">Choose an employee...</option>
                  {allEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Role</label>
                <input
                  type="text" required
                  className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  placeholder="e.g. Developer, Designer"
                />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowMemberModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600">
                  Cancel
                </button>
                <button type="submit" disabled={isAddingMember || !newMember.userId} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">
                  {isAddingMember ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerTeams;
