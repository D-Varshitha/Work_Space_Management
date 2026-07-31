// Reusable skeleton loading components
export const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
    <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
    <div className="w-32 h-4 bg-gray-100 dark:bg-gray-700 rounded" />
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
      <div className="w-40 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
    <div className="divide-y divide-gray-50 dark:divide-gray-700">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-6 px-6 py-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonText = ({ lines = 3 }) => (
  <div className="space-y-2 animate-pulse">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
    ))}
  </div>
);
