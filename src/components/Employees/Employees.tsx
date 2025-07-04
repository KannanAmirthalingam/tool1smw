import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Users, UserCheck } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import SecurityModal from '../Common/SecurityModal';
import { Employee } from '../../types';

const Employees: React.FC = () => {
  const { documents: employees, loading, addDocument, updateDocument, deleteDocument } = useFirestore('employees');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [securityAction, setSecurityAction] = useState<() => void>(() => {});
  const [securityTitle, setSecurityTitle] = useState('');
  const [securityMessage, setSecurityMessage] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [formData, setFormData] = useState({
    emp_id: '',
    emp_name: '',
    group: '',
    destination: ''
  });

  const groups = [...new Set(employees.map((emp: Employee) => emp.group))].filter(Boolean);

  const filteredEmployees = employees.filter((employee: Employee) => {
    const matchesSearch = employee.emp_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.emp_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroup === '' || employee.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const action = async () => {
      try {
        if (editingEmployee) {
          await updateDocument(editingEmployee.id, formData);
        } else {
          await addDocument(formData);
        }
        setIsModalOpen(false);
        setEditingEmployee(null);
        setFormData({ emp_id: '', emp_name: '', group: '', destination: '' });
      } catch (error) {
        console.error('Error saving employee:', error);
      }
    };

    setSecurityAction(() => action);
    setSecurityTitle(editingEmployee ? 'Update Employee' : 'Add Employee');
    setSecurityMessage('Please verify your credentials to proceed with this action.');
    setIsSecurityModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      emp_id: employee.emp_id,
      emp_name: employee.emp_name,
      group: employee.group,
      destination: employee.destination
    });
    setIsModalOpen(true);
  };

  const handleDelete = (employeeId: string) => {
    const action = async () => {
      try {
        await deleteDocument(employeeId);
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    };

    setSecurityAction(() => action);
    setSecurityTitle('Delete Employee');
    setSecurityMessage('Are you sure you want to delete this employee? This action cannot be undone.');
    setIsSecurityModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    setFormData({ emp_id: '', emp_name: '', group: '', destination: '' });
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
          <Users className="text-blue-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Employee Management</h2>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Groups</option>
          {groups.map((group: string) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee: Employee) => (
          <div key={employee.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserCheck className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{employee.emp_name}</h3>
                  <p className="text-sm text-gray-600">ID: {employee.emp_id}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(employee)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(employee.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Group:</span>
                <span className="text-sm font-medium text-gray-800">{employee.group}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Destination:</span>
                <span className="text-sm font-medium text-gray-800">{employee.destination}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                Active
              </span>
              <span className="text-xs text-gray-500">
                {new Date(employee.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No employees found</h3>
          <p className="text-gray-600">
            {searchTerm || selectedGroup ? 'Try adjusting your search terms or filters' : 'Get started by adding your first employee'}
          </p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    value={formData.emp_id}
                    onChange={(e) => setFormData({ ...formData, emp_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee Name *
                  </label>
                  <input
                    type="text"
                    value={formData.emp_name}
                    onChange={(e) => setFormData({ ...formData, emp_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group *
                  </label>
                  <input
                    type="text"
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Engineering, Maintenance, Production"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination *
                  </label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Workshop A, Site B, Office"
                    required
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
                    {editingEmployee ? 'Update' : 'Add'} Employee
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

export default Employees;