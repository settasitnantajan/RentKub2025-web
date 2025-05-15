// /Users/duke/Documents/GitHub/RentKub/client/src/components/admin/AdminCampingsList.jsx
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import { listCampings, deleteCamping as apiDeleteCamping } from "@/api/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // <-- Import Input
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Tent, AlertCircle, Trash2, Loader2, Search } from "lucide-react"; // <-- Import Search icon
import { formatDate } from "@/utils/formats";
// import { toast } from "sonner";

const AdminCampingsList = () => {
  const [campings, setCampings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // <-- Add state for search term
  const { getToken } = useAuth();

  const fetchCampings = async () => {
    // ... (fetchCampings function remains the same)
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication token not available.");
      }
      const response = await listCampings(token);
      const campingsData = response.data?.result || response.data || [];
      setCampings(campingsData);
      console.log("Fetched campings:", campingsData);
    } catch (err) {
      console.error("Failed to fetch campings:", err);
      setError(
        err.message || "An unknown error occurred while fetching campings."
      );
      setCampings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getToken]);

  const handleDeleteCamping = async (campingId) => {
    // ... (handleDeleteCamping function remains the same)
    if (
      !window.confirm(
        "Are you sure you want to delete this camping? This action cannot be undone."
      )
    ) {
      return;
    }
    setDeletingId(campingId);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication token not available.");
      }
      await apiDeleteCamping(token, campingId);
      setCampings((prevCampings) =>
        prevCampings.filter(
          (camping) => (camping.id || camping._id) !== campingId
        )
      );
      console.log(`Camping ${campingId} deleted successfully.`);
    } catch (err) {
      console.error(`Failed to delete camping ${campingId}:`, err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "An unknown error occurred while deleting the camping."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // --- Filter campings based on search term ---
  const filteredCampings = campings.filter((camping) => {
    const id = (camping.id || camping._id || "").toString().toLowerCase();
    const title = (camping.title || "").toLowerCase();
    const ownerId = (camping.profile?.id || camping.profile?._id || "")
      .toString()
      .toLowerCase();
    // Add price search (convert to string)
    const price = (camping.price?.toString() || "").toLowerCase();
    const term = searchTerm.toLowerCase().trim();

    return (
      id.includes(term) ||
      title.includes(term) ||
      ownerId.includes(term) ||
      price.includes(term)
    );
  });

  // --- Process data for Camping Category Summary Chart ---
  const campingCategoryChartData = useMemo(() => {
    if (!campings || campings.length === 0) {
      return [];
    }
    const counts = campings.reduce((acc, camping) => {
      const category = camping.category || "Uncategorized"; // Handle missing category
      console.log(category);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [campings]); // Depends on the main campings array

  // Chart configuration
  const campingChartConfig = {
    count: {
      label: "Campings",
      color: "hsl(var(--chart-2))", // Using a different chart color
    },
  };

  // --- Process data for New Campings (Last 30 Days) Chart ---
  const newCampingsChartData = useMemo(() => {
    if (!campings || campings.length === 0) {
      return [];
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0); // Start of the day

    // Filter campings created in the last 30 days
    const recentCampings = campings.filter((camping) => {
      const createdAtDate = camping.createAt
        ? new Date(camping.createAt)
        : camping.createdAt
        ? new Date(camping.createdAt)
        : null;
      return createdAtDate && createdAtDate >= thirtyDaysAgo;
    });

    // Group by date (YYYY-MM-DD)
    const dailyCounts = recentCampings.reduce((acc, camping) => {
      const createdAtDate = camping.createAt
        ? new Date(camping.createAt)
        : new Date(camping.createdAt);
      const dateStr = createdAtDate.toISOString().split("T")[0];
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
  }, [campings]);

  const newCampingsChartConfig = {
    count: { label: "New Campings", color: "hsl(var(--chart-4))" }, // Using a different chart color
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
  if (error && !deletingId) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-destructive py-10">
        <AlertCircle className="h-12 w-12 mb-4" />
        <p className="text-lg font-semibold">Error</p>
        <p>{error}</p>
        <Button onClick={fetchCampings} variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  // --- No Data State (Initial Load) ---
  if (!isLoading && !error && campings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10">
        <Tent className="h-12 w-12 mb-4" />
        <p className="text-lg font-semibold">No Campings Found</p>
        <p>There are currently no campings listed in the system.</p>
      </div>
    );
  }

  // --- Success State (Display Table) ---
  return (
    <div>
      {" "}
      {/* Camping Category Summary Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Camping Category Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {campingCategoryChartData.length > 0 ? (
            <ChartContainer
              config={campingChartConfig}
              className="min-h-[300px] w-full"
            >
              <BarChart
                data={campingCategoryChartData}
                layout="vertical"
                margin={{ left: 20, right: 30, top: 5, bottom: 5 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" dataKey="count" allowDecimals={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={120} // Adjust if category names are longer
                  interval={0}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="count"
                  fill={campingChartConfig.count.color}
                  radius={4}
                  barSize={20}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No camping data available to display category summary.
            </p>
          )}
        </CardContent>
      </Card>
      {/* New Campings (Last 30 Days) Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>New Campings Created (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {newCampingsChartData.length > 0 ? (
            <ChartContainer
              config={newCampingsChartConfig}
              className="min-h-[250px] w-full"
            >
              <BarChart
                data={newCampingsChartData}
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
                  fill={newCampingsChartConfig.count.color}
                  radius={4}
                  barSize={15}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No new camping creation data available for the last 30 days.
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
            placeholder="Search campings by ID, name, owner ID, price..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8" // Add padding for the icon
          />
        </div>
      </div>
      {/* Display deletion error specifically */}
      {error && deletingId && (
        <div className="mb-4 p-3 border border-destructive/50 bg-destructive/10 text-destructive rounded-md text-sm">
          <p>
            <b>Deletion Error:</b> {error}
          </p>
        </div>
      )}
      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-center">Price (THB)</TableHead>
            <TableHead className="text-center">Category</TableHead>
            <TableHead className="text-center">Owner ID</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Render filtered campings */}
          {filteredCampings.length > 0 ? (
            filteredCampings.map((camping) => {
              const id = camping.id || camping._id;
              const isDeleting = deletingId === id;

              return (
                <TableRow key={id}>
                  <TableCell className="font-mono text-xs">
                    {id || "N/A"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {camping.title && camping.title.length > 30
                      ? `${camping.title.substring(0, 30)}...`
                      : camping.title || "N/A"}
                  </TableCell>
                  <TableCell className="text-center">
                    {camping.price ? camping.price.toLocaleString() : "N/A"}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {camping.category || "N/A"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-center">
                    {camping.profile?.id || camping.profile?._id || "N/A"}
                  </TableCell>
                  <TableCell>
                    {camping.createAt || camping.createdAt
                      ? formatDate(camping.createAt || camping.createdAt)
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCamping(id)}
                      disabled={isDeleting}
                      aria-label={`Delete camping ${camping.title || id}`}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            // Show message if search yields no results but campings exist
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-24 text-center text-muted-foreground"
              >
                No campings found matching your search "{searchTerm}".
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminCampingsList;
