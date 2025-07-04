import React, { useState } from 'react';
import { X, CheckCircle, Package, User, Calendar, ArrowDownCircle } from 'lucide-react';
import SecurityModal from '../Common/SecurityModal';
import { OutwardEntry } from '../../types';

interface InwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingEntries: OutwardEntry[];
  onSubmit: (selectedEntries: string[], remarks: string) => void;
}

const InwardModal: React.FC<InwardModalProps> = ({
  isOpen,
  onClose,
  pendingEntries,
  onSubmit
}) => {
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [globalRemarks, setGlobalRemarks] = useState('');
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter entries based on search
  const filteredEntries = pendingEntries.filter(entry =>
    entry.emp_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.tool_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.tool_unique_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEntryToggle = (entryId: string) => {
    setSelectedEntries(prev => 
      prev.includes(entryId) 
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEntries.length === filteredEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(filteredEntries.map(entry => entry.id));
    }
  };

  const handleSelectByEmployee = (empId: string) => {
    const employeeEntries = filteredEntries.filter(entry => entry.emp_id === empId);
    const allSelected = employeeEntries.every(entry => selectedEntries.includes(entry.id));
    
    if (allSelected) {
      // Deselect all for this employee
      setSelectedEntries(prev => prev.filter(id => !employeeEntries.map(e => e.id).includes(id)));
    } else {
      // Select all for this employee
      const newSelections = employeeEntries.map(entry => entry.id);
      setSelectedEntries(prev => [...new Set([...prev, ...newSelections])]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedEntries.length === 0) {
      alert('Please select at least one tool to return');
      return;
    }

    setIsSecurityModalOpen(true);
  };

  const handleSecurityVerify = () => {
    onSubmit(selectedEntries, globalRemarks);
    setIsSecurityModalOpen(false);
    handleClose();
  };

  const handleClose = () => {
    setSelectedEntries([]);
    setGlobalRemarks('');
    setSearchTerm('');
    onClose();
  };

  const getDaysIssued = (issuedDate: Date) => {
    const today = new Date();
    const issued = new Date(issuedDate);
    const diffTime = Math.abs(today.getTime() - issued.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (days: number) => {
    if (days > 30) return 'bg-red-100 text-red-800 border-red-200';
    if (days > 14) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getPriorityColor = (days: number) => {
    if (days > 30) return 'bg-red-500';
    if (days > 14) return 'bg-orange-500';
    return 'bg-green-500';
  };

  // Group entries by employee
  const groupedEntries = filteredEntries.reduce((groups, entry) => {
    const key = entry.emp_id;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(entry);
    return groups;
  }, {} as Record<string, OutwardEntry[]>);

  const getSelectedCount = () => selectedEntries.length;
  const getTotalQuantity = () => {
    return filteredEntries.filter(entry => selectedEntries.includes(entry.id)).length;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-green-50">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <ArrowDownCircle className="mr-3 text-green-600" size={24} />
                Return Tools from Employees
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Select tools to return from pending outward entries ({pendingEntries.length} pending)
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Search and Controls */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by employee, tool name, or tool ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {selectedEntries.length === filteredEntries.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>

            {/* Selection Summary */}
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Selected Tools:</span>
                  <span className="ml-2 font-bold text-green-600">{getSelectedCount()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Quantity:</span>
                  <span className="ml-2 font-bold text-green-600">{getTotalQuantity()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Unique Employees:</span>
                  <span className="ml-2 font-bold text-green-600">
                    {new Set(
                      filteredEntries
                        .filter(entry => selectedEntries.includes(entry.id))
                        .map(entry => entry.emp_id)
                    ).size}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Return Date:</span>
                  <span className="ml-2 font-bold text-green-600">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto max-h-[calc(95vh-300px)]">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Grouped Entries by Employee */}
              {Object.keys(groupedEntries).length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No pending returns found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'Try adjusting your search terms' : 'All tools have been returned'}
                  </p>
                </div>
              ) : (
                Object.entries(groupedEntries).map(([empId, entries]) => {
                  const employee = entries[0]; // Get employee info from first entry
                  const employeeSelected = entries.every(entry => selectedEntries.includes(entry.id));
                  const someSelected = entries.some(entry => selectedEntries.includes(entry.id));

                  return (
                    <div key={empId} className="border-2 border-gray-200 rounded-xl overflow-hidden">
                      {/* Employee Header */}
                      <div className="bg-blue-50 p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <input
                              type="checkbox"
                              checked={employeeSelected}
                              onChange={() => handleSelectByEmployee(empId)}
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="text-blue-600" size={24} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800">{employee.emp_name}</h4>
                                <p className="text-sm text-gray-600">
                                  ID: {employee.emp_id} • {employee.group} • {employee.destination}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              {entries.filter(entry => selectedEntries.includes(entry.id)).length} of {entries.length} selected
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectByEmployee(empId)}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              {employeeSelected ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Employee's Tools */}
                      <div className="divide-y divide-gray-200">
                        {entries.map((entry) => {
                          const daysIssued = getDaysIssued(entry.issued_date);
                          const isSelected = selectedEntries.includes(entry.id);

                          return (
                            <div
                              key={entry.id}
                              className={`p-4 transition-all cursor-pointer hover:bg-gray-50 ${
                                isSelected ? 'bg-green-50 border-l-4 border-green-500' : ''
                              }`}
                              onClick={() => handleEntryToggle(entry.id)}
                            >
                              <div className="flex items-center space-x-4">
                                {/* Checkbox */}
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleEntryToggle(entry.id)}
                                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />

                                {/* Priority Indicator */}
                                <div className={`w-3 h-3 rounded-full ${getPriorityColor(daysIssued)}`}></div>

                                {/* Tool Info */}
                                <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4">
                                  <div className="flex items-center space-x-3">
                                    <Package className="text-gray-400" size={16} />
                                    <div>
                                      <div className="font-medium text-gray-800">{entry.tool_name}</div>
                                      <div className="text-sm text-gray-600">{entry.category_name}</div>
                                    </div>
                                  </div>

                                  <div>
                                    <div className="text-sm text-gray-600">Tool ID</div>
                                    <div className="font-mono text-blue-600 font-medium">{entry.tool_unique_id}</div>
                                  </div>

                                  <div>
                                    <div className="text-sm text-gray-600">Issue Date</div>
                                    <div className="text-gray-800">{new Date(entry.issued_date).toLocaleDateString()}</div>
                                  </div>

                                  <div>
                                    <div className="text-sm text-gray-600">Days Out</div>
                                    <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(daysIssued)}`}>
                                      {daysIssued} days
                                    </span>
                                  </div>

                                  <div>
                                    <div className="text-sm text-gray-600">Issue Remarks</div>
                                    <div className="text-gray-800 text-sm truncate">{entry.remarks || 'None'}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Global Remarks */}
              {selectedEntries.length > 0 && (
                <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                  <h4 className="font-medium text-green-800 mb-4">Return Remarks</h4>
                  <textarea
                    value={globalRemarks}
                    onChange={(e) => setGlobalRemarks(e.target.value)}
                    className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="Condition of tools, any damage, maintenance notes, etc..."
                  />
                  <p className="text-sm text-green-600 mt-2">
                    These remarks will be applied to all {selectedEntries.length} selected tool{selectedEntries.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          {filteredEntries.length > 0 && (
            <div className="flex space-x-4 p-6 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={selectedEntries.length === 0}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Return {getSelectedCount()} Tool{getSelectedCount() > 1 ? 's' : ''} from {new Set(
                  filteredEntries
                    .filter(entry => selectedEntries.includes(entry.id))
                    .map(entry => entry.emp_id)
                ).size} Employee{new Set(
                  filteredEntries
                    .filter(entry => selectedEntries.includes(entry.id))
                    .map(entry => entry.emp_id)
                ).size > 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Security Modal */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        onVerify={handleSecurityVerify}
        title="Return Tools"
        message={`Please verify your credentials to return ${selectedEntries.length} tool${selectedEntries.length > 1 ? 's' : ''}.`}
      />
    </>
  );
};

export default InwardModal;