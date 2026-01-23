
import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  itemsPerPageOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 50]
}) => {
  // Ensure at least 1 page logically for calculation safety, though we handle 0 items display below
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Calculate display indices
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 border-t border-slate-100 bg-white rounded-b-2xl">
      {/* Left: Info Text */}
      <div className="text-xs text-slate-500 font-medium">
        Mostrando <span className="font-bold text-slate-800">{startItem}</span> a <span className="font-bold text-slate-800">{endItem}</span> de <span className="font-bold text-slate-800">{totalItems}</span> resultados
      </div>
      
      {/* Right: Controls */}
      <div className="flex items-center gap-4">
        
        {/* Rows Per Page Selector */}
        <div className="relative">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1); // Reset to first page
            }}
            className="appearance-none bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg pl-3 pr-8 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer transition-all hover:bg-slate-100"
          >
            {itemsPerPageOptions.map(opt => (
              <option key={opt} value={opt}>{opt} por pág</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Navigation Group */}
        <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || totalItems === 0}
            className="px-3 py-1.5 rounded-md text-xs font-bold text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all flex items-center gap-1"
          >
            <ChevronLeft size={14} className="-ml-1" />
            <span className="hidden sm:inline">Anterior</span>
          </button>
          
          <div className="px-3 py-1 text-xs font-bold text-slate-400 border-x border-slate-200 mx-1 min-w-[60px] text-center">
            {totalItems === 0 ? '0 / 0' : `${currentPage} / ${totalPages}`}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalItems === 0}
            className="px-3 py-1.5 rounded-md text-xs font-bold text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all flex items-center gap-1"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight size={14} className="-mr-1" />
          </button>
        </div>

      </div>
    </div>
  );
};
