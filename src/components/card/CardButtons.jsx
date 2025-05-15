import { SignInButton } from "@clerk/clerk-react";
import { Heart, RotateCw } from "lucide-react";

export const CardSubmitButtons = ({ isPending, isFavorite, onClick, className, ...props }) => {
  console.log("[CardSubmitButtons] Received props - isPending:", isPending, "isFavorite:", isFavorite);
  return (
    <button onClick={onClick} className={className} {...props}>
      {isPending ? (
        <RotateCw className="animate-spin" />
      ) : isFavorite ? (
        <Heart
          className="hover:scale-110 hover:duration-300"
          fill="red"
          size={34}
          stroke="white"
        />
      ) : (
        <Heart
          className="hover:scale-110 hover:duration-300"
          fill="black"
          fillOpacity="25%"
          size={34}
          stroke="white"
        />
      )}
    </button>
  );
};

export const CardSignInButtons = ({ className, ...props }) => {
  return (
    <SignInButton mode="modal">
      {/* Apply className and other props to the button that Clerk will render */}
      <button className={className} {...props}>
        <Heart
          className="hover:scale-110 hover:duration-300" // Icon-specific animation
          fill="black" // Default appearance for sign-in prompt
          fillOpacity="25%"
          size={34}
          stroke="white"
        />
      </button>
    </SignInButton>
  );
};
