import { type ReactNode } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  // LayoutDashboard, 
  // FileText, 
  MessageSquare,
  Briefcase,
  UserCheck,
  Package,
  Contact,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const menuItems = [
    // { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    // { path: '/dashboard/blogs', icon: FileText, label: 'Blogs' },
    { path: '/dashboard/contacts', icon: MessageSquare, label: 'Contacts' },
    { path: '/dashboard/contact-details', icon: Contact, label: 'Contact Details' },
    { path: '/dashboard/jobs', icon: Briefcase, label: 'Jobs' },
    { path: '/dashboard/applications', icon: UserCheck, label: 'Applications' },
    { path: '/dashboard/packages', icon: Package, label: 'Packages' },
    // { path: '/dashboard/bookings', icon: Calendar, label: 'Bookings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        <div className={`h-full w-full px-4 py-6 bg-white border-r border-slate-200 flex flex-col ${
          sidebarCollapsed ? 'overflow-hidden' : 'overflow-y-auto'
        }`}>
          {/* Logo Section */}
          <div className={`flex items-center mb-10 transition-all duration-300 ${
            sidebarCollapsed ? 'px-2' : 'px-2'
          }`}>
            {sidebarCollapsed ? (
              <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src="/assets/logo.png" alt="E Drive" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="flex items-center w-full">
                <div className="flex items-center">
                  <div className="w-28 h-28 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img src="/assets/logo.png" alt="E Drive" className="w-full h-full object-contain" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Toggle Button - Positioned on border */}
          <button
            onClick={toggleSidebar}
            className="absolute top-6 -right-3 z-50 w-6 h-6 bg-white border border-slate-200 rounded-full shadow-md flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-200"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Navigation */}
          <nav className="flex-1 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center rounded-xl transition-all duration-200 group relative ${
                    sidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'
                  } ${
                    isActive(item.path)
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title={sidebarCollapsed ? item.label : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className={`ml-3 font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                    sidebarCollapsed 
                      ? 'opacity-0 w-0 overflow-hidden' 
                      : 'opacity-100 ml-3'
                  }`}>
                    {item.label}
                  </span>
                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-900 rotate-45"></div>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="mt-auto pt-4 border-t border-slate-100">
            <button
              onClick={handleLogoutClick}
              className={`flex items-center w-full rounded-xl transition-all duration-200 group relative ${
                sidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'
              } text-slate-600 hover:bg-red-50 hover:text-red-600`}
              title={sidebarCollapsed ? 'Logout' : ''}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className={`ml-3 font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                sidebarCollapsed 
                  ? 'opacity-0 w-0 overflow-hidden' 
                  : 'opacity-100 ml-3'
              }`}>
                Logout
              </span>
              {/* Tooltip for collapsed state */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Logout
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-900 rotate-45"></div>
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`lg:hidden fixed top-0 left-0 z-40 w-64 h-screen transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full px-4 py-6 overflow-y-auto bg-white border-r border-slate-200">
          <div className="flex items-center justify-between mb-10 px-2">
            <div className="flex items-center">
              <div className="w-28 h-28 flex items-center justify-center overflow-hidden">
                <img src="/assets/logo.png" alt="E Drive" className="w-full h-full object-contain" />
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="text-slate-600 hover:bg-slate-50 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="ml-3 font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-4 left-4 right-4 border-t border-slate-100 pt-4">
            <button
              onClick={handleLogoutClick}
              className="flex items-center w-full px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="ml-3 font-medium text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}>
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-4 ml-auto">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user?.name || 'Admin User'}</p>
                <p className="text-xs text-slate-500">{user?.email || 'admin@technacall.com'}</p>
              </div>
              <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Confirm Logout</h2>
                <p className="text-slate-500 text-sm mt-1">Are you sure you want to logout?</p>
              </div>
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  setIsLoggingOut(false);
                }}
                disabled={isLoggingOut}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-slate-600 mb-6">
                You will be logged out and redirected to the login page. Are you sure you want to continue?
              </p>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowLogoutModal(false);
                    setIsLoggingOut(false);
                  }}
                  disabled={isLoggingOut}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  disabled={isLoggingOut}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Logging out...
                    </>
                  ) : (
                    'Logout'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
