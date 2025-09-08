import React, { useEffect, useRef, useState, useMemo, useCallback, memo, useLayoutEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const calculateMismatchCount = (referencePositions, referenceGenomePositions, varietyPositions) => {
  return referencePositions.reduce((count, position) => {
    const refValue = referenceGenomePositions[position];
    const varValue = varietyPositions[position];

    if (varValue && varValue !== refValue) {
      return varValue.includes(refValue) ? count + 0.5 : count + 1;
    }
    return count;
  }, 0);
};

const VarietyTable = memo(({ results, referenceGenomePositions }) => {
  const referencePositions = useMemo(() => Object.keys(referenceGenomePositions), [referenceGenomePositions]);
  const varietyIds = useMemo(() => Object.keys(results.varieties), [results.varieties]);
  
  // Refs for column headers
  const col1Ref = useRef(null);
  const col2Ref = useRef(null);
  const col3Ref = useRef(null);
  const col4Ref = useRef(null);
  const col5Ref = useRef(null);
  
  // Memoized column positions calculation
  const [columnPositions, setColumnPositions] = useState({
    col2: 0, col3: 0, col4: 0, col5: 0, col6: 0
  });

  // Pagination state with memoization
  const [currentPage, setCurrentPage] = useState(1);
  const [columnsPerPage, setColumnsPerPage] = useState(10);
  const [pageInputValue, setPageInputValue] = useState('1');
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [customSizeValue, setCustomSizeValue] = useState('');
  
  // Memoized pagination calculations
  const totalPages = useMemo(() => Math.ceil(referencePositions.length / columnsPerPage), [referencePositions, columnsPerPage]);
  const indexOfLastColumn = currentPage * columnsPerPage;
  const indexOfFirstColumn = indexOfLastColumn - columnsPerPage;
  const currentColumns = useMemo(() => 
    referencePositions.slice(indexOfFirstColumn, indexOfLastColumn), 
    [referencePositions, currentPage, columnsPerPage]
  );

  // Debounced resize handler
  const calculatePositions = useCallback(() => {
    if (!col1Ref.current || !col2Ref.current || !col3Ref.current || !col4Ref.current || !col5Ref.current) {
      return;
    }

    const col1Width = col1Ref.current.offsetWidth - 1;
    const col2Width = col2Ref.current.offsetWidth - 1;
    const col3Width = col3Ref.current.offsetWidth - 1;
    const col4Width = col4Ref.current.offsetWidth - 1;
    const col5Width = col5Ref.current.offsetWidth - 1;

    setColumnPositions({
      col2: col1Width,
      col3: col1Width + col2Width,
      col4: col1Width + col2Width + col3Width,
      col5: col1Width + col2Width + col3Width + col4Width,
      col6: col1Width + col2Width + col3Width + col4Width + col5Width - 1
    });
  }, []);

  // Optimized resize effect
  useLayoutEffect(() => {
    const debouncedCalculatePositions = () => {
      requestAnimationFrame(calculatePositions);
    };

    // Call on initial render and whenever dependencies change
    debouncedCalculatePositions();

    window.addEventListener('resize', debouncedCalculatePositions);

    return () => {
      window.removeEventListener('resize', debouncedCalculatePositions);
    };
  }, [calculatePositions, currentColumns, columnsPerPage, currentPage, results]);

  // Memoized page change handler
  const handlePageChange = useCallback((pageNumber) => {
    const page = Math.max(1, Math.min(pageNumber, totalPages));
    setCurrentPage(page);
    setPageInputValue(page.toString());
    
    // Trigger position recalculation
    requestAnimationFrame(calculatePositions);
  }, [totalPages, calculatePositions]);

  // Memoized handlers
  const handleColumnsPerPageChange = useCallback((event) => {
    const value = event.target.value;
    if (value === 'custom') {
      setIsCustomSize(true);
    } else {
      setCustomSizeValue('');
      setIsCustomSize(false);
      setColumnsPerPage(Number(value));
      setCurrentPage(1);
      setPageInputValue('1');
      
      // Trigger position recalculation
      requestAnimationFrame(calculatePositions);
    }
  }, [calculatePositions]);

  const handleCustomSizeChange = useCallback((event) => {
    setCustomSizeValue(event.target.value);
  }, []);

  const applyCustomSize = useCallback(() => {
    let size = parseInt(customSizeValue, 10);
    
    size = isNaN(size) ? 10 : 
           size < 10 ? 10 : 
           size > 100 ? 100 : size;
    
    setCustomSizeValue(size.toString());
    setColumnsPerPage(size);
    setCurrentPage(1);
    setPageInputValue('1');
    
    // Trigger position recalculation
    requestAnimationFrame(calculatePositions);
  }, [customSizeValue, calculatePositions]);

  const handleCustomSizeKeyPress = useCallback((event) => {
    if (event.key === 'Enter') {
      applyCustomSize();
    }
  }, [applyCustomSize]);

  const handlePageInputChange = useCallback((event) => {
    setPageInputValue(event.target.value);
  }, []);

  const handleGoToPage = useCallback(() => {
    const pageNumber = parseInt(pageInputValue, 10);
    if (!isNaN(pageNumber)) {
      handlePageChange(pageNumber);
    }
  }, [handlePageChange, pageInputValue]);

  const handlePageInputKeyPress = useCallback((event) => {
    if (event.key === 'Enter') {
      handleGoToPage();
    }
  }, [handleGoToPage]);

  // Memoized variety rendering
  const renderVarietyRows = useMemo(() => {
    return varietyIds.map((varietyId) => {
      const variety = results.varieties[varietyId] || {};
      const varietyPositions = results.varietyPositions[varietyId] || {};

      const mismatchCount = calculateMismatchCount(referencePositions, referenceGenomePositions, varietyPositions);

      return (
        <tr key={varietyId} className="py-2 text-white border font-['open-sans'] font-light text-xs bg-gray-800 border-gray-700">
          <td className="sticky left-0 z-10 px-3 py-1 border-r border-gray-700 bg-gray-800">
            {variety.name || ""}
          </td>
          <td 
            className="sticky z-10 px-3 py-1 border-r border-gray-700 bg-gray-800"
            style={{ left: `${columnPositions.col2}px`}}
          >
            {variety.irisId || ""}
          </td>
          <td 
            className="sticky z-10 px-3 py-1 border-r border-gray-700 bg-gray-800"
            style={{ left: `${columnPositions.col3}px` }}
          >
            {variety.accession || ""}
          </td>
          <td 
            className="sticky z-10 px-3 py-1 border-r border-gray-700 bg-gray-800"
            style={{ left: `${columnPositions.col4}px` }}
          >
            {variety.subpopulation || ""}
          </td>
          <td 
            className="sticky z-10 px-3 py-1 border-r border-gray-700 bg-gray-800"
            style={{ left: `${columnPositions.col5}px`}}
          >
            {variety.varietySet || ""}
          </td>
          <td 
            className="sticky z-10 px-3 py-1 border-r border-gray-700 bg-gray-800"
            style={{ left: `${columnPositions.col6}px`, top:`10px`}}
          >
            {mismatchCount}
          </td>
          {currentColumns.map((position) => {
            const refValue = referenceGenomePositions[position];
            const varValue = varietyPositions[position];
            const isMismatch = varValue && varValue !== refValue;
            return (
              <td
                key={position}
                className={`px-3 py-1 border-r border-gray-700 text-sm ${
                  isMismatch ? "text-red-500" : "text-white"
                }`}
              >
                {varValue || ""}
              </td>
            );
          })}
        </tr>
      );
    });
  }, [
    varietyIds, 
    results.varieties, 
    results.varietyPositions, 
    referencePositions, 
    referenceGenomePositions, 
    currentColumns, 
    columnPositions
  ]);

  return (
    <div className="relative">
      {/* Pagination Controls */}
      <div className="flex justify-between items-center mb-4 bg-gray-800 p-3 rounded">
        <div className="flex items-center">
          <span className="text-white mr-2 font-['Poppins-Bold']">Columns Shown:</span>
          <select 
            value={isCustomSize ? 'custom' : columnsPerPage} 
            onChange={handleColumnsPerPageChange}
            className="bg-gray-700 font-['Lato-Regular'] text-white border border-gray-600 rounded px-2 py-1"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value="custom">Custom</option>
          </select>
          
          {isCustomSize && (
            <div className="flex items-center ml-2">
              <input
                type="number"
                min="10"
                max="100"
                value={customSizeValue}
                onChange={handleCustomSizeChange}
                onKeyPress={handleCustomSizeKeyPress}
                className="bg-gray-700 font-['Lato-Regular'] text-white border border-gray-600 rounded px-2 py-1 w-24 text-center"
                placeholder="10-100"
              />
              <button
                onClick={applyCustomSize}
                className="px-2 py-1 rounded ml-1 bg-green-2 text-white font-['Lato-Regular']"
              >
                Apply
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center">
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1}
            className={`font-['Lato-Regular'] px-3 py-1 rounded mr-2 ${currentPage === 1 ? 'bg-gray-700 text-gray-500' : 'bg-green-1 text-white'}`}
          >
            <ChevronLeft/>
          </button>
          <span className="text-white mx-2 font-['Lato-Regular']">
            Page 
          </span>
          <input
            type="text"
            value={pageInputValue}
            onChange={handlePageInputChange}
            onKeyPress={handlePageInputKeyPress}
            className="bg-gray-700 text-white border font-['Lato-Regular'] font-bold border-gray-600 rounded px-2 py-1 w-12 text-center"
          />
          <span className="text-white mx-2 font-['Lato-Regular']">
            of {totalPages}
          </span>
          <button 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className={`font-['Lato-Regular'] px-3 py-1 rounded ml-2 ${currentPage === totalPages ? 'bg-gray-700 text-gray-500' : 'bg-green-1 text-white'}`}
          >
            <ChevronRight/>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="table-auto border-collapse border border-gray-700 text-sm text-center text-gray-300">
            <thead className="text-xs text-white bg-green-1 font-['Poppins-Bold'] border-b border-gray-700">
              <tr>
                <th 
                  ref={col1Ref}
                  scope="col" 
                  className="sticky left-0 z-10 px-3 py-3 border-r border-gray-700 bg-green-1"
                  style={{ width: 'max-content', minWidth: '150px' }}
                >
                  Japonica Nipponbare Positions
                </th>
                <th 
                  ref={col2Ref}
                  scope="col" 
                  className="sticky z-10 px-3 py-3 border-r border-gray-700 bg-green-1"
                  style={{ left: `${columnPositions.col2}px`, width: 'max-content', minWidth: '90px' }}
                >
                  Assay
                </th>
                <th 
                  ref={col3Ref}
                  scope="col" 
                  className="sticky z-10 px-3 py-3 border-r border-gray-700 bg-green-1"
                  style={{ left: `${columnPositions.col3}px`, width: 'max-content', minWidth: '90px'   }}
                >
                  Accession
                </th>
                <th 
                  ref={col4Ref}
                  scope="col" 
                  className="sticky z-10 px-3 py-3 border-r border-gray-700 bg-green-1"
                  style={{ left: `${columnPositions.col4}px`, width: 'max-content', minWidth: '50px' }}
                >
                  Subpop
                </th>
                <th 
                  ref={col5Ref}
                  scope="col" 
                  className="sticky z-10 px-3 py-3 border-r border-gray-700 bg-green-1"
                  style={{ left: `${columnPositions.col5}px`, width: 'max-content', minWidth: '50px'  }}
                >
                  Dataset
                </th>
                <th 
                  scope="col" 
                  className="sticky z-10 px-3 py-3 border-r border-gray-700 bg-green-1"
                  style={{ left: `${columnPositions.col6}px`, width: 'max-content', minWidth: '50px'  }}
                >
                  Mismatch
                </th>
                {currentColumns.map((position) => (
                  <th
                    scope="col"
                    key={position}
                    className="px-2 py-3 border-r border-gray-700"
                  >
                    {position}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="sticky left-0 z-10 px-3 py-3 bg-green-900 border-r border-gray-700">
                  Japonica Nipponbare
                </th>
                <td 
                  className="sticky z-10 px-3 py-3 bg-green-900 border-r border-gray-700" 
                  style={{ left: `${columnPositions.col2}px` }}
                ></td>
                <td 
                  className="sticky z-10 px-3 py-3 bg-green-900 border-r border-gray-700" 
                  style={{ left: `${columnPositions.col3}px` }}
                ></td>
                <td 
                  className="sticky z-10 px-3 py-3 bg-green-900 border-r border-gray-700" 
                  style={{ left: `${columnPositions.col4}px` }}
                ></td>
                <td 
                  className="sticky z-10 px-3 py-3 bg-green-900 border-r border-gray-700" 
                  style={{ left: `${columnPositions.col5}px` }}
                ></td>
                <td 
                  className="sticky z-10 px-3 py-3 bg-green-900 border-r border-gray-700" 
                  style={{ left: `${columnPositions.col6}px` }}
                ></td>
                {currentColumns.map((position) => (
                  <th key={position} className="px-3 py-3 bg-green-2 text-sm border-r border-gray-700">
                    {referenceGenomePositions[position]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {renderVarietyRows}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export default VarietyTable;
