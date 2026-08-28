const CheckoutPageSkeleton = () => {
  return <div className="space-y-8 animate-pulse" id="checkout-skeleton">
      {
    /* Steps Indicator Skeleton */
  }
      <div className="flex items-center justify-center gap-4 sm:gap-8 pb-4">
        {[1, 2, 3].map((step) => <div key={step} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-200" />
            <div className="h-4 w-20 bg-slate-200 rounded hidden sm:block" />
          </div>)}
      </div>

      {
    /* Main 2-Column Grid */
  }
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {
    /* Left: Checkout Form Skeleton */
  }
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs">
            <div className="h-6 w-48 bg-slate-200 rounded" />

            {
    /* Form Fields Grid */
  }
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <div className="h-4 w-20 bg-slate-200 rounded" />
                <div className="h-10 w-full bg-slate-100 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-16 bg-slate-200 rounded" />
                <div className="h-10 w-full bg-slate-100 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-16 bg-slate-200 rounded" />
                <div className="h-10 w-full bg-slate-100 rounded-lg" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <div className="h-4 w-28 bg-slate-200 rounded" />
                <div className="h-10 w-full bg-slate-100 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-16 bg-slate-200 rounded" />
                <div className="h-10 w-full bg-slate-100 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-slate-200 rounded" />
                <div className="h-10 w-full bg-slate-100 rounded-lg" />
              </div>
            </div>
          </div>

          {
    /* Payment Method Selector Skeleton */
  }
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="h-6 w-36 bg-slate-200 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl border border-slate-200" />)}
            </div>
          </div>
        </div>

        {
    /* Right: Order Preview & Totals Skeleton */
  }
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs">
            <div className="h-6 w-36 bg-slate-200 rounded" />

            {
    /* Items Mini List */
  }
            <div className="space-y-3 pb-4 border-b border-slate-100">
              {[1, 2].map((i) => <div key={i} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-200 rounded-lg shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-3/4 bg-slate-200 rounded" />
                    <div className="h-3 w-1/3 bg-slate-150 rounded" />
                  </div>
                  <div className="h-4 w-14 bg-slate-200 rounded" />
                </div>)}
            </div>

            {
    /* Cost Breakdown */
  }
            <div className="space-y-2.5">
              <div className="flex justify-between">
                <div className="h-4 w-16 bg-slate-200 rounded" />
                <div className="h-4 w-14 bg-slate-200 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-slate-200 rounded" />
                <div className="h-4 w-12 bg-slate-200 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-12 bg-slate-200 rounded" />
                <div className="h-4 w-14 bg-slate-200 rounded" />
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-100">
                <div className="h-6 w-20 bg-slate-300 rounded" />
                <div className="h-6 w-24 bg-slate-300 rounded" />
              </div>
            </div>

            {
    /* Place Order CTA */
  }
            <div className="h-12 w-full bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>;
};
export {
  CheckoutPageSkeleton
};
