import React, { useState } from 'react';
import { Plus, Trash2, X, User, Package, CheckCircle } from 'lucide-react';
import SearchableSelect from '../Common/SearchableSelect';
import SecurityModal from '../Common/SecurityModal';
import { Employee, ToolCategory, Tool, ToolPart } from '../../types';

interface ToolSelection {
  id: string;
  emp_id: string;
  category_id: string;
  tool_id: string;
  tool_part_id: string;
  quantity: number;
  remarks: string;
}

interface OutwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  categories: ToolCategory[];
  tools: Tool[];
  toolParts: ToolPart[];
  onSubmit: (selections: ToolSelection[]) => void;
}

const OutwardModal: React.FC<OutwardModalProps> = ({
  isOpen,
  onClose,
  employees,
  categories,
  tools,
  toolParts,
  onSubmit
}) => {
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [toolSelections, setToolSelections] = useState<ToolSelection[]>([
    { id: '1', emp_id: '', category_id: '', tool_id: '', tool_part_id: '', quantity: 1, remarks: '' }
  ]);

  const addToolSelection = () => {
    const newId = Date.now().toString();
    setToolSelections([
      ...toolSelections,
      { id: newId, emp_id: '', category_id: '', tool_id: '', tool_part_id: '', quantity: 1, remarks: '' }
    ]);
  };

  const removeToolSelection = (id: string) => {
    if (toolSelections.length > 1) {
      setToolSelections(toolSelections.filter(selection => selection.id !== id));
    }
  };

  const updateToolSelection = (id: string, field: keyof ToolSelection, value: string | number) => {
    setToolSelections(toolSelections.map(selection => {
      if (selection.id === id) {
        const updated = { ...selection, [field]: value };
        
        // Reset dependent fields when parent changes
        if (field === 'category_id') {
          updated.tool_id = '';
          updated.tool_part_id = '';
        } else if (field === 'tool_id') {
          updated.tool_part_id = '';
        }
        
        return updated;
      }
      return selection;
    }));
  };

  const getAvailableTools = (categoryId: string) => {
    return tools.filter(tool => tool.category_id === categoryId);
  };

  const getAvailableToolParts = (toolId: string) => {
    return toolParts.filter(part => part.tool_id === toolId && part.status === 'available');
  };

  const getSelectedEmployee = (empId: string) => {
    return employees.find(emp => emp.id === empId);
  };

  const getSelectedTool = (toolId: string) => {
    return tools.find(tool => tool.id === toolId);
  };

  const getSelectedToolPart = (toolPartId: string) => {
    return toolParts.find(part => part.id === toolPartId);
  };

  const getTotalToolCount = () => {
    return toolSelections.reduce((total, selection) => total + (selection.quantity || 0), 0);
  };

  const getUniqueEmployeeCount = () => {
    return new Set(toolSelections.filter(s => s.emp_id).map(s => s.emp_id)).size;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all selections
    const isValid = toolSelections.every(selection => 
      selection.emp_id && selection.category_id && selection.tool_id && selection.tool_part_id && selection.quantity > 0
    );

    if (!isValid) {
      alert('Please complete all tool selections and ensure quantities are greater than 0');
      return;
    }

    setIsSecurityModalOpen(true);
  };

  const handleSecurityVerify = () => {
    onSubmit(toolSelections);
    setIsSecurityModalOpen(false);
    handleClose();
  };

  const handleClose = () => {
    setToolSelections([
      { id: '1', emp_id: '', category_id: '', tool_id: '', tool_part_id: '', quantity: 1, remarks: '' }
    ]);
    onClose();
  };

  const employeeOptions = employees.map(emp => ({
    value: emp.id,
    label: emp.emp_name,
    subtitle: `ID: ${emp.emp_id} • ${emp.group} • ${emp.destination}`
  }));

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.category_name,
    subtitle: cat.description || 'No description'
  }));

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-orange-50">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <Package className="mr-3 text-orange-600" size={24} />
                Issue Tools to Employees
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Select employees and tools to issue in a single transaction
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
          <div className="flex-1 overflow-y-auto max-h-[calc(95vh-200px)]">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Tool Selections */}
              <div className="space-y-6">
                {toolSelections.map((selection, index) => {
                  const selectedEmployee = getSelectedEmployee(selection.emp_id);
                  const availableTools = getAvailableTools(selection.category_id);
                  const availableToolParts = getAvailableToolParts(selection.tool_id);
                  const selectedTool = getSelectedTool(selection.tool_id);
                  const selectedToolPart = getSelectedToolPart(selection.tool_part_id);

                  const toolOptions = availableTools.map(tool => {
                    const availableCount = toolParts.filter(part => 
                      part.tool_id === tool.id && part.status === 'available'
                    ).length;
                    return {
                      value: tool.id,
                      label: tool.tool_name,
                      subtitle: `Available: ${availableCount} units`,
                      disabled: availableCount === 0
                    };
                  });

                  const toolPartOptions = availableToolParts.map(part => ({
                    value: part.id,
                    label: part.unique_id,
                    subtitle: 'Available for issue'
                  }));

                  return (
                    <div key={selection.id} className="border-2 border-gray-200 rounded-xl p-6 space-y-6 bg-gray-50">
                      {/* Selection Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-semibold text-sm">{index + 1}</span>
                          </div>
                          <h4 className="text-lg font-medium text-gray-800">
                            Tool Selection {index + 1}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={addToolSelection}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Add another tool"
                          >
                            <Plus size={18} />
                          </button>
                          {toolSelections.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeToolSelection(selection.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove this tool"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Employee Selection */}
                        <SearchableSelect
                          label="Select Employee"
                          placeholder="Choose an employee"
                          value={selection.emp_id}
                          onChange={(value) => updateToolSelection(selection.id, 'emp_id', value)}
                          options={employeeOptions}
                          required
                        />

                        {/* Category Selection */}
                        <SearchableSelect
                          label="Select Category"
                          placeholder="Choose a category"
                          value={selection.category_id}
                          onChange={(value) => updateToolSelection(selection.id, 'category_id', value)}
                          options={categoryOptions}
                          required
                        />

                        {/* Tool Selection */}
                        <SearchableSelect
                          label="Select Tool"
                          placeholder="Choose a tool"
                          value={selection.tool_id}
                          onChange={(value) => updateToolSelection(selection.id, 'tool_id', value)}
                          options={toolOptions}
                          disabled={!selection.category_id}
                          required
                        />

                        {/* Tool Part Selection */}
                        <SearchableSelect
                          label="Select Specific Tool ID"
                          placeholder="Choose a specific tool"
                          value={selection.tool_part_id}
                          onChange={(value) => updateToolSelection(selection.id, 'tool_part_id', value)}
                          options={toolPartOptions}
                          disabled={!selection.tool_id}
                          required
                        />

                        {/* Quantity */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={selection.quantity}
                            onChange={(e) => updateToolSelection(selection.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            required
                          />
                        </div>

                        {/* Remarks */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Remarks
                          </label>
                          <textarea
                            value={selection.remarks}
                            onChange={(e) => updateToolSelection(selection.id, 'remarks', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            rows={2}
                            placeholder="Any additional notes..."
                          />
                        </div>
                      </div>

                      {/* Employee Details */}
                      {selectedEmployee && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center mb-3">
                            <User className="text-blue-600 mr-2" size={20} />
                            <h5 className="font-medium text-blue-800">Employee Details</h5>
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-blue-600 font-medium">Name:</span>
                              <div className="text-blue-800">{selectedEmployee.emp_name}</div>
                            </div>
                            <div>
                              <span className="text-blue-600 font-medium">ID:</span>
                              <div className="text-blue-800">{selectedEmployee.emp_id}</div>
                            </div>
                            <div>
                              <span className="text-blue-600 font-medium">Group:</span>
                              <div className="text-blue-800">{selectedEmployee.group}</div>
                            </div>
                            <div>
                              <span className="text-blue-600 font-medium">Destination:</span>
                              <div className="text-blue-800">{selectedEmployee.destination}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tool Details */}
                      {selectedToolPart && selectedTool && (
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center mb-3">
                            <Package className="text-green-600 mr-2" size={20} />
                            <h5 className="font-medium text-green-800">Selected Tool Details</h5>
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-green-600 font-medium">Tool Name:</span>
                              <div className="text-green-800">{selectedTool.tool_name}</div>
                            </div>
                            <div>
                              <span className="text-green-600 font-medium">Unique ID:</span>
                              <div className="text-green-800 font-mono">{selectedToolPart.unique_id}</div>
                            </div>
                            <div>
                              <span className="text-green-600 font-medium">Category:</span>
                              <div className="text-green-800">{selectedTool.category_name}</div>
                            </div>
                            <div>
                              <span className="text-green-600 font-medium">Quantity:</span>
                              <div className="text-green-800">{selection.quantity} unit{selection.quantity > 1 ? 's' : ''}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Tool Button */}
              <div className="flex justify-center py-4">
                <button
                  type="button"
                  onClick={addToolSelection}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  <Plus size={20} />
                  <span>Add Another Tool</span>
                </button>
              </div>

              {/* Summary */}
              <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
                <div className="flex items-center mb-4">
                  <CheckCircle className="text-orange-600 mr-2" size={20} />
                  <h4 className="font-semibold text-orange-800">Issue Summary</h4>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-orange-600 font-medium">Total Tools:</span>
                    <div className="text-orange-800 text-lg font-bold">{toolSelections.length}</div>
                  </div>
                  <div>
                    <span className="text-orange-600 font-medium">Total Quantity:</span>
                    <div className="text-orange-800 text-lg font-bold">{getTotalToolCount()}</div>
                  </div>
                  <div>
                    <span className="text-orange-600 font-medium">Unique Employees:</span>
                    <div className="text-orange-800 text-lg font-bold">{getUniqueEmployeeCount()}</div>
                  </div>
                  <div>
                    <span className="text-orange-600 font-medium">Issue Date:</span>
                    <div className="text-orange-800 text-lg font-bold">{new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
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
              className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Issue {getTotalToolCount()} Tool{getTotalToolCount() > 1 ? 's' : ''} to {getUniqueEmployeeCount()} Employee{getUniqueEmployeeCount() > 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Security Modal */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        onVerify={handleSecurityVerify}
        title="Issue Tools"
        message={`Please verify your credentials to issue ${getTotalToolCount()} tool${getTotalToolCount() > 1 ? 's' : ''} to ${getUniqueEmployeeCount()} employee${getUniqueEmployeeCount() > 1 ? 's' : ''}.`}
      />
    </>
  );
};

export default OutwardModal;