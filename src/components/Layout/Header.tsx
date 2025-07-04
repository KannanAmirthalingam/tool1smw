import React, { useState } from 'react';
import { Bell, User, ChevronDown, Edit3, Phone, Mail, IdCard } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import SecurityModal from '../Common/SecurityModal';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  mobile1: string;
  mobile2: string;
  mobile3: string;
  role: string;
  created_at: Date;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { documents: adminProfiles, addDocument: addAdmin, updateDocument: updateAdmin } = useFirestore('admin_profiles');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [securityAction, setSecurityAction] = useState<() => void>(() => {});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile1: '',
    mobile2: '',
    mobile3: ''
  });

  // Get or create admin profile
  const getAdminProfile = (): AdminProfile => {
    if (adminProfiles.length > 0) {
      return adminProfiles[0] as AdminProfile;
    }
    
    // Create default admin profile if none exists
    const defaultAdmin = {
      name: 'System Administrator',
      email: 'admin@toolinventory.com',
      mobile1: '+1 (555) 123-4567',
      mobile2: '+1 (555) 234-5678',
      mobile3: '+1 (555) 345-6789',
      role: 'Admin'
    };
    
    // Add to database
    addAdmin(defaultAdmin);
    
    return {
      id: 'temp',
      ...defaultAdmin,
      created_at: new Date()
    };
  };

  const adminProfile = getAdminProfile();

  const handleEditProfile = () => {
    setFormData({
      name: adminProfile.name,
      email: adminProfile.email,
      mobile1: adminProfile.mobile1,
      mobile2: adminProfile.mobile2,
      mobile3: adminProfile.mobile3
    });
    setShowEditModal(true);
    setShowProfileDropdown(false);
  };

  const handleSaveProfile = async () => {
    const action = async () => {
      try {
        if (adminProfiles.length > 0) {
          await updateAdmin(adminProfile.id, formData);
        } else {
          await addAdmin({ ...formData, role: 'Admin' });
        }
        setShowEditModal(false);
      } catch (error) {
        console.error('Error saving admin profile:', error);
      }
    };

    setSecurityAction(() => action);
    setIsSecurityModalOpen(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setFormData({ name: '', email: '', mobile1: '', mobile2: '', mobile3: '' });
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div className="ml-0 lg:ml-0">
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            {subtitle && (
              <p className="text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={20} />
            </button>

            {/* Admin Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-3 p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-800">{adminProfile.name}</div>
                  <div className="text-xs text-gray-500">{adminProfile.role}</div>
                </div>
                <ChevronDown size={16} className={`transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <User size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{adminProfile.name}</h3>
                        <p className="text-sm text-gray-600">{adminProfile.role}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Email */}
                    <div className="flex items-center space-x-3">
                      <Mail size={16} className="text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500">Email</div>
                        <div className="text-sm text-gray-800">{adminProfile.email}</div>
                      </div>
                    </div>

                    {/* Mobile Numbers */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <Phone size={16} className="text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-500">Primary Mobile</div>
                          <div className="text-sm text-gray-800">{adminProfile.mobile1}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone size={16} className="text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-500">Secondary Mobile</div>
                          <div className="text-sm text-gray-800">{adminProfile.mobile2}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone size={16} className="text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-500">Emergency Mobile</div>
                          <div className="text-sm text-gray-800">{adminProfile.mobile3}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={handleEditProfile}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit3 size={16} />
                      <span>Edit Profile</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Edit Admin Profile</h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <User size={20} className="text-gray-500" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <IdCard size={16} className="inline mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail size={16} className="inline mr-2" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone size={16} className="inline mr-2" />
                    Primary Mobile *
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile1}
                    onChange={(e) => setFormData({ ...formData, mobile1: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone size={16} className="inline mr-2" />
                    Secondary Mobile
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile2}
                    onChange={(e) => setFormData({ ...formData, mobile2: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone size={16} className="inline mr-2" />
                    Emergency Mobile
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile3}
                    onChange={(e) => setFormData({ ...formData, mobile3: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    Save Changes
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
        title="Update Admin Profile"
        message="Please verify your credentials to update the admin profile."
      />

      {/* Click outside to close dropdown */}
      {showProfileDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowProfileDropdown(false)}
        />
      )}
    </>
  );
};

export default Header;