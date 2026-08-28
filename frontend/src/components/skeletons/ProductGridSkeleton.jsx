import { ProductCardSkeleton } from "./ProductCardSkeleton";
const ProductGridSkeleton = ({ count = 6, viewMode = "grid" }) => {
  if (viewMode === "horizontal" || viewMode === "carousel") {
    return <div className="flex gap-5 overflow-x-auto py-2 [scroll-snap-type:x_mandatory] snap-x snap-mandatory [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-100/90 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        {Array.from({ length: count }).map((_, index) => <div key={index} className="w-70 sm:w-[320px] shrink-0 snap-start">
            <ProductCardSkeleton viewMode="grid" />
          </div>)}
      </div>;
  }
  return <div
    className={viewMode === "grid" ? "flex sm:grid sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 overflow-x-auto sm:overflow-x-visible [scroll-snap-type:x_mandatory] snap-x snap-mandatory sm:snap-none pb-4 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-100/90 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full" : "space-y-4"}
  >
      {Array.from({ length: count }).map((_, index) => <div
    key={index}
    className={viewMode === "grid" ? "w-[78vw] max-w-72.5 shrink-0 snap-start sm:w-auto sm:max-w-none sm:shrink" : "w-full"}
  >
          <ProductCardSkeleton viewMode={viewMode === "grid" ? "grid" : viewMode} />
        </div>)}
    </div>;
};
export {
  ProductGridSkeleton
};
