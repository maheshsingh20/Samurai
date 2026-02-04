import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Activity, BarChart3, Plus, User, Menu, X, Home, TrendingUp } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { dynamicApi, DynamicUser } from '../services/dynamicApi';
import NotificationPanel from './NotificationPanel';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { unreadCount, connectionStatus } = useNotifications();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const [dynamicUsers, setDynamicUsers] = useState<DynamicUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await dynamicApi.getUsers();
        setDynamicUsers(users);

        // If current user_id doesn't exist in dynamic users, set to first user
        const currentUserId = localStorage.getItem('user_id');
        const userExists = users.find(u => u.id === currentUserId);
        if (!userExists && users.length > 0) {
          localStorage.setItem('user_id', users[0].id);
        }
      } catch (error) {
        console.error('Error loading users for layout:', error);
      } finally {
        setUsersLoading(false);
      }
    };

    loadUsers();
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, color: 'text-blue-600' },
    { name: 'Feed', href: '/feed', icon: Activity, color: 'text-green-600' },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, color: 'text-purple-600' },
    { name: 'Create Event', href: '/create', icon: Plus, color: 'text-orange-600' },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'CONNECTED':
        return 'bg-green-500';
      case 'CONNECTING':
        return 'bg-yellow-500 animate-pulse';
      case 'FAILED':
      case 'CLOSED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'CONNECTED':
        return 'Connected';
      case 'CONNECTING':
        return 'Connecting...';
      case 'FAILED':
        return 'Failed';
      case 'CLOSED':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const currentUserId = localStorage.getItem('user_id') || (dynamicUsers[0]?.id);
  const currentUser = dynamicUsers.find(u => u.id === currentUserId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Desktop Navigation */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Activity Feed
                    </span>
                    <div className="text-xs text-gray-500">Real-time Events</div>
                  </div>
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:ml-8 md:flex md:space-x-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${active
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        } inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium rounded-t-lg transition-all duration-200`}
                    >
                      <Icon className={`h-4 w-4 mr-2 ${active ? item.color : ''}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right side items */}
            <div className="flex items-center space-x-3">
              {/* Connection Status */}
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-full">
                <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`} />
                <span className="text-xs font-medium text-gray-600">{getConnectionStatusText()}</span>
              </div>

              {/* Dynamic User Selector */}
              <div className="flex items-center space-x-2">
                {usersLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-32 rounded-lg"></div>
                ) : (
                  <div className="relative">
                    <select
                      value={currentUserId || ''}
                      onChange={(e) => {
                        localStorage.setItem('user_id', e.target.value);
                        window.location.reload();
                      }}
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {dynamicUsers.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.avatar} {user.name} {user.isOnline ? '🟢' : '🔴'}
                        </option>
                      ))}
                    </select>
                    <User className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Current User Info - Desktop */}
              {currentUser && !usersLoading && (
                <div className="hidden lg:flex items-center space-x-3 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                  <span className="text-xl">{currentUser.avatar}</span>
                  <div className="text-sm">
                    <div className="font-semibold text-gray-900">{currentUser.name.split(' ')[0]}</div>
                    <div className="text-gray-500 text-xs">{currentUser.company || 'No company'}</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${currentUser.isOnline ? 'bg-green-500' : 'bg-gray-400'} ring-2 ring-white`}></div>
                </div>
              )}

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-all duration-200"
                >
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <NotificationPanel onClose={() => setShowNotifications(false)} />
                )}
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {showMobileMenu ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={`${active
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } block pl-3 pr-4 py-2 border-l-4 text-base font-medium rounded-r-lg`}
                  >
                    <div className="flex items-center">
                      <Icon className={`h-5 w-5 mr-3 ${active ? item.color : ''}`} />
                      {item.name}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Connection Status */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`} />
                  <span className="text-sm font-medium text-gray-600">{getConnectionStatusText()}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {dynamicUsers.filter(u => u.isOnline).length} users online
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile User Info */}
        {currentUser && !usersLoading && (
          <div className="md:hidden px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-blue-100">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{currentUser.avatar}</span>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{currentUser.name}</div>
                <div className="text-sm text-gray-600">
                  {currentUser.company || currentUser.email} •
                  <span className={`ml-1 ${currentUser.isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                    {currentUser.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${currentUser.isOnline ? 'bg-green-500' : 'bg-gray-400'} ring-2 ring-white`}></div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="min-h-[calc(100vh-200px)]">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>© 2024 Activity Feed System</span>
              <span>•</span>
              <span>Real-time Events & Notifications</span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4" />
                <span>{dynamicUsers.length} Total Users</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{dynamicUsers.filter(u => u.isOnline).length} Online</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;