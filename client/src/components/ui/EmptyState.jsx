import { PackageOpen, Users, Briefcase, FileText } from 'lucide-react';

const icons = {
  users: Users,
  projects: Briefcase,
  files: FileText,
  default: PackageOpen,
};

const EmptyState = ({
  title = 'No data found',
  description = 'Nothing to show here yet.',
  icon = 'default',
  action = null, // { label: 'Create Now', onClick: fn }
}) => {
  const Icon = icons[icon] || icons.default;
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
