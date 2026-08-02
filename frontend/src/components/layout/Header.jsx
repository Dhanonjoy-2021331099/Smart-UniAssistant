import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import NotificationsMenu from './NotificationsMenu';
import ProfileDropdown from './ProfileDropdown';

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40" data-testid="header">
      <div className="px-6 h-16 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white truncate">
            Welcome, {user?.name?.split(' ')[0]}
          </h2>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 capitalize truncate">
            {user?.role?.replace('_', ' ')}
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button
            onClick={toggleTheme}
            data-testid="theme-toggle"
            className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-gray-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>

          <NotificationsMenu user={user} />

          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
};

export default Header;
