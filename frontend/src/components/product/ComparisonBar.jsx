import { Columns3, X, Trash2, ArrowRight } from "lucide-react";
import { useComparison } from "../../context/ComparisonContext";
import { LazyImage } from "../common/LazyImage";
const ComparisonBar = () => {
  const {
    comparedProducts,
    removeFromCompare,
    clearCompare,
    openCompareModal,
    isCompareModalOpen
  } = useComparison();
  if (comparedProducts.length === 0 || isCompareModalOpen) {
    return null;
  }
  return <aside
    aria-label="Product comparison floating bar"
    className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 pointer-events-none"
  >
      <div className="pointer-events-auto bg-slate-950/95 text-white backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {
    /* Left: Indicator & Thumbnails */
  }
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 shrink-0">
            <span className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Columns3 className="w-4 h-4" />
            </span>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Compare ({comparedProducts.length}/3)
              </div>
              <div className="text-xs font-medium text-slate-200 hidden sm:block">
                {comparedProducts.length === 1 ? "Add 1-2 more to compare" : "Ready to compare specs"}
              </div>
            </div>
          </div>

          {
    /* Thumbnails of compared products */
  }
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {comparedProducts.map((prod) => <div
    key={prod.id}
    className="relative group shrink-0 w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden"
  >
                <LazyImage
    src={prod.images[0]}
    alt={prod.name}
    objectFit="contain"
    className="w-full h-full p-0.5"
    wrapperClassName="w-full h-full bg-transparent"
  />
                <button
    onClick={(e) => {
      e.stopPropagation();
      removeFromCompare(prod.id);
    }}
    className="absolute inset-0 bg-rose-950/80 text-rose-300 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
    title={`Remove ${prod.name}`}
    aria-label={`Remove ${prod.name} from comparison`}
  >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>)}

            {
    /* Empty Slots */
  }
            {Array.from({ length: 3 - comparedProducts.length }).map((_, i) => <div
    key={`empty-${i}`}
    className="w-10 h-10 rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-slate-500 text-xs shrink-0"
    title="Add another product from the catalog"
  >
                +
              </div>)}
          </div>
        </div>

        {
    /* Right: Actions */
  }
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
    onClick={clearCompare}
    className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 hover:bg-slate-900 rounded-lg"
    title="Clear all compared items"
  >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          <button
    onClick={openCompareModal}
    className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
    id="compare-now-dock-btn"
  >
            <span>Compare Specs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>;
};
export {
  ComparisonBar
};
