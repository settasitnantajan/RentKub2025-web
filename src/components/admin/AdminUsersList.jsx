// /Users/duke/Documents/GitHub/RentKub/client/src/components/admin/AdminUsersList.jsx
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import { listUsers } from "@/api/admin";
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
import { Search, Terminal, Users } from "lucide-react"; // <-- Import Search icon
import { formatDate } from "@/utils/formats";

const AdminUsersList = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // <-- Add state for search term
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Authentication token not available.");
        }
        const response = await listUsers(token);
        setUsers(response.data.result || []);
        console.log("Fetched users:", response.data);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError(
          err.message || "An unknown error occurred while fetching users."
        );
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [getToken]);

  // --- Filter users based on search term ---
  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstname || ""} ${
      user.lastname || ""
    }`.toLowerCase();
    const email = (
      user.emailAddresses?.[0]?.emailAddress ||
      user.email ||
      ""
    ).toLowerCase();
    const id = (user.id || user._id || "").toString().toLowerCase();
    const term = searchTerm.toLowerCase().trim();

    return fullName.includes(term) || email.includes(term) || id.includes(term);
  });

  // --- Process data for New Users (Last 30 Days) Chart ---
  const newUsersChartData = useMemo(() => {
    if (!users || users.length === 0) {
      return [];
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0); // Start of the day

    // Filter users created in the last 30 days
    const recentUsers = users.filter((user) => {
      const createdAt = user.createAt ? new Date(user.createAt) : null;
      return createdAt && createdAt >= thirtyDaysAgo;
    });

    // Group by date (YYYY-MM-DD)
    const dailyCounts = recentUsers.reduce((acc, user) => {
      const dateStr = new Date(user.createAt).toISOString().split("T")[0];
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

      chartData.push({
        date: shortDate, // For X-axis display
        count: dailyCounts[dateStr] || 0,
      });
    }
    return chartData.reverse(); // Show oldest date first
  }, [users]);

  const usersChartConfig = {
    count: { label: "New Users", color: "hsl(var(--chart-3))" },
  };
  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // --- Error State ---
  // if (error) { ... } // Keep error handling as is

  // --- No Data State (Initial Load) ---
  if (!isLoading && !error && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10">
        <Users className="h-12 w-12 mb-4" />
        <p className="text-lg font-semibold">No Users Found</p>
        <p>There are currently no users registered in the system.</p>
      </div>
    );
  }

  // --- Success State (Display Table) ---
  return (
    <div>
      {" "}
      {/* New Users Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>New User Registrations (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {newUsersChartData.length > 0 ? (
            <ChartContainer
              config={usersChartConfig}
              className="min-h-[250px] w-full"
            >
              <BarChart
                data={newUsersChartData}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }} // Adjusted margins
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
                  fill={usersChartConfig.count.color}
                  radius={4}
                  barSize={15}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No new user registration data available for the last 30 days.
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
            placeholder="Search users by name, email, or ID..."
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
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Render filtered users */}
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <TableRow key={user.id || user._id}>
                <TableCell>{user.id || user._id || "N/A"}</TableCell>
                <TableCell className="font-medium">
                  {`${user.firstname || ""} ${user.lastname || ""}`.trim() ||
                    "N/A"}
                </TableCell>
                <TableCell>
                  {user.emailAddresses?.[0]?.emailAddress ||
                    user.email ||
                    "N/A"}
                </TableCell>
                <TableCell>
                  {user.createAt ? formatDate(user.createAt) : "N/A"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            // Show message if search yields no results but users exist
            <TableRow>
              <TableCell
                colSpan={4}
                className="h-24 text-center text-muted-foreground"
              >
                No users found matching your search "{searchTerm}".
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminUsersList;
