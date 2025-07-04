import React, { useState } from 'react';
import { ArrowUpCircle, Plus, Search, User, Package, Calendar } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import OutwardModal from './OutwardModal';
import { Employee, ToolCategory, Tool, ToolPart, OutwardEntry } from '../../types';

interface ToolSelection {
  id: string;
  emp_id: string;
  category_id: string;
  tool_id: string;
  tool_part_id: string;
  quantity: number;
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

        // Create outward entry for each quantity
        for (let i = 0; i < selection.quantity; i++) {
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
            issued_date: new Date(),
            status: 'issued',
            remarks: selection.remarks,
            quantity: 1 // Each entry represents 1 unit
          };

          await addDocument(outwardData);
        }

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
        <div className="flex flex-col lg:flex-row gap-4">
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
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tool
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
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="text-blue-600" size={20} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-800">{entry.emp_name}</div>
                          <div className="text-sm text-gray-600">{entry.group} • {entry.destination}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="text-gray-400 mr-2" size={16} />
                        <div className="text-sm font-medium text-gray-800">{entry.tool_name}</div>
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