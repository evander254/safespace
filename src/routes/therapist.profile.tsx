import { createFileRoute } from "@tanstack/react-router";
import { User, Shield, Briefcase, MapPin, Globe, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProfileImageUpload } from "@/components/profile-image-upload";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/therapist/profile")({
  component: TherapistProfile,
});

function TherapistProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: therapist, isLoading } = useQuery({
    queryKey: ["therapist-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("therapists")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase
        .from("therapists")
        .update(values)
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["therapist-profile", user?.id] });
      toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    full_name: "",
    bio: "",
    price_per_session: 0,
    license_type: "",
    license_number: "",
  });

  useEffect(() => {
    if (therapist) {
      setEditData({
        full_name: therapist.full_name || "",
        bio: therapist.bio || "",
        price_per_session: therapist.price_per_session || 0,
        license_type: therapist.license_type || "",
        license_number: therapist.license_number || "",
      });
    }
  }, [therapist]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  if (!therapist) {
    return <div className="p-8 text-center">Profile not found.</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-card border border-border p-8 rounded-3xl shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24 border-2 border-primary/20">
            <AvatarImage src={therapist.avatar_url || user?.user_metadata?.avatar_url} />
            <AvatarFallback className="text-2xl bg-primary/5">{(therapist.full_name || user?.user_metadata?.full_name)?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{therapist.full_name || user?.user_metadata?.full_name || "Therapist Name"}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="rounded-full">Licensed Professional</Badge>
              <Badge variant="outline" className="rounded-full flex items-center gap-1">
                <Shield className="h-3 w-3 text-green-500" /> Verified
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-3 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {therapist.jurisdiction || "Nairobi, Kenya"}
            </p>
          </div>
        </div>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full px-8">Edit Profile</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Clinical Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex justify-center">
                <ProfileImageUpload 
                  userId={user!.id} 
                  currentUrl={therapist.avatar_url} 
                  onUploadComplete={(url) => updateProfileMutation.mutate({ avatar_url: url })}
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={editData.full_name} 
                    onChange={(e) => setEditData({ ...editData, full_name: e.target.value })} 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Biography</Label>
                  <Textarea 
                    id="bio" 
                    value={editData.bio} 
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })} 
                    className="rounded-xl h-32"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price per Session (KES)</Label>
                    <Input 
                      id="price" 
                      type="number"
                      value={editData.price_per_session} 
                      onChange={(e) => setEditData({ ...editData, price_per_session: Number(e.target.value) })} 
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_type">License Type</Label>
                    <Input 
                      id="license_type" 
                      value={editData.license_type} 
                      onChange={(e) => setEditData({ ...editData, license_type: e.target.value })} 
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_number">License Number</Label>
                  <Input 
                    id="license_number" 
                    value={editData.license_number} 
                    onChange={(e) => setEditData({ ...editData, license_number: e.target.value })} 
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => {
                  updateProfileMutation.mutate(editData);
                  setEditOpen(false);
                }}
                className="rounded-full px-8 w-full sm:w-auto"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="md:col-span-2 border-border rounded-3xl shadow-[var(--shadow-soft)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" /> Clinical Biography
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed italic">
              {therapist.bio || "No biography provided yet. Update your profile to tell clients about your approach and experience."}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border rounded-3xl shadow-[var(--shadow-soft)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" /> Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">License Type</span>
              <p className="font-medium">{therapist.license_type || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">License Number</span>
              <p className="font-medium">{therapist.license_number || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Languages</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {therapist.languages?.map((l: string) => (
                  <Badge key={l} variant="secondary" className="text-[10px] py-0">{l}</Badge>
                )) || <p className="text-sm">English</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
