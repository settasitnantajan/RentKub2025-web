// /Users/duke/Documents/GitHub/RentKub/client/src/components/admin/AdminBookingsList.jsx
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import { listBookings } from "@/api/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input"; // <-- Import Input
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { AlertCircle, CalendarDays, Loader2, Search } from "lucide-react"; // <-- Import Search icon
import { formatDate, formatNumber } from "@/utils/formats";

const AdminBookingsList = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // <-- Add state for search term
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Authentication token not available.");
        }
        const response = await listBookings(token);
        setBookings(response.data?.result || []);
        console.log("Fetched bookings:", response.data?.result);
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "An unknown error occurred while fetching bookings."
        );
        setBookings([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [getToken]);

  // --- Filter bookings based on search term ---
  const filteredBookings = bookings.filter((booking) => {
    const bookingId = (booking.id || booking._id || "")
      .toString()
      .toLowerCase();
    const userName = `${booking.profile?.firstname || ""} ${
      booking.profile?.lastname || ""
    }`.toLowerCase();
    const userEmail = (booking.profile?.email || "").toLowerCase();
    const userId = (booking.profile?._id || booking.profile?.id || "")
      .toString()
      .toLowerCase();
    const campingTitle = (booking.landmark?.title || "").toLowerCase();
    const campingId = (booking.landmark?._id || booking.landmark?.id || "")
      .toString()
      .toLowerCase();
    const term = searchTerm.toLowerCase().trim();

    return (
      bookingId.includes(term) ||
      userName.includes(term) ||
      userEmail.includes(term) ||
      userId.includes(term) ||
      campingTitle.includes(term) ||
      campingId.includes(term)
      // Add more fields to search if needed (e.g., status, dates - though date search needs careful handling)
    );
  });

  // Helper function to determine display status for admin view
  const getBookingDisplayStatus = (booking) => {
    const now = new Date();
    // Ensure date parsing is robust, handle invalid dates if necessary
    const checkInDate = booking.checkIn ? new Date(booking.checkIn) : null;
    // const checkOutDate = booking.checkOut ? new Date(booking.checkOut) : null; // Not directly used in this logic path for now

    const paymentStatus = booking.paymentStatus || false;
    const confirmStatus = booking.confirmStatus || false;
    const checkInStatus = booking.checkInStatus || false;
    const checkOutStatus = booking.checkOutStatus || false;
    const cancelledByUserStatus = booking.cancelledByUserStatus || false;

    let text = "Unknown";
    let className = "bg-gray-100 text-gray-800 border-gray-300"; // Default style

    if (cancelledByUserStatus) {
      text = "Cancelled (User)";
      className = "bg-red-50 text-red-700 border border-red-200";
    } else if (!paymentStatus && !checkOutStatus) {
      text = "Awaiting Payment";
      className = "bg-orange-50 text-orange-700 border border-orange-200";
    } else if (paymentStatus && !confirmStatus && !checkOutStatus) {
      text = "Awaiting Confirmation";
      className = "bg-blue-50 text-blue-700 border border-blue-200";
    } else if (
      paymentStatus &&
      confirmStatus &&
      !checkInStatus &&
      !checkOutStatus
    ) {
      if (checkInDate && checkInDate > now) {
        text = "Upcoming";
        className = "bg-green-50 text-green-700 border border-green-200";
      } else if (checkInDate && checkInDate <= now) {
        text = "Awaiting Check-in"; // Past due for check-in
        className = "bg-yellow-50 text-yellow-700 border border-yellow-200";
      } else {
        text = "Pending Check-in"; // Fallback if date is invalid or missing
        className = "bg-yellow-50 text-yellow-600 border border-yellow-200";
      }
    } else if (
      paymentStatus &&
      confirmStatus &&
      checkInStatus &&
      !checkOutStatus
    ) {
      text = "Checked In";
      className = "bg-indigo-50 text-indigo-700 border border-indigo-200";
    } else if (
      paymentStatus &&
      confirmStatus &&
      checkInStatus &&
      checkOutStatus
    ) {
      text = "Completed";
      className = "bg-gray-100 text-gray-700 border border-gray-300";
    } else {
      text = "Processing"; // General fallback
      className = "bg-gray-50 text-gray-600 border border-gray-200";
    }

    return { text, className };
  };

  // --- Process data for Booking Status Summary Chart ---
  const bookingStatusChartData = useMemo(() => {
    if (!bookings || bookings.length === 0) {
      return [];
    }
    const counts = bookings.reduce((acc, booking) => {
      // Use the same status logic as the table
      const statusText = getBookingDisplayStatus(booking).text;
      acc[statusText] = (acc[statusText] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [bookings]); // Depends on bookings array

  // Chart configuration (can be expanded later if needed)
  const bookingChartConfig = {
    count: {
      label: "Bookings",
      color: "hsl(var(--chart-1))", // Uses a shadcn/ui CSS variable for color
    },
  };

  // --- Process data for New Bookings (Last 30 Days) Chart ---
  const newBookingsChartData = useMemo(() => {
    if (!bookings || bookings.length === 0) {
      return [];
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0); // Start of the day

    // Filter bookings created in the last 30 days
    const recentBookings = bookings.filter((booking) => {
      const createdAtDate = booking.createdAt
        ? new Date(booking.createdAt)
        : null;
      return createdAtDate && createdAtDate >= thirtyDaysAgo;
    });

    // Group by date (YYYY-MM-DD)
    const dailyCounts = recentBookings.reduce((acc, booking) => {
      const dateStr = new Date(booking.createdAt).toISOString().split("T")[0];
      acc[dateStr] = (acc[dateStr] || 0) + 1;
      return acc;
    }, {});

    // Create data points for the last 30 days
    const chartData = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const shortDate = `${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}/${String(date.getDate()).padStart(2, "0")}`; // MM/DD format
      chartData.push({ date: shortDate, count: dailyCounts[dateStr] || 0 });
    }
    return chartData.reverse(); // Show oldest date first
  }, [bookings]);

  const newBookingsChartConfig = {
    count: { label: "New Bookings", color: "hsl(var(--chart-5))" }, // Using a different chart color
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/4" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-destructive py-10">
        <AlertCircle className="h-12 w-12 mb-4" />
        <p className="text-lg font-semibold">Error Fetching Bookings</p>
        <p>{error}</p>
      </div>
    );
  }

  // --- No Data State (Initial Load) ---
  if (!isLoading && !error && bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10">
        <CalendarDays className="h-12 w-12 mb-4" />
        <p className="text-lg font-semibold">No Bookings Found</p>
        <p>There are currently no bookings recorded in the system.</p>
      </div>
    );
  }

  // --- Success State (Display Table) ---
  return (
    <div>
      {" "}
      {/* Booking Status Summary Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Booking Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {bookingStatusChartData.length > 0 ? (
            <ChartContainer
              config={bookingChartConfig}
              className="min-h-[300px] w-full"
            >
              <BarChart
                data={bookingStatusChartData}
                layout="vertical"
                margin={{ left: 20, right: 30, top: 5, bottom: 5 }} // Adjusted margins
              >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" dataKey="count" allowDecimals={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={150} // Adjust if status names are longer/shorter
                  interval={0} // Ensure all labels are displayed
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="count"
                  fill={bookingChartConfig.count.color}
                  radius={4}
                  barSize={20}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No booking data available to display summary chart.
            </p>
          )}
        </CardContent>
      </Card>
      {/* New Bookings (Last 30 Days) Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>New Bookings Created (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {newBookingsChartData.length > 0 ? (
            <ChartContainer
              config={newBookingsChartConfig}
              className="min-h-[250px] w-full"
            >
              <BarChart
                data={newBookingsChartData}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis allowDecimals={false} tickMargin={8} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="count"
                  fill={newBookingsChartConfig.count.color}
                  radius={4}
                  barSize={15}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No new booking creation data available for the last 30 days.
            </p>
          )}
        </CardContent>
      </Card>
      {/* Wrap content in a div for positioning */}
      {/* Search Input */}
      <div className="flex justify-end mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search bookings by ID, user, camping..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8" // Add padding for the icon
          />
        </div>
      </div>
      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Booking ID</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Camping</TableHead>
            <TableHead>Check-in</TableHead>
            <TableHead>Check-out</TableHead>
            <TableHead className="text-right">Total Price</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead>Booked On</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Render filtered bookings */}
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => {
              const bookingId = booking.id || booking._id;
              const userName = booking.profile
                ? `${booking.profile.firstname || ""} ${
                    booking.profile.lastname || ""
                  }`.trim()
                : "N/A";
              const userEmail = booking.profile?.email || "N/A";
              const campingTitle =
                booking.landmark?.title.substring(0, 20) || "N/A";

              return (
                <TableRow key={bookingId}>
                  <TableCell className="font-mono text-xs">
                    {bookingId}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div title={userEmail}>{userName}</div>
                    <div className="text-xs text-muted-foreground">
                      id:{" "}
                      {booking.profile?._id ||
                        booking.profile?.id ||
                        "No User ID"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{campingTitle}</div>
                    <div className="text-xs text-muted-foreground">
                      id:{" "}
                      {booking.landmark?._id ||
                        booking.landmark?.id ||
                        "No Camping ID"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {booking.checkIn ? formatDate(booking.checkIn) : "N/A"}
                  </TableCell>
                  <TableCell>
                    {booking.checkOut ? formatDate(booking.checkOut) : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    {booking.total ? `${formatNumber(booking.total)}฿` : "N/A"}
                  </TableCell>
                  <TableCell className="text-center">
                    {(() => {
                      const statusInfo = getBookingDisplayStatus(booking);
                      return (
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${statusInfo.className}`}
                        >
                          {statusInfo.text}
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {booking.createdAt ? formatDate(booking.createdAt) : "N/A"}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            // Show message if search yields no results but bookings exist
            <TableRow>
              <TableCell
                colSpan={8}
                className="h-24 text-center text-muted-foreground"
              >
                No bookings found matching your search "{searchTerm}".
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminBookingsList;
