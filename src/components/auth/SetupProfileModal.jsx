// /Users/duke/Documents/GitHub/RentKub/client/src/components/auth/SetupProfileModal.jsx
import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createProfile } from "@/api/profile";
// Remove useNavigate if you are no longer forcing a refresh
// import { useNavigate } from "react-router";

const SetupProfileModal = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  // const navigate = useNavigate(); // No longer needed if Clerk update works

  const [isOpen, setIsOpen] = useState(true);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Pre-fill from Clerk if available, but allow user to change
    // This effect might not be strictly necessary if the modal only shows
    // when names are missing, but it's good practice.
    if (!firstName) setFirstName(user?.firstName || "");
    if (!lastName) setLastName(user?.lastName || "");
  }, [user?.firstName, user?.lastName]); // Rerun if Clerk data changes externally

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!firstName || !lastName) {
      setError("Both first and last name are required.");
      setIsSubmitting(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const profileData = {
        firstname: firstName,
        lastname: lastName,
      };

      // 1. Call the API to create the profile in your backend
      await createProfile(token, profileData);
      toast.success("Profile saved successfully!");

      // 2. Update Clerk user data directly
      // Check if user object and update method exist before calling
      if (user && typeof user.update === 'function') {
        try {
          await user.update({ firstName: firstName, lastName: lastName });
          // Optional: A toast confirming Clerk update, might be too much noise
          // toast.info("User session updated.");
          console.log("Clerk user session updated successfully.");
        } catch (clerkUpdateError) {
          // Log the error, but don't block the process if backend save succeeded
          console.error("Failed to update Clerk user session:", clerkUpdateError);
          toast.warning("Profile saved, but session update failed. A refresh might be needed to see changes everywhere.");
        }
      } else {
         console.warn("Clerk user object or update method not available.");
         toast.warning("Profile saved, but couldn't update the current session automatically. Please refresh if needed.");
      }


      // 3. Close the modal ONLY on successful backend submission
      setIsOpen(false);

      // 4. Remove forced refresh - Clerk's state update should trigger UI changes
      // navigate(0);

    } catch (err) {
      console.error("Failed to setup profile:", err);
      const errorMessage = err.response?.data?.message || err.message || "An unexpected error occurred.";
      setError(errorMessage);
      toast.error(`Profile setup failed: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // No changes needed for the rest of the component (render part)
  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        // hideCloseButton // Ensure no close 'X' is visible if possible
      >
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Welcome! Please provide your first and last name to continue.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                First Name
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="col-span-3"
                placeholder="Your first name"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="col-span-3"
                placeholder="Your last name"
                disabled={isSubmitting}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-500 col-span-4 text-center">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !firstName || !lastName}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SetupProfileModal;
