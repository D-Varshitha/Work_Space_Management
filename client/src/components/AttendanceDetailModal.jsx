import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import {
  CheckCircle, Clock, XCircle, TrendingUp,
  Flame, AlarmClock, BarChart2, CalendarDays
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────────────────────────────────────
const DAY_NAMES   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const statusDotClass = (status) => {
  if (status === 'present') return 'bg-green-500';
  if (status === 'late')    return 'bg-amber-400';
  if (status === 'absent')  return 'bg-red-500';
  return 'bg-gray-300 dark:bg-gray-600';
};

const statusBadgeClass = (status) => {
  if (status === 'present') return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
  if (status === 'late')    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
  if (status === 'absent')  return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
  return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
};

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 — Summary card
// ─────────────────────────────────────────────────────────────────────────────
const SummaryCard = ({ icon: Icon, label, value, iconBg, cardBg }) => (
  <div className={`${cardBg} rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all duration-200 group cursor-default`}>
    <div className={`${iconBg} p-3 rounded-xl group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{value}</p>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Section 2 — Monthly Calendar Heatmap
// ─────────────────────────────────────────────────────────────────────────────
const AttendanceCalendar = ({ records, selectedDay, onSelectDay }) => {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();

  const recordMap = useMemo(() => {
    const m = {};
    records.forEach((r) => {
      const d   = new Date(r.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      m[key]    = r;
    });
    return m;
  }, [records]);

  const firstDay     = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const cells        = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
          {MONTH_NAMES[month]} {year}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold">
          {[
            ['bg-green-500', 'Present'],
            ['bg-amber-400', 'Late'],
            ['bg-red-500',   'Absent'],
            ['bg-gray-200 dark:bg-gray-600', 'No record'],
          ].map(([c, l]) => (
            <span key={l} className="flex items-center gap-1">
              <span className={`w-3 h-3 rounded-sm inline-block ${c}`} />
              <span className="text-gray-500 dark:text-gray-400">{l}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`blank-${idx}`} />;
          const key       = `${year}-${month}-${day}`;
          const rec       = recordMap[key];
          const isSelected = selectedDay === key;
          const isToday    = now.getDate() === day && now.getMonth() === month && now.getFullYear() === year;
          const isWeekend  = new Date(year, month, day).getDay() % 6 === 0;

          let cellClass = '';
          if (rec) {
            cellClass = `${statusDotClass(rec.status)} text-white shadow-sm`;
          } else if (isWeekend) {
            cellClass = 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500';
          } else {
            cellClass = 'bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400';
          }

          return (
            <button
              key={key}
              onClick={() => onSelectDay(isSelected ? null : key)}
              className={`
                relative aspect-square rounded-lg flex items-center justify-center
                text-[11px] font-bold transition-all duration-150
                ${cellClass}
                ${isSelected ? 'ring-2 ring-offset-1 ring-blue-500 scale-110 z-10 shadow-lg' : 'hover:scale-105 hover:shadow-md'}
                ${isToday && !isSelected ? 'outline outline-2 outline-white dark:outline-gray-800' : ''}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/** Detail panel for selected day */
const DayDetailPanel = ({ dayKey, records }) => {
  if (!dayKey) return null;
  const [yr, mo, d] = dayKey.split('-').map(Number);
  const rec = records.find((r) => {
    const rd = new Date(r.date);
    return rd.getFullYear() === yr && rd.getMonth() === mo && rd.getDate() === d;
  });
  const dateStr = new Date(yr, mo, d).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
      <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3">{dateStr}</p>
      {rec ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1">Status</p>
            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${statusBadgeClass(rec.status)}`}>
              {rec.status}
            </span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1">Date</p>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{fmtDate(rec.date)}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-blue-600 dark:text-blue-400 italic">
          No attendance record for this day.
        </p>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Section 3 — Trend chart
// ─────────────────────────────────────────────────────────────────────────────
const AttendanceTrendChart = ({ records }) => {
  const data = useMemo(() => {
    const sorted = [...records]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30);
    return sorted.map((r) => ({
      date:    new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      Present: r.status === 'present' ? 1 : 0,
      Late:    r.status === 'late'    ? 1 : 0,
      Absent:  r.status === 'absent'  ? 1 : 0,
    }));
  }, [records]);

  if (data.length === 0) {
    return (
      <p className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm italic">
        Not enough data for a trend chart.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={170}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -30, bottom: 0 }}>
        <defs>
          {[
            ['gP', '#22c55e'],
            ['gL', '#f59e0b'],
            ['gA', '#ef4444'],
          ].map(([id, color]) => (
            <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0}    />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />
        <XAxis
          dataKey="date" tick={{ fontSize: 10 }}
          tickLine={false} axisLine={false} interval="preserveStartEnd"
        />
        <YAxis
          allowDecimals={false} tick={{ fontSize: 10 }}
          tickLine={false} axisLine={false} domain={[0, 1]}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '10px', border: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: '12px',
          }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
        <Area type="monotone" dataKey="Present" stroke="#22c55e" fill="url(#gP)" strokeWidth={2} />
        <Area type="monotone" dataKey="Late"    stroke="#f59e0b" fill="url(#gL)" strokeWidth={2} />
        <Area type="monotone" dataKey="Absent"  stroke="#ef4444" fill="url(#gA)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Section 4 — Insight card
// ─────────────────────────────────────────────────────────────────────────────
const InsightCard = ({ icon: Icon, label, value, sub }) => (
  <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl p-4 flex items-start gap-3 hover:shadow-sm transition-shadow duration-150">
    <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm flex-shrink-0">
      <Icon className="w-4 h-4 text-blue-500" />
    </div>
    <div className="min-w-0">
      <p className="text-xl font-black text-gray-900 dark:text-white leading-none">{value ?? '—'}</p>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Section 5 — Activity row
// ─────────────────────────────────────────────────────────────────────────────
const ActivityRow = ({ record }) => {
  const d = new Date(record.date);
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-150">
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDotClass(record.status)}`} />
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">{DAY_NAMES[d.getDay()]}</p>
        </div>
      </div>
      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide ${statusBadgeClass(record.status)}`}>
        {record.status}
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main export — AttendanceDetailModal
// ─────────────────────────────────────────────────────────────────────────────
const AttendanceDetailModal = ({ employee, records, onClose }) => {
  const [selectedDay, setSelectedDay] = useState(null);

  // Memoised stats
  const stats = useMemo(() => {
    const total   = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const late    = records.filter((r) => r.status === 'late').length;
    const absent  = records.filter((r) => r.status === 'absent').length;
    const pct     = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    // Streak (descending sort)
    const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
    let currentStreak = 0;
    let longestStreak = 0;
    let run = 0;
    for (let i = 0; i < sorted.length; i++) {
      const active = sorted[i].status === 'present' || sorted[i].status === 'late';
      if (active) {
        run++;
        longestStreak = Math.max(longestStreak, run);
        if (i === run - 1) currentStreak = run; // still unbroken from latest
      } else {
        run = 0;
      }
    }

    // Most frequent late day
    const lateDays = records.filter((r) => r.status === 'late').map((r) => new Date(r.date).getDay());
    let maxLateDay = null;
    if (lateDays.length > 0) {
      const dayCount = Array(7).fill(0);
      lateDays.forEach((d) => dayCount[d]++);
      maxLateDay = DAY_NAMES[dayCount.indexOf(Math.max(...dayCount))];
    }

    const latePct   = total > 0 ? Math.round((late   / total) * 100) : 0;
    const absentPct = total > 0 ? Math.round((absent / total) * 100) : 0;

    return { total, present, late, absent, pct, latePct, absentPct, currentStreak, longestStreak, maxLateDay };
  }, [records]);

  const recent = useMemo(
    () => [...records].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
    [records],
  );

  // Trap backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto"
      onClick={handleBackdrop}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl my-8 shadow-2xl overflow-hidden">

        {/* ── Gradient header ─────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-6 text-white relative overflow-hidden">
          {/* decorative blobs */}
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black shadow-inner">
                {employee.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">{employee.name}</h2>
                <p className="text-blue-200 text-sm mt-0.5">{employee.department || 'No department'}</p>
                <p className="text-blue-100 text-xs mt-1 opacity-80">{stats.total} records in log</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/25 transition-colors text-white font-bold text-lg leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div className="p-6 space-y-7">

          {/* Section 1 — Summary */}
          <section>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SummaryCard
                icon={TrendingUp} label="Attendance Rate" value={`${stats.pct}%`}
                iconBg="bg-blue-600"  cardBg="bg-blue-50  dark:bg-blue-900/20"
              />
              <SummaryCard
                icon={CheckCircle} label="Present Days" value={stats.present}
                iconBg="bg-green-500" cardBg="bg-green-50 dark:bg-green-900/20"
              />
              <SummaryCard
                icon={Clock} label="Late Days" value={stats.late}
                iconBg="bg-amber-500" cardBg="bg-amber-50 dark:bg-amber-900/20"
              />
              <SummaryCard
                icon={XCircle} label="Absent Days" value={stats.absent}
                iconBg="bg-red-500"   cardBg="bg-red-50   dark:bg-red-900/20"
              />
            </div>
          </section>

          {/* Section 2 — Calendar */}
          <section className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-5">
              <CalendarDays className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Monthly Heatmap</h3>
            </div>
            <AttendanceCalendar
              records={records}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
            <DayDetailPanel dayKey={selectedDay} records={records} />
          </section>

          {/* Section 3 — Trend */}
          <section className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Attendance Trend <span className="font-normal text-gray-400 dark:text-gray-500">(last 30 records)</span>
              </h3>
            </div>
            <AttendanceTrendChart records={records} />
          </section>

          {/* Section 4 — Insights */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-4 h-4 text-orange-400" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Attendance Insights</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <InsightCard icon={TrendingUp}   label="Overall Rate"      value={`${stats.pct}%`} />
              <InsightCard icon={Clock}        label="Late Rate"         value={`${stats.latePct}%`} />
              <InsightCard icon={XCircle}      label="Absent Rate"       value={`${stats.absentPct}%`} />
              <InsightCard icon={Flame}        label="Current Streak"    value={`${stats.currentStreak}d`}  sub="consecutive days" />
              <InsightCard icon={AlarmClock}   label="Longest Streak"    value={`${stats.longestStreak}d`}  sub="all-time best" />
              <InsightCard icon={CalendarDays} label="Most Late Day"     value={stats.maxLateDay ?? 'N/A'} sub="day of week" />
            </div>
          </section>

          {/* Section 5 — Recent activity */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recent Activity</h3>
              </div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-semibold">
                Latest 5
              </span>
            </div>
            {recent.length === 0 ? (
              <p className="text-center text-gray-400 dark:text-gray-500 py-6 text-sm italic">
                No recent records.
              </p>
            ) : (
              <div className="space-y-2">
                {recent.map((r, i) => (
                  <ActivityRow key={i} record={r} />
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
};

export default AttendanceDetailModal;
