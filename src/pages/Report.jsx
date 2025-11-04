//src\pages\Report.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Download, Search, Filter, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import Header from '../components/Header';


const Report = () => {
  // --- State Management ---
  const [loggingData, setLoggingData] = useState([]);
  const [distinctUsers, setDistinctUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedFeedbackType, setSelectedFeedbackType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- API Configuration ---
  const API_BASE_URL = 'https://app-azuresearch-qa-evolve.azurewebsites.net';
  const REPORT_ENDPOINT = '/azai_report';
  const DISTINCT_VALUES_ENDPOINT = '/distinct_values';

  // --- Fetch Distinct Users ---
  const fetchDistinctUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${DISTINCT_VALUES_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      setDistinctUsers(data.distinct_user_name || []);
    } catch (err) {
      console.error('Error fetching distinct users:', err);
      // Don't set error state for this - it's not critical
    }
  };

  // --- Fetch Report Data ---
  const fetchLogData = async (startDate, endDate, userName = '', feedbackType = '') => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate dates
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required');
      }

      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);

      if (startDateTime > endDateTime) {
        throw new Error('Start date cannot be after end date');
      }

      // Build request body
      const requestBody = {
        start_date: startDate,
        end_date: endDate,
      };

      // Add optional filters
      if (userName) {
        requestBody.user_name = userName;
      }
      if (feedbackType) {
        requestBody.feedback_type = feedbackType;
      }

      const response = await fetch(`${API_BASE_URL}${REPORT_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different response structures
      let transformedData = [];
      if (data.p1 && Array.isArray(data.p1)) {
        transformedData = data.p1;
      } else if (data.p2 && Array.isArray(data.p2)) {
        transformedData = [...(data.p1 || []), ...data.p2];
      } else if (Array.isArray(data)) {
        transformedData = data;
      }
      
      setLoggingData(transformedData);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      console.error('Error fetching log data:', err);
      setLoggingData([]);
    } finally {
      setLoading(false);
    }
  };

  // --- Initial Data Load ---
  useEffect(() => {
    // Fetch distinct users for dropdown
    fetchDistinctUsers();

    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const defaultStartDate = thirtyDaysAgo.toISOString().split('T')[0];
    const defaultEndDate = today.toISOString().split('T')[0];
    
    setFromDate(defaultStartDate);
    setToDate(defaultEndDate);
    
    // Fetch initial data
    fetchLogData(defaultStartDate, defaultEndDate);
  }, []);

  // --- Handle Filter Application ---
  const handleApplyFilters = () => {
    if (!fromDate || !toDate) {
      setError('Please select both start and end dates');
      return;
    }
    fetchLogData(fromDate, toDate, selectedUser, selectedFeedbackType);
  };

  // --- Handle Reset Filters ---
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedUser('');
    setSelectedFeedbackType('');
    
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const defaultStartDate = thirtyDaysAgo.toISOString().split('T')[0];
    const defaultEndDate = today.toISOString().split('T')[0];
    
    setFromDate(defaultStartDate);
    setToDate(defaultEndDate);
    
    fetchLogData(defaultStartDate, defaultEndDate);
  };

  // --- Column Definitions ---
  const logColumns = [
    { key: 'user_name', label: 'User Name' },
    { key: 'job_title', label: 'Job Title' },
    { key: 'date_and_time', label: 'Date & Time' },
    { key: 'query', label: 'Query' },
    { key: 'ai_response', label: 'AI Response' },
    { key: 'citations', label: 'Citations' },
    { key: 'feedback_type', label: 'Feedback Type' },
    { key: 'feedback', label: 'Feedback' },
  ];

  // --- Client-side Filtering Logic ---
  const filteredData = useMemo(() => {
    return loggingData.filter(item => {
      const matchesSearchTerm = searchTerm === '' ||
        Object.values(item).some(value =>
          value && String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );

      return matchesSearchTerm;
    });
  }, [searchTerm, loggingData]);

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [currentPage, filteredData]);

  const handlePageChange = (direction) => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // --- Export Function ---
  const handleExport = async () => {
    try {
      if (filteredData.length === 0) {
        alert('No data to export');
        return;
      }

      // Convert filtered data to CSV
      const csvHeaders = logColumns.map(col => col.label).join(',');
      const csvRows = filteredData.map(row => 
        logColumns.map(col => {
          const value = row[col.key] || '';
          // Escape quotes and wrap in quotes, handle line breaks
          const cleanValue = String(value).replace(/"/g, '""').replace(/\n/g, ' ');
          return `"${cleanValue}"`;
        }).join(',')
      );
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Failed to export data. Please try again.');
    }
  };

  // --- Format date for display ---
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'N/A';
    try {
      const date = new Date(dateTimeStr);
      if (isNaN(date.getTime())) return dateTimeStr;
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTimeStr;
    }
  };

  // --- Truncate long text ---
  const truncateText = (text, maxLength = 150) => {
    if (!text) return 'N/A';
    const str = String(text);
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />

      <div className="flex-grow p-6">
        <div className="w-[95%] max-w-[1600px] mx-auto bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-[#0f85a3]">Report Generator</h1>
            <button
              className="flex items-center gap-2 px-6 py-2 bg-[#174a7e] text-white rounded-md shadow-sm hover:bg-[#082340] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#174a7e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={handleExport}
              disabled={filteredData.length === 0 || loading}
            >
              <Download size={18} />
              Export to CSV
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-sm font-semibold text-red-800">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Control Panel: Filters */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  <Search size={14} className="inline mr-1" />
                  Search
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search all columns..."
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-[#174a7e] focus:border-[#174a7e]"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
              
              <div>
                <label htmlFor="userFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  <Filter size={14} className="inline mr-1" />
                  User Name
                </label>
                <select
                  id="userFilter"
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-[#174a7e] focus:border-[#174a7e]"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">All Users</option>
                  {distinctUsers.map((user, idx) => (
                    <option key={idx} value={user}>{user}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="feedbackFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  <Filter size={14} className="inline mr-1" />
                  Feedback Type
                </label>
                <select
                  id="feedbackFilter"
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-[#174a7e] focus:border-[#174a7e]"
                  value={selectedFeedbackType}
                  onChange={(e) => setSelectedFeedbackType(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="thumbs_up">Thumbs Up</option>
                  <option value="thumbs_down">Thumbs Down</option>
                </select>
              </div>

              <div>
                <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={14} className="inline mr-1" />
                  From Date
                </label>
                <input
                  type="date"
                  id="fromDate"
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-[#174a7e] focus:border-[#174a7e]"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={14} className="inline mr-1" />
                  To Date
                </label>
                <input
                  type="date"
                  id="toDate"
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-[#174a7e] focus:border-[#174a7e]"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
                  <button
                    className="w-full px-4 py-2 bg-[#174a7e] text-white rounded-md shadow-sm hover:bg-[#082340] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#174a7e] disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                    onClick={handleApplyFilters}
                    disabled={!fromDate || !toDate || loading}
                  >
                    Apply
                  </button>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
                  <button
                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 text-sm transition-colors"
                    onClick={handleResetFilters}
                    disabled={loading}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-[#174a7e]" size={40} />
              <span className="ml-3 text-gray-600 text-lg">Loading data...</span>
            </div>
          )}

          {/* Table Display */}
          {!loading && (
            <>
              <div className="overflow-x-auto shadow-md rounded-lg mb-6 border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {logColumns.map((col) => (
                        <th
                          key={col.key}
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {currentTableData.length > 0 ? (
                      currentTableData.map((row, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}>
                          {logColumns.map((col) => (
                            <td key={`${index}-${col.key}`} className="px-4 py-3 text-sm text-gray-900">
                              <div className="max-w-xs">
                                {col.key === 'date_and_time' 
                                  ? formatDateTime(row[col.key])
                                  : col.key === 'ai_response' || col.key === 'query'
                                  ? <span title={row[col.key]}>{truncateText(row[col.key])}</span>
                                  : (row[col.key] || 'N/A')}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={logColumns.length} className="px-4 py-12 text-center text-sm text-gray-500">
                          {error ? 'Failed to load data. Please try again.' : 'No data found for the current filters.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredData.length > 0 && (
                <div className="flex justify-between items-center mt-4 flex-wrap gap-4">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-semibold">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span> to <span className="font-semibold">
                      {Math.min(currentPage * itemsPerPage, filteredData.length)}
                    </span> of <span className="font-semibold">{filteredData.length}</span> results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className="px-4 py-2 bg-[#174a7e] text-white rounded-md shadow-sm hover:bg-[#082340] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      onClick={() => handlePageChange('prev')}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <span className="text-sm font-medium text-gray-700 px-4">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      className="px-4 py-2 bg-[#174a7e] text-white rounded-md shadow-sm hover:bg-[#082340] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      onClick={() => handlePageChange('next')}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Report;
