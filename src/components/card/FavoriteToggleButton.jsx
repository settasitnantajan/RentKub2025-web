// /Users/duke/Documents/GitHub/RentKub/client/src/components/card/FavoriteToggleButton.jsx
import { useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import useCampingStore from "@/store/camping-store";
// import { Heart } from "lucide-react"; // No longer directly used here
// import { Button } from "@/components/ui/button"; // No longer directly used here
// import { toast } from "sonner"; // Replaced with createNotify
// import { createNotify } from "@/utils/notifications"; // Assuming createNotify is in utils/notifications.js or similar
// import { useNavigate } from "react-router"; // Not needed as CardSignInButtons handles the modal
import { createNotify } from "@/utils/createAlert";
import { CardSubmitButtons, CardSignInButtons } from "@/components/card/CardButtons";

const FavoriteToggleButton = ({ campingId, isFavorite }) => {
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const [isPending, setIsPending] = useState(false);
  const actionAddorRemoveFavorite = useCampingStore(
    (state) => state.actionAddorRemoveFavorite
  );
  console.log("[FavoriteToggleButton] Received props - campingId:", campingId, "isFavorite:", isFavorite);

  const handleToggleFavorite = async (e) => {
    e.preventDefault(); // Prevent link navigation if this button is inside an <a> tag
    e.stopPropagation(); // Stop event from bubbling up

    if (!isSignedIn) {
      // This case should ideally not be hit if CardSignInButtons is rendered,
      // but as a fallback:
      createNotify("error", "Please sign in to manage favorites.");
      return;
    }

    setIsPending(true);
    try {
    const token = await getToken();
    if (!token) {
        createNotify("error", "Authentication error. Please try again.");
      return;
    }

    // The `data` for `actionAddorRemoveFavorite` expects `campingId` and the *current* `isFavorite` state.
    // The action itself will toggle it in the store.
    const result = await actionAddorRemoveFavorite(token, {
        campingId,
        isFavorite,
    });

    if (result.success) {
        createNotify("success", result.message); // Corrected: use result.message
    } else {
        createNotify("error", result.message || "Failed to update favorite status."); // Corrected: use result.message, add fallback
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      createNotify("error", "An unexpected error occurred while updating favorites.");
    } finally {
      setIsPending(false);
    }
  };

  // Base classes for the button's appearance in the overlay.
  // CardSubmitButtons/CardSignInButtons use size={34} for icons.
  const baseButtonClasses = "rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center p-1"; // Added p-1 for a bit of padding around the 34px icon

  if (!isSignedIn) {
    return (
      <CardSignInButtons
        className={baseButtonClasses}
        aria-label="Add to favorites (requires sign-in)"
      />
    );
  }

  return (
    <CardSubmitButtons
      isPending={isPending}
      isFavorite={isFavorite}
      onClick={handleToggleFavorite}
      className={`${baseButtonClasses} ${isFavorite ? "bg-red-500/50 hover:bg-red-500/70" : ""}`} // Apply dynamic background for active state
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    />
  );
};

export default FavoriteToggleButton;