import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  sequelize,
  dbConnectionInfo,
  User,
  Project,
  ProjectMember,
  Task,
  Leave,
  Attendance,
  Feedback,
  Facility,
  Notification,
  LeaveApproval,
  Asset,
  AssetCustodyHistory,
  AssetMaintenanceRequest,
  FacilityZone,
  FacilityInventory,
  WellnessCheckin,
  TimeEntry,
  EmployeeRoleHistory,
  TeamAnnouncement,
  SeatingAssignment
} from './models/index.js';
import { seedDefaultData } from './seed/defaultData.js';
import authRoutes from './routes/auth.js';
import { protect, authorizeRoles } from './middleware/auth.js';
import { Op } from 'sequelize';

dotenv.config();


const app = express();

// CORS: allow local dev + the deployed Vercel frontend
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  // Add your Vercel frontend URL here once deployed, e.g.:
  // 'https://your-app-name.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Current authenticated user snapshot (used by UI to refresh counters)
app.get('/api/me', protect, async (req, res) => {
  res.json(req.user);
});

// ── ADMIN STATS ──────────────────────────────────────────────────────────────
app.get('/api/admin/stats', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalEmployees,
      activeEmployees,
      activeProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      attendanceToday,
      employeesOnLeave,
      assetsAssigned,
      maintenanceRequests,
      overworkRisks
    ] = await Promise.all([
      User.count({ where: { role: { [Op.ne]: 'admin' } } }),
      User.count({ where: { role: { [Op.ne]: 'admin' }, archived: false } }),
      Project.count({ where: { status: { [Op.ne]: 'completed' } } }),
      Task.count(),
      Task.count({ where: { status: 'done' } }),
      Task.count({ where: { status: { [Op.in]: ['todo', 'in-progress'] } } }),
      Attendance.count({ where: { date: { [Op.between]: [today, tomorrow] }, status: 'present' } }),
      Leave.count({ where: { status: 'approved', startDate: { [Op.lte]: today }, endDate: { [Op.gte]: today } } }),
      Asset.count({ where: { status: 'Assigned' } }),
      AssetMaintenanceRequest.count({ where: { status: 'pending' } }),
      // Overwork risk: employees with 3+ active/overdue tasks
      Task.count({ where: { status: { [Op.in]: ['todo', 'in-progress'] }, dueDate: { [Op.lt]: new Date() } } })
    ]);

    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      totalEmployees,
      activeEmployees,
      activeProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      attendanceToday,
      employeesOnLeave,
      assetsAssigned,
      maintenanceRequests,
      overworkRisks,
      taskCompletionRate
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── MANAGER STATS ─────────────────────────────────────────────────────────────
app.get('/api/manager/stats', protect, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const managerId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const teamMembers = await User.findAll({ where: { managerId, archived: false }, attributes: ['id'] });
    const teamMemberIds = teamMembers.map(u => u.id);

    const projects = await Project.findAll({ where: { managerId }, attributes: ['id'] });
    const projectIds = projects.map(p => p.id);

    const [
      activeProjects,
      pendingLeaves,
      openTasks,
      completedTasks,
      attendanceToday,
      wellnessData
    ] = await Promise.all([
      Project.count({ where: { managerId, status: { [Op.ne]: 'completed' } } }),
      teamMemberIds.length > 0
        ? Leave.count({ where: { employeeId: { [Op.in]: teamMemberIds }, status: 'pending' } })
        : 0,
      projectIds.length > 0
        ? Task.count({ where: { projectId: { [Op.in]: projectIds }, status: { [Op.ne]: 'done' } } })
        : 0,
      projectIds.length > 0
        ? Task.count({ where: { projectId: { [Op.in]: projectIds }, status: 'done' } })
        : 0,
      teamMemberIds.length > 0
        ? Attendance.count({ where: { userId: { [Op.in]: teamMemberIds }, date: { [Op.between]: [today, tomorrow] }, status: 'present' } })
        : 0,
      teamMemberIds.length > 0
        ? WellnessCheckin.findAll({
            where: { employeeId: { [Op.in]: teamMemberIds } },
            order: [['createdAt', 'DESC']],
            limit: Math.max(teamMemberIds.length * 3, 10)
          })
        : []
    ]);

    const avgWellnessScore = wellnessData.length > 0
      ? Math.round((wellnessData.reduce((sum, w) => sum + (10 - w.stressLevel + 1), 0) / wellnessData.length) * 10)
      : null;

    res.json({
      teamSize: teamMemberIds.length,
      activeProjects,
      pendingLeaves,
      openTasks,
      completedTasks,
      attendanceToday,
      wellnessScore: avgWellnessScore
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// USERS
app.get('/api/users', protect, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/users/:id', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// FR1.1/FR1.3: Archive/unarchive + update role/department with history log
app.patch('/api/users/:id', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const { role, department, archived, managerId } = req.body || {};
    const userToUpdate = await User.findByPk(req.params.id);
    if (!userToUpdate) return res.status(404).json({ message: 'User not found' });

    const oldRole = userToUpdate.role;
    const oldDepartment = userToUpdate.department;
    const oldArchived = userToUpdate.archived;
    const oldManagerId = userToUpdate.managerId;

    const nextRole = role ?? userToUpdate.role;
    const nextDept = department ?? userToUpdate.department;
    const nextArchived = archived ?? userToUpdate.archived;
    const nextManagerId = managerId ?? userToUpdate.managerId;

    userToUpdate.role = nextRole;
    userToUpdate.department = nextDept;
    userToUpdate.managerId = nextManagerId;
    userToUpdate.archived = Boolean(nextArchived);
    userToUpdate.archivedAt = userToUpdate.archived ? new Date() : null;

    await userToUpdate.save();

    const roleChanged = nextRole !== oldRole;
    const deptChanged = nextDept !== oldDepartment;
    const archivedChanged = Boolean(nextArchived) !== Boolean(oldArchived);

    if (roleChanged || deptChanged) {
      await EmployeeRoleHistory.create({
        userId: userToUpdate.id,
        changedBy: req.user.id,
        oldRole,
        newRole: nextRole,
        oldDepartment,
        newDepartment: nextDept,
        changeType: 'role_or_department_change'
      });
    }

    // FR2.2: offboarding notification to IT
    if (archivedChanged && userToUpdate.archived) {
      const itAdmin =
        (await User.findOne({ where: { role: 'admin', department: 'IT' } })) ||
        (await User.findOne({ where: { role: 'admin' } }));

      if (itAdmin) {
        await Notification.create({
          userId: itAdmin.id,
          message: `Employee offboarding: ${userToUpdate.name}.`,
          read: false
        });
      }
    }

    res.json(userToUpdate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PROJECTS
app.get('/api/projects', protect, async (req, res) => {
  try {
    const include = [
      { model: User, as: 'Manager', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'TeamMembers', attributes: ['id', 'name', 'role'], through: { attributes: ['role'] } }
    ];

    let projects;
    if (req.user.role === 'admin') {
      projects = await Project.findAll({ include });
    } else if (req.user.role === 'manager') {
      projects = await Project.findAll({ where: { managerId: req.user.id }, include });
    } else {
      // Employee: only return projects where they are present in ProjectMembers.
      // (Using explicit ProjectMember join is more reliable than `$TeamMembers.id$` filtering.)
      const memberships = await ProjectMember.findAll({
        where: { UserId: req.user.id },
        attributes: ['ProjectId'],
        raw: true
      });

      const projectIds = memberships.map((m) => m.ProjectId);
      if (projectIds.length === 0) return res.json([]);

      projects = await Project.findAll({
        where: { id: { [Op.in]: projectIds } },
        include
      });
    }
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/projects', protect, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const { teamMembers, ...projectData } = req.body;

    const project = await Project.create({
      ...projectData,
      managerId: projectData.managerId || req.user.id
    });

    if (teamMembers?.length) {
      for (const member of teamMembers) {
        await ProjectMember.create({
          ProjectId: project.id,
          UserId: member.user,
          role: member.role
        });
      }
    }

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/projects/:id/members', protect, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const member = await ProjectMember.create({
      ProjectId: req.params.id,
      UserId: req.body.userId,
      role: req.body.role || 'member'
    });
    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Team management alias (spec-friendly)
// POST /api/projects/:projectId/add-employee
app.post('/api/projects/:projectId/add-employee', protect, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const member = await ProjectMember.create({
      ProjectId: req.params.projectId,
      UserId: userId,
      role: role || 'member'
    });

    res.status(201).json(member);
  } catch (err) {
    // Common case: (ProjectId, UserId) already exists.
    if (String(err?.name).toLowerCase().includes('unique') || String(err?.message).toLowerCase().includes('duplicate')) {
      return res.status(400).json({ message: 'Member already exists in this project' });
    }
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/projects/:id/employees', protect, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [{ model: User, as: 'TeamMembers', attributes: ['id', 'name', 'role'], through: { attributes: ['role'] } }]
    });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project.TeamMembers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// TASKS
app.post('/api/tasks', protect, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const assignedToId = req.body.assignedTo ?? req.body.assignedToId;
    const due = req.body.dueDate ? new Date(req.body.dueDate) : null;

    // FR5.2: prevent over-scheduling into approved leave window
    if (assignedToId && due && !Number.isNaN(due.getTime())) {
      const overlappingApprovedLeave = await Leave.findOne({
        where: {
          employeeId: assignedToId,
          status: 'approved',
          startDate: { [Op.lte]: due },
          endDate: { [Op.gte]: due }
        }
      });
      if (overlappingApprovedLeave) {
        return res.status(400).json({ message: 'Employee is on approved leave during the due date' });
      }
    }

    const task = await Task.create({
      ...req.body,
      assignedTo: assignedToId,
      projectId: req.body.projectId
    });

    // FR6.2: optionally update project progress based on current tasks.
    // (Task status just created; progress will reflect on subsequent status changes as well.)
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/tasks/project/:projectId', protect, async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { projectId: req.params.projectId },
      include: [{ model: User, as: 'AssignedTo', attributes: ['name'] }]
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/tasks/my', protect, async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { assignedTo: req.user.id },
      include: [{ model: Project, attributes: ['name'] }]
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/tasks/:id', protect, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (!req.body?.status) return res.status(400).json({ message: 'status is required' });

    const nextStatus = req.body.status;
    await task.update({ status: nextStatus });

    // FR6.2: update Project.progress based on task completion
    if (task.projectId) {
      const total = await Task.count({ where: { projectId: task.projectId } });
      const doneCount = await Task.count({ where: { projectId: task.projectId, status: 'done' } });
      const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;
      await Project.update({ progress }, { where: { id: task.projectId } });
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Tasks alias (spec-friendly)
// PATCH /api/tasks/:id  (update task status)
app.patch('/api/tasks/:id', protect, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (!req.body?.status) return res.status(400).json({ message: 'status is required' });

    const nextStatus = req.body.status;
    await task.update({ status: nextStatus });

    if (task.projectId) {
      const total = await Task.count({ where: { projectId: task.projectId } });
      const doneCount = await Task.count({ where: { projectId: task.projectId, status: 'done' } });
      const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;
      await Project.update({ progress }, { where: { id: task.projectId } });
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ATTENDANCE
// Late cutoff is configurable via environment variables:
//   LATE_CUTOFF_HOUR   (default: 9)   — 24-hour format
//   LATE_CUTOFF_MINUTE (default: 15)  — e.g. 9:15 AM → late
app.post('/api/attendance/checkin', protect, async (req, res) => {
  try {
    const now       = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const existing = await Attendance.findOne({
      where: {
        userId: req.user.id,
        date: { [Op.between]: [todayStart, todayEnd] }
      }
    });

    if (existing) return res.status(400).json({ message: 'Already checked in today' });

    // ── Auto-detect status from server clock ──────────────────────────────
    const cutoffHour   = parseInt(process.env.LATE_CUTOFF_HOUR   ?? '9',  10);
    const cutoffMinute = parseInt(process.env.LATE_CUTOFF_MINUTE ?? '15', 10);
    const currentHour   = now.getHours();
    const currentMinute = now.getMinutes();

    const isPastCutoff =
      currentHour > cutoffHour ||
      (currentHour === cutoffHour && currentMinute >= cutoffMinute);

    const status = isPastCutoff ? 'late' : 'present';
    // ─────────────────────────────────────────────────────────────────────

    const attendance = await Attendance.create({
      userId: req.user.id,
      status,
      date:   now
    });

    res.status(201).json({
      ...attendance.toJSON(),
      autoStatus: status,
      checkedInAt: now.toISOString(),
      cutoff: `${String(cutoffHour).padStart(2,'0')}:${String(cutoffMinute).padStart(2,'0')}`
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/attendance/my (used by employee attendance page)
app.get('/api/attendance/my', protect, async (req, res) => {
  try {
    const records = await Attendance.findAll({
      where: { userId: req.user.id },
      order: [['date', 'DESC']]
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/attendance/:id (monthly log dialog)
app.get('/api/admin/attendance/:id', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const records = await Attendance.findAll({
      where: { userId: id },
      order: [['date', 'DESC']],
      limit: 60
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/attendance', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: { [Op.ne]: 'admin' } },
      attributes: ['id', 'name', 'role', 'department']
    });

    const attendance = await Attendance.findAll();

    const report = users.map((user) => {
      const record = attendance.find((a) => a.userId === user.id);
      return {
        ...user.toJSON(),
        status: record ? record.status : 'absent'
      };
    });

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LEAVES
app.post('/api/leave', protect, async (req, res) => {
  try {
    const { startDate, endDate, reason, managerId } = req.body || {};
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'startDate, endDate, and reason are required' });
    }

    const leave = await Leave.create({
      employeeId: req.user.id,
      managerId: managerId ?? req.user.managerId ?? null,
      startDate,
      endDate,
      reason,
      status: 'pending'
    });

    // FR5.1 prototype: approval step depends on role
    // - Employee leave: approved by their respective manager
    // - Manager leave: approved by HR/admin
    // - Admin leave: approved by himself (HR/admin step)
    const requesterRole = req.user.role;
    const approvalsToCreate =
      requesterRole === 'employee'
        ? [{ level: 'manager', status: 'pending' }]
        : [{ level: 'hr', status: 'pending' }];

    await LeaveApproval.bulkCreate(approvalsToCreate.map((a) => ({ ...a, leaveId: leave.id })));

    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/leave/my', protect, async (req, res) => {
  try {
    const level =
      req.user.role === 'admin' ? 'hr' : req.user.role === 'manager' ? 'manager' : null;

    const include = [
      { model: User, as: 'Employee', attributes: ['id', 'name', 'email'] }
    ];
    if (level) {
      include.push({
        model: LeaveApproval,
        required: false,
        where: { level, status: 'pending' }
      });
    }

    const leaves = await Leave.findAll({
      where: { employeeId: req.user.id },
      include,
      order: [['createdAt', 'DESC']]
    });

    // Standard response shape for UI:
    // { ..., user: { name, email }, ... }
    const payload = leaves.map((l) => {
      const json = l.toJSON();
      json.user = { name: json.Employee?.name, email: json.Employee?.email };
      delete json.Employee;
      return json;
    });

    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/leave/pending', protect, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const level = req.user.role === 'admin' ? 'hr' : 'manager';

    let employeeIds = null;
    if (req.user.role === 'manager') {
      const employees = await User.findAll({
        where: { managerId: req.user.id, archived: false },
        attributes: ['id']
      });
      employeeIds = employees.map((e) => e.id);
      if (employeeIds.length === 0) return res.json([]);
    }

    const whereClause = {
      status: 'pending',
      ...(req.user.role === 'manager' ? { employeeId: { [Op.in]: employeeIds } } : {})
    };

    const leaves = await Leave.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'Employee', attributes: ['id', 'name', 'email'], required: true },
        {
          model: LeaveApproval,
          required: true,
          where: { level, status: 'pending' }
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const payload = leaves.map((l) => {
      const json = l.toJSON();
      json.user = { name: json.Employee?.name, email: json.Employee?.email };
      delete json.Employee;
      return json;
    });

    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/leave/:id', protect, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const leave = await Leave.findByPk(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });

    if (!req.body?.status) return res.status(400).json({ message: 'status is required' });

    const desiredStatus = req.body.status;
    const rejectionComment = req.body.rejectionComment || null;
    const now = new Date();

    const isManager = req.user.role === 'manager';
    const level = isManager ? 'manager' : 'hr';

    if (isManager) {
      // Authorize using the employee's current managerId (Leave.managerId may be stale/null).
      const employee = await User.findByPk(leave.employeeId, {
        attributes: ['id', 'managerId']
      });
      if (!employee || String(employee.managerId) !== String(req.user.id)) {
        return res.status(403).json({ message: 'Not allowed to approve this leave request' });
      }
    }

    let approval = await LeaveApproval.findOne({ where: { leaveId: leave.id, level } });
    if (!approval) {
      approval = await LeaveApproval.create({ leaveId: leave.id, level, status: 'pending' });
    }

    if (!['approved', 'rejected'].includes(desiredStatus)) {
      return res.status(400).json({ message: 'status must be approved or rejected' });
    }

    // Deduct leave balance only when the leave transitions to fully approved.
    // We simulate the "next" leave status based on all LeaveApprovals for this leave.
    const previousLeaveStatus = leave.status;
    let daysToDeduct = null;
    if (desiredStatus === 'approved' && previousLeaveStatus !== 'approved') {
      const approvalsBefore = await LeaveApproval.findAll({ where: { leaveId: leave.id } });

      // Simulate updating the current approval level to `desiredStatus`.
      const simulatedApprovals = approvalsBefore.map((a) => ({
        level: a.level,
        status: a.status
      }));

      const idx = simulatedApprovals.findIndex((a) => a.level === level);
      if (idx >= 0) simulatedApprovals[idx].status = desiredStatus;
      else simulatedApprovals.push({ level, status: desiredStatus });

      const anyRejectedAfter = simulatedApprovals.some((a) => a.status === 'rejected');
      const allApprovedAfter = simulatedApprovals.length > 0 && simulatedApprovals.every((a) => a.status === 'approved');
      const nextLeaveStatus = anyRejectedAfter ? 'rejected' : allApprovedAfter ? 'approved' : 'pending';

      if (nextLeaveStatus === 'approved') {
        const days = calcInclusiveLeaveDays(leave.startDate, leave.endDate);
        if (!days || days < 1) return res.status(400).json({ message: 'Invalid leave dates' });

        const employee = await User.findByPk(leave.employeeId, {
          attributes: ['id', 'totalLeaves', 'usedLeaves']
        });
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const totalLeaves = Number(employee.totalLeaves ?? 24);
        const usedLeaves = Number(employee.usedLeaves ?? 0);
        const remainingLeaves = totalLeaves - usedLeaves;

        if (remainingLeaves < days) {
          return res.status(400).json({ message: 'Not enough remaining leaves for this approval' });
        }

        daysToDeduct = days;
      }
    }

    approval.status = desiredStatus;
    approval.decidedBy = req.user.id;
    approval.decidedAt = now;
    approval.comment = rejectionComment;
    await approval.save();

    // Keep a single source of truth from LeaveApprovals.
    // Supports both the new 1-step-per-role model and older rows that may have both levels.
    const approvals = await LeaveApproval.findAll({ where: { leaveId: leave.id } });
    if (approvals.some((a) => a.status === 'rejected')) {
      leave.status = 'rejected';
      if (rejectionComment) {
        leave.reason = `${leave.reason || ''} [Rejected: ${rejectionComment}]`.trim();
      }
    } else if (approvals.length > 0 && approvals.every((a) => a.status === 'approved')) {
      leave.status = 'approved';
    } else {
      leave.status = 'pending';
    }

    await leave.save();

    if (daysToDeduct !== null && leave.status === 'approved') {
      const employee = await User.findByPk(leave.employeeId, {
        attributes: ['id', 'totalLeaves', 'usedLeaves']
      });
      if (employee) {
        const usedLeaves = Number(employee.usedLeaves ?? 0);
        employee.usedLeaves = usedLeaves + daysToDeduct;
        await employee.save();
      }
    }

    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Leaves aliases (spec-friendly)
// POST /api/leaves
app.post('/api/leaves', protect, async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body || {};
    const managerId = req.body?.managerId ?? req.user.managerId ?? null;

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'startDate, endDate, and reason are required' });
    }

    const leave = await Leave.create({
      startDate,
      endDate,
      reason,
      employeeId: req.user.id,
      managerId,
      status: 'pending'
    });

    const requesterRole = req.user.role;
    const approvalsToCreate =
      requesterRole === 'employee'
        ? [{ level: 'manager', status: 'pending' }]
        : [{ level: 'hr', status: 'pending' }];

    await LeaveApproval.bulkCreate(approvalsToCreate.map((a) => ({ ...a, leaveId: leave.id })));

    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/leaves
app.get('/api/leaves', protect, async (req, res) => {
  try {
    let employeeIds = null;
    if (req.user.role === 'manager') {
      const employees = await User.findAll({
        where: { managerId: req.user.id, archived: false },
        attributes: ['id']
      });
      employeeIds = employees.map((e) => e.id);
      if (employeeIds.length === 0) return res.json([]);
    }

    const whereClause =
      req.user.role === 'admin'
        ? {}
        : req.user.role === 'manager'
          ? { employeeId: { [Op.in]: employeeIds } }
          : { employeeId: req.user.id };

    const leaves = await Leave.findAll({
      where: whereClause,
      include: [{ model: User, as: 'Employee', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']]
    });

    const payload = leaves.map((l) => {
      const json = l.toJSON();
      json.user = { name: json.Employee?.name, email: json.Employee?.email };
      delete json.Employee;
      return json;
    });

    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/leaves/:id
app.patch('/api/leaves/:id', protect, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const leave = await Leave.findByPk(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });

    if (!req.body?.status) return res.status(400).json({ message: 'status is required' });

    const desiredStatus = req.body.status;
    const rejectionComment = req.body.rejectionComment || null;
    const now = new Date();

    const isManager = req.user.role === 'manager';
    const level = isManager ? 'manager' : 'hr';

    if (isManager) {
      // Authorize using the employee's current managerId (Leave.managerId may be stale/null).
      const employee = await User.findByPk(leave.employeeId, {
        attributes: ['id', 'managerId']
      });
      if (!employee || String(employee.managerId) !== String(req.user.id)) {
        return res.status(403).json({ message: 'Not allowed to approve this leave request' });
      }
    }

    let approval = await LeaveApproval.findOne({ where: { leaveId: leave.id, level } });
    if (!approval) {
      approval = await LeaveApproval.create({ leaveId: leave.id, level, status: 'pending' });
    }

    if (!['approved', 'rejected'].includes(desiredStatus)) {
      return res.status(400).json({ message: 'status must be approved or rejected' });
    }

    // Deduct leave balance only when the leave transitions to fully approved.
    const previousLeaveStatus = leave.status;
    let daysToDeduct = null;
    if (desiredStatus === 'approved' && previousLeaveStatus !== 'approved') {
      const approvalsBefore = await LeaveApproval.findAll({ where: { leaveId: leave.id } });

      const simulatedApprovals = approvalsBefore.map((a) => ({
        level: a.level,
        status: a.status
      }));

      const idx = simulatedApprovals.findIndex((a) => a.level === level);
      if (idx >= 0) simulatedApprovals[idx].status = desiredStatus;
      else simulatedApprovals.push({ level, status: desiredStatus });

      const anyRejectedAfter = simulatedApprovals.some((a) => a.status === 'rejected');
      const allApprovedAfter =
        simulatedApprovals.length > 0 && simulatedApprovals.every((a) => a.status === 'approved');
      const nextLeaveStatus = anyRejectedAfter ? 'rejected' : allApprovedAfter ? 'approved' : 'pending';

      if (nextLeaveStatus === 'approved') {
        const days = calcInclusiveLeaveDays(leave.startDate, leave.endDate);
        if (!days || days < 1) return res.status(400).json({ message: 'Invalid leave dates' });

        const employee = await User.findByPk(leave.employeeId, {
          attributes: ['id', 'totalLeaves', 'usedLeaves']
        });
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const totalLeaves = Number(employee.totalLeaves ?? 24);
        const usedLeaves = Number(employee.usedLeaves ?? 0);
        const remainingLeaves = totalLeaves - usedLeaves;

        if (remainingLeaves < days) {
          return res.status(400).json({ message: 'Not enough remaining leaves for this approval' });
        }

        daysToDeduct = days;
      }
    }

    approval.status = desiredStatus;
    approval.decidedBy = req.user.id;
    approval.decidedAt = now;
    approval.comment = rejectionComment;
    await approval.save();

    // Single source of truth from all approvals for this leave (supports both old/new data)
    const approvals = await LeaveApproval.findAll({ where: { leaveId: leave.id } });
    if (approvals.some((a) => a.status === 'rejected')) {
      leave.status = 'rejected';
      if (rejectionComment) {
        leave.reason = `${leave.reason || ''} [Rejected: ${rejectionComment}]`.trim();
      }
    } else if (approvals.length > 0 && approvals.every((a) => a.status === 'approved')) {
      leave.status = 'approved';
    } else {
      leave.status = 'pending';
    }
    await leave.save();

    if (daysToDeduct !== null && leave.status === 'approved') {
      const employee = await User.findByPk(leave.employeeId, {
        attributes: ['id', 'totalLeaves', 'usedLeaves']
      });
      if (employee) {
        const usedLeaves = Number(employee.usedLeaves ?? 0);
        employee.usedLeaves = usedLeaves + daysToDeduct;
        await employee.save();
      }
    }

    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --------
// FACILITY BOOKING HELPERS
// --------
function normalizeDateOnly(dateVal) {
  if (!dateVal) return null;
  if (typeof dateVal === 'string') {
    // Expected: YYYY-MM-DD (from `<input type="date">`)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal;
    const d = new Date(dateVal);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return null;
  }
  if (dateVal instanceof Date) return dateVal.toISOString().slice(0, 10);
  return null;
}

function parseHHMMToMinutes(t) {
  if (!t || typeof t !== 'string') return null;
  const m = /^(\d{2}):(\d{2})$/.exec(t);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function calcInclusiveLeaveDays(startDate, endDate) {
  // Inclusive: if start=end, days=1.
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;

  const sUTC = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
  const eUTC = Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate());
  const diffDays = Math.floor((eUTC - sUTC) / (24 * 60 * 60 * 1000));
  return diffDays + 1;
}

function rangesOverlap(startA, endA, startB, endB) {
  // Overlap check for [start, end) time ranges.
  return startA < endB && endA > startB;
}

async function assertNoFacilityDoubleBooking({ facilityName, dateOnly, fromTime, toTime }) {
  const fromMins = parseHHMMToMinutes(fromTime);
  const toMins = parseHHMMToMinutes(toTime);
  if (fromMins === null || toMins === null) {
    const err = new Error('fromTime and toTime must be in HH:MM format');
    err.statusCode = 400;
    throw err;
  }
  if (fromMins >= toMins) {
    const err = new Error('fromTime must be earlier than toTime');
    err.statusCode = 400;
    throw err;
  }

  const existing = await Facility.findAll({
    where: {
      facilityName,
      date: dateOnly,
      status: { [Op.in]: ['pending', 'approved'] }
    }
  });

  for (const b of existing) {
    const bFrom = parseHHMMToMinutes(b.fromTime);
    const bTo = parseHHMMToMinutes(b.toTime);
    if (bFrom === null || bTo === null) continue;

    if (rangesOverlap(fromMins, toMins, bFrom, bTo)) {
      const err = new Error('Already booked for this time slot');
      err.statusCode = 400;
      throw err;
    }
  }
}

// FACILITIES
app.post('/api/facilities', protect, authorizeRoles('employee', 'manager'), async (req, res) => {
  try {
    const {
      facilityId,
      facilityName,
      date,
      fromTime,
      toTime,
      from,
      to
    } = req.body || {};

    const resolvedDate = normalizeDateOnly(date);
    const resolvedFromTime = fromTime ?? from;
    const resolvedToTime = toTime ?? to;

    if (!facilityId || !facilityName || !resolvedDate || !resolvedFromTime || !resolvedToTime) {
      return res.status(400).json({ message: 'facilityId, facilityName, date, from, to are required' });
    }

    // Idempotency: if the exact same booking already exists for the user, return it.
    const existingExact = await Facility.findOne({
      where: {
        facilityId,
        facilityName,
        date: resolvedDate,
        fromTime: resolvedFromTime,
        toTime: resolvedToTime,
        employeeId: req.user.id
      }
    });
    if (existingExact) return res.status(200).json(existingExact);

    await assertNoFacilityDoubleBooking({
      facilityName,
      dateOnly: resolvedDate,
      fromTime: resolvedFromTime,
      toTime: resolvedToTime
    });

    const facility = await Facility.create({
      facilityId,
      facilityName,
      date: resolvedDate,
      fromTime: resolvedFromTime,
      toTime: resolvedToTime,
      employeeId: req.user.id,
      requestedBy: req.user.name,
      status: 'pending'
    });

    res.status(201).json(facility);
  } catch (err) {
    const statusCode = err?.statusCode || 500;
    res.status(statusCode).json({ message: err.message });
  }
});

app.get('/api/facilities', protect, async (req, res) => {
  try {
    const facilities = await Facility.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(facilities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/facilities/:id', protect, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id);
    if (!facility) return res.status(404).json({ message: 'Facility booking not found' });

    if (!req.body?.status) return res.status(400).json({ message: 'status is required' });
    facility.status = req.body.status;
    await facility.save();
    res.json(facility);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Facilities aliases (spec-friendly)
// POST /api/facilities/book
app.post('/api/facilities/book', protect, authorizeRoles('employee', 'manager'), async (req, res) => {
  try {
    const {
      facilityId,
      facilityName,
      date,
      fromTime,
      toTime,
      from,
      to
    } = req.body || {};

    const resolvedFromTime = fromTime ?? from;
    const resolvedToTime = toTime ?? to;

    const resolvedDate = normalizeDateOnly(date);
    if (!facilityId || !facilityName || !resolvedDate || !resolvedFromTime || !resolvedToTime) {
      return res.status(400).json({ message: 'facilityId, facilityName, date, from, and to are required' });
    }

    const existingExact = await Facility.findOne({
      where: {
        facilityId,
        facilityName,
        date: resolvedDate,
        fromTime: resolvedFromTime,
        toTime: resolvedToTime,
        employeeId: req.user.id
      }
    });
    if (existingExact) return res.status(200).json(existingExact);

    await assertNoFacilityDoubleBooking({
      facilityName,
      dateOnly: resolvedDate,
      fromTime: resolvedFromTime,
      toTime: resolvedToTime
    });

    const facility = await Facility.create({
      facilityId,
      facilityName,
      date: resolvedDate,
      fromTime: resolvedFromTime,
      toTime: resolvedToTime,
      requestedBy: req.user.name,
      employeeId: req.user.id,
      status: 'pending'
    });

    res.status(201).json(facility);
  } catch (err) {
    const statusCode = err?.statusCode || 500;
    res.status(statusCode).json({ message: err.message });
  }
});

// PATCH /api/facilities/:id
app.patch('/api/facilities/:id', protect, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id);
    if (!facility) return res.status(404).json({ message: 'Facility booking not found' });

    if (!req.body?.status) return res.status(400).json({ message: 'status is required' });

    facility.status = req.body.status;
    await facility.save();
    res.json(facility);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// FEEDBACK
app.post('/api/feedback', protect, async (req, res) => {
  try {
    const { type, message, anonymous } = req.body || {};
    if (!type || !message) return res.status(400).json({ message: 'type and message are required' });

    const isAnonymous = anonymous === true;

    const feedback = await Feedback.create({
      type,
      message,
      createdBy: isAnonymous ? null : req.user.id,
      anonymous: isAnonymous,
      department: req.user.department
    });

    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/feedback
app.get('/api/feedback', protect, async (req, res) => {
  try {
    const whereClause = req.user.role === 'employee' ? { createdBy: req.user.id } : {};

    const feedbacks = await Feedback.findAll({
      where: whereClause,
      include: [{ model: User, as: 'CreatedBy', attributes: ['id', 'name', 'role', 'department'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/feedback (frontend-admin page)
app.get('/api/admin/feedback', protect, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const feedbacks = await Feedback.findAll({
      include: [{ model: User, as: 'CreatedBy', attributes: ['id', 'name', 'role', 'department'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Notifications
app.get('/api/notifications', protect, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.patch('/api/notifications/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification || String(notification.userId) !== String(req.user.id)) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------
// FR2/FR3/FR4: Assets, Occupancy, Wellness, Workload
// -------------------------

// -------------------------
// Manager dashboard additions: wellness + team announcements
// -------------------------
app.get('/api/manager/attendance/my', protect, authorizeRoles('manager'), async (req, res) => {
  try {
    const records = await Attendance.findAll({
      where: { userId: req.user.id },
      order: [['date', 'DESC']]
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/manager/wellness', protect, authorizeRoles('manager'), async (req, res) => {
  try {
    const employees = await User.findAll({
      where: { managerId: req.user.id, archived: false },
      attributes: ['id', 'name', 'department']
    });
    const employeeIds = employees.map((e) => e.id);

    const checkins = await WellnessCheckin.findAll({
      where: { employeeId: { [Op.in]: employeeIds } },
      order: [['checkInDate', 'DESC']],
      limit: 200,
      include: [{ model: User, as: 'WellnessEmployee', attributes: ['id', 'name', 'department'] }]
    });

    res.json({ employees, checkins });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/manager/announcements', protect, authorizeRoles('manager'), async (req, res) => {
  try {
    const announcements = await TeamAnnouncement.findAll({
      where: { managerId: req.user.id, isArchived: false },
      order: [['createdAt', 'DESC']]
    });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/manager/announcements', protect, authorizeRoles('manager'), async (req, res) => {
  try {
    const { title, message } = req.body || {};
    if (!title || !message) return res.status(400).json({ message: 'title and message are required' });

    const announcement = await TeamAnnouncement.create({
      managerId: req.user.id,
      title,
      message,
      isArchived: false
    });

    // Notify employees under this manager
    const employees = await User.findAll({
      where: { managerId: req.user.id, archived: false },
      attributes: ['id']
    });
    for (const e of employees) {
      await Notification.create({
        userId: e.id,
        message: `New team announcement: ${title}`,
        read: false
      });
    }

    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------
// Seating arrangement system
// -------------------------
app.get('/api/seating', protect, async (req, res) => {
  try {
    const seats = await SeatingAssignment.findAll({
      order: [['cubicleId', 'ASC']],
      include: [{ model: User, as: 'SeatedUser', attributes: ['id', 'name', 'role', 'department'] }]
    });
    res.json(seats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.patch('/api/seating/:cubicleId', protect, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const { cubicleId } = req.params;
    const { userId } = req.body || {};

    // Create row if missing
    const [seat] = await SeatingAssignment.findOrCreate({
      where: { cubicleId },
      defaults: { cubicleId, userId: null }
    });

    // Prevent a user being assigned to multiple cubicles
    if (userId) {
      const existing = await SeatingAssignment.findOne({ where: { userId } });
      if (existing && existing.cubicleId !== cubicleId) {
        return res.status(400).json({ message: 'User is already assigned to another cubicle' });
      }
    }

    seat.userId = userId || null;
    await seat.save();

    const reloaded = await SeatingAssignment.findByPk(seat.id, {
      include: [{ model: User, as: 'SeatedUser', attributes: ['id', 'name', 'role', 'department'] }]
    });
    res.json(reloaded);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function mapAssetForApi(asset) {
  const data = asset?.toJSON ? asset.toJSON() : asset;
  return {
    ...data,
    assignedTo: data.assignedEmployeeId || null
  };
}

async function ensureDefaultLaptopAssetsForEmployees() {
  const employees = await User.findAll({ where: { role: 'employee', archived: false }, attributes: ['id'] });
  for (const e of employees) {
    const existingLaptop = await Asset.findOne({
      where: { assignedEmployeeId: e.id, assetType: 'Laptop' }
    });
    if (existingLaptop) continue;

    const asset = await Asset.create({
      assetType: 'Laptop',
      assignedEmployeeId: e.id,
      status: 'Assigned',
      assignedDate: new Date()
    });
    await AssetCustodyHistory.create({
      assetId: asset.id,
      employeeId: e.id,
      assignedAt: new Date(),
      releasedAt: null,
      reason: 'Backfill default laptop assignment'
    });
  }
}

// Assets: admin list
app.get('/api/assets', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const assets = await Asset.findAll({
      include: [{ model: User, as: 'AssignedEmployee', attributes: ['id', 'name', 'department', 'email'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(assets.map(mapAssetForApi));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assets: admin create
app.post('/api/assets', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const { assetType, assignedTo, status } = req.body || {};
    if (!assetType) return res.status(400).json({ message: 'assetType is required' });

    if (assignedTo && assetType === 'Laptop') {
      const existingLaptop = await Asset.findOne({
        where: { assignedEmployeeId: assignedTo, assetType: 'Laptop' }
      });
      if (existingLaptop) return res.status(400).json({ message: 'Laptop already assigned to this user' });
    }

    const asset = await Asset.create({
      assetType,
      assignedEmployeeId: assignedTo || null,
      status: status || (assignedTo ? 'Assigned' : 'Available'),
      assignedDate: assignedTo ? new Date() : null
    });

    if (assignedTo) {
      await AssetCustodyHistory.create({
        assetId: asset.id,
        employeeId: assignedTo,
        assignedAt: new Date(),
        releasedAt: null,
        reason: 'Assigned by admin'
      });
    }

    const withUser = await Asset.findByPk(asset.id, {
      include: [{ model: User, as: 'AssignedEmployee', attributes: ['id', 'name', 'department', 'email'] }]
    });
    res.status(201).json(mapAssetForApi(withUser));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assets: admin status/assignment update
app.patch('/api/assets/:id', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const asset = await Asset.findByPk(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    const { status, assignedTo, assetType } = req.body || {};
    const nextAssetType = assetType || asset.assetType;
    const nextAssigned = assignedTo !== undefined ? assignedTo : asset.assignedEmployeeId;

    if (nextAssigned && nextAssetType === 'Laptop') {
      const existingLaptop = await Asset.findOne({
        where: {
          assignedEmployeeId: nextAssigned,
          assetType: 'Laptop',
          id: { [Op.ne]: asset.id }
        }
      });
      if (existingLaptop) return res.status(400).json({ message: 'Laptop already assigned to this user' });
    }

    const assignmentChanged = String(nextAssigned || '') !== String(asset.assignedEmployeeId || '');
    const previousAssignee = asset.assignedEmployeeId;

    asset.assetType = nextAssetType;
    if (status) asset.status = status;
    if (assignedTo !== undefined) {
      asset.assignedEmployeeId = assignedTo || null;
      asset.assignedDate = assignedTo ? new Date() : null;
      if (!status) asset.status = assignedTo ? 'Assigned' : 'Available';
    }
    await asset.save();

    if (assignmentChanged && previousAssignee) {
      const activeOld = await AssetCustodyHistory.findOne({
        where: { assetId: asset.id, employeeId: previousAssignee, releasedAt: null },
        order: [['assignedAt', 'DESC']]
      });
      if (activeOld) {
        activeOld.releasedAt = new Date();
        activeOld.reason = 'Reassigned by admin';
        await activeOld.save();
      }
    }

    if (assignmentChanged && assignedTo) {
      await AssetCustodyHistory.create({
        assetId: asset.id,
        employeeId: assignedTo,
        assignedAt: new Date(),
        releasedAt: null,
        reason: 'Assigned by admin update'
      });
    }

    const withUser = await Asset.findByPk(asset.id, {
      include: [{ model: User, as: 'AssignedEmployee', attributes: ['id', 'name', 'department', 'email'] }]
    });
    res.json(mapAssetForApi(withUser));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assets: employee view
app.get('/api/assets/my', protect, async (req, res) => {
  try {
    const assets = await Asset.findAll({
      where: { assignedEmployeeId: req.user.id }
    });

    const out = [];
    for (const asset of assets) {
      const activeCustody = await AssetCustodyHistory.findOne({
        where: { assetId: asset.id, releasedAt: null },
        order: [['assignedAt', 'DESC']]
      });

      const custodyStart = activeCustody?.assignedAt || null;
      const custodyEnd = activeCustody?.releasedAt || new Date();
      const custodyDays =
        custodyStart && custodyEnd ? Math.max(0, (custodyEnd - new Date(custodyStart)) / (24 * 60 * 60 * 1000)) : 0;

      out.push({
        ...asset.toJSON(),
        custodyStart,
        custodyEnd,
        custodyDays: Math.round(custodyDays * 10) / 10
      });
    }

    res.json(out.map(mapAssetForApi));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assets: maintenance request (employee -> IT notification)
app.post('/api/assets/maintenance-request', protect, async (req, res) => {
  try {
    const { assetId, issueDescription } = req.body || {};

    if (!issueDescription || typeof issueDescription !== 'string' || !issueDescription.trim()) {
      return res.status(400).json({ message: 'issueDescription is required' });
    }

    let resolvedAssetId = assetId || null;
    if (!resolvedAssetId) {
      const asset = await Asset.findOne({
        where: { assignedEmployeeId: req.user.id },
        order: [['assetType', 'ASC'], ['createdAt', 'DESC']]
      });
      if (!asset) return res.status(400).json({ message: 'No asset assigned to this employee' });
      resolvedAssetId = asset.id;
    }

    const asset = await Asset.findByPk(resolvedAssetId);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    // Users can only request maintenance for assets assigned to them.
    if (String(asset.assignedEmployeeId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You can only request maintenance for your assigned asset' });
    }

    const request = await AssetMaintenanceRequest.create({
      assetId: resolvedAssetId,
      issueDescription: issueDescription.trim(),
      status: 'pending',
      requestedBy: req.user.id,
      resolvedBy: null,
      resolvedAt: null
    });

    // Notify IT admins (if present)
    const itAdmin =
      (await User.findOne({ where: { role: 'admin', department: 'IT' } })) ||
      (await User.findOne({ where: { role: 'admin' } }));

    if (itAdmin) {
      const message = `Asset maintenance requested for ${asset.assetType}.`;
      await Notification.create({
        userId: itAdmin.id,
        message,
        read: false
      });
    }

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: view maintenance requests
app.get('/api/admin/asset-maintenance-requests', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const requests = await AssetMaintenanceRequest.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        { model: Asset, attributes: ['assetType', 'condition'] },
        { model: User, as: 'MaintenanceRequester', attributes: ['id', 'name', 'department'] }
      ]
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: resolve maintenance request
app.patch('/api/admin/asset-maintenance-requests/:id', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const { status, resolvedBy } = req.body || {};
    if (!status) return res.status(400).json({ message: 'status is required' });

    const request = await AssetMaintenanceRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: 'Maintenance request not found' });

    request.status = status;
    request.resolvedBy = resolvedBy || req.user.id;
    request.resolvedAt = new Date();
    await request.save();

    // If resolved, update asset condition (prototype behavior)
    if (String(status).toLowerCase() === 'approved' || String(status).toLowerCase() === 'completed') {
      await Asset.update({ condition: 'good' }, { where: { id: request.assetId } });
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: asset accountability report
app.get('/api/admin/assets/accountability', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const assets = await Asset.findAll({
      include: [{ model: User, as: 'AssignedEmployee', attributes: ['id', 'name', 'department'] }]
    });

    const out = [];
    for (const asset of assets) {
      const activeCustody = await AssetCustodyHistory.findOne({
        where: { assetId: asset.id },
        order: [['assignedAt', 'DESC']]
      });

      const custodyStart = activeCustody?.assignedAt || null;
      const custodyEnd = activeCustody?.releasedAt || new Date();
      const custodyDays =
        custodyStart && custodyEnd ? Math.max(0, (custodyEnd - new Date(custodyStart)) / (24 * 60 * 60 * 1000)) : 0;

      out.push({
        ...asset.toJSON(),
        custodyStart,
        custodyEnd,
        custodyDays: Math.round(custodyDays * 10) / 10
      });
    }

    res.json(out);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Occupancy summary (real-time-ish)
app.get('/api/occupancy/today', protect, async (req, res) => {
  try {
    const dateOnly = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const zones = await FacilityZone.findAll({ order: [['createdAt', 'DESC']] });
    const inventory = await FacilityInventory.findAll();
    const facilityToZone = new Map(inventory.map((inv) => [inv.facilityId, inv.zoneId]));
    const zoneById = new Map(zones.map((z) => [z.id, z]));

    const bookings = await Facility.findAll({
      where: {
        date: dateOnly,
        facilityId: Array.from(new Set(inventory.map((i) => i.facilityId))),
        status: { [Op.in]: ['pending', 'approved'] }
      }
    });

    const occupancyByZone = new Map();
    for (const z of zones) {
      occupancyByZone.set(z.id, { zone: z, occupancyCount: 0 });
    }

    for (const b of bookings) {
      const zoneId = facilityToZone.get(b.facilityId);
      if (!zoneId) continue;

      const fromMins = parseHHMMToMinutes(b.fromTime);
      const toMins = parseHHMMToMinutes(b.toTime);
      if (fromMins === null || toMins === null) continue;

      // current time overlap: [from, to)
      const overlapsNow = nowMinutes >= fromMins && nowMinutes < toMins;
      if (!overlapsNow) continue;

      const bucket = occupancyByZone.get(zoneId);
      if (bucket) bucket.occupancyCount += 1;
    }

    // Alert managers if threshold exceeded
    const managers = await User.findAll({ where: { role: 'manager' } });
    const alerts = [];
    const start = new Date(`${dateOnly}T00:00:00.000Z`);
    const end = new Date(`${dateOnly}T23:59:59.999Z`);

    for (const [zoneId, bucket] of occupancyByZone.entries()) {
      const { zone, occupancyCount } = bucket;
      const percent = zone.capacityLimit > 0 ? (occupancyCount / zone.capacityLimit) * 100 : 0;
      const roundedPct = Math.round(percent * 10) / 10;

      alerts.push({
        zoneId,
        zoneName: zone.zoneName,
        capacityLimit: zone.capacityLimit,
        safetyThresholdPct: zone.safetyThresholdPct,
        occupancyCount,
        occupancyPct: roundedPct
      });

      if (percent >= zone.safetyThresholdPct) {
        const message = `Occupancy threshold exceeded in ${zone.zoneName} (${roundedPct}% capacity) on ${dateOnly}.`;
        for (const m of managers) {
          const already = await Notification.findOne({
            where: {
              userId: m.id,
              message,
              createdAt: { [Op.between]: [start, end] }
            }
          });
          if (!already) {
            await Notification.create({ userId: m.id, message, read: false });
          }
        }
      }
    }

    res.json({ date: dateOnly, zones: alerts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Wellness check-ins
app.get('/api/wellness/my', protect, async (req, res) => {
  try {
    const checkins = await WellnessCheckin.findAll({
      where: { employeeId: req.user.id },
      order: [['checkInDate', 'DESC']]
    });
    res.json(checkins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/wellness/checkin', protect, async (req, res) => {
  try {
    const { checkInDate, stressLevel, mood, notes } = req.body || {};

    const level = Number(stressLevel);
    if (!Number.isFinite(level) || level < 1 || level > 10) {
      return res.status(400).json({ message: 'stressLevel must be a number between 1 and 10' });
    }

    const resolvedDate = checkInDate ? checkInDate : new Date().toISOString().slice(0, 10);

    const record = await WellnessCheckin.create({
      employeeId: req.user.id,
      checkInDate: resolvedDate,
      stressLevel: level,
      mood: mood || null,
      notes: notes || null
    });

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Workload score (prototype)
app.get('/api/workload/my', protect, async (req, res) => {
  try {
    const now = new Date();
    const tasks = await Task.findAll({ where: { assignedTo: req.user.id } });

    const active = tasks.filter((t) => t.status !== 'done');
    const overdue = active.filter((t) => t.dueDate && new Date(t.dueDate) < now);

    const score = active.length * 10 + overdue.length * 25;

    res.json({
      activeTasks: active.length,
      overdueTasks: overdue.length,
      workloadScore: score
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// HR/Admin: Overwork risk list
app.get('/api/admin/workload/risks', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const now = new Date();
    const users = await User.findAll({ where: { role: { [Op.in]: ['employee', 'manager'] }, archived: false } });

    const OVERDUE_THRESHOLD = Number(process.env.OVERWORK_OVERDUE_THRESHOLD || 2);
    const SCORE_THRESHOLD = Number(process.env.OVERWORK_SCORE_THRESHOLD || 120);

    const risks = [];

    for (const u of users) {
      const tasks = await Task.findAll({ where: { assignedTo: u.id } });
      const active = tasks.filter((t) => t.status !== 'done');
      const overdue = active.filter((t) => t.dueDate && new Date(t.dueDate) < now);
      const score = active.length * 10 + overdue.length * 25;

      const isRisk = overdue.length >= OVERDUE_THRESHOLD || score >= SCORE_THRESHOLD;
      if (!isRisk) continue;

      risks.push({
        userId: u.id,
        name: u.name,
        activeTasks: active.length,
        overdueTasks: overdue.length,
        workloadScore: score
      });

      // Create one notification per user per day for prototype
      const dateOnly = new Date().toISOString().slice(0, 10);
      const message = `Overwork risk detected for ${u.name}. Score=${score}, Overdue=${overdue.length} (${dateOnly}).`;

      const already = await Notification.findOne({
        where: {
          userId: u.id,
          message
        }
      });

      if (!already) {
        // Notify admin/HR (all admins) to review
        const admins = await User.findAll({ where: { role: 'admin' } });
        for (const a of admins) {
          await Notification.create({ userId: a.id, message, read: false });
        }
      }
    }

    res.json({ risks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ERROR HANDLER
app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

// Port: use environment variable (required by Render, Railway, etc.) or fall back to 5001 for local dev
const PORT = process.env.PORT || 5001;

// DB + SERVER START
async function startServer() {
  try {
    console.log('[DB] connection info (resolved):', dbConnectionInfo);
    await sequelize.authenticate();
    console.log('[DB] connected successfully');

    // Create required tables if missing.
    // `DB_SYNC=false` disables schema alteration; default is to allow `alter:true`
    // to ensure Supabase tables/columns stay aligned with the Sequelize models.
    const shouldAlter = process.env.DB_SYNC !== 'false';
    await sequelize.sync({ alter: shouldAlter });

    await ensureDefaultLaptopAssetsForEmployees();
    await seedDefaultData();

    console.log('PostgreSQL database connected and synced');
    console.log('[DB]', dbConnectionInfo);

    app.get('/', (req, res) => {
      res.send('API is running 🚀');
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[DB] connection/sync error:', err?.message || err);
    process.exit(1);
  }
}

startServer();