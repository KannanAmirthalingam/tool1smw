import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Wrench, Package } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import SecurityModal from '../Common/SecurityModal';
import { Tool, ToolCategory, ToolPart } from '../../types';

const Tools: React.FC = () => {
  const { documents: tools, loading, addDocument, updateDocument, deleteDocument } = useFirestore('tools');
  const { documents: categories } = useFirestore('categories');
  const { documents: toolParts, addDocument: addToolPart, deleteDocument: deleteToolPart } = useFirestore('tool_parts');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [securityAction, setSecurityAction] = useState<() => void>(() => {});
  const [securityTitle, setSecurityTitle] = useState('');
  const [securityMessage, setSecurityMessage] = useState('');
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    tool_name: '',
    category_id: '',
    total_quantity: 0,
    available_quantity: 0,
    description: '',
    image_url: ''
  });

  const filteredTools = tools.filter((tool: Tool) => {
    const matchesSearch = tool.tool_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || tool.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const generateUniqueToolId = (toolName: string, index: number) => {
    const cleanName = toolName.replace(/\s+/g, '').toUpperCase();
    return `${cleanName}Q${index + 1}`;
  };

  const createToolParts = async (toolId: string, toolName: string, categoryId: string, categoryName: string, quantity: number) => {
    const tool = tools.find(t => t.id === toolId) || formData;
    const promises = [];
    for (let i = 0; i < quantity; i++) {
      const uniqueId = generateUniqueToolId(toolName, i);
      promises.push(addToolPart({
        tool_id: toolId,
        tool_name: toolName,
        category_id: categoryId,
        category_name: categoryName,
        unique_id: uniqueId,
        status: 'available',
        image_url: tool.image_url || ''
      }));
    }
    await Promise.all(promises);
  };

  const deleteToolParts = async (toolId: string) => {
    const partsToDelete = toolParts.filter((part: ToolPart) => part.tool_id === toolId);
    const promises = partsToDelete.map((part: ToolPart) => deleteToolPart(part.id));
    await Promise.all(promises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const action = async () => {
      try {
        const selectedCategoryData = categories.find((cat: ToolCategory) => cat.id === formData.category_id);
        const toolData = {
          ...formData,
          category_name: selectedCategoryData?.category_name || '',
          total_quantity: Number(formData.total_quantity),
          available_quantity: Number(formData.available_quantity)
        };

        if (editingTool) {
          await updateDocument(editingTool.id, toolData);
          
          // Handle quantity changes for existing tools
          const currentParts = toolParts.filter((part: ToolPart) => part.tool_id === editingTool.id);
          const newQuantity = Number(formData.total_quantity);
          
          if (newQuantity > currentParts.length) {
            // Add new parts
            const additionalParts = newQuantity - currentParts.length;
            for (let i = 0; i < additionalParts; i++) {
              const uniqueId = generateUniqueToolId(formData.tool_name, currentParts.length + i);
              await addToolPart({
                tool_id: editingTool.id,
                tool_name: formData.tool_name,
                category_id: formData.category_id,
                category_name: selectedCategoryData?.category_name || '',
                unique_id: uniqueId,
                status: 'available',
                image_url: formData.image_url || ''
              });
            }
          } else if (newQuantity < currentParts.length) {
            // Remove excess parts (only available ones)
            const availableParts = currentParts.filter((part: ToolPart) => part.status === 'available');
            const partsToRemove = currentParts.length - newQuantity;
            for (let i = 0; i < Math.min(partsToRemove, availableParts.length); i++) {
              await deleteToolPart(availableParts[i].id);
            }
          }
        } else {
          const toolId = await addDocument(toolData);
          // Create individual tool parts
          await createToolParts(
            toolId, 
            formData.tool_name, 
            formData.category_id, 
            selectedCategoryData?.category_name || '', 
            Number(formData.total_quantity)
          );
        }
        
        setIsModalOpen(false);
        setEditingTool(null);
        setFormData({ tool_name: '', category_id: '', total_quantity: 0, available_quantity: 0, description: '', image_url: '' });
      } catch (error) {
        console.error('Error saving tool:', error);
      }
    };

    setSecurityAction(() => action);
    setSecurityTitle(editingTool ? 'Update Tool' : 'Add Tool');
    setSecurityMessage('Please verify your credentials to proceed with this action.');
    setIsSecurityModalOpen(true);
  };

  const handleEdit = (tool: Tool) => {
    setEditingTool(tool);
    setFormData({
      tool_name: tool.tool_name,
      category_id: tool.category_id,
      total_quantity: tool.total_quantity,
      available_quantity: tool.available_quantity,
      description: (tool as any).description || '',
      image_url: tool.image_url || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (toolId: string) => {
    const action = async () => {
      try {
        await deleteToolParts(toolId);
        await deleteDocument(toolId);
      } catch (error) {
        console.error('Error deleting tool:', error);
      }
    };

    setSecurityAction(() => action);
    setSecurityTitle('Delete Tool');
    setSecurityMessage('Are you sure you want to delete this tool and all its parts? This action cannot be undone.');
    setIsSecurityModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTool(null);
    setFormData({ tool_name: '', category_id: '', total_quantity: 0, available_quantity: 0, description: '', image_url: '' });
  };

  const getStockStatus = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage === 0) return { status: 'Out of Stock', color: 'red' };
    if (percentage < 20) return { status: 'Low Stock', color: 'orange' };
    if (percentage < 50) return { status: 'Medium Stock', color: 'yellow' };
    return { status: 'Good Stock', color: 'green' };
  };

  const getToolPartsCount = (toolId: string) => {
    const parts = toolParts.filter((part: ToolPart) => part.tool_id === toolId);
    const available = parts.filter((part: ToolPart) => part.status === 'available').length;
    const issued = parts.filter((part: ToolPart) => part.status === 'issued').length;
    return { total: parts.length, available, issued };
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
          <Wrench className="text-blue-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Tools Management</h2>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>Add Tool</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Categories</option>
          {categories.map((category: ToolCategory) => (
            <option key={category.id} value={category.id}>
              {category.category_name}
            </option>
          ))}
        </select>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.map((tool: Tool) => {
          const partsCount = getToolPartsCount(tool.id);
          const stockStatus = getStockStatus(partsCount.available, partsCount.total);
          
          return (
            <div key={tool.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              {/* Tool Image */}
              {tool.image_url && (
                <div className="mb-4">
                  <img 
                    src={tool.image_url} 
                    alt={tool.tool_name}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{tool.tool_name}</h3>
                  <p className="text-sm text-gray-600">{tool.category_name}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(tool)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(tool.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Parts:</span>
                  <span className="text-sm font-medium text-gray-800">{partsCount.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Available:</span>
                  <span className="text-sm font-medium text-gray-800">{partsCount.available}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Issued:</span>
                  <span className="text-sm font-medium text-gray-800">{partsCount.issued}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  stockStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                  stockStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  stockStatus.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {stockStatus.status}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(tool.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Show some tool part IDs */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Tool IDs ({toolParts.filter((part: ToolPart) => part.tool_id === tool.id).length} total):</p>
                <div className="flex flex-wrap gap-1">
                  {toolParts
                    .filter((part: ToolPart) => part.tool_id === tool.id)
                    .slice(0, 4)
                    .map((part: ToolPart) => (
                      <span 
                        key={part.id} 
                        className={`px-2 py-1 text-xs rounded font-mono ${
                          part.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {part.unique_id}
                      </span>
                    ))}
                  {toolParts.filter((part: ToolPart) => part.tool_id === tool.id).length > 4 && (
                    <span className="text-xs text-gray-400 px-2 py-1">+{toolParts.filter((part: ToolPart) => part.tool_id === tool.id).length - 4} more</span>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <span className="inline-block w-2 h-2 bg-green-100 rounded mr-1"></span>Available
                  <span className="inline-block w-2 h-2 bg-orange-100 rounded mr-1 ml-3"></span>Issued
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <Wrench className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No tools found</h3>
          <p className="text-gray-600">
            {searchTerm || selectedCategory ? 'Try adjusting your search terms or filters' : 'Get started by adding your first tool'}
          </p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {editingTool ? 'Edit Tool' : 'Add New Tool'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tool Name *
                  </label>
                  <input
                    type="text"
                    value={formData.tool_name}
                    onChange={(e) => setFormData({ ...formData, tool_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Unique IDs will be auto-generated (e.g., {formData.tool_name ? generateUniqueToolId(formData.tool_name, 0) : 'TOOLNAMEQ1'})
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category: ToolCategory) => (
                      <option key={category.id} value={category.id}>
                        {category.category_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.total_quantity}
                    onChange={(e) => {
                      const total = Number(e.target.value);
                      setFormData({ 
                        ...formData, 
                        total_quantity: total,
                        available_quantity: editingTool ? formData.available_quantity : total
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Each unit will get a unique ID (Q1, Q2, Q3, etc.)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tool Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/tool-image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a valid image URL to display tool photo
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingTool ? 'Update' : 'Add'} Tool
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Security Modal */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        onVerify={securityAction}
        title={securityTitle}
        message={securityMessage}
      />
    </div>
  );
};

export default Tools;