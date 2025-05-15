// /Users/duke/Documents/GitHub/RentKub/client/src/pages/admin/Dashboard.jsx
import { useState } from "react";
import StateContainer from "@/components/admin/StateContainer";
import { useUser } from "@clerk/clerk-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// --- Import the actual components ---
import AdminUsersList from "@/components/admin/AdminUsersList";
import AdminCampingsList from "@/components/admin/AdminCampingsList";
import AdminBookingsList from "@/components/admin/AdminBookingsList"; // <-- Import the new component
import AdminOverviewChart from "@/components/admin/AdminOverviewChart"; // <-- Import the overview chart
import Breadcrums from "@/components/campings/Breadcrums"; // <-- Import Breadcrums

// --- Remove Placeholder Components ---
// const AdminUsersList = () => <div className="p-4 border rounded bg-muted/40">User list details will appear here...</div>;
// const AdminCampingsList = () => <div className="p-4 border rounded bg-muted/40">Camping list details will appear here.</div>;
// const AdminBookingsList = () => <div className="p-4 border rounded bg-muted/40">Booking list details will appear here.</div>; // <-- Remove this placeholder
// --- End Remove Placeholders ---

const Dashboard = () => {
  const { user, isLoaded } = useUser();
  const [selectedView, setSelectedView] = useState(null); // Default to null or maybe 'users'

  const handleViewDetails = (viewType) => {
    console.log("Setting view to:", viewType);
    setSelectedView(viewType);
  };

  const renderDetailView = () => {
    switch (selectedView) {
      case "users":
        return <AdminUsersList />;
      case "campings":
        return <AdminCampingsList />;
      case "bookings":
        return <AdminBookingsList />; // <-- Use the imported component
      default:
        return <AdminOverviewChart />; // <-- Show overview chart by default
    }
  };

  const getDetailTitle = () => {
    switch (selectedView) {
      case "users":
        return "User Management";
      case "campings":
        return "Camping Management";
      case "bookings":
        return "Booking Overview"; // <-- Update title
      default:
        return "Platform At a Glance"; // <-- New default title
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Breadcrumbs */}
      <div className="mb-4"> {/* Optional: Add some margin below breadcrumbs */}
        <Breadcrums items={[{ label: "Admin Dashboard" }]} />
      </div>
      {/* Dashboard Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">
          Admin Dashboard
        </h1>
        {isLoaded ? (
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName || "Admin"}! Here's an overview of
            the platform.
          </p>
        ) : (
          <Skeleton className="h-5 w-1/3" />
        )}
      </div>

      {/* Main Content Area (Two Columns) */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column (State Cards) */}
        <div className="w-full md:w-1/4 flex-shrink-0">
          <h2 className="text-lg font-semibold mb-3">Overview Stats</h2>
          {/* StateContainer already calls handleViewDetails('bookings') */}
          <StateContainer onSelectView={handleViewDetails} />
        </div>

        {/* Right Column (Detail View) */}
        <div className="w-full md:w-3/4">
          <Card className="h-full min-h-[300px]">
            {" "}
            {/* Added min-height for better layout */}
            <CardHeader>
              <CardTitle>{getDetailTitle()}</CardTitle>
              {selectedView ? (
                <CardDescription>
                  Detailed information for {selectedView}.
                </CardDescription>
              ) : (
                <CardDescription>
                  An overview of key platform metrics.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>{renderDetailView()}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
