const CartPageSkeleton = () => {
  return <div className="space-y-8 animate-pulse" id="cart-skeleton">
      {
    /* Header Skeleton */
  }
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="space-y-2">
          <div className="h-8 w-44 bg-slate-200 rounded-lg" />
          <div className="h-4 w-28 bg-slate-150 rounded" />
        </div>
        <div className="h-4 w-24 bg-slate-200 rounded" />
      </div>

      {
    /* Main 2-Column Grid */
  }
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {
    /* Left: Cart Items List */
  }
        <div className="lg:col-span-8 space-y-4">
          {
    /* Shipping Progress bar skeleton */
  }
          <div className="p-4 bg-slate-100 rounded-xl space-y-2">
            <div className="h-4 w-52 bg-slate-200 rounded" />
            <div className="h-2 w-full bg-slate-200 rounded-full" />
          </div>

          {[1, 2, 3].map((i) => <div
    key={i}
    className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-xs"
  >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-20 h-20 bg-slate-200 rounded-lg shrink-0" />
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="h-4 w-40 bg-slate-200 rounded" />
                  <div className="h-3.5 w-24 bg-slate-150 rounded" />
                  <div className="h-4 w-20 bg-slate-200 rounded" />
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="h-9 w-28 bg-slate-100 rounded-lg" />
                <div className="h-5 w-16 bg-slate-200 rounded" />
                <div className="h-8 w-8 bg-slate-100 rounded-lg" />
              </div>
            </div>)}
        </div>

        {
    /* Right: Order Summary Card */
  }
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs">
            <div className="h-6 w-36 bg-slate-200 rounded" />

            {
    /* Coupon input placeholder */
  }
            <div className="flex gap-2">
              <div className="h-10 flex-1 bg-slate-100 rounded-lg" />
              <div className="h-10 w-20 bg-slate-200 rounded-lg" />
            </div>

            {
    /* Calculation Lines */
  }
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-slate-200 rounded" />
                <div className="h-4 w-16 bg-slate-200 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-28 bg-slate-200 rounded" />
                <div className="h-4 w-12 bg-slate-200 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-4 w-14 bg-slate-200 rounded" />
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-100">
                <div className="h-6 w-24 bg-slate-300 rounded" />
                <div className="h-6 w-20 bg-slate-300 rounded" />
              </div>
            </div>

            {
    /* Checkout Button */
  }
            <div className="h-12 w-full bg-slate-200 rounded-xl" />

            {
    /* Trust guarantees */
  }
            <div className="space-y-2 pt-2">
              <div className="h-3.5 w-4/5 bg-slate-100 rounded mx-auto" />
              <div className="h-3.5 w-3/5 bg-slate-100 rounded mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export {
  CartPageSkeleton
};
