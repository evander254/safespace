import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface ProfileImageUploadProps {
  currentUrl?: string | null;
  onUploadComplete: (url: string) => void;
  userId: string;
}

export function ProfileImageUpload({ currentUrl, onUploadComplete, userId }: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("Profiles")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from("Profiles").getPublicUrl(filePath);
      
      onUploadComplete(data.publicUrl);
      toast.success("Profile picture updated!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error uploading image!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group">
      <div className="h-24 w-24 rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-soft">
        {currentUrl ? (
          <img src={currentUrl} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-400">
            <Camera className="h-8 w-8" />
          </div>
        )}
      </div>
      
      <label 
        htmlFor="avatar-upload" 
        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl"
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        ) : (
          <Camera className="h-6 w-6 text-white" />
        )}
        <input
          type="file"
          id="avatar-upload"
          accept="image/*"
          onChange={uploadImage}
          disabled={uploading}
          className="hidden"
        />
      </label>
    </div>
  );
}
