import React, { useState } from 'react';
import { X, CheckCircle, Package, User, Calendar, ArrowDownCircle, Search } from 'lucide-react';
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
      setSelectedEntries(prev => prev.filter(id => !employeeEntries.map(e => e.id).includes(id)));
    } else {
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col">
          {/* Fixed Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-green-50 rounded-t-xl flex-shrink-0">
            <div className="flex items-center space-x-3">
              <ArrowDownCircle className="text-green-600" size={20} />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Return Tools</h3>
                <p className="text-xs text-gray-600">{pendingEntries.length} pending returns</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Fixed Search and Controls */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search employee, tool, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
              >
                {selectedEntries.length === filteredEntries.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Summary */}
            <div className="mt-3 flex items-center justify-between text-xs">
              <div className="flex space-x-4">
                <span className="text-gray-600">Selected: <strong className="text-green-600">{getSelectedCount()}</strong></span>
                <span className="text-gray-600">Employees: <strong className="text-green-600">
                  {new Set(filteredEntries.filter(entry => selectedEntries.includes(entry.id)).map(entry => entry.emp_id)).size}
                </strong></span>
              </div>
              <span className="text-gray-600">Return Date: <strong>{new Date().toLocaleDateString()}</strong></span>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4 space-y-3">
              {Object.keys(groupedEntries).length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                  <h3 className="text-sm font-medium text-gray-800 mb-1">No pending returns found</h3>
                  <p className="text-xs text-gray-600">
                    {searchTerm ? 'Try adjusting your search terms' : 'All tools have been returned'}
                  </p>
                </div>
              ) : (
                Object.entries(groupedEntries).map(([empId, entries]) => {
                  const employee = entries[0];
                  const employeeSelected = entries.every(entry => selectedEntries.includes(entry.id));

                  return (
                    <div key={empId} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Employee Header */}
                      <div className="bg-blue-50 p-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={employeeSelected}
                              onChange={() => handleSelectByEmployee(empId)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="text-blue-600" size={16} />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-800">{employee.emp_name}</h4>
                                <p className="text-xs text-gray-600">{employee.emp_id} • {employee.group}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600">
                            {entries.filter(entry => selectedEntries.includes(entry.id)).length}/{entries.length} selected
                          </div>
                        </div>
                      </div>

                      {/* Tools List */}
                      <div className="divide-y divide-gray-200">
                        {entries.map((entry) => {
                          const daysIssued = getDaysIssued(entry.issued_date);
                          const isSelected = selectedEntries.includes(entry.id);

                          return (
                            <div
                              key={entry.id}
                              className={`p-3 transition-all cursor-pointer hover:bg-gray-50 ${
                                isSelected ? 'bg-green-50 border-l-2 border-green-500' : ''
                              }`}
                              onClick={() => handleEntryToggle(entry.id)}
                            >
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleEntryToggle(entry.id)}
                                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />
                                <div className={`w-2 h-2 rounded-full ${getPriorityColor(daysIssued)}`}></div>
                                
                                <div className="flex-1 grid grid-cols-4 gap-3 text-xs">
                                  <div className="flex items-center space-x-2">
                                    <Package className="text-gray-400" size={12} />
                                    <div>
                                      <div className="font-medium text-gray-800">{entry.tool_name}</div>
                                      <div className="text-gray-500">{entry.category_name}</div>
                                    </div>
                                  </div>

                                  <div>
                                    <div className="text-gray-500">Tool ID</div>
                                    <div className="font-mono text-blue-600 font-medium">{entry.tool_unique_id}</div>
                                  </div>

                                  <div>
                                    <div className="text-gray-500">Issue Date</div>
                                    <div className="text-gray-800">{new Date(entry.issued_date).toLocaleDateString()}</div>
                                  </div>

                                  <div className="text-right">
                                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(daysIssued)}`}>
                                      {daysIssued}d
                                    </span>
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

              {/* Remarks Section */}
              {selectedEntries.length > 0 && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200 sticky bottom-0 z-10">
                  <label className="block text-sm font-medium text-green-800 mb-2">
                    Return Remarks (for {selectedEntries.length} tool{selectedEntries.length > 1 ? 's' : ''})
                  </label>
                  <textarea
                    value={globalRemarks}
                    onChange={(e) => setGlobalRemarks(e.target.value)}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none"
                    rows={3}
                    placeholder="Tool condition, damage notes, etc..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Fixed Footer */}
          {filteredEntries.length > 0 && (
            <div className="flex space-x-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex-shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={selectedEntries.length === 0}
                className="flex-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Return {getSelectedCount()} Tool{getSelectedCount() > 1 ? 's' : ''}
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