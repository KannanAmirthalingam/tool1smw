import React, { useState } from 'react';
import { ArrowDownCircle, Search, User, Package, CheckCircle, Grid3X3, List } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import InwardModal from './InwardModal';
import ImageModal from '../Common/ImageModal';
import { OutwardEntry } from '../../types';

const Inward: React.FC = () => {
  const { documents: outwardEntries, updateDocument: updateOutward } = useFirestore('outward');
  const { documents: toolParts, updateDocument: updateToolPart } = useFirestore('tool_parts');
  const { addDocument: addHistory } = useFirestore('history');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [imageModal, setImageModal] = useState({ isOpen: false, imageUrl: '', toolName: '' });

  const pendingReturns = outwardEntries.filter((entry: OutwardEntry) => entry.status === 'issued');
  
  const filteredEntries = pendingReturns.filter((entry: OutwardEntry) => {
    const matchesSearch = entry.emp_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.tool_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.tool_unique_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSubmit = async (selectedEntryIds: string[], remarks: string) => {
    try {
      const selectedEntries = outwardEntries.filter((entry: OutwardEntry) => 
        selectedEntryIds.includes(entry.id)
      );

      for (const entry of selectedEntries) {
        // Update outward entry status
        await updateOutward(entry.id, {
          status: 'returned',
          returned_date: new Date(),
          return_remarks: remarks
        });

        // Update tool part status back to available
        await updateToolPart(entry.tool_part_id, {
          status: 'available'
        });

        // Add to history
        await addHistory({
          tool_id: entry.tool_id,
          tool_name: entry.tool_name,
          tool_part_id: entry.tool_part_id,
          tool_unique_id: entry.tool_unique_id,
          emp_id: entry.emp_id,
          emp_name: entry.emp_name,
          group: entry.group,
          destination: entry.destination,
          issued_date: entry.issued_date,
          returned_date: new Date(),
          tool_image_url: entry.tool_image_url || '',
          remarks: remarks
        });
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error('Error processing returns:', error);
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

  const handleImageClick = (imageUrl: string, toolName: string) => {
    setImageModal({ isOpen: true, imageUrl, toolName });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <ArrowDownCircle className="text-green-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Inward Management</h2>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <CheckCircle size={20} />
          <span>Process Returns</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search pending returns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                viewMode === 'table' 
                  ? 'bg-white text-green-600 shadow-sm' 
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              <List size={16} />
              <span className="text-sm font-medium">Table</span>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                viewMode === 'card' 
                  ? 'bg-white text-green-600 shadow-sm' 
                  : 'text-gray-600 hover:text-green-600'
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
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Returns</p>
              <p className="text-2xl font-bold text-orange-600">{filteredEntries.length}</p>
            </div>
            <ArrowDownCircle className="text-orange-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue ({'>'}30 days)</p>
              <p className="text-2xl font-bold text-red-600">
                {filteredEntries.filter((entry: OutwardEntry) => 
                  getDaysIssued(entry.issued_date) > 30
                ).length}
              </p>
            </div>
            <Package className="text-red-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unique Employees</p>
              <p className="text-2xl font-bold text-blue-600">
                {new Set(filteredEntries.map((entry: OutwardEntry) => entry.emp_id)).size}
              </p>
            </div>
            <User className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Days Out</p>
              <p className="text-2xl font-bold text-purple-600">
                {filteredEntries.length > 0 
                  ? Math.round(
                      filteredEntries.reduce((acc: number, entry: OutwardEntry) => 
                        acc + getDaysIssued(entry.issued_date), 0
                      ) / filteredEntries.length
                    )
                  : 0
                }
              </p>
            </div>
            <ArrowDownCircle className="text-purple-600" size={24} />
          </div>
        </div>
      </div>

      {/* Pending Returns */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Pending Returns</h3>
            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
              {filteredEntries.length} pending
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
                    Issue Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Issued
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.map((entry: OutwardEntry) => {
                  const daysIssued = getDaysIssued(entry.issued_date);
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {entry.tool_image_url ? (
                            <img 
                              src={entry.tool_image_url} 
                              alt={entry.tool_name}
                             className="w-10 h-10 object-cover rounded-lg border mr-3 cursor-pointer hover:opacity-90 transition-opacity"
                             onClick={() => handleImageClick(entry.tool_image_url!, entry.tool_name)}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Package className="text-gray-400 mr-3" size={20} />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-800">{entry.tool_name}</div>
                            <div className="text-xs text-gray-600">{entry.category_name}</div>
                          </div>
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
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          daysIssued > 30 ? 'bg-red-100 text-red-800' :
                          daysIssued > 14 ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {daysIssued > 30 ? 'High' : daysIssued > 14 ? 'Medium' : 'Normal'}
                        </span>
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
              {filteredEntries.map((entry: OutwardEntry) => {
                const daysIssued = getDaysIssued(entry.issued_date);
                const priorityColor = daysIssued > 30 ? 'red' : daysIssued > 14 ? 'orange' : 'green';
                const priorityLabel = daysIssued > 30 ? 'High Priority' : daysIssued > 14 ? 'Medium Priority' : 'Normal';

                return (
                  <div key={entry.id} className={`bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border-2 hover:shadow-lg transition-all duration-200 ${
                    priorityColor === 'red' ? 'border-red-200 hover:border-red-300' :
                    priorityColor === 'orange' ? 'border-orange-200 hover:border-orange-300' :
                    'border-green-200 hover:border-green-300'
                  }`}>
                    {/* Priority Badge */}
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                        priorityColor === 'red' ? 'bg-red-100 text-red-800' :
                        priorityColor === 'orange' ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {priorityLabel}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(daysIssued)}`}>
                        {daysIssued}d
                      </span>
                    </div>

                    {/* Tool Image */}
                    {entry.tool_image_url && (
                      <div className="mb-4">
                        <img 
                          src={entry.tool_image_url} 
                          alt={entry.tool_name}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handleImageClick(entry.tool_image_url!, entry.tool_name)}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Tool Header */}
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-800 mb-1">{entry.tool_name}</h3>
                      <p className="text-sm text-blue-600 font-mono font-medium">{entry.tool_unique_id}</p>
                      <p className="text-xs text-gray-600">{entry.category_name}</p>
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

                    {/* Issue Details */}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Issue Date:</span>
                        <span className="font-medium text-gray-800">
                          {new Date(entry.issued_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-gray-600">Days Out:</span>
                        <span className={`font-bold ${
                          priorityColor === 'red' ? 'text-red-600' :
                          priorityColor === 'orange' ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {daysIssued} days
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No pending returns</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'All tools have been returned'}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      <InwardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pendingEntries={filteredEntries}
        onSubmit={handleSubmit}
      />

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={() => setImageModal({ isOpen: false, imageUrl: '', toolName: '' })}
        imageUrl={imageModal.imageUrl}
        toolName={imageModal.toolName}
      />
    </div>
  );
};

export default Inward;