import { createFileRoute } from "@tanstack/react-router";
import { User, Shield, Briefcase, MapPin, Globe, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/therapist/profile")({
  component: TherapistProfile,
});

function TherapistProfile() {
  const { user } = useAuth();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-card border border-border p-8 rounded-3xl shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24 border-2 border-primary/20">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="text-2xl bg-primary/5">{user?.user_metadata?.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{user?.user_metadata?.full_name || "Therapist Name"}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="rounded-full">Licensed Professional</Badge>
              <Badge variant="outline" className="rounded-full flex items-center gap-1">
                <Shield className="h-3 w-3 text-green-500" /> Verified
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-3 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> Nairobi, Kenya
            </p>
          </div>
        </div>
        <Button className="rounded-full px-8">Edit Profile</Button>
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
              {user?.user_metadata?.bio || "No biography provided yet. Update your profile to tell clients about your approach and experience."}
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
              <p className="font-medium">{user?.user_metadata?.license_type || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">License Number</span>
              <p className="font-medium">{user?.user_metadata?.license_number || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Languages</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {user?.user_metadata?.languages?.map((l: string) => (
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
