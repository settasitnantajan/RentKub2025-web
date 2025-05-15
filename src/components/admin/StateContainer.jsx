// /Users/duke/Documents/GitHub/RentKub/client/src/components/admin/StateContainer.jsx
import { listStats } from "@/api/admin";
import StateCard from "./StateCard";
import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router"; // Corrected import
import { Users, Tent, CalendarCheck, Loader2 } from "lucide-react";

// Accept onSelectView prop
const StateContainer = ({ onSelectView }) => {
  const [data, setData] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const navigate = useNavigate();

  const { getToken } = useAuth();
  const { user, isLoaded: isClerkLoaded } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";

  useEffect(() => {
    if (isClerkLoaded) {
      if (!isAdmin) {
        console.warn("User is not an admin. Redirecting to home page.");
        navigate("/");
      } else {
        fetchStats();
      }
    }
  }, [isClerkLoaded, isAdmin, getToken, navigate]); // Added navigate back

  const fetchStats = async () => {
    if (isLoadingStats || !isAdmin) return;
    setIsLoadingStats(true);
    setData(null);
    const token = await getToken();
    if (!token) {
      console.error("Admin stats fetch: Token not available.");
      setIsLoadingStats(false);
      return;
    }
    try {
      const res = await listStats(token);
      setData(res.data);
      console.log("Admin stats fetched:", res.data);
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
      setData(null);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // --- Render Logic ---

  if (!isClerkLoaded) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading authentication...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Stats Loading (Show Skeletons)
  if (isLoadingStats) {
    return (
      // Use flex-col for vertical stacking in the smaller left column
      <div className="space-y-4">
        {/* Pass dummy onClick or disable button during load */}
        <StateCard
          label="Users"
          value={<Loader2 className="h-5 w-5 animate-spin" />}
          icon={Users}
          onClick={() => {}}
          disabled={true}
        />
        <StateCard
          label="Campings"
          value={<Loader2 className="h-5 w-5 animate-spin" />}
          icon={Tent}
          onClick={() => {}}
          disabled={true}
        />
        <StateCard
          label="Bookings"
          value={<Loader2 className="h-5 w-5 animate-spin" />}
          icon={CalendarCheck}
          onClick={() => {}}
          disabled={true}
        />
      </div>
    );
  }

  // --- Data Display Section ---
  return (
    // Use flex-col for vertical stacking in the smaller left column
    <div className="space-y-4">
      <StateCard
        label="Users"
        value={data?.usersCount ?? "N/A"}
        icon={Users}
        // Pass the handler with 'users' identifier
        onClick={() => onSelectView("users")}
      />
      <StateCard
        label="Campings"
        value={data?.campingsCount ?? "N/A"}
        icon={Tent}
        // Pass the handler with 'campings' identifier
        onClick={() => onSelectView("campings")}
      />
      <StateCard
        label="Bookings"
        value={data?.bookingsCount ?? "N/A"}
        icon={CalendarCheck}
        // Pass the handler with 'bookings' identifier
        onClick={() => onSelectView("bookings")}
      />
    </div>
  );
  // --- End Data Display Section ---
};
export default StateContainer;
