import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import SearchableSelect from '../Common/SearchableSelect';
import SecurityModal from '../Common/SecurityModal';
import { Employee, ToolCategory, Tool, ToolPart } from '../../types';

interface ToolSelection {
  id: string;
  emp_id: string;
  category_id: string;
  tool_id: string;
  tool_part_id: string;
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
    { id: '1', emp_id: '', category_id: '', tool_id: '', tool_part_id: '', remarks: '' }
  ]);

  const addToolSelection = () => {
    const newId = (toolSelections.length + 1).toString();
    setToolSelections([
      ...toolSelections,
      { id: newId, emp_id: '', category_id: '', tool_id: '', tool_part_id: '', remarks: '' }
    ]);
  };

  const removeToolSelection = (id: string) => {
    if (toolSelections.length > 1) {
      setToolSelections(toolSelections.filter(selection => selection.id !== id));
    }
  };

  const updateToolSelection = (id: string, field: keyof ToolSelection, value: string) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all selections
    const isValid = toolSelections.every(selection => 
      selection.emp_id && selection.category_id && selection.tool_id && selection.tool_part_id
    );

    if (!isValid) {
      alert('Please complete all tool selections');
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
      { id: '1', emp_id: '', category_id: '', tool_id: '', tool_part_id: '', remarks: '' }
    ]);
    onClose();
  };

  const employeeOptions = employees.map(emp => ({
    value: emp.id,
    label: `${emp.emp_name} (${emp.emp_id})`
  }));

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.category_name
  }));

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">Issue Tools</h3>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    label: `${tool.tool_name} (Available: ${availableCount})`,
                    disabled: availableCount === 0
                  };
                });

                const toolPartOptions = availableToolParts.map(part => ({
                  value: part.id,
                  label: `${part.unique_id} (Available)`
                }));

                return (
                  <div key={selection.id} className="border border-gray-200 rounded-lg p-6 space-y-4">
                    {/* Header for each tool selection */}
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-gray-800">
                        Tool Selection {index + 1}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {toolSelections.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeToolSelection(selection.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>

                    {/* Employee Details */}
                    {selectedEmployee && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h5 className="font-medium text-blue-800 mb-2">Employee Details</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-blue-600">Name:</span>
                            <span className="ml-2 text-blue-800">{selectedEmployee.emp_name}</span>
                          </div>
                          <div>
                            <span className="text-blue-600">ID:</span>
                            <span className="ml-2 text-blue-800">{selectedEmployee.emp_id}</span>
                          </div>
                          <div>
                            <span className="text-blue-600">Group:</span>
                            <span className="ml-2 text-blue-800">{selectedEmployee.group}</span>
                          </div>
                          <div>
                            <span className="text-blue-600">Destination:</span>
                            <span className="ml-2 text-blue-800">{selectedEmployee.destination}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tool Details */}
                    {selectedToolPart && selectedTool && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h5 className="font-medium text-green-800 mb-2">Selected Tool Details</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-green-600">Tool Name:</span>
                            <span className="ml-2 text-green-800">{selectedTool.tool_name}</span>
                          </div>
                          <div>
                            <span className="text-green-600">Unique ID:</span>
                            <span className="ml-2 text-green-800 font-mono">{selectedToolPart.unique_id}</span>
                          </div>
                          <div>
                            <span className="text-green-600">Category:</span>
                            <span className="ml-2 text-green-800">{selectedTool.category_name}</span>
                          </div>
                          <div>
                            <span className="text-green-600">Status:</span>
                            <span className="ml-2 text-green-800 capitalize">{selectedToolPart.status}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Remarks */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Remarks
                      </label>
                      <textarea
                        value={selection.remarks}
                        onChange={(e) => updateToolSelection(selection.id, 'remarks', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        rows={2}
                        placeholder="Any additional notes..."
                      />
                    </div>
                  </div>
                );
              })}

              {/* Add Tool Button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={addToolSelection}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} />
                  <span>Add Another Tool</span>
                </button>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Summary</h4>
                <p className="text-sm text-gray-600">
                  Total tools to be issued: <span className="font-medium">{toolSelections.length}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Unique employees: <span className="font-medium">
                    {new Set(toolSelections.filter(s => s.emp_id).map(s => s.emp_id)).size}
                  </span>
                </p>
              </div>

              {/* Action Buttons */}
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
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Issue {toolSelections.length} Tool{toolSelections.length > 1 ? 's' : ''}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Security Modal */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        onVerify={handleSecurityVerify}
        title="Issue Tools"
        message={`Please verify your credentials to issue ${toolSelections.length} tool${toolSelections.length > 1 ? 's' : ''}.`}
      />
    </>
  );
};

export default OutwardModal;