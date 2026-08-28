const ProductCardSkeleton = ({ viewMode = "grid" }) => {
  if (viewMode === "list") {
    return <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center gap-5 animate-pulse shadow-xs">
        {
      /* Thumbnail Image Box */
    }
        <div className="w-full sm:w-44 h-44 shrink-0 rounded-lg bg-slate-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        </div>

        {
      /* Content Lines */
    }
        <div className="flex-1 min-w-0 space-y-3 w-full">
          <div className="flex items-center gap-3">
            <div className="h-4 bg-slate-200 rounded w-24" />
            <div className="h-4 bg-slate-200 rounded w-16" />
          </div>
          <div className="h-5 bg-slate-200 rounded w-3/4" />
          <div className="space-y-1.5">
            <div className="h-3 bg-slate-200 rounded w-full" />
            <div className="h-3 bg-slate-200 rounded w-4/5" />
          </div>
          <div className="h-4 bg-slate-200 rounded w-28 mt-2" />
        </div>

        {
      /* Price and CTA */
    }
        <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="h-7 bg-slate-200 rounded w-20" />
          <div className="h-9 bg-slate-200 rounded-lg w-28" />
        </div>
      </div>;
  }
  return <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs animate-pulse flex flex-col">
      {
    /* Product Image Box */
  }
      <div className="h-48 bg-slate-200 relative overflow-hidden">
        <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-slate-300" />
        <div className="absolute top-2.5 left-2.5 w-16 h-5 rounded bg-slate-300" />
      </div>

      {
    /* Product Information */
  }
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="h-3.5 bg-slate-200 rounded w-20" />
            <div className="h-3.5 bg-slate-200 rounded w-14" />
          </div>
          <div className="h-4 bg-slate-200 rounded w-4/5" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="space-y-1 pt-1">
            <div className="h-3 bg-slate-200 rounded w-full" />
            <div className="h-3 bg-slate-200 rounded w-3/4" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="h-6 bg-slate-200 rounded w-20" />
          <div className="w-9 h-9 rounded-lg bg-slate-200" />
        </div>
      </div>
    </div>;
};
export {
  ProductCardSkeleton
};
