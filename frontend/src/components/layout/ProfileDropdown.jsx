import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useStudentProfile } from "../../context/StudentProfileContext";
import { getProfilePath } from "../../utils/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { User, Pencil, LogOut } from "lucide-react";

const getInitials = (name) =>
  name?.split(" ").map((part) => part[0]).join("").toUpperCase() || "U";

const ProfileDropdown = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profile } = useStudentProfile();

  const imageSrc = profile?.personal?.profileImage || user?.profileImage || "";
  const name = user?.name || profile?.personal?.name || "User";
  const email = user?.email || profile?.personal?.email || "";
  const profilePath = getProfilePath(user?.role);
  const editPath =
    user?.role === "student" ? `${profilePath}?edit=1` : profilePath;

  const handleLogout = () => {
    logout().catch(() => {});
    navigate("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-10 w-10 rounded-full hover:ring-2 hover:ring-blue-500/50 transition-all"
          data-testid="profile-dropdown-trigger"
          aria-label="Profile menu"
        >
          <Avatar>
            {imageSrc ? (
              <AvatarImage src={imageSrc} alt={name} />
            ) : (
              <AvatarFallback>{getInitials(name)}</AvatarFallback>
            )}
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col py-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate(profilePath)}
          data-testid="view-profile-item"
        >
          <User className="mr-2 h-4 w-4" />
          View Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate(editPath)}
          data-testid="edit-profile-item"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          data-testid="logout-menu-item"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
