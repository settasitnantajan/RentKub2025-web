import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { getHostBookings, getHostLandmarks } from "@/api/host.jsx"; // Import the new API functions
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"; // Import specific recharts components used by shadcn charts
import {
  Card,
  CardContent,
  CardDescription, // Added for chart context
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow, // Removed Badge import
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"; // Corrected import path
// import { format } from "date-fns"; // For formatting dates (install if needed: npm install date-fns)
import {
  formatDateISO,
  formatDateShort, // Keep this if used elsewhere, or remove if only for charts
  formatDatePretty,
  formatNumber,
} from "@/utils/formats.jsx"; // Import custom formatters
import { updateBookingStatus } from "@/api/booking";
import { Link } from "react-router"; // <-- Import Link
import { Input } from "@/components/ui/input";
import { Search, Star, Loader2, ChevronRight, Heart } from "lucide-react"; // <-- Import Search, Star, Loader2, ChevronRight, and Heart icons
import ConfirmationModal from "./ConfirmationModal"; // Import the modal

import { toast } from "sonner"; // For notifications
import LoadingSpinner from "../LoadingSpinner";
import Breadcrums from "@/components/campings/Breadcrums"; // Import the Breadcrums component

const HostDashboard = () => {
  const { getToken } = useAuth();
  const [landmarks, setLandmarks] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]); // State for pending requests
  const [loading, setLoading] = useState(true);
  const [incomeData, setIncomeData] = useState([]); // State for income chart
  const [searchTermLandmarks, setSearchTermLandmarks] = useState("");
  const [searchTermAllBookings, setSearchTermAllBookings] = useState("");
  const [searchTermConfirmedBookings, setSearchTermConfirmedBookings] =
    useState("");
  // New state for pending action counts
  const [needsConfirmationCount, setNeedsConfirmationCount] = useState(0);
  const [needsCheckInCount, setNeedsCheckInCount] = useState(0);
  const [needsCheckOutCount, setNeedsCheckOutCount] = useState(0);
  const [todayIncome, setTodayIncome] = useState(0); // New state for today's income
  const [todayBookingsCount, setTodayBookingsCount] = useState(0); // New state for today's bookings count
  const [isActionConfirmModalOpen, setIsActionConfirmModalOpen] = useState(false);
  const [currentActionInfo, setCurrentActionInfo] = useState({
    bookingId: null,
    actionType: null, 
    title: "",
    description: "",
    confirmText: "",
    confirmButtonVariant: "default",
    actionFunction: null,
  });
  const [averageOverallRating, setAverageOverallRating] = useState(0);
  const [totalReviewCount, setTotalReviewCount] = useState(0);
  // New state for best rated and most booked landmarks
  const [bestRatedLandmark, setBestRatedLandmark] = useState(null);
  const [mostBookedLandmark, setMostBookedLandmark] = useState(null);
  const [mostBookedLandmarkCount, setMostBookedLandmarkCount] = useState(0);
  // New state for most income landmark
  const [mostIncomeLandmark, setMostIncomeLandmark] = useState(null);
  const [mostIncomeLandmarkAmount, setMostIncomeLandmarkAmount] = useState(0);
  // New state for most favorited landmark
  const [mostFavoritedLandmark, setMostFavoritedLandmark] = useState(null);
  const [mostFavoritedLandmarkCount, setMostFavoritedLandmarkCount] = useState(0);


  // Define chart config for income
  const incomeChartConfig = {
    income: {
      label: "Income",
      color: "hsl(var(--chart-1))", // Use shadcn CSS variables
    },
    // Add more series if needed
  };

  const [bookingTrendData, setBookingTrendData] = useState([]); // State for booking trend chart
  // Define chart config for booking trends
  const bookingTrendChartConfig = {
    count: {
      label: "Bookings",
      color: "hsl(var(--chart-3))", // Use a different shadcn CSS variable
    },
  };

  const [reviewData, setReviewData] = useState([]); // State for review chart
  // Define chart config for reviews
  const reviewChartConfig = {
    count: {
      label: "Count",
      color: "hsl(var(--chart-2))", // Use different shadcn CSS variable
    },
    // Define colors for each star rating if needed for more complex charts
    // stars: {
    //   label: "Stars",
    //   color: "hsl(var(--chart-3))",
    // }
  };
  const [error, setError] = useState(null);

  // Define fetchData in the component scope so it can be called by useEffect and handlers
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        // Handle case where user is not authenticated or token is unavailable
        throw new Error("Authentication token not available.");
      }

      // Fetch landmarks and bookings in parallel
      const [landmarksRes, bookingsRes] = await Promise.all([
        getHostLandmarks(token),
        getHostBookings(token),
      ]);

      const allLandmarks = landmarksRes.data || []; // Get all landmarks for the host
      const allBookings = bookingsRes.data || [];
      const pending = allBookings.filter((booking) => !booking.paymentStatus);
      // You could also filter for confirmed bookings if needed for other purposes:
      // const confirmed = allBookings.filter(booking => booking.paymentStatus);

      setLandmarks(landmarksRes.data || []);
      setBookings(allBookings); // Keep all bookings for the "Recent Bookings" section for now
      setPendingBookings(pending); // Set the filtered pending bookings

      // Calculate pending action counts for the host
      let confirmNeeded = 0;
      let checkInNeeded = 0;
      let checkOutNeeded = 0;

      allBookings.forEach(booking => {
        const {
          paymentStatus = false,
          confirmStatus = false,
          checkInStatus = false,
          checkOutStatus = false,
          cancelledByUserStatus = false, // Used to exclude cancelled bookings from host actions
        } = booking;

        if (cancelledByUserStatus) return; // Skip if cancelled by user

        if (paymentStatus && !confirmStatus) {
          confirmNeeded++;
        } else if (paymentStatus && confirmStatus && !checkInStatus) {
          checkInNeeded++;
        } else if (paymentStatus && confirmStatus && checkInStatus && !checkOutStatus) {
          checkOutNeeded++;
        }
      });
      setNeedsConfirmationCount(confirmNeeded);
      setNeedsCheckInCount(checkInNeeded);
      setNeedsCheckOutCount(checkOutNeeded);

      // Calculate Today's Income
      const today = new Date();
      const todayDateString = formatDateISO(today); // Get today's date in YYYY-MM-DD format

      const todaysConfirmedBookings = allBookings.filter(
        (b) => b.paymentStatus && formatDateISO(b.createdAt) === todayDateString
      );
      const currentTodayIncome = todaysConfirmedBookings.reduce((sum, booking) => sum + (booking.total || 0), 0);
      setTodayIncome(currentTodayIncome);

      // Calculate Today's Bookings Count (all bookings made today, regardless of payment status)
      const todaysAllBookings = allBookings.filter(
        (b) => formatDateISO(b.createdAt) === todayDateString
      );
      setTodayBookingsCount(todaysAllBookings.length);

      // --- Process data for charts ---

      // 1. Income Chart (Last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const confirmedBookingsLast30Days = allBookings.filter(
        (b) => b.paymentStatus && new Date(b.createdAt) >= thirtyDaysAgo // Assuming createdAt is the booking date
      );
      console.log(
        "Confirmed Bookings (Last 30 Days):",
        confirmedBookingsLast30Days
      );

      const dailyIncome = confirmedBookingsLast30Days.reduce((acc, booking) => {
        const date = formatDateISO(booking.createdAt); // Use custom formatter
        acc[date] = (acc[date] || 0) + booking.total;
        return acc;
      }, {});

      // Create data points for the last 30 days, including days with 0 income
      const incomeChartData = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const formattedDate = formatDateISO(date);
        const shortDate = formatDateShort(date); // Use custom formatter
        incomeChartData.push({
          date: shortDate, // Use short date for display
          fullDate: formattedDate, // Keep full date for sorting/reference
          income: dailyIncome[formattedDate] || 0,
        });
      }
      console.log("Income Chart Data:", incomeChartData);
      setIncomeData(incomeChartData.reverse()); // Reverse to show oldest date first

      // 2. Booking Trend Chart (Last 30 days)
      const bookingsLast30Days = allBookings.filter(
        (b) => new Date(b.createdAt) >= thirtyDaysAgo
      );

      const dailyBookings = bookingsLast30Days.reduce((acc, booking) => {
        const date = formatDateISO(booking.createdAt); // Use custom formatter
        acc[date] = (acc[date] || 0) + 1; // Increment count for the day
        return acc;
      }, {});

      const bookingChartData = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const formattedDate = formatDateISO(date);
        const shortDate = formatDateShort(date); // Use custom formatter
        bookingChartData.push({
          date: shortDate,
          count: dailyBookings[formattedDate] || 0,
        });
      }
      setBookingTrendData(bookingChartData.reverse()); // Reverse to show oldest date first

      // 3. Review Stars Distribution
      const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }; // Initialize counts for 1 to 5 stars

      let totalStarsSum = 0;
      let currentTotalReviews = 0;

      if (allLandmarks && allLandmarks.length > 0) {
        allLandmarks.forEach(landmark => {
          // Assuming landmark.reviews exists and each review has overallRating
          if (landmark.reviews && landmark.reviews.length > 0) {
            landmark.reviews.forEach(review => {
              const rating = Math.round(review.overallRating); // Ensure integer rating
              if (rating >= 1 && rating <= 5) { // Check if rating is within valid range
                starCounts[rating]++;
                totalStarsSum += review.overallRating; // Use the actual rating for sum
                currentTotalReviews++;
              }
            });
          }
        });
      }

      const processedReviewData = Object.keys(starCounts)
        .map(star => ({
          stars: parseInt(star), // The star rating value (e.g., 1, 2, 3, 4, 5)
          count: starCounts[star], // The number of reviews with this star rating
        })).sort((a, b) => b.stars - a.stars); // Ensure sorted by stars in descending order for the chart display

      setReviewData(processedReviewData);
      setTotalReviewCount(currentTotalReviews);
      setAverageOverallRating(
        currentTotalReviews > 0 ? totalStarsSum / currentTotalReviews : 0
      );

      // --- START: Calculate per-landmark averageRating and reviewCount ---
      const landmarksWithCalculatedRatings = allLandmarks.map(lm => {
        let sumOfRatings = 0;
        let count = 0;
        let avgRating = 0;
        if (lm.reviews && lm.reviews.length > 0) {
          count = lm.reviews.length;
          sumOfRatings = lm.reviews.reduce((acc, rev) => acc + rev.overallRating, 0);
          avgRating = count > 0 ? sumOfRatings / count : 0;
        }
        return {
          ...lm,
          averageRating: avgRating, // Will be used by the "Best Rated" card logic
          reviewCount: count,       // Will be used by the "Best Rated" card logic
        };
      });
      // --- END: Calculate per-landmark averageRating and reviewCount ---

      // 4. Determine Best Rated Landmark
      let determinedBestRatedLandmark = null;
      // Use landmarksWithCalculatedRatings which now have .averageRating and .reviewCount
      if (landmarksWithCalculatedRatings.length > 0) {
        determinedBestRatedLandmark = landmarksWithCalculatedRatings
          .filter(lm => lm.averageRating > 0 && lm.reviewCount > 0) // Ensure landmark has actual reviews and a positive rating
          .reduce((best, current) => {
            if (!best) return current;
            if (current.averageRating > best.averageRating) return current;
            // Tie-breaker: if ratings are equal, prefer the one with more reviews
            if (current.averageRating === best.averageRating && current.reviewCount > best.reviewCount) return current;
            return best;
          }, null);
      }
      setBestRatedLandmark(determinedBestRatedLandmark);

      // 5. Determine Most Booked Landmark
      let determinedMostBookedLandmark = null;
      let maxBookingsCount = 0;
      // Use landmarksWithCalculatedRatings to find the landmark object by ID
      if (allBookings.length > 0 && landmarksWithCalculatedRatings.length > 0) {
        const landmarkBookingCounts = allBookings.reduce((acc, booking) => {
          // Use booking.landmarkId as it's directly available from the Prisma schema
          if (booking.landmarkId !== undefined && booking.landmarkId !== null) {
            const landmarkIdStr = String(booking.landmarkId);
            acc[landmarkIdStr] = (acc[landmarkIdStr] || 0) + 1;
          }
          return acc;
        }, {});

        if (Object.keys(landmarkBookingCounts).length > 0) {
          let mostBookedLandmarkIdStr = null;
          for (const landmarkIdStr in landmarkBookingCounts) {
            if (landmarkBookingCounts[landmarkIdStr] > maxBookingsCount) {
              maxBookingsCount = landmarkBookingCounts[landmarkIdStr];
              mostBookedLandmarkIdStr = landmarkIdStr;
            }
          }
          if (mostBookedLandmarkIdStr) {
            determinedMostBookedLandmark = landmarksWithCalculatedRatings.find(lm => String(lm.id) === mostBookedLandmarkIdStr);
          }
        }
      }
      setMostBookedLandmark(determinedMostBookedLandmark);
      setMostBookedLandmarkCount(maxBookingsCount);

      // 6. Determine Landmark with Most Income
      let determinedMostIncomeLandmark = null;
      let maxIncomeAmount = 0;
      if (allBookings.length > 0 && landmarksWithCalculatedRatings.length > 0) {
        const landmarkIncome = allBookings.reduce((acc, booking) => {
          // Consider only paid bookings for income calculation
          if (booking.paymentStatus && booking.landmarkId !== undefined && booking.landmarkId !== null) {
            const landmarkIdStr = String(booking.landmarkId);
            acc[landmarkIdStr] = (acc[landmarkIdStr] || 0) + (booking.total || 0);
          }
          return acc;
        }, {});

        if (Object.keys(landmarkIncome).length > 0) {
          let mostIncomeLandmarkIdStr = null;
          for (const landmarkIdStr in landmarkIncome) {
            if (landmarkIncome[landmarkIdStr] > maxIncomeAmount) {
              maxIncomeAmount = landmarkIncome[landmarkIdStr];
              mostIncomeLandmarkIdStr = landmarkIdStr;
            }
          }
          if (mostIncomeLandmarkIdStr) {
            determinedMostIncomeLandmark = landmarksWithCalculatedRatings.find(lm => String(lm.id) === mostIncomeLandmarkIdStr);
          }
        }
      }
      setMostIncomeLandmark(determinedMostIncomeLandmark);
      setMostIncomeLandmarkAmount(maxIncomeAmount);

      // 7. Determine Most Favorited Landmark
      // This expects each landmark object (lm) from `getHostLandmarks`
      // to have an `_count: { favorites: X }` property, where X is the number of favorites.
      // Ensure your backend API (getHostLandmarks) includes this via Prisma's _count.
      let determinedMostFavoritedLandmark = null;
      let maxFavCount = 0;

      if (landmarksWithCalculatedRatings.length > 0) {
        const landmarksWithFavoritesData = landmarksWithCalculatedRatings.filter(
          // Check if _count exists and _count.favorites is a number
          lm => lm._count && typeof lm._count.favorites === 'number' && lm._count.favorites >= 0
        );

        if (landmarksWithFavoritesData.length > 0) {
          determinedMostFavoritedLandmark = landmarksWithFavoritesData.reduce((most, current) => {
            if (!most) return current;
            // Compare using current._count.favorites
            if (current._count.favorites > most._count.favorites) return current;
            // Optional tie-breakers
            if (current._count.favorites === most._count.favorites) {
              if (current.averageRating > most.averageRating) return current; // Prefer higher rated
              if (current.averageRating === most.averageRating && current.reviewCount > most.reviewCount) return current; // Then more reviews
            }
            return most;
          }, null);
          if (determinedMostFavoritedLandmark) {
            maxFavCount = determinedMostFavoritedLandmark._count.favorites;
          }
        }
      }
      setMostFavoritedLandmark(determinedMostFavoritedLandmark);
      setMostFavoritedLandmarkCount(maxFavCount);

    } catch (err) {
      console.error("Error fetching host data:", err);
      setError(
        err.response?.data?.message || // Check for backend error message
          err.message ||
          "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [getToken]); // Re-run effect if getToken function instance changes

  // Render breadcrumbs even during loading
  const breadcrumbItems = [{ label: "Host Dashboard" }];

  if (loading) {
    // Render breadcrumbs and then the spinner
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        <div className="mb-4">
          <Breadcrums items={breadcrumbItems} />
        </div>
        <LoadingSpinner customText="Loading your dashboard..." />
      </div>
    );
  }

  // If the user has no landmarks, show a page encouraging them to become a host.
  if (landmarks.length === 0) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-lg mb-4 self-start pl-0"> {/* Position breadcrumbs at the top left of this view */}
          <Breadcrums items={breadcrumbItems} />
        </div>
        <Card className="w-full max-w-lg text-center shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-gray-800">Become a Host on Rentkub!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 py-6">
            <p className="text-lg text-muted-foreground">
              It seems you're new to hosting with us.
            </p>
            <p className="text-xl font-medium text-gray-700">
              Ready to share your unique space and start earning?
            </p>
            <p className="text-md text-muted-foreground">
              Listing your property is easy. Click the button below to create your first landmark and join our growing community of hosts.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center pt-6">
            <Link to="/admin/camping"> {/* Ensure this is the correct link for creating a landmark */}
              <Button size="lg" className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 text-lg rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105 cursor-pointer">
                Create Your First RentKub!
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // console.log("Landmarks:", landmarks); // Corrected/clarified console log
  // console.log("All Bookings (state):", bookings);
  // console.log("Pending Bookings (state):", pendingBookings); // For debugging if needed
  // console.log("Income Data:", incomeData);
  // console.log("Booking Trend Data:", bookingTrendData);
  // console.log("Review Data:", reviewData);

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 text-red-600">
        Error: {error}
      </div>
    );
  }

  // --- Action Handlers ---
  // Generic function to update booking status.
  // You'll need to create corresponding API endpoints and client-side API functions.
  // For example, in your api/host.jsx or api/booking.jsx:
  // export const updateBookingStatus = async (token, bookingId, statusUpdate) => {
  //   return apiClient.patch(`/bookings/${bookingId}/status`, statusUpdate, {
  //     headers: { Authorization: `Bearer ${token}` },
  //   });
  // };

  const handleUpdateBookingStatus = async (
    bookingId,
    statusField,
    successMessage
  ) => {
    // Close modal before processing, if it was open for this action
    setIsActionConfirmModalOpen(false);
    try {
      const token = await getToken();
      await updateBookingStatus(token, bookingId, { [statusField]: true }); // Actual API call
      toast.success(`${successMessage} for booking ID: ${bookingId}.`);
      fetchData(); // Refetch all data to reflect changes
    } catch (error) {
      console.error(
        `Error updating ${statusField} for booking ${bookingId}:`,
        error
      );
      toast.error(error.response?.data?.message || `Failed to update ${statusField}. Please try again.`);
    }
  };

  const openConfirmationForAction = (bookingId, type) => {
    let title, description, confirmText, actionFunction, confirmButtonVariant = "default";
    const bookingIdentifier = `booking ID: ${bookingId}`;

    switch (type) {
      case 'confirm':
        title = "Confirm Booking";
        description = `Are you sure you want to confirm ${bookingIdentifier}? This will notify the guest.`;
        confirmText = "Yes, Confirm";
        actionFunction = () => handleConfirmBooking(bookingId);
        break;
      case 'checkIn':
        title = "Mark as Checked-In";
        description = `Are you sure you want to mark ${bookingIdentifier} as checked-in?`;
        confirmText = "Yes, Check-In";
        actionFunction = () => handleCheckIn(bookingId);
        break;
      case 'checkOut':
        title = "Mark as Checked-Out";
        description = `Are you sure you want to mark ${bookingIdentifier} as checked-out?`;
        confirmText = "Yes, Check-Out";
        actionFunction = () => handleCheckOut(bookingId);
        break;
      default:
        return; 
    }
    setCurrentActionInfo({ bookingId, actionType: type, title, description, confirmText, confirmButtonVariant, actionFunction });
    setIsActionConfirmModalOpen(true);
  };

  const handleConfirmBooking = (bookingId) => {
    handleUpdateBookingStatus(bookingId, "confirmStatus", "Booking confirmed");
  };

  const handleCheckIn = (bookingId) => {
    handleUpdateBookingStatus(bookingId, "checkInStatus", "Guest checked-in");
  };

  const handleCheckOut = (bookingId) => {
    handleUpdateBookingStatus(bookingId, "checkOutStatus", "Guest checked-out");
  };

  // Function to determine button properties based on booking status
  const getActionButtonProps = (booking) => {
    // Destructure all relevant statuses from the booking object
    // Ensure 'cancelledByUserStatus' is provided by your getHostBookings API
    const {
      paymentStatus = false,
      confirmStatus = false,
      checkInStatus = false,
      checkOutStatus = false,
      cancelledByUserStatus = false,
    } = booking;

    if (cancelledByUserStatus) {
      return {
        text: "Cancelled by User", // Clearly indicate user cancellation
        onClick: () => {},
        disabled: true,
        className: "text-gray-500 border-gray-300 bg-gray-100 cursor-not-allowed", // Changed to gray
      };
    }

    // If not cancelled by user, proceed with other status checks
    if (!paymentStatus) {
      return {
        text: "Awaiting Payment", // Host sees this, cannot act
        onClick: () => {},
        disabled: true,
        className: "text-orange-600 border-orange-300 bg-orange-50", // Style for waiting payment
      };
    }
    // From here, paymentStatus is true
    if (!confirmStatus) {
      return {
        text: "Confirm Booking",
        onClick: () => openConfirmationForAction(booking.id, 'confirm'),
        disabled: false,
        className: "hover:bg-blue-50 text-blue-600 border-blue-300 cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105",
      };
    }
    // From here, paymentStatus and confirmStatus are true
    if (!checkInStatus) {
      return {
        text: "Mark as Checked-In",
        onClick: () => openConfirmationForAction(booking.id, 'checkIn'),
        disabled: false,
        className: "hover:bg-indigo-50 text-indigo-600 border-indigo-300 cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105",
      };
    }
    // From here, paymentStatus, confirmStatus, and checkInStatus are true
    if (!checkOutStatus) {
      return {
        text: "Mark as Checked-Out",
        onClick: () => openConfirmationForAction(booking.id, 'checkOut'),
        disabled: false,
        className: "hover:bg-purple-50 text-purple-600 border-purple-300 cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105",
      };
    }
    // All primary actions completed by host (paid, confirmed, checked-in, checked-out)
    return {
      text: "Booking Completed", // Final state from host's active involvement
      onClick: () => {},
      disabled: true,
      className: "text-gray-500 border-gray-300 bg-gray-100 cursor-not-allowed", // Changed to gray
    };
  };

  const handleExecuteConfirmedAction = () => {
    if (currentActionInfo.actionFunction) {
      currentActionInfo.actionFunction(); // This will call the specific handler like handleConfirmBooking
    }
    // The modal will be closed by handleUpdateBookingStatus or if an error occurs there.
    // Or, ensure it's closed here if actionFunction doesn't always lead to handleUpdateBookingStatus
    // setIsActionConfirmModalOpen(false); // Can be handled within handleUpdateBookingStatus
  };

  // --- Calculate overall totals ---
  const totalOverallIncome = bookings
    .filter((booking) => booking.paymentStatus) // Only count income from paid bookings
    .reduce((sum, booking) => sum + (booking.total || 0), 0);

  const totalOverallBookings = bookings.length;

  // --- Filtered Data for Search ---
  const filteredLandmarks = landmarks.filter((landmark) =>
    landmark.title.toLowerCase().includes(searchTermLandmarks.toLowerCase())
  );

  const filterBookings = (bookingsToFilter, term) => {
    if (!term.trim()) return bookingsToFilter;
    const lowerCaseTerm = term.toLowerCase();
    return bookingsToFilter.filter((booking) => {
      const bookingId = (booking.id || "").toString().toLowerCase();
      const propertyTitle = (booking.landmark?.title || "").toLowerCase();
      const guestFirstName = (booking.profile?.firstname || "").toLowerCase();
      const guestLastName = (booking.profile?.lastname || "").toLowerCase();
      const guestFullName = `${guestFirstName} ${guestLastName}`.trim();

      return (
        bookingId.includes(lowerCaseTerm) ||
        propertyTitle.includes(lowerCaseTerm) ||
        guestFirstName.includes(lowerCaseTerm) ||
        guestLastName.includes(lowerCaseTerm) ||
        guestFullName.includes(lowerCaseTerm)
      );
    });
  };

  const filteredAllBookings = filterBookings(bookings, searchTermAllBookings);
  const filteredConfirmedBookings = filterBookings(
    bookings.filter((b) => b.paymentStatus),
    searchTermConfirmedBookings
  );

  const renderNoResultsMessage = (colSpan, term) => (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="h-24 text-center text-muted-foreground" // Adjusted colSpan from 9 to 8
      >
        No results found matching your search "{term}".
      </TableCell>
    </TableRow>
  );

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <div className="mb-4">
        <Breadcrums items={breadcrumbItems} />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Host Dashboard</h1>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ฿{Number(totalOverallIncome).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
            {/* Display Today's Income */}
            <p className="text-sm text-green-600 font-medium mt-1">
              Today: ฿{Number(todayIncome).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>

          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Bookings Received</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatNumber(totalOverallBookings)}
            </p>
            {/* Display Today's Bookings Count */}
            <p className="text-sm text-green-600 font-medium mt-1"> {/* Changed color to green */}
              Today: {formatNumber(todayBookingsCount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards: Top Rated, Most Popular, Top Earning, Most Favorited */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Changed to md:grid-cols-2 for a 2x2 layout */}
        {/* Best Rated Landmark Card */}
        <Card>
          <CardHeader>
            <CardTitle>Top Rated</CardTitle>
            {bestRatedLandmark ? (
              <CardDescription>
                Your property with the highest guest rating.
              </CardDescription>
            ) : (
              <CardDescription>No review data available yet.</CardDescription>
            )}
          </CardHeader>
          {bestRatedLandmark && (
            <>
              <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                <Link to={`/user/camping/${bestRatedLandmark.id}`} className="block w-full sm:w-32 flex-shrink-0">
                  <img
                    src={bestRatedLandmark.images && bestRatedLandmark.images.length > 0 ? bestRatedLandmark.images[0] : "https://via.placeholder.com/150"}
                    alt={bestRatedLandmark.title}
                    className="w-full h-32 object-cover rounded-lg shadow hover:opacity-80 transition-opacity"
                  />
                </Link>
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold">{bestRatedLandmark.title.length > 30 ? bestRatedLandmark.title.substring(0,27) + "..." : bestRatedLandmark.title}</h3>
                  <div className="flex items-center text-yellow-500 mt-1">
                    <Star className="w-5 h-5 mr-1 fill-current" />
                    <span className="font-bold text-lg">{Number(bestRatedLandmark.averageRating).toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground ml-1">({bestRatedLandmark.reviewCount} reviews)</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link to={`/user/update-landmark/${bestRatedLandmark.id}`} className="w-full">
                  <Button variant="outline" className="w-full cursor-pointer">Manage</Button>
                </Link>
              </CardFooter>
            </>
          )}
        </Card>

        {/* Most Booked Landmark Card */}
        <Card>
          <CardHeader>
            <CardTitle>Most Popular</CardTitle>
            {mostBookedLandmark ? (
              <CardDescription>
                Your property with the highest number of bookings.
              </CardDescription>
            ) : (
              <CardDescription>No booking data available yet.</CardDescription>
            )}
          </CardHeader>
          {mostBookedLandmark && (
            <>
              <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                <Link to={`/user/camping/${mostBookedLandmark.id}`} className="block w-full sm:w-32 flex-shrink-0">
                  <img
                    src={mostBookedLandmark.images && mostBookedLandmark.images.length > 0 ? mostBookedLandmark.images[0] : "https://via.placeholder.com/150"}
                    alt={mostBookedLandmark.title}
                    className="w-full h-32 object-cover rounded-lg shadow hover:opacity-80 transition-opacity"
                  />
                </Link>
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold">{mostBookedLandmark.title.length > 30 ? mostBookedLandmark.title.substring(0,27) + "..." : mostBookedLandmark.title}</h3>
                  <p className="text-lg font-bold mt-1">{formatNumber(mostBookedLandmarkCount)} <span className="text-sm font-normal text-muted-foreground">bookings</span></p>
                </div>
              </CardContent>
              <CardFooter>
                <Link to={`/user/update-landmark/${mostBookedLandmark.id}`} className="w-full">
                  <Button variant="outline" className="w-full cursor-pointer">Manage</Button>
                </Link>
              </CardFooter>
            </>
          )}
        </Card>

        {/* Landmark with Most Income Card */}
        <Card>
          <CardHeader>
            <CardTitle>Top Earning</CardTitle>
            {mostIncomeLandmark ? (
              <CardDescription>
                Your property that has generated the most income.
              </CardDescription>
            ) : (
              <CardDescription>No income data available yet.</CardDescription>
            )}
          </CardHeader>
          {mostIncomeLandmark && (
            <>
              <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                <Link to={`/user/camping/${mostIncomeLandmark.id}`} className="block w-full sm:w-32 flex-shrink-0">
                  <img
                    src={mostIncomeLandmark.images && mostIncomeLandmark.images.length > 0 ? mostIncomeLandmark.images[0] : "https://via.placeholder.com/150"}
                    alt={mostIncomeLandmark.title}
                    className="w-full h-32 object-cover rounded-lg shadow hover:opacity-80 transition-opacity"
                  />
                </Link>
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold">{mostIncomeLandmark.title.length > 30 ? mostIncomeLandmark.title.substring(0,27) + "..." : mostIncomeLandmark.title}</h3>
                  <p className="text-lg font-bold mt-1">
                    ฿{formatNumber(mostIncomeLandmarkAmount)}
                    <span className="text-sm font-normal text-muted-foreground"> total income</span>
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Link to={`/user/update-landmark/${mostIncomeLandmark.id}`} className="w-full">
                  <Button variant="outline" className="w-full cursor-pointer">Manage</Button>
                </Link>
              </CardFooter>
            </>
          )}
        </Card>

        {/* Most Favorited Landmark Card */}
        <Card>
          <CardHeader>
            <CardTitle>Most Favorited</CardTitle>
            {mostFavoritedLandmark ? (
              <CardDescription>
                Your property with the most favorites from users.
              </CardDescription>
            ) : (
              <CardDescription>No favorite data available yet, or no properties have been favorited.</CardDescription>
            )}
          </CardHeader>
          {mostFavoritedLandmark && mostFavoritedLandmarkCount > 0 && ( // Only show content if there's a landmark AND it has favorites
            <>
              <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                <Link to={`/user/camping/${mostFavoritedLandmark.id}`} className="block w-full sm:w-32 flex-shrink-0">
                  <img
                    src={mostFavoritedLandmark.images && mostFavoritedLandmark.images.length > 0 ? mostFavoritedLandmark.images[0] : "https://via.placeholder.com/150"}
                    alt={mostFavoritedLandmark.title}
                    className="w-full h-32 object-cover rounded-lg shadow hover:opacity-80 transition-opacity"
                  />
                </Link>
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold">{mostFavoritedLandmark.title.length > 30 ? mostFavoritedLandmark.title.substring(0,27) + "..." : mostFavoritedLandmark.title}</h3>
                  <div className="flex items-center text-red-500 mt-1"> {/* Red color for favorites */}
                    <Heart className="w-5 h-5 mr-1 fill-current" /> {/* Heart icon */}
                    <span className="font-bold text-lg">{formatNumber(mostFavoritedLandmarkCount)}</span>
                    <span className="text-sm text-muted-foreground ml-1">favorites</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link to={`/user/update-landmark/${mostFavoritedLandmark.id}`} className="w-full">
                  <Button variant="outline" className="w-full cursor-pointer">Manage</Button>
                </Link>
              </CardFooter>
            </>
          )}
        </Card>
      </div>

      {/* Pending Actions Checklist Card */}
      {(needsConfirmationCount > 0 || needsCheckInCount > 0 || needsCheckOutCount > 0) && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">Pending Actions</CardTitle>
            <CardDescription>Tasks requiring your attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {needsConfirmationCount > 0 && (
                <li className="flex items-center font-medium text-blue-600">
                  <ChevronRight className="h-4 w-4 mr-2 text-blue-500" /> {/* Icon for visual cue */}
                  Confirm Bookings: {needsConfirmationCount}
                </li>
              )}
              {needsCheckInCount > 0 && (
                <li className="flex items-center font-medium text-indigo-600">
                  <ChevronRight className="h-4 w-4 mr-2 text-indigo-500" />
                  Mark as Checked-In: {needsCheckInCount}
                </li>
              )}
              {needsCheckOutCount > 0 && (
                <li className="flex items-center font-medium text-purple-600">
                  <ChevronRight className="h-4 w-4 mr-2 text-purple-500" />
                  Mark as Checked-Out: {needsCheckOutCount}
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Grid for main sections */}

      {/* Grid for Properties and Booking Requests */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {" "}
        {/* Added md:grid-cols-2 */}
        <Card className="md:col-span-2 lg:col-span-1">
          {" "}
          {/* Adjusted spans: Full width on md, 1/3 on lg */}
          <CardHeader>
            <CardTitle>Review Stars</CardTitle>
            {totalReviewCount > 0 ? (
              <CardDescription className="text-green-600 font-medium"> {/* Added green color and medium font weight */}
                Average: {averageOverallRating.toFixed(2)} ★ ({totalReviewCount} reviews)
              </CardDescription>
            ) : (
              <CardDescription>No reviews yet.</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {reviewData.length > 0 ? (
              <ChartContainer
                config={reviewChartConfig}
                className="min-h-[200px] w-full"
              >
                <BarChart
                  accessibilityLayer
                  data={reviewData}
                  layout="vertical"
                  margin={{ left: 10, right: 10 }}
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="stars"
                    type="category" // Treat stars as categories on Y-axis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `${value} ★`} // Add star icon
                  />
                  <XAxis type="number" hide /> {/* Hide X-axis line/ticks */}
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar
                    dataKey="count"
                    layout="vertical"
                    fill={reviewChartConfig.count.color}
                    radius={4}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">
                No review data available.
              </p>
            )}
          </CardContent>
        </Card>
        {/* My Properties Section (Takes full width on small, 1/3 on large) */}
        <Card className="md:col-span-1 lg:col-span-2">
          {" "}
          {/* Adjusted spans */}
          {/* --- Modified CardHeader to include Manage Campings button --- */}
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            {" "}
            <CardTitle>
              My Properties {landmarks.length > 0 ? `(${landmarks.length})` : ''}
            </CardTitle>
            <Link to="/admin/camping">
              {" "}
              {/* Link to the admin camping page */}
              <Button variant="outline" size="sm" className="cursor-pointer">
                Create Landmark
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {/* Since this section is only rendered if landmarks.length > 0, 
                the landmarks.length === 0 check here is redundant and removed. */}
              <>
                {/* Search input for landmarks - moved from its own CardHeader */}
                <div className="relative w-full mb-4">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search properties by title..."
                    value={searchTermLandmarks}
                    onChange={(e) => setSearchTermLandmarks(e.target.value)}
                    className="pl-8 w-full"
                  />
                </div>
                {filteredLandmarks.length > 0 ? (
                <ul className="space-y-3 max-h-72 overflow-y-auto">
                  {filteredLandmarks.map((landmark) => (
                    <li
                      key={landmark.id}
                      // Stack vertically on small screens, row on sm and up
                      className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b pb-2 last:border-b-0 pt-2 space-y-2 sm:space-y-0"
                    >
                      {/* Group title and dates */}
                      <div className="flex-grow sm:mr-4"> {/* Title and creation/update dates */}
                        {" "}
                        <div className="flex items-center gap-2"> {/* Flex container for title and rating */}
                          <span className="font-medium text-sm block">
                            {landmark.title.split(" ").length > 4 // Adjusted title length check
                              ? landmark.title.split(" ").slice(0, 4).join(" ") +
                                "..."
                              : landmark.title}
                          </span>
                          {landmark.reviews && landmark.reviews.length > 0 && (
                            <span className="flex items-center text-xs text-yellow-600">
                              <Star className="w-3 h-3 mr-0.5 fill-current" />
                              {(
                                landmark.reviews.reduce(
                                  (sum, review) => sum + (review.overallRating || 0),
                                  0
                                ) / landmark.reviews.length
                              ).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground block">
                          Created:{" "}
                          {landmark.createAt // Use custom formatter
                            ? formatDatePretty(landmark.createAt)
                            : "N/A"}{" "}
                          | Last Updated:{" "}
                          {landmark.updateAt // Use custom formatter
                            ? formatDatePretty(landmark.updateAt)
                            : "N/A"}
                        </span>
                      </div>
                      {/* Update Button */}
                      <span className="flex-shrink-0 self-start sm:self-center">
                        {" "}
                        {/* Align button left on small screens, wrap Button with Link */}
                        <Link to={`/user/update-landmark/${landmark.id}`}>
                          <Button variant="outline" size="sm" className="cursor-pointer">
                            Update {/* Button text */}
                          </Button>
                        </Link>{" "}
                        {/* Correct closing tag for Link */}
                      </span>
                      {/* Add links/buttons to edit/view property details later */}
                      {/* <Button variant="ghost" size="sm">View</Button> */}
                    </li>
                  ))}
                </ul>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No properties found matching your search "{searchTermLandmarks}".
                  </p>
                )}
              </> {/* Closing the fragment that was part of the ternary else */}
          </CardContent>
        </Card>
        {/* Booking Requests Section (Takes full width on small, 2/3 on large) */}
        <Card className="md:col-span-1 lg:col-span-3">
          {" "}
          {/* Renamed and updated to show all bookings */}
          <CardHeader className="pb-2">
            <CardTitle>
              All Guest Bookings ({filteredAllBookings.length})
            </CardTitle>
          </CardHeader>
          {/* Search input for all bookings */}
          <CardHeader className="pt-0 pb-2">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by ID, property, guest..."
                value={searchTermAllBookings}
                onChange={(e) => setSearchTermAllBookings(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
          </CardHeader>          <CardContent className="overflow-x-auto overflow-y-auto max-h-72">
            {" "}
            {bookings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* Add Action column */}
                    <TableHead className="text-center">Actions</TableHead>
                    {/* Added Booking ID for clarity */}
                    <TableHead>ID</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead className="text-center">Nights</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAllBookings.length > 0
                    ? filteredAllBookings.map((booking) => (
                        <TableRow
                          key={booking.id}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="text-center">
                            <div className="relative inline-flex items-center justify-center"> {/* Wrapper for positioning */}
                              {(() => {
                                const props = getActionButtonProps(booking);
                                return (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={props.onClick}
                                      disabled={props.disabled}
                                      className={`${props.className || ""} `} // Ensure space for potential badge
                                    >
                                      {props.text}
                                    </Button>
                                    {/* Red circle notification for actionable buttons */}
                                    {!props.disabled && (
                                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-orange-500 border border-white dark:border-gray-800"></span>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-xs">
                            {booking.id}
                          </TableCell>
                          <TableCell className="font-medium text-xs">
                            {booking.landmark?.title
                              ? booking.landmark.title.split(" ").length > 3
                                ? booking.landmark.title
                                    .split(" ")
                                    .slice(0, 3)
                                    .join(" ") + "..."
                                : booking.landmark.title
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {booking.profile?.firstname || "Guest"}
                            {booking.profile?.lastname
                              ? " " + booking.profile.lastname
                              : ""}
                          </TableCell>
                          <TableCell className="text-xs">
                            {booking.checkIn
                              ? formatDatePretty(booking.checkIn)
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {booking.checkOut
                              ? formatDatePretty(booking.checkOut)
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            {booking.totalNights}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            ฿{Number(booking.total).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </TableCell>
                        </TableRow>
                      ))
                    : renderNoResultsMessage(8, searchTermAllBookings)}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                No bookings found.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmed Bookings Section (formerly Recent Bookings) */}
      <Card>
        {" "}
        <CardHeader className="pb-2">
          <CardTitle>
            Confirmed Bookings ({filteredConfirmedBookings.length})
          </CardTitle>
        </CardHeader>
        {/* Search input for confirmed bookings */}
        <CardHeader className="pt-0 pb-2">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by ID, property, guest..."
              value={searchTermConfirmedBookings}
              onChange={(e) => setSearchTermConfirmedBookings(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
        </CardHeader>        <CardContent className="overflow-x-auto overflow-y-auto max-h-72"> {/* Added scroll and max-height */}
          {bookings.filter((b) => b.paymentStatus).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead className="text-center">Nights</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  {/* End of TableHeads */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConfirmedBookings.length > 0
                  ? filteredConfirmedBookings.map((booking) => (
                      <TableRow key={booking.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium text-xs">
                          {booking.id}
                        </TableCell>
                        <TableCell className="font-medium text-xs">
                          {booking.landmark?.title
                            ? booking.landmark.title.length > 18
                              ? booking.landmark.title.substring(0, 18) +
                                "..."
                              : booking.landmark.title
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {booking.checkIn
                            ? formatDatePretty(booking.checkIn)
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {booking.checkOut
                            ? formatDatePretty(booking.checkOut)
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          {booking.totalNights}
                        </TableCell>
                        <TableCell className="text-xs">
                          {booking.profile?.firstname || "Guest"}
                          {booking.profile?.lastname
                            ? " " + booking.profile.lastname
                            : ""}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          ฿{Number(booking.total).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          <span
                            className={
                              booking.paymentStatus
                                ? "text-green-600 font-medium"
                                : "text-gray-500"
                            }
                          >
                            {booking.paymentStatus ? "Confirmed" : "Pending"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  : renderNoResultsMessage(8, searchTermConfirmedBookings)}
              </TableBody>
            </Table>
          ) : (
            <p>No confirmed bookings found.</p>
          )}{" "}
          {/* Consider enhancing empty state */}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {" "}
        {/* Added md:grid-cols-2 */}
        {/* Performance Graphs using shadcn/ui charts */}
        <Card className="md:col-span-1 lg:col-span-12">
          {" "}
          {/* Adjusted spans */}
          <CardHeader>
            <CardTitle>Income (Last 30 Days)</CardTitle>
            <CardDescription>
              Daily income from confirmed bookings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {incomeData.length > 0 ? (
              <ChartContainer
                config={incomeChartConfig}
                className="min-h-[200px] w-full max-w-lg mx-auto"
              >
                {" "}
                {/* Added max-w-lg and mx-auto */}
                <BarChart // Changed from LineChart to BarChart
                  accessibilityLayer
                  data={incomeData}
                  margin={{
                    // Adjust margins as needed
                    left: 12,
                    right: 12,
                    top: 5,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date" // Use the short date for the axis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    // tickFormatter={(value) => value.slice(-2)} // Example: show only day part if needed
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `฿${Number(value).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar
                    dataKey="income"
                    fill={incomeChartConfig.income.color}
                    radius={4}
                  />{" "}
                  {/* Changed from Line to Bar */}
                </BarChart>{" "}
                {/* Corrected closing tag */}
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">
                Not enough data for income chart.
              </p>
            )}
          </CardContent>
        </Card>
        {/* Booking Trend Chart */}
        <Card className="md:col-span-1 lg:col-span-12">
          {" "}
          {/* Adjusted spans */}
          <CardHeader>
            <CardTitle>Booking Trends (Last 30 Days)</CardTitle>
            <CardDescription>
              Daily count of new bookings received.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bookingTrendData.length > 0 ? (
              <ChartContainer
                config={bookingTrendChartConfig}
                className="min-h-[200px] w-full max-w-lg mx-auto"
              >
                {" "}
                {/* Added max-w-lg and mx-auto */}
                <BarChart // Using BarChart for variety, LineChart is also fine
                  accessibilityLayer
                  data={bookingTrendData}
                  margin={{ left: 12, right: 12, top: 5, bottom: 5 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    allowDecimals={false} // Ensure whole numbers for counts
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar
                    dataKey="count"
                    fill={bookingTrendChartConfig.count.color}
                    radius={4}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">
                Not enough data for booking trend chart.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <ConfirmationModal
        isOpen={isActionConfirmModalOpen}
        onClose={() => setIsActionConfirmModalOpen(false)}
        onConfirm={handleExecuteConfirmedAction}
        title={currentActionInfo.title}
        description={currentActionInfo.description}
        confirmButtonText={currentActionInfo.confirmText}
        confirmButtonVariant={currentActionInfo.confirmButtonVariant}
      />
    </div>
  );
};
export default HostDashboard;
