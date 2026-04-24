import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Upload, Plus, MapPin } from "lucide-react";

const CATEGORIES = [
  { value: "overflowing_bin", label: "Overflowing Bin" },
  { value: "illegal_dumping", label: "Illegal Dumping" },
  { value: "missed_pickup", label: "Missed Pickup" },
  { value: "hazardous_waste", label: "Hazardous Waste" },
  { value: "recycling", label: "Recycling Issue" },
  { value: "street_litter", label: "Street Litter" },
  { value: "other", label: "Other" },
] as const;

const reportSchema = z.object({
  title: z.string().trim().max(200, "Title must be less than 200 characters").optional(),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be less than 2000 characters"),
  category: z.enum([
    "overflowing_bin",
    "illegal_dumping",
    "missed_pickup",
    "hazardous_waste",
    "recycling",
    "street_litter",
    "other",
  ]),
  location: z
    .string()
    .trim()
    .max(500, "Location must be less than 500 characters")
    .optional()
    .transform((val) => val || null),
});

interface ReportIssueDialogProps {
  onSuccess?: () => void;
}

export const ReportIssueDialog = ({ onSuccess }: ReportIssueDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    location?: string;
    category?: string;
  }>({});

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("Location captured for the Waste Map");
      },
      (err) => {
        setLocating(false);
        toast.error(err.message || "Could not get your location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const rawData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      location: formData.get("location") as string,
      category,
    };

    const validationResult = reportSchema.safeParse(rawData);
    if (!validationResult.success) {
      const fieldErrors: typeof errors = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path[0] as keyof typeof fieldErrors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      setLoading(false);
      toast.error("Please fix the validation errors");
      return;
    }

    const { title, description, location, category: cat } = validationResult.data;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let imageUrl: string | null = null;
      if (imageFile) {
        if (imageFile.size > 5 * 1024 * 1024) {
          toast.error("Image file too large. Maximum size is 5MB.");
          setLoading(false);
          return;
        }
        const fileExt = imageFile.name.split(".").pop()?.toLowerCase();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from("issue-images")
          .upload(filePath, imageFile);
        if (uploadError) {
          toast.error(`Failed to upload image: ${uploadError.message}`);
        } else {
          imageUrl = filePath;
        }
      }

      const finalTitle = title?.trim()
        ? title.trim()
        : description.trim().split(/\s+/).slice(0, 8).join(" ").slice(0, 200) || "Untitled issue";

      const { error } = await supabase.from("issue_reports").insert({
        reporter_id: user.id,
        title: finalTitle,
        description,
        location,
        category: cat,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        image_url: imageUrl,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Issue reported successfully!");
      setImageFile(null);
      setCategory("");
      setCoords(null);
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to report issue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Provide details about the waste management issue you've encountered
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Issue Title <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Overflowing bin on Main Street"
              maxLength={200}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a waste category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the issue in detail..."
              rows={4}
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
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={captureLocation}
                disabled={locating}
                className="gap-2"
              >
                {locating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <MapPin className="h-3 w-3" />
                )}
                {coords ? "Update GPS" : "Use my location"}
              </Button>
              {coords && (
                <span className="text-xs text-muted-foreground">
                  📍 {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </span>
              )}
            </div>
            {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
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
            {imageFile && (
              <div className="mt-2 space-y-2">
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Preview"
                  className="w-full max-w-xs rounded-lg border"
                />
                <p className="text-sm text-primary">
                  ✓ Image selected: {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Upload a photo to help us understand the issue better (max 5MB)
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
      </DialogContent>
    </Dialog>
  );
};
