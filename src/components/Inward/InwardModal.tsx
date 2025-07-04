import React, { useState } from 'react';
import { X, CheckCircle, Package, User, Calendar } from 'lucide-react';
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

  const handleEntryToggle = (entryId: string) => {
    setSelectedEntries(prev => 
      prev.includes(entryId) 
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEntries.length === pendingEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(pendingEntries.map(entry => entry.id));
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Return Tools</h3>
              <p className="text-sm text-gray-600 mt-1">
                Select tools to return ({pendingEntries.length} pending returns)
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Select All */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={selectedEntries.length === pendingEntries.length && pendingEntries.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="select-all" className="text-sm font-medium text-gray-700">
                    Select All ({pendingEntries.length} tools)
                  </label>
                </div>
                <span className="text-sm text-gray-600">
                  {selectedEntries.length} selected
                </span>
              </div>

              {/* Pending Returns List */}
              <div className="space-y-3">
                {pendingEntries.map((entry) => {
                  const daysIssued = getDaysIssued(entry.issued_date);
                  const isSelected = selectedEntries.includes(entry.id);

                  return (
                    <div
                      key={entry.id}
                      className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleEntryToggle(entry.id)}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleEntryToggle(entry.id)}
                          className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1"
                        />

                        {/* Content */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Employee Info */}
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="text-blue-600" size={20} />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-800">{entry.emp_name}</div>
                              <div className="text-xs text-gray-600">{entry.group}</div>
                            </div>
                          </div>

                          {/* Tool Info */}
                          <div className="flex items-center space-x-3">
                            <Package className="text-gray-400" size={16} />
                            <div>
                              <div className="text-sm font-medium text-gray-800">{entry.tool_name}</div>
                              <div className="text-xs text-blue-600 font-mono">{entry.tool_unique_id}</div>
                            </div>
                          </div>

                          {/* Issue Date */}
                          <div className="flex items-center space-x-3">
                            <Calendar className="text-gray-400" size={16} />
                            <div>
                              <div className="text-sm text-gray-600">
                                {new Date(entry.issued_date).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">Issue Date</div>
                            </div>
                          </div>

                          {/* Days Issued */}
                          <div className="flex items-center justify-end">
                            <span className={`px-3 py-1 text-xs rounded-full border ${getStatusColor(daysIssued)}`}>
                              {daysIssued} days
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Additional Details (when selected) */}
                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-green-200">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-green-600">Employee ID:</span>
                              <span className="ml-2 text-green-800">{entry.emp_id}</span>
                            </div>
                            <div>
                              <span className="text-green-600">Destination:</span>
                              <span className="ml-2 text-green-800">{entry.destination}</span>
                            </div>
                            <div>
                              <span className="text-green-600">Category:</span>
                              <span className="ml-2 text-green-800">{entry.category_name}</span>
                            </div>
                            <div>
                              <span className="text-green-600">Issue Remarks:</span>
                              <span className="ml-2 text-green-800">{entry.remarks || 'None'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {pendingEntries.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No pending returns</h3>
                  <p className="text-gray-600">All tools have been returned</p>
                </div>
              )}

              {/* Global Remarks */}
              {selectedEntries.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Return Remarks (Applied to all selected tools)
                  </label>
                  <textarea
                    value={globalRemarks}
                    onChange={(e) => setGlobalRemarks(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="Condition of tools, any damage, etc..."
                  />
                </div>
              )}

              {/* Summary */}
              {selectedEntries.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">Return Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-green-600">Tools to return:</span>
                      <span className="ml-2 font-medium text-green-800">{selectedEntries.length}</span>
                    </div>
                    <div>
                      <span className="text-green-600">Unique employees:</span>
                      <span className="ml-2 font-medium text-green-800">
                        {new Set(
                          pendingEntries
                            .filter(entry => selectedEntries.includes(entry.id))
                            .map(entry => entry.emp_id)
                        ).size}
                      </span>
                    </div>
                    <div>
                      <span className="text-green-600">Categories:</span>
                      <span className="ml-2 font-medium text-green-800">
                        {new Set(
                          pendingEntries
                            .filter(entry => selectedEntries.includes(entry.id))
                            .map(entry => entry.category_name)
                        ).size}
                      </span>
                    </div>
                    <div>
                      <span className="text-green-600">Return date:</span>
                      <span className="ml-2 font-medium text-green-800">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {pendingEntries.length > 0 && (
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={selectedEntries.length === 0}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Return {selectedEntries.length} Tool{selectedEntries.length > 1 ? 's' : ''}
                  </button>
                </div>
              )}
            </form>
          </div>
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