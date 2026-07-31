import { Moon, Sun, User } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import NotificationsMenu from './NotificationsMenu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40" data-testid="header">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Welcome, {user?.name?.split(' ')[0]}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            data-testid="theme-toggle"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-gray-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>

          <NotificationsMenu user={user} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-2" data-testid="user-menu-trigger">
                <Avatar>
                  <AvatarImage src={user?.profileImage} />
                  <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem data-testid="profile-menu-item">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout} data-testid="logout-menu-item">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
