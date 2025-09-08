import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import React from 'react';

export default function PageButtons({ handlePageChange, currentPage, totalPages, isOneIndexed }) {
  if (isOneIndexed) {
    return (
      <div className="flex justify-center mt-auto space-x-2 py-5">
        {/* Skip to First Page */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="px-3 py-2 bg-green-2 text-white rounded disabled:opacity-50"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 bg-green-2 text-white rounded disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Indicator */}
        <span className="px-3 py-2 bg-green-1 text-white rounded font-['Lato-Regular']">
          Page <span className="font-bold">{currentPage}</span> of {totalPages}
        </span>

        {/* Next Page */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 bg-green-2 text-white rounded disabled:opacity-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Skip to Last Page */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 bg-green-2 text-white rounded disabled:opacity-50"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    );
  } else {
    return (
      <div className="mt-auto flex justify-center space-x-2 py-5">
        {/* Skip to First Page */}
        <button
          onClick={() => handlePageChange(0)}
          disabled={currentPage === 0}
          className="px-3 py-2 bg-green-2 text-white rounded disabled:opacity-50"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="px-3 py-2 bg-green-2 text-white rounded disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Indicator */}
        <span className="px-3 py-2 bg-green-1 text-white rounded font-['Lato-Regular']">
          Page <span className="font-bold">{currentPage + 1}</span> of {totalPages + 1}
        </span>

        {/* Next Page */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 bg-green-2 text-white rounded disabled:opacity-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Skip to Last Page */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 bg-green-2 text-white rounded disabled:opacity-50"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    );
  }
}
