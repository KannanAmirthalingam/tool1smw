import React, { useState } from 'react';
import { 
  Package, 
  Users, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  Eye,
  ChevronRight
} from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { Tool, ToolCategory, ToolPart, OutwardEntry } from '../../types';

const Dashboard: React.FC = () => {
  const { documents: tools } = useFirestore('tools');
  const { documents: categories } = useFirestore('categories');
  const { documents: employees } = useFirestore('employees');
  const { documents: toolParts } = useFirestore('tool_parts');
  const { documents: outwardEntries } = useFirestore('outward');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Calculate statistics from tool parts
  const totalToolParts = toolParts.length;
  const availableToolParts = toolParts.filter((part: ToolPart) => part.status === 'available').length;
  const issuedToolParts = toolParts.filter((part: ToolPart) => part.status === 'issued').length;
  const pendingReturns = outwardEntries.filter((entry: OutwardEntry) => entry.status === 'issued').length;

  // Get tools by category with real counts
  const getToolsByCategory = (categoryId: string) => {
    return tools.filter((tool: Tool) => tool.category_id === categoryId);
  };

  // Get category statistics from tool parts
  const getCategoryStats = (categoryId: string) => {
    const categoryParts = toolParts.filter((part: ToolPart) => part.category_id === categoryId);
    const total = categoryParts.length;
    const available = categoryParts.filter((part: ToolPart) => part.status === 'available').length;
    return { total, available, issued: total - available };
  };

  const stats = [
    {
      title: 'Total Tool Parts',
      value: totalToolParts.toString(),
      change: '+12.3%',
      changeType: 'positive',
      icon: Package,
      color: 'blue'
    },
    {
      title: 'Available Parts',
      value: availableToolParts.toString(),
      change: '+5.2%',
      changeType: 'positive',
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Parts Issued',
      value: issuedToolParts.toString(),
      change: '+8.1%',
      changeType: 'positive',
      icon: ArrowUpCircle,
      color: 'orange'
    },
    {
      title: 'Pending Returns',
      value: pendingReturns.toString(),
      change: '-15.4%',
      changeType: 'negative',
      icon: Clock,
      color: 'yellow'
    }
  ];

  const recentActivity = outwardEntries
    .slice(0, 4)
    .map((entry: OutwardEntry) => ({
      id: entry.id,
      type: entry.status === 'issued' ? 'outward' : 'inward',
      tool: `${entry.tool_name} (${entry.tool_unique_id})`,
      employee: entry.emp_name,
      time: new Date(entry.issued_date).toLocaleString(),
      status: entry.status
    }));

  const lowStockAlerts = tools
    .map((tool: Tool) => {
      const toolPartsForTool = toolParts.filter((part: ToolPart) => part.tool_id === tool.id);
      const availableParts = toolPartsForTool.filter((part: ToolPart) => part.status === 'available');
      const totalParts = toolPartsForTool.length;
      const percentage = totalParts > 0 ? (availableParts.length / totalParts) * 100 : 0;
      
      return {
        ...tool,
        availableCount: availableParts.length,
        totalCount: totalParts,
        percentage
      };
    })
    .filter(tool => tool.percentage < 20 && tool.totalCount > 0)
    .slice(0, 3)
    .map((tool) => ({
      id: tool.id,
      tool: tool.tool_name,
      current: tool.availableCount,
      minimum: Math.ceil(tool.totalCount * 0.2),
      category: tool.category_name
    }));

  const getStatColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-600',
      green: 'bg-green-600',
      orange: 'bg-orange-600',
      yellow: 'bg-yellow-600',
      red: 'bg-red-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                  <p className={`text-sm mt-1 ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${getStatColor(stat.color)} flex items-center justify-center`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tool Availability by Category */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Tool Availability by Category</h3>
          <Package className="text-blue-600" size={20} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {categories.map((category: ToolCategory) => {
            const stats = getCategoryStats(category.id);
            const isSelected = selectedCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(isSelected ? null : category.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">{category.category_name}</h4>
                  <ChevronRight 
                    size={16} 
                    className={`text-gray-400 transition-transform ${isSelected ? 'rotate-90' : ''}`}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <span className="ml-1 font-medium text-gray-800">{stats.total}</span>
                  </div>
                  <div>
                    <span className="text-green-600">Available:</span>
                    <span className="ml-1 font-medium text-green-800">{stats.available}</span>
                  </div>
                  <div>
                    <span className="text-orange-600">Issued:</span>
                    <span className="ml-1 font-medium text-orange-800">{stats.issued}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Category Tools Table */}
        {selectedCategory && (
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-md font-semibold text-gray-800 mb-4">
              Tools in {categories.find(c => c.id === selectedCategory)?.category_name}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tool Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Parts
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available Parts
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getToolsByCategory(selectedCategory).map((tool: Tool) => {
                    const toolPartsForTool = toolParts.filter((part: ToolPart) => part.tool_id === tool.id);
                    const availableParts = toolPartsForTool.filter((part: ToolPart) => part.status === 'available');
                    const totalParts = toolPartsForTool.length;
                    const percentage = totalParts > 0 ? (availableParts.length / totalParts) * 100 : 0;
                    
                    const status = percentage === 0 ? 'Out of Stock' : 
                                  percentage < 20 ? 'Low Stock' : 
                                  percentage < 50 ? 'Medium Stock' : 'Good Stock';
                    const statusColor = percentage === 0 ? 'red' : 
                                       percentage < 20 ? 'orange' : 
                                       percentage < 50 ? 'yellow' : 'green';
                    
                    return (
                      <tr key={tool.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-800">{tool.tool_name}</div>
                          <div className="text-xs text-gray-500 font-mono">
                            IDs: {tool.tool_name.replace(/\s+/g, '-').toUpperCase()}-Q1, Q2, Q3...
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{totalParts}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-800">{availableParts.length}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            statusColor === 'green' ? 'bg-green-100 text-green-800' :
                            statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            statusColor === 'orange' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.type === 'outward' ? 'bg-orange-100' : 'bg-green-100'
                }`}>
                  {activity.type === 'outward' ? (
                    <ArrowUpCircle className="text-orange-600" size={16} />
                  ) : (
                    <ArrowDownCircle className="text-green-600" size={16} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{activity.tool}</p>
                  <p className="text-xs text-gray-600">{activity.employee} • {activity.time}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  activity.status === 'issued' 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Low Stock Alerts</h3>
            <AlertTriangle className="text-red-600" size={20} />
          </div>
          <div className="space-y-4">
            {lowStockAlerts.length > 0 ? (
              lowStockAlerts.map((alert) => (
                <div key={alert.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800">{alert.tool}</h4>
                    <span className="text-sm text-gray-600">{alert.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Available: {alert.current} | Minimum: {alert.minimum}
                    </span>
                    <button className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors">
                      Reorder
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                <p className="text-sm text-gray-600">All tools are well stocked</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
            <ArrowUpCircle className="text-blue-600 mb-2" size={24} />
            <p className="font-medium text-gray-800">Issue Tool</p>
            <p className="text-sm text-gray-600">Quick tool outward</p>
          </button>
          <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
            <ArrowDownCircle className="text-green-600 mb-2" size={24} />
            <p className="font-medium text-gray-800">Return Tool</p>
            <p className="text-sm text-gray-600">Process returns</p>
          </button>
          <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left">
            <Package className="text-orange-600 mb-2" size={24} />
            <p className="font-medium text-gray-800">Add Tool</p>
            <p className="text-sm text-gray-600">Register new tool</p>
          </button>
          <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
            <Users className="text-purple-600 mb-2" size={24} />
            <p className="font-medium text-gray-800">Add Employee</p>
            <p className="text-sm text-gray-600">Register employee</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;