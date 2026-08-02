import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

const ACCEPTED_TYPES = ["image/jpeg", "image/png"];
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_DIMENSION = 512;

const getInitials = (name) =>
  name?.split(" ").map((part) => part[0]).join("").toUpperCase() || "U";

const processImage = (file, callback) => {
  const reader = new FileReader();
  reader.onerror = () => callback(null);
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => callback(null);
    image.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, width, height);
      callback(canvas.toDataURL("image/jpeg", 0.85));
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
};

const AvatarUpload = ({ value, name = "", onChange, className }) => {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Please upload a JPG, JPEG, or PNG image");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    setLoading(true);
    processImage(file, (result) => {
      setLoading(false);
      if (!result) {
        toast.error("Failed to read image");
        return;
      }
      onChange(result);
      toast.success("Profile picture updated");
    });
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative">
        <Avatar className="w-20 h-20">
          {value ? (
            <AvatarImage src={value} alt={name || "avatar"} />
          ) : (
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          )}
        </Avatar>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 className="w-6 h-6 text-white animate-spin" data-testid="avatar-loading" />
          </div>
        )}
      </div>
      <div className="flex flex-col items-start gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          data-testid="change-photo-button"
        >
          <Camera className="w-4 h-4 mr-2" />
          Change Photo
        </Button>
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={() => onChange(null)}
            disabled={loading}
            data-testid="remove-photo-button"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove Photo
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          className="hidden"
          onChange={handleFileChange}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          JPG, JPEG or PNG (max 5MB)
        </p>
      </div>
    </div>
  );
};

export default AvatarUpload;
