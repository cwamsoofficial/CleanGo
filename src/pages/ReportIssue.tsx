import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

// Validation schema for issue reports
const reportSchema = z.object({
  title: z.string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z.string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be less than 2000 characters"),
  location: z.string()
    .trim()
    .max(500, "Location must be less than 500 characters")
    .optional()
    .transform(val => val || null)
});

const ReportIssue = () => {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ title?: string; description?: string; location?: string }>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const rawData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      location: formData.get("location") as string,
    };

    // Validate input with zod
    const validationResult = reportSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      const fieldErrors: { title?: string; description?: string; location?: string } = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field as keyof typeof fieldErrors] = err.message;
      });
      setErrors(fieldErrors);
      setLoading(false);
      toast.error("Please fix the validation errors");
      return;
    }

    const { title, description, location } = validationResult.data;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let imageUrl = null;

      // Upload image if provided
      if (imageFile) {
        try {
          const fileExt = imageFile.name.split(".").pop();
          const fileName = `${user.id}-${Date.now()}.${fileExt}`;
          const filePath = `issue-reports/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("issue-images")
            .upload(filePath, imageFile);

          if (uploadError) {
            console.error("Image upload error:", uploadError);
            toast.error("Failed to upload image, but report will be submitted");
          } else {
            // Store the file path (not public URL) since bucket is private
            imageUrl = filePath;
          }
        } catch (uploadError) {
          console.error("Image upload exception:", uploadError);
        }
      }

      // Insert issue report with validated data
      const { error } = await supabase.from("issue_reports").insert({
        reporter_id: user.id,
        title,
        description,
        location,
        image_url: imageUrl,
        status: "pending",
      });

      if (error) throw error;

      // Award points securely using RPC
      const { error: rewardError } = await supabase.rpc("award_points", {
        _user_id: user.id,
        _points: 3,
        _description: "Reported waste management issue",
      });

      if (rewardError) {
        console.log("Reward RPC error:", rewardError);
      }

      toast.success("Issue reported successfully!");
      (e.target as HTMLFormElement).reset();
      setImageFile(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to report issue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Report an Issue</h2>
          <p className="text-muted-foreground mt-1">
            Help improve waste management by reporting issues in your area
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Issue Details</CardTitle>
            <CardDescription>
              Provide as much detail as possible to help us resolve the issue quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Issue Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Overflowing bin on Main Street"
                  maxLength={200}
                  required
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the issue in detail..."
                  rows={5}
                  maxLength={2000}
                  required
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g., 123 Main Street, City Center"
                  maxLength={500}
                />
                {errors.location && (
                  <p className="text-sm text-destructive">{errors.location}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Photo Evidence</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                  {imageFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setImageFile(null)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a photo to help us understand the issue better
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit Report
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReportIssue;
