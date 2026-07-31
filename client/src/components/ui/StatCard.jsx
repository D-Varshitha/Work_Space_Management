// Reusable StatCard with trend indicator and dark mode support
const StatCard = ({
  label,
  value,
  icon: Icon,
  color = 'blue',
  trend = null,   // e.g. { direction: 'up', value: '12%' }
  subtitle = null,
}) => {
  const colorMap = {
    blue:   { bg: 'bg-blue-50   dark:bg-blue-900/30', icon: 'text-blue-600   dark:text-blue-400', ring: 'ring-blue-100 dark:ring-blue-800' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/30', icon: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-100 dark:ring-purple-800' },
    green:  { bg: 'bg-green-50  dark:bg-green-900/30',  icon: 'text-green-600  dark:text-green-400',  ring: 'ring-green-100  dark:ring-green-800' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/30', icon: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-100 dark:ring-orange-800' },
    red:    { bg: 'bg-red-50    dark:bg-red-900/30',    icon: 'text-red-600    dark:text-red-400',    ring: 'ring-red-100    dark:ring-red-800' },
    teal:   { bg: 'bg-teal-50   dark:bg-teal-900/30',   icon: 'text-teal-600   dark:text-teal-400',   ring: 'ring-teal-100   dark:ring-teal-800' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/30', icon: 'text-indigo-600 dark:text-indigo-400', ring: 'ring-indigo-100 dark:ring-indigo-800' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`${c.bg} ${c.ring} ring-1 p-3 rounded-xl transition-transform duration-200 group-hover:scale-110`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${
            trend.direction === 'up'
              ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900 dark:text-white">{value ?? '—'}</p>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
