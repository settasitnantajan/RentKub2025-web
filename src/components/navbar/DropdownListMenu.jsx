import { useEffect, useState, useCallback } from "react"; // Added useEffect, useState, useCallback
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlignLeft, Home, ChevronRight } from "lucide-react"; // Import Home and ChevronRight
import { Button } from "../ui/button";
import UserIcon from "./UserIcon";
import { privateLinks, publicLinks } from "@/utils/Links";
// Assuming you are using react-router-dom v6+
// If using older react-router, keep your existing import
import { Link } from "react-router"; // Or keep: import { Link } from "react-router";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  SignUpButton,
  UserButton,
  useUser,
  useAuth, // <-- Import useAuth hook
} from "@clerk/clerk-react";
import SignOutLink from "./SignOutLink";
import { listBookings } from "@/api/booking"; // <-- Import API to fetch bookings
import { getHostBookings, getHostLandmarks } from "@/api/host"; // <-- Import getHostLandmarks

const DropdownListMenu = () => {
  const { user, isSignedIn } = useUser(); // Get user and isSignedIn status
  const { getToken } = useAuth(); // Get getToken for API calls
  const [actionableBookingsCount, setActionableBookingsCount] = useState(0);
  const [hostActionableBookingsCount, setHostActionableBookingsCount] = useState(0);

  const [isHost, setIsHost] = useState(false); // New state to track if user is a host
  // --- Determine if the user is an admin ---
  // Adjust this condition based on how you store admin status in Clerk
  // Examples: user.publicMetadata?.role === 'admin', user.organizationMemberships?.[0]?.role === 'admin', etc.
  const isAdmin = user?.publicMetadata?.role === "admin";

  const fetchAndCountBookings = useCallback(async () => {
    if (!isSignedIn) {
      setActionableBookingsCount(0);
      return;
    }

    const token = await getToken();
    if (!token) {
      setActionableBookingsCount(0);
      return;
    }

    try {
      const res = await listBookings(token);
      const bookings = res.data.result || [];

      let waitingPayment = 0;
      let upcoming = 0;
      let awaitingReview = 0;
      const now = new Date();

      bookings.forEach(booking => {
        const checkInDate = new Date(booking.checkIn);
        const paymentStatus = booking.paymentStatus || false;
        const confirmStatus = booking.confirmStatus || false;
        const checkInStatus = booking.checkInStatus || false;
        const checkOutStatus = booking.checkOutStatus || false;
        const reviewed = booking.reviewed || false;
        const cancelledByUserStatus = booking.cancelledByUserStatus || false;

        if (!paymentStatus && !checkOutStatus && !cancelledByUserStatus) {
          waitingPayment++;
        }
        if (paymentStatus && confirmStatus && !checkInStatus && !checkOutStatus && checkInDate > now) {
          upcoming++;
        }
        if (paymentStatus && confirmStatus && checkInStatus && checkOutStatus && !reviewed) {
          awaitingReview++;
        }
      });
      setActionableBookingsCount(waitingPayment + upcoming + awaitingReview);
    } catch (error) {
      console.error("Error fetching bookings for dropdown count:", error);
      setActionableBookingsCount(0);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    fetchAndCountBookings();
  }, [fetchAndCountBookings]);

  const fetchAndCountHostBookings = useCallback(async () => {
    if (!isSignedIn) {
      setHostActionableBookingsCount(0);
      return;
    }
    // Potentially add a check here if only specific roles should see host counts, e.g., if (!isAdmin && !isHostRole) return;

    const token = await getToken();
    if (!token) {
      setHostActionableBookingsCount(0);
      return;
    }

    try {
      const res = await getHostBookings(token);
      const hostBookings = res.data || [];
      let hostActionCount = 0;

      hostBookings.forEach(booking => {
        const {
          paymentStatus = false,
          confirmStatus = false,
          checkInStatus = false,
          checkOutStatus = false,
          cancelledByUserStatus = false,
        } = booking;

        if (cancelledByUserStatus) return; // Skip cancelled bookings

        if (paymentStatus && !confirmStatus) hostActionCount++; // Needs confirmation
        else if (paymentStatus && confirmStatus && !checkInStatus) hostActionCount++; // Needs check-in
        else if (paymentStatus && confirmStatus && checkInStatus && !checkOutStatus) hostActionCount++; // Needs check-out
      });
      setHostActionableBookingsCount(hostActionCount);
    } catch (error) {
      console.error("Error fetching host bookings for dropdown count:", error);
      setHostActionableBookingsCount(0);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    fetchAndCountHostBookings();
  }, [fetchAndCountHostBookings]);

  const checkHostStatus = useCallback(async () => {
    if (!isSignedIn) {
      setIsHost(false);
      return;
    }
    const token = await getToken();
    if (!token) {
      setIsHost(false);
      return;
    }
    try {
      const res = await getHostLandmarks(token);
      const landmarks = res.data || [];
      setIsHost(landmarks.length > 0);
    } catch (error) {
      console.error("Error fetching host landmarks for dropdown:", error);
      setIsHost(false); // Assume not a host on error or if API fails
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (isSignedIn) { // Only check host status if user is signed in
      checkHostStatus();
    }
  }, [isSignedIn, checkHostStatus]);

  // Calculate the total count for the main trigger badge
  const totalActionableCount = actionableBookingsCount + hostActionableBookingsCount;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="relative cursor-pointer"> 
          <AlignLeft />
          <UserIcon />
          {/* Combined badge for all actionable items on the trigger button */}
          {isSignedIn && totalActionableCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white"
              aria-label={`${totalActionableCount} actionable items`}
            >
              {totalActionableCount > 9 ? '9+' : totalActionableCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          {isSignedIn && user ? (
            user.firstName ? `Welcome, ${user.firstName}` : 
            user.username ? `Welcome, ${user.username}` : "My Account"
          ) : (
            "My Account"
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {publicLinks.map((item, index) => {
          return (
            <DropdownMenuItem key={index}>
              {/* Use relative path /admin for flexibility */}
              <Link to={item.href}>{item.label}</Link>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />
        {/* Login Show */}
        <SignedOut>
          <DropdownMenuItem>
            <SignInButton mode="modal">
              <button>Login</button>
            </SignInButton>
          </DropdownMenuItem>

          <DropdownMenuItem>
            <SignUpButton mode="modal">
              <button>Register</button>
            </SignUpButton>
          </DropdownMenuItem>
        </SignedOut>

        {/* Logout Show */}
        <SignedIn>
          {/* --- Conditionally render Admin Dashboard link --- */}
          {isAdmin && (
            <DropdownMenuItem>
              {/* Use relative path /admin for flexibility across environments */}
              <Link to="/admin" className="text-blue-500">
                Admin Dashboard
              </Link>
              {/* Or if you absolutely need the full localhost URL: */}
              {/* <a href="http://localhost:5173/admin">Dashboard</a> */}
            </DropdownMenuItem>
          )}
          {/* --- --- */}

          {/* links other */}
          {privateLinks.map((item, index) => {
            return (
              <DropdownMenuItem key={index} asChild>
                <Link to={item.href} className="flex items-center justify-between w-full">
                  {item.href === "/user/host-dashboard" ? (
                    isHost ? (
                      <span>{item.label}</span>
                    ) : (
                      <span className="text-red-500 font-semibold flex items-center">
                        <Home className="mr-2 h-4 w-4 text-red-500" /> 
                        Become a Host!
                        <ChevronRight className="ml-1 h-4 w-4 animate-pulse" /> 
                      </span>
                    )
                  ) : (
                    <span>{item.label}</span>
                  )}
                  {item.href === "/user/myorders" && actionableBookingsCount > 0 && (
                    <span 
                      className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white"
                      aria-label={`${actionableBookingsCount} actionable bookings`}
                    >
                      {actionableBookingsCount > 9 ? '9+' : actionableBookingsCount}
                    </span>
                  )}
                  {item.href === "/user/host-dashboard" && isHost && hostActionableBookingsCount > 0 && (
                    <span
                      className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white"
                      aria-label={`${hostActionableBookingsCount} host actions pending`}
                    >
                      {hostActionableBookingsCount > 9 ? '9+' : hostActionableBookingsCount}
                    </span>
                  )}
                </Link>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            {/* <UserButton/> */}
            {/* <SignOutButton /> */}
            <SignOutLink />
          </DropdownMenuItem>
        </SignedIn>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default DropdownListMenu;
