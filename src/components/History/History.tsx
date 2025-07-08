import React, { useState } from 'react';
import { History as HistoryIcon, Search, User, Package, Calendar, Download, Filter } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { ToolHistory } from '../../types';
import { format } from 'date-fns';

const History: React.FC = () => {
  const { documents: history, loading } = useFirestore('history');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('returned_date');

  const filteredHistory = history.filter((entry: ToolHistory) => {
    const matchesSearch = entry.emp_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.tool_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.tool_unique_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    const returnedDate = new Date(entry.returned_date);
    const today = new Date();
    const daysDiff = Math.ceil((today.getTime() - returnedDate.getTime()) / (1000 * 60 * 60 * 24));

    switch (dateFilter) {
      case 'today':
        return daysDiff === 0;
      case 'week':
        return daysDiff <= 7;
      case 'month':
        return daysDiff <= 30;
      case 'year':
        return daysDiff <= 365;
      default:
        return true;
    }
  }).sort((a: ToolHistory, b: ToolHistory) => {
    const aDate = new Date(a[sortBy as keyof ToolHistory] as Date);
    const bDate = new Date(b[sortBy as keyof ToolHistory] as Date);
    return bDate.getTime() - aDate.getTime();
  });

  const calculateDuration = (issued: Date, returned: Date) => {
    const diffTime = Math.abs(new Date(returned).getTime() - new Date(issued).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const exportToCSV = () => {
    const csvData = [
      ['Tool Name', 'Tool ID', 'Employee Name', 'Group', 'Destination', 'Issued Date', 'Returned Date', 'Duration (Days)', 'Remarks'],
      ...filteredHistory.map((entry: ToolHistory) => [
        entry.tool_name,
        entry.tool_unique_id,
        entry.emp_name,
        entry.group,
        entry.destination,
        format(new Date(entry.issued_date), 'yyyy-MM-dd'),
        format(new Date(entry.returned_date), 'yyyy-MM-dd'),
        calculateDuration(entry.issued_date, entry.returned_date),
        entry.remarks || 'No remarks'
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `tool_history_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <HistoryIcon className="text-purple-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Tool History</h2>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Download size={20} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="returned_date">Sort by Return Date</option>
            <option value="issued_date">Sort by Issue Date</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Returns</p>
              <p className="text-2xl font-bold text-gray-800">{filteredHistory.length}</p>
            </div>
            <Package className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Duration</p>
              <p className="text-2xl font-bold text-gray-800">
                {filteredHistory.length > 0 
                  ? Math.round(
                      filteredHistory.reduce((acc: number, entry: ToolHistory) => 
                        acc + calculateDuration(entry.issued_date, entry.returned_date), 0
                      ) / filteredHistory.length
                    )
                  : 0
                } days
              </p>
            </div>
            <Calendar className="text-green-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unique Tools</p>
              <p className="text-2xl font-bold text-gray-800">
                {new Set(filteredHistory.map((entry: ToolHistory) => entry.tool_unique_id)).size}
              </p>
            </div>
            <Package className="text-orange-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unique Users</p>
              <p className="text-2xl font-bold text-gray-800">
                {new Set(filteredHistory.map((entry: ToolHistory) => entry.emp_id)).size}
              </p>
            </div>
            <User className="text-purple-600" size={24} />
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tool
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tool ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issued Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Returned Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHistory.map((entry: ToolHistory) => {
                const duration = calculateDuration(entry.issued_date, entry.returned_date);
                return (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {(entry as any).tool_image_url ? (
                          <img 
                            src={(entry as any).tool_image_url} 
                            alt={entry.tool_name}
                            className="w-8 h-8 object-cover rounded border mr-3"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Package className="text-gray-400 mr-3" size={16} />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-800">{entry.tool_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600 font-mono">{entry.tool_unique_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="text-gray-400 mr-3" size={16} />
                        <div>
                          <div className="text-sm font-medium text-gray-800">{entry.emp_name}</div>
                          <div className="text-sm text-gray-600">{entry.group} • {entry.destination}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {format(new Date(entry.issued_date), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {format(new Date(entry.returned_date), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        duration > 30 ? 'bg-red-100 text-red-800' :
                        duration > 14 ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {duration} days
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {entry.remarks || 'No remarks'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredHistory.length === 0 && (
          <div className="text-center py-12">
            <HistoryIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No history found</h3>
            <p className="text-gray-600">
              {searchTerm || dateFilter !== 'all' ? 'Try adjusting your filters' : 'No tools have been returned yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;