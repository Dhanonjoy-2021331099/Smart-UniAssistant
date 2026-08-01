import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, FileText, ClipboardList, Award, Bell, Calendar, Users, Settings, LogOut, GraduationCap, Upload, BarChart3, FolderOpen, HelpCircle, CalendarClock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getMenuItems = () => {
    if (user?.role === 'student') {
      return [
        { icon: Home, label: 'Dashboard', path: '/student/dashboard' },
        { icon: BookOpen, label: 'Courses', path: '/student/courses' },
        { icon: ClipboardList, label: 'Assignments', path: '/student/assignments' },
        { icon: Award, label: 'Results', path: '/student/results' },
        { icon: FileText, label: 'Materials', path: '/student/materials' },
        { icon: HelpCircle, label: 'Question Bank', path: '/student/questions' },
        { icon: FolderOpen, label: 'Resources', path: '/student/resources' },
        { icon: Calendar, label: 'Routine', path: '/student/routine' },
        { icon: CalendarClock, label: 'Class Schedule', path: '/student/schedule' },
        { icon: Bell, label: 'Notices', path: '/student/notices' },
        { icon: Users, label: 'Events', path: '/student/events' },
        { icon: Settings, label: 'Settings', path: '/student/settings' }
      ];
    } else if (user?.role === 'teacher') {
      return [
        { icon: Home, label: 'Dashboard', path: '/teacher/dashboard' },
        { icon: BookOpen, label: 'My Courses', path: '/teacher/courses' },
        { icon: Upload, label: 'Upload Materials', path: '/teacher/materials' },
        { icon: ClipboardList, label: 'Assignments', path: '/teacher/assignments' },
        { icon: BarChart3, label: 'Results', path: '/teacher/results' },
        { icon: Bell, label: 'Notices', path: '/teacher/notices' },
        { icon: Settings, label: 'Settings', path: '/teacher/settings' }
      ];
    } else if (user?.role === 'cr_admin') {
      return [
        { icon: Home, label: 'Dashboard', path: '/cradmin/dashboard' },
        { icon: CalendarClock, label: "Tomorrow's Schedule", path: '/cradmin/schedule/tomorrow' },
        { icon: Calendar, label: 'Base Routine', path: '/cradmin/schedule/base' },
        { icon: Bell, label: 'Manage Notices', path: '/cradmin/notices' },
        { icon: Users, label: 'Manage Events', path: '/cradmin/events' },
        { icon: Calendar, label: 'Manage Routine', path: '/cradmin/routine' },
        { icon: FolderOpen, label: 'Resources', path: '/cradmin/resources' },
        { icon: Settings, label: 'Settings', path: '/cradmin/settings' }
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen sticky top-0 flex flex-col" data-testid="sidebar">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <Link to="/" className="flex items-center space-x-2" data-testid="logo-link">
          <GraduationCap className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Smart UniAssistant</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">SUST</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4" data-testid="sidebar-nav">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={logout}
          data-testid="logout-button"
          className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;