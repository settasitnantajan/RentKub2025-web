// /Users/duke/Documents/GitHub/RentKub/client/src/components/navbar/UserIcon.jsx
import { useUser } from "@clerk/clerk-react";
import { CircleUserRound, ShieldCheck } from "lucide-react"; // Import an icon for admin if desired

const UserIcon = () => {
  // Clerk
  const { user } = useUser();

  if (user) {
    // Check for the admin role in public metadata
    const isAdmin = user.publicMetadata?.role === "admin";

    return (
      // Use a flex container for better alignment
      <div className="flex items-center gap-2">
        {/* Conditionally display Admin Badge or User Image */}
        {isAdmin ? (
          // Display something distinct for Admins
          // Option 1: Admin Badge next to name (shown above within the <p> tag)
          // Option 2: Replace image with an Admin Icon
          <ShieldCheck className="w-6 h-6 text-blue-600" title="Admin User" />
        ) : (
          // Option 3: Keep image but add a visual cue (e.g., border) - less common
          // <img src={user.imageUrl} alt={`${user.firstName} ${user.lastName}'s profile (Admin)`} className="w-6 h-6 rounded-full object-cover border-2 border-blue-500" />

          // Display standard user image for non-admins
          <img
            src={user.imageUrl}
            alt={`${user.firstName} ${user.lastName}'s profile`} // Add alt text for accessibility
            className="w-6 h-6 rounded-full object-cover"
          />
        )}

        {/* Alternative: Always show image, add badge separately */}
        {isAdmin && (
          <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full">
            Admin
          </span>
        )}
      </div>
    );
  }

  // Fallback for logged-out users
  return <CircleUserRound />;
};
export default UserIcon;
