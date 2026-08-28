const AdminDashboardSkeleton = () => {
  return <div className="space-y-8 animate-pulse" id="admin-skeleton">
      {
    /* Top Header Skeleton */
  }
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-2">
          <div className="h-8 w-60 bg-slate-200 rounded-lg" />
          <div className="h-4 w-44 bg-slate-150 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-slate-100 rounded-lg" />
          <div className="h-10 w-32 bg-slate-200 rounded-lg" />
        </div>
      </div>

      {
    /* 4 Metric KPI Cards */
  }
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-slate-150 rounded" />
              <div className="w-9 h-9 rounded-lg bg-slate-100" />
            </div>
            <div className="h-8 w-32 bg-slate-200 rounded-lg" />
            <div className="h-3.5 w-28 bg-slate-100 rounded" />
          </div>)}
      </div>

      {
    /* Tabs Switcher Skeleton */
  }
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <div className="h-10 w-32 bg-slate-200 rounded-lg" />
        <div className="h-10 w-32 bg-slate-100 rounded-lg" />
        <div className="h-10 w-32 bg-slate-100 rounded-lg" />
      </div>

      {
    /* 2 Chart Cards */
  }
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="h-5 w-40 bg-slate-200 rounded" />
          <div className="h-56 bg-slate-100 rounded-xl" />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="h-5 w-40 bg-slate-200 rounded" />
          <div className="h-56 bg-slate-100 rounded-xl" />
        </div>
      </div>

      {
    /* Recent Table Skeleton */
  }
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="h-5 w-36 bg-slate-200 rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((r) => <div key={r} className="h-12 bg-slate-50 rounded-lg" />)}
        </div>
      </div>
    </div>;
};
export {
  AdminDashboardSkeleton
};
