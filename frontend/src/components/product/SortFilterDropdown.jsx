import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Sparkles,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Star,
  Zap,
  Check,
  SlidersHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const SORT_OPTIONS = [
  {
    id: "featured",
    label: "Featured & Relevant",
    description: "Hand-picked showcase products",
    icon: Sparkles
  },
  {
    id: "price-asc",
    label: "Price: Low to High",
    description: "Budget-friendly options first",
    icon: ArrowUpNarrowWide
  },
  {
    id: "price-desc",
    label: "Price: High to Low",
    description: "Premium flagship selections first",
    icon: ArrowDownWideNarrow
  },
  {
    id: "newest",
    label: "Newest Arrivals",
    description: "Recently added 2026 releases",
    icon: Zap
  },
  {
    id: "rating",
    label: "Highest Customer Rating",
    description: "4.5+ star customer favorites",
    icon: Star
  }
];

export const SortFilterDropdown = ({ value = "featured", onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = SORT_OPTIONS.find((opt) => opt.id === value) || SORT_OPTIONS[0];
  const SelectedIcon = selectedOption.icon;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionId) => {
    onChange?.(optionId);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        id="sort-dropdown-trigger"
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 border cursor-pointer select-none ${
          isOpen
            ? "bg-blue-50/90 text-blue-900 border-blue-300 ring-2 ring-blue-500/20 shadow-xs"
            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs"
        }`}
      >
        <SelectedIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span className="hidden sm:inline text-slate-500 font-medium">Sort by:</span>
        <span className="font-semibold text-slate-900">{selectedOption.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-blue-600" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-1.5 w-64 sm:w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-40 focus:outline-none"
            role="listbox"
            aria-label="Sort options"
          >
            <div className="px-3 py-1.5 border-b border-slate-100/80 mb-1 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Sort Catalog By
              </span>
              <SlidersHorizontal className="w-3 h-3 text-slate-400" />
            </div>

            <div className="p-1 space-y-0.5">
              {SORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = opt.id === value;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.id)}
                    className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 text-blue-900 font-semibold"
                        : "hover:bg-slate-50 text-slate-700 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs leading-snug">{opt.label}</div>
                        <div className="text-[10px] text-slate-400 leading-tight">
                          {opt.description}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
