import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, PREMIUM_TIERS } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, Zap, Crown, Lock, Navigation } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function RequestPickupDialog() {
  const navigate = useNavigate();
  const { isSubscribed, tier } = useSubscription();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [notes, setNotes] = useState("");
  const [isPriority, setIsPriority] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast.error("Please select a pickup date");
      return;
    }

    if (!location.trim()) {
      toast.error("Please enter a pickup location");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Build notes with priority flag if applicable
      let finalNotes = notes.trim() || "";
      if (isPriority && isSubscribed) {
        finalNotes = `[PRIORITY PICKUP] ${finalNotes}`.trim();
      }

      const { error } = await supabase.from("waste_pickups").insert({
        user_id: user.id,
        scheduled_date: format(date, "yyyy-MM-dd"),
        location: location.trim(),
        notes: finalNotes || null,
        status: "pending",
      });

      if (error) throw error;

      toast.success(
        isPriority && isSubscribed 
          ? "Priority pickup request submitted! You'll be prioritized." 
          : "Pickup request submitted successfully!"
      );
      setOpen(false);
      setDate(undefined);
      setLocation("");
      setNotes("");
      setIsPriority(false);
      
      // Refresh the page to show the new pickup
      setTimeout(() => window.location.reload(), 500);
    } catch (error: any) {
      console.error("Error creating pickup:", error);
      toast.error("Failed to submit pickup request");
    } finally {
      setLoading(false);
    }
  };

  const getBonusText = () => {
    if (tier === "pro") return "+25% bonus rewards";
    if (tier === "basic") return "+10% bonus rewards";
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Request Pickup
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Request Waste Pickup
              {isSubscribed && (
                <Badge variant="secondary" className="text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  {getBonusText()}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Schedule a waste collection at your location
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Priority Pickup Toggle - Premium Feature */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className={cn(
                    "h-4 w-4",
                    isSubscribed ? "text-primary" : "text-muted-foreground"
                  )} />
                  <Label htmlFor="priority" className="font-medium">
                    Priority Pickup
                  </Label>
                  {!isSubscribed && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Lock className="h-3 w-3" />
                      Premium
                    </Badge>
                  )}
                </div>
                <Switch
                  id="priority"
                  checked={isPriority}
                  onCheckedChange={setIsPriority}
                  disabled={!isSubscribed}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {isSubscribed 
                  ? "Your pickup will be prioritized and scheduled first."
                  : "Upgrade to Premium for priority scheduling and faster pickups."
                }
              </p>
              {!isSubscribed && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setOpen(false);
                    navigate("/dashboard/billing");
                  }}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Premium
                </Button>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">Pickup Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Pickup Location *</Label>
              <Input
                id="location"
                placeholder="Enter your address or location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions or details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
