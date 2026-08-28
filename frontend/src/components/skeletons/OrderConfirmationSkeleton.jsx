const OrderConfirmationSkeleton = () => {
  return <div className="max-w-4xl mx-auto space-y-8 animate-pulse" id="order-confirmation-skeleton">
      {
    /* Top Success Banner Skeleton */
  }
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
        <div className="w-16 h-16 rounded-full bg-slate-200 mx-auto" />
        <div className="h-7 w-64 bg-slate-200 rounded-lg mx-auto" />
        <div className="h-4 w-96 bg-slate-150 rounded mx-auto" />
        <div className="h-6 w-48 bg-slate-100 rounded-full mx-auto" />
      </div>

      {
    /* Shipment Tracker Skeleton */
  }
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
        <div className="h-5 w-44 bg-slate-200 rounded" />
        <div className="grid grid-cols-5 gap-2 pt-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="text-center space-y-2">
              <div className="w-7 h-7 rounded-full bg-slate-200 mx-auto" />
              <div className="h-3 w-16 bg-slate-200 rounded mx-auto" />
            </div>)}
        </div>
      </div>

      {
    /* Order Details & Items Skeleton */
  }
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="h-5 w-32 bg-slate-200 rounded" />
          <div className="space-y-2">
            <div className="h-4 w-40 bg-slate-200 rounded" />
            <div className="h-3.5 w-48 bg-slate-150 rounded" />
            <div className="h-3.5 w-36 bg-slate-150 rounded" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="h-5 w-32 bg-slate-200 rounded" />
          <div className="space-y-2">
            <div className="h-4 w-36 bg-slate-200 rounded" />
            <div className="h-3.5 w-44 bg-slate-150 rounded" />
            <div className="h-3.5 w-32 bg-slate-150 rounded" />
          </div>
        </div>
      </div>
    </div>;
};
export {
  OrderConfirmationSkeleton
};
