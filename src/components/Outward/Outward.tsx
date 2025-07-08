import React, { useState } from 'react';
import { ArrowUpCircle, Plus, Search, User, Package, Calendar, Grid3X3, List } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import OutwardModal from './OutwardModal';
import { Employee, ToolCategory, Tool, ToolPart, OutwardEntry } from '../../types';

interface ToolSelection {
  id: string;
  emp_id: string;
  category_id: string;
  tool_id: string;
  tool_part_id: string;
  remarks: string;
}

const Outward: React.FC = () => {
  const { documents: employees } = useFirestore('employees');
  const { documents: categories } = useFirestore('categories');
  const { documents: tools } = useFirestore('tools');
  const { documents: toolParts, updateDocument: updateToolPart } = useFirestore('tool_parts');
  const { documents: outwardEntries, addDocument } = useFirestore('outward');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  const filteredOutwardEntries = outwardEntries.filter((entry: OutwardEntry) => {
    const matchesSearch = entry.emp_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.tool_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.tool_unique_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.group.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    const issueDate = new Date(entry.issued_date);
    const today = new Date();
    const daysDiff = Math.ceil((today.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));

    switch (dateFilter) {
      case 'today':
        return daysDiff === 0;
      case 'week':
        return daysDiff <= 7;
      case 'month':
        return daysDiff <= 30;
      default:
        return entry.status === 'issued';
    }
  });

  const handleSubmit = async (selections: ToolSelection[]) => {
    try {
      // Process each tool selection
      for (const selection of selections) {
        const employee = employees.find((emp: Employee) => emp.id === selection.emp_id);
        const tool = tools.find((t: Tool) => t.id === selection.tool_id);
        const toolPart = toolParts.find((part: ToolPart) => part.id === selection.tool_part_id);

        if (!employee || !tool || !toolPart) {
          console.error('Missing data for selection:', selection);
          continue;
        }

        // Create outward entry
        const outwardData = {
          emp_id: employee.emp_id,
          emp_name: employee.emp_name,
          group: employee.group,
          destination: employee.destination,
          tool_id: tool.id,
          tool_name: tool.tool_name,
          tool_part_id: toolPart.id,
          tool_unique_id: toolPart.unique_id,
          category_id: tool.category_id,
          category_name: tool.category_name,
          tool_image_url: tool.image_url || '',
          issued_date: new Date(),
          status: 'issued',
          remarks: selection.remarks
        };

        await addDocument(outwardData);

        // Update tool part status
        await updateToolPart(toolPart.id, {
          status: 'issued'
        });
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error('Error processing outward:', error);
    }
  };

  const getDaysIssued = (issuedDate: Date) => {
    const today = new Date();
    const issued = new Date(issuedDate);
    const diffTime = Math.abs(today.getTime() - issued.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (days: number) => {
    if (days > 30) return 'bg-red-100 text-red-800';
    if (days > 14) return 'bg-orange-100 text-orange-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const todayIssues = outwardEntries.filter((entry: OutwardEntry) => {
    const today = new Date();
    const issueDate = new Date(entry.issued_date);
    return issueDate.toDateString() === today.toDateString() && entry.status === 'issued';
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <ArrowUpCircle className="text-orange-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Outward Management</h2>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors shadow-md"
        >
          <Plus size={20} />
          <span>Issue Tools</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by employee, tool name, tool ID, or group..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Issued Tools</option>
            <option value="today">Today's Issues</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                viewMode === 'table' 
                  ? 'bg-white text-orange-600 shadow-sm' 
                  : 'text-gray-600 hover:text-orange-600'
              }`}
            >
              <List size={16} />
              <span className="text-sm font-medium">Table</span>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                viewMode === 'card' 
                  ? 'bg-white text-orange-600 shadow-sm' 
                  : 'text-gray-600 hover:text-orange-600'
              }`}
            >
              <Grid3X3 size={16} />
              <span className="text-sm font-medium">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Issued</p>
              <p className="text-2xl font-bold text-orange-600">{filteredOutwardEntries.length}</p>
            </div>
            <ArrowUpCircle className="text-orange-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unique Employees</p>
              <p className="text-2xl font-bold text-blue-600">
                {new Set(filteredOutwardEntries.map((entry: OutwardEntry) => entry.emp_id)).size}
              </p>
            </div>
            <User className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-green-600">
                {new Set(filteredOutwardEntries.map((entry: OutwardEntry) => entry.category_name)).size}
              </p>
            </div>
            <Package className="text-green-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Issues</p>
              <p className="text-2xl font-bold text-purple-600">{todayIssues}</p>
            </div>
            <Calendar className="text-purple-600" size={24} />
          </div>
        </div>
      </div>

      {/* Outward Entries */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Issued Tools</h3>
            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
              {filteredOutwardEntries.length} issued
            </span>
          </div>
        </div>
        
        {viewMode === 'table' ? (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tool
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tool ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Issued
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOutwardEntries.map((entry: OutwardEntry) => {
                  const daysIssued = getDaysIssued(entry.issued_date);

                  return (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {entry.tool_image_url ? (
                            <img 
                              src={entry.tool_image_url} 
                              alt={entry.tool_name}
                              className="w-10 h-10 object-cover rounded-lg border mr-3"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Package className="text-gray-400 mr-3" size={20} />
                          )}
                          <div className="text-sm font-medium text-gray-800">{entry.tool_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <User className="text-blue-600" size={16} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-800">{entry.emp_name}</div>
                            <div className="text-xs text-gray-600">{entry.group} • {entry.destination}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600 font-mono">{entry.tool_unique_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{entry.category_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {new Date(entry.issued_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(daysIssued)}`}>
                          {daysIssued} days
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                          Issued
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
        ) : (
          /* Card View */
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOutwardEntries.map((entry: OutwardEntry) => {
                const daysIssued = getDaysIssued(entry.issued_date);

                return (
                  <div key={entry.id} className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200">
                    {/* Tool Image */}
                    {entry.tool_image_url && (
                      <div className="mb-4">
                        <img 
                          src={entry.tool_image_url} 
                          alt={entry.tool_name}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Tool Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">{entry.tool_name}</h3>
                        <p className="text-sm text-blue-600 font-mono font-medium">{entry.tool_unique_id}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(daysIssued)}`}>
                        {daysIssued}d
                      </span>
                    </div>

                    {/* Employee Info */}
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <div className="flex items-center mb-2">
                        <User className="text-blue-600 mr-2" size={16} />
                        <span className="text-sm font-medium text-blue-800">Issued To</span>
                      </div>
                      <div className="text-sm text-blue-900 font-semibold">{entry.emp_name}</div>
                      <div className="text-xs text-blue-700">{entry.group} • {entry.destination}</div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div>
                        <span className="text-gray-600">Category:</span>
                        <div className="font-medium text-gray-800">{entry.category_name}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Issue Date:</span>
                        <div className="font-medium text-gray-800">
                          {new Date(entry.issued_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Status and Remarks */}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full font-medium">
                          Issued
                        </span>
                        <span className="text-xs text-gray-500">
                          {daysIssued} days ago
                        </span>
                      </div>
                      {entry.remarks && (
                        <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
                          <strong>Remarks:</strong> {entry.remarks}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {filteredOutwardEntries.length === 0 && (
          <div className="text-center py-12">
            <ArrowUpCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No issued tools found</h3>
            <p className="text-gray-600">
              {searchTerm || dateFilter !== 'all' ? 'Try adjusting your search terms or filters' : 'No tools have been issued yet'}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      <OutwardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employees={employees}
        categories={categories}
        tools={tools}
        toolParts={toolParts}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default Outward;