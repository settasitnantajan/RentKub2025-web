// /Users/duke/Documents/GitHub/RentKub/client/src/components/admin/AdminOverviewChart.jsx
import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@clerk/clerk-react";
import { listCampings, listBookings, listUsers } from "@/api/admin";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, ResponsiveContainer, Cell, Legend } from "recharts"; // Updated imports
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; // Keep Skeleton
import { AlertCircle } from "lucide-react"; // TrendingUp not needed for this layout
import { formatNumber } from "@/utils/formats";

const AdminOverviewChart = () => {
  const [stats, setStats] = useState({
    totalCampings: 0,
    totalBookings: 0,
    totalIncome: 0,
    totalUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchOverviewData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Authentication token not available.");
        }

        const [campingsResponse, bookingsResponse, usersResponse] =
          await Promise.all([
            listCampings(token),
            listBookings(token),
            listUsers(token),
          ]);

        const campingsData = campingsResponse.data?.result || [];
        const bookingsData = bookingsResponse.data?.result || [];
        const usersData = usersResponse.data?.result || [];

        // Calculate date 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0); // Set to the beginning of the 30th day ago

        const recentBookings = bookingsData.filter((booking) => {
          // Ensure booking.createdAt is a valid date string or Date object
          // Adjust 'booking.createdAt' if your date field is named differently
          const bookingDate = new Date(booking.createdAt);
          return bookingDate >= thirtyDaysAgo;
        });

        const totalCampings = campingsData.length;
        const totalBookingsLast30Days = recentBookings.length;
        const totalUsers = usersData.length;
        const totalIncomeLast30Days = recentBookings.reduce(
          (sum, booking) => sum + (booking.total || 0),
          0
        );

        setStats({
          totalCampings,
          totalBookings: totalBookingsLast30Days,
          totalIncome: totalIncomeLast30Days,
          totalUsers,
        });
      } catch (err) {
        console.error("Failed to fetch overview data:", err);
        setError(
          err.message ||
            "An unknown error occurred while fetching overview data."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverviewData();
  }, [getToken]);

  const chartConfig = {
    value: {
      label: "Value",
    },
    // Define colors for each metric
    campings: { color: "hsl(200, 80%, 55%)" }, // A distinct blue
    bookings: { color: "hsl(120, 65%, 45%)" }, // A distinct green
    income: { color: "hsl(35, 95%, 58%)" }, // A distinct orange
    users: { color: "hsl(260, 70%, 60%)" }, // A distinct purple
  };

  const combinedChartData = useMemo(() => {
    return [
      {
        name: "Campings",
        value: stats.totalCampings,
        fill: chartConfig.campings.color,
      },
      {
        name: "Bookings (30d)",
        value: stats.totalBookings,
        fill: chartConfig.bookings.color,
      },
      { name: "Users", value: stats.totalUsers, fill: chartConfig.users.color },
      {
        name: "Income (30d)",
        value: stats.totalIncome,
        fill: chartConfig.income.color,
        isCurrency: true,
      },
    ].filter((item) => item.value > 0); // Optionally filter out zero-value slices
  }, [stats, chartConfig]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-destructive py-10">
        <AlertCircle className="h-12 w-12" />
        <p className="text-lg font-semibold">Error Loading Overview</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">View Overall Totals</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Overall Platform Totals</DialogTitle>
              <DialogDescription>
                A summary of key metrics for the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <ul className="space-y-2">
                {combinedChartData.map((item) => (
                  <li
                    key={item.name}
                    className="flex flex-col items-start p-3 border-b last:border-b-0 sm:flex-row sm:justify-between sm:items-center sm:p-2"
                  >
                    <span className="flex items-center mb-1 sm:mb-0">
                      <span
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: item.fill }}
                      ></span>
                      {item.name}:
                    </span>
                    <span className="font-medium">
                      {item.isCurrency && typeof item.value === "number"
                        ? `฿${item.value.toFixed(2)}`
                        : formatNumber(item.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <ChartContainer
        config={chartConfig}
        className="w-full flex flex-col items-center min-h-[300px]" // Apply min-height on all screen sizes
      >
        {/* Pie chart will now be visible on all screen sizes */}
        <ResponsiveContainer width="100%" height={300} className="">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => {
                    if (item.payload.isCurrency && typeof value === "number") {
                      // Ensure currency uses toFixed(2) here too
                      return `฿${value.toFixed(2)}`;
                    }
                    return formatNumber(value);
                  }}
                />
              }
            />
            <Pie
              data={combinedChartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={60} // Creates the donut effect
              paddingAngle={2}
              strokeWidth={2}
            >
              {combinedChartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  stroke={entry.fill}
                />
              ))}
            </Pie>
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </>
  );
};

export default AdminOverviewChart;
