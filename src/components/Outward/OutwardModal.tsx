import React, { useState } from 'react';
import { Plus, Trash2, X, User, Package, CheckCircle, AlertCircle, Copy } from 'lucide-react';
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
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [toolSelections, setToolSelections] = useState<ToolSelection[]>([
    { id: '1', emp_id: '', category_id: '', tool_id: '', tool_part_id: '', remarks: '' }
  ]);

  const addToolSelection = () => {
    const newId = Date.now().toString();
    setToolSelections([
      ...toolSelections,
      { id: newId, emp_id: selectedEmployee, category_id: '', tool_id: '', tool_part_id: '', remarks: '' }
    ]);
  };

  const duplicateToolSelection = (sourceId: string) => {
    const sourceSelection = toolSelections.find(s => s.id === sourceId);
    if (sourceSelection) {
      const newId = Date.now().toString();
      const duplicated = {
        ...sourceSelection,
        id: newId,
        tool_part_id: '', // Reset tool part ID for new selection
        remarks: ''
      };
      setToolSelections([...toolSelections, duplicated]);
    }
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

  const handleEmployeeChange = (empId: string) => {
    setSelectedEmployee(empId);
    // Update all tool selections with the new employee
    setToolSelections(toolSelections.map(selection => ({
      ...selection,
      emp_id: empId
    })));
  };

  const getAvailableTools = (categoryId: string) => {
    return tools.filter(tool => tool.category_id === categoryId);
  };

  const getAvailableToolParts = (toolId: string) => {
    // Filter out already selected tool parts
    const selectedPartIds = toolSelections.map(s => s.tool_part_id).filter(Boolean);
    return toolParts.filter(part => 
      part.tool_id === toolId && 
      part.status === 'available' && 
      !selectedPartIds.includes(part.id)
    );
  };

  const getSelectedEmployeeData = () => {
    return employees.find(emp => emp.id === selectedEmployee);
  };

  const getSelectedTool = (toolId: string) => {
    return tools.find(tool => tool.id === toolId);
  };

  const getSelectedToolPart = (toolPartId: string) => {
    return toolParts.find(part => part.id === toolPartId);
  };

  const getTotalToolCount = () => {
    return toolSelections.filter(s => s.tool_part_id).length;
  };

  const getToolSelectionSummary = () => {
    const toolCounts = toolSelections.reduce((acc, selection) => {
      if (selection.tool_id) {
        const tool = getSelectedTool(selection.tool_id);
        if (tool) {
          acc[tool.tool_name] = (acc[tool.tool_name] || 0) + (selection.tool_part_id ? 1 : 0);
        }
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(toolCounts).filter(([_, count]) => count > 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate employee selection
    if (!selectedEmployee) {
      alert('Please select an employee');
      return;
    }

    // Validate all tool selections
    const isValid = toolSelections.every(selection => 
      selection.category_id && selection.tool_id && selection.tool_part_id
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
    setSelectedEmployee('');
    setToolSelections([
      { id: '1', emp_id: '', category_id: '', tool_id: '', tool_part_id: '', remarks: '' }
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

  const selectedEmployeeData = getSelectedEmployeeData();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold flex items-center">
                  <Package className="mr-3" size={28} />
                  Issue Tools to Employee
                </h3>
                <p className="text-orange-100 mt-2">
                  Select an employee and multiple tools to issue in a single transaction
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto max-h-[calc(95vh-200px)]">
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Employee Selection - Enhanced Design */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200 shadow-sm">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-4">
                    <User className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-blue-900">Select Employee</h4>
                    <p className="text-blue-600 text-sm">Choose the employee who will receive the tools</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SearchableSelect
                    label="Employee"
                    placeholder="Search and select an employee"
                    value={selectedEmployee}
                    onChange={handleEmployeeChange}
                    options={employeeOptions}
                    required
                  />

                  {/* Employee Details Card */}
                  {selectedEmployeeData && (
                    <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <User className="text-blue-600" size={20} />
                        </div>
                        <h5 className="font-bold text-blue-900">Employee Details</h5>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-blue-600 font-medium">Name:</span>
                          <span className="text-blue-900 font-semibold">{selectedEmployeeData.emp_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600 font-medium">ID:</span>
                          <span className="text-blue-900 font-mono">{selectedEmployeeData.emp_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600 font-medium">Group:</span>
                          <span className="text-blue-900">{selectedEmployeeData.group}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600 font-medium">Destination:</span>
                          <span className="text-blue-900">{selectedEmployeeData.destination}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tool Selections - Enhanced Design */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mr-4">
                      <Package className="text-white" size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">Select Tools</h4>
                      <p className="text-gray-600 text-sm">Add multiple tools including same tool with different IDs</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addToolSelection}
                    disabled={!selectedEmployee}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
                  >
                    <Plus size={20} />
                    <span className="font-medium">Add Tool</span>
                  </button>
                </div>

                {/* Tool Selection Cards */}
                <div className="space-y-4">
                  {toolSelections.map((selection, index) => {
                    const availableTools = getAvailableTools(selection.category_id);
                    const availableToolParts = getAvailableToolParts(selection.tool_id);
                    const selectedTool = getSelectedTool(selection.tool_id);
                    const selectedToolPart = getSelectedToolPart(selection.tool_part_id);

                    const toolOptions = availableTools.map(tool => {
                      const availableCount = toolParts.filter(part => 
                        part.tool_id === tool.id && part.status === 'available'
                      ).length;
                      const selectedCount = toolSelections.filter(s => s.tool_id === tool.id && s.tool_part_id).length;
                      return {
                        value: tool.id,
                        label: tool.tool_name,
                        subtitle: `Available: ${availableCount} units${selectedCount > 0 ? ` • Selected: ${selectedCount}` : ''}`,
                        disabled: availableCount === 0
                      };
                    });

                    const toolPartOptions = availableToolParts.map(part => ({
                      value: part.id,
                      label: part.unique_id,
                      subtitle: 'Available for issue'
                    }));

                    return (
                      <div key={selection.id} className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        {/* Tool Header */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                              <span className="text-white font-bold">{index + 1}</span>
                            </div>
                            <div>
                              <h5 className="text-lg font-bold text-gray-900">Tool {index + 1}</h5>
                              {selectedTool && (
                                <p className="text-sm text-gray-600">{selectedTool.tool_name}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {/* Duplicate Tool Button */}
                            {selection.tool_id && (
                              <button
                                type="button"
                                onClick={() => duplicateToolSelection(selection.id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Duplicate this tool selection"
                              >
                                <Copy size={18} />
                              </button>
                            )}
                            {/* Remove Tool Button */}
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

                        {/* Tool Form Fields */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                          {/* Category Selection */}
                          <SearchableSelect
                            label="Category"
                            placeholder="Choose a category"
                            value={selection.category_id}
                            onChange={(value) => updateToolSelection(selection.id, 'category_id', value)}
                            options={categoryOptions}
                            disabled={!selectedEmployee}
                            required
                          />

                          {/* Tool Selection */}
                          <SearchableSelect
                            label="Tool Name"
                            placeholder="Choose a tool"
                            value={selection.tool_id}
                            onChange={(value) => updateToolSelection(selection.id, 'tool_id', value)}
                            options={toolOptions}
                            disabled={!selection.category_id}
                            required
                          />

                          {/* Tool Part Selection */}
                          <SearchableSelect
                            label="Specific Tool ID"
                            placeholder="Choose specific tool ID"
                            value={selection.tool_part_id}
                            onChange={(value) => updateToolSelection(selection.id, 'tool_part_id', value)}
                            options={toolPartOptions}
                            disabled={!selection.tool_id}
                            required
                          />
                        </div>

                        {/* Remarks */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Remarks
                          </label>
                          <textarea
                            value={selection.remarks}
                            onChange={(e) => updateToolSelection(selection.id, 'remarks', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                            rows={2}
                            placeholder="Any additional notes for this tool..."
                          />
                        </div>

                        {/* Selected Tool Details */}
                        {selectedToolPart && selectedTool && (
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                            <div className="flex items-center mb-3">
                              <CheckCircle className="text-green-600 mr-2" size={18} />
                              <h6 className="font-bold text-green-800">Selected Tool Details</h6>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-green-600 font-medium">Tool:</span>
                                <div className="text-green-900 font-semibold">{selectedTool.tool_name}</div>
                              </div>
                              <div>
                                <span className="text-green-600 font-medium">ID:</span>
                                <div className="text-green-900 font-mono font-bold">{selectedToolPart.unique_id}</div>
                              </div>
                              <div>
                                <span className="text-green-600 font-medium">Category:</span>
                                <div className="text-green-900">{selectedTool.category_name}</div>
                              </div>
                              <div>
                                <span className="text-green-600 font-medium">Status:</span>
                                <div className="text-green-900 capitalize font-semibold">{selectedToolPart.status}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Enhanced Summary */}
              {selectedEmployee && getTotalToolCount() > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl border border-orange-200 shadow-sm">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mr-4">
                      <CheckCircle className="text-white" size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-orange-900">Issue Summary</h4>
                      <p className="text-orange-600 text-sm">Review your tool issue details</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Summary Stats */}
                    <div className="bg-white p-4 rounded-xl border border-orange-200">
                      <h5 className="font-bold text-orange-900 mb-3">Issue Statistics</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-orange-600 font-medium">Employee:</span>
                          <div className="text-orange-900 font-bold">{selectedEmployeeData?.emp_name}</div>
                        </div>
                        <div>
                          <span className="text-orange-600 font-medium">Total Tools:</span>
                          <div className="text-orange-900 text-xl font-bold">{getTotalToolCount()}</div>
                        </div>
                        <div>
                          <span className="text-orange-600 font-medium">Categories:</span>
                          <div className="text-orange-900 text-xl font-bold">
                            {new Set(toolSelections.filter(s => s.category_id).map(s => s.category_id)).size}
                          </div>
                        </div>
                        <div>
                          <span className="text-orange-600 font-medium">Issue Date:</span>
                          <div className="text-orange-900 font-bold">{new Date().toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>

                    {/* Tool Breakdown */}
                    <div className="bg-white p-4 rounded-xl border border-orange-200">
                      <h5 className="font-bold text-orange-900 mb-3">Tool Breakdown</h5>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {getToolSelectionSummary().map(([toolName, count]) => (
                          <div key={toolName} className="flex justify-between items-center text-sm">
                            <span className="text-orange-700">{toolName}</span>
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-bold">
                              {count} unit{count > 1 ? 's' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Enhanced Footer */}
          <div className="flex space-x-4 p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-4 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedEmployee || getTotalToolCount() === 0}
              className="flex-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md"
            >
              Issue {getTotalToolCount()} Tool{getTotalToolCount() > 1 ? 's' : ''} to {selectedEmployeeData?.emp_name || 'Employee'}
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
        message={`Please verify your credentials to issue ${getTotalToolCount()} tool${getTotalToolCount() > 1 ? 's' : ''} to ${selectedEmployeeData?.emp_name}.`}
      />
    </>
  );
};

export default OutwardModal;