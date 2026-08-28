const AccountPageSkeleton = () => {
  return <div className="space-y-8 animate-pulse" id="account-skeleton">
      {
    /* Profile Header Banner Skeleton */
  }
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-full bg-slate-200 shrink-0" />
          <div className="space-y-2">
            <div className="h-6 w-44 bg-slate-200 rounded-lg mx-auto sm:mx-0" />
            <div className="h-4 w-36 bg-slate-150 rounded mx-auto sm:mx-0" />
            <div className="h-5 w-28 bg-slate-100 rounded-full mx-auto sm:mx-0" />
          </div>
        </div>

        {
    /* User Stats Mini Tiles */
  }
        <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
          {[1, 2, 3].map((i) => <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-1">
              <div className="h-6 w-10 bg-slate-200 rounded mx-auto" />
              <div className="h-3 w-14 bg-slate-150 rounded mx-auto" />
            </div>)}
        </div>
      </div>

      {
    /* Tabs Navigation Skeleton */
  }
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <div className="h-10 w-32 bg-slate-200 rounded-lg" />
        <div className="h-10 w-32 bg-slate-100 rounded-lg" />
        <div className="h-10 w-32 bg-slate-100 rounded-lg" />
      </div>

      {
    /* Orders List Skeleton */
  }
      <div className="space-y-6">
        {[1, 2].map((i) => <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1.5">
                <div className="h-5 w-40 bg-slate-200 rounded" />
                <div className="h-3.5 w-32 bg-slate-150 rounded" />
              </div>
              <div className="h-7 w-28 bg-slate-100 rounded-full" />
            </div>

            {
    /* Shipment Milestones Timeline Skeleton */
  }
            <div className="py-4 px-2 bg-slate-50 rounded-xl border border-slate-100">
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((s) => <div key={s} className="space-y-2 text-center">
                    <div className="w-6 h-6 rounded-full bg-slate-200 mx-auto" />
                    <div className="h-3 w-12 bg-slate-200 rounded mx-auto" />
                  </div>)}
              </div>
            </div>

            {
    /* Order Items Mini */
  }
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-200 rounded-lg shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-52 bg-slate-200 rounded" />
                  <div className="h-3.5 w-24 bg-slate-150 rounded" />
                </div>
                <div className="h-5 w-18 bg-slate-200 rounded" />
              </div>
            </div>
          </div>)}
      </div>
    </div>;
};
export {
  AccountPageSkeleton
};
