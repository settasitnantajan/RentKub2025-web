import {
  listBookings,
  cancelBooking as apiCancelBooking,
  retryPayment as apiRetryPayment, // Import the new retryPayment function
} from "@/api/booking"; // Import cancelBooking
import { useAuth } from "@clerk/clerk-react";
import { submitReview as apiSubmitReview } from "@/api/review"; // Import submitReview API
import { useNavigate } from "react-router"; // Import useNavigate
import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"; // Import Card components

import { formatDate, formatNumber } from "@/utils/formats";
import BookingPDF from "@/components/booking/BookingPDF";
import { Button } from "@/components/ui/button"; // Import Button
import useCampingStore from "@/store/camping-store"; // Import the camping store
import { Loader2 } from "lucide-react"; // Import Loader2 for spinner
import ReviewModal from "@/components/review/ReviewModal"; // Import ReviewModal

import { toast } from "sonner"; // For notifications
import ConfirmationModal from "./ConfirmationModal";
import LoadingSpinner from "../LoadingSpinner";
import Breadcrums from "@/components/campings/Breadcrums"; // Import the Breadcrums component

const FILTER_OPTIONS = {
  TOTAL: "Total Bookings",
  WAITING_PAYMENT: "Waiting for Payment",
  UPCOMING: "Upcoming",
  AWAITING_REVIEW: "Awaiting Review",
  CANCELLED: "Cancelled", // Added new filter option
};

const MyOrders = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true); // New state for initial page load
  const [activeFilter, setActiveFilter] = useState(FILTER_OPTIONS.TOTAL);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [payingBookingId, setPayingBookingId] = useState(null); // State to track paying booking
  const [isCancelConfirmModalOpen, setIsCancelConfirmModalOpen] = useState(false);
  const [bookingToCancelId, setBookingToCancelId] = useState(null);
  const [currentReviewData, setCurrentReviewData] = useState(null); // { bookingId, landmarkId, landmarkName }
  const { getToken } = useAuth();
  const navigate = useNavigate(); // Initialize useNavigate
  const { actionReadCamping } = useCampingStore(); // Get action from camping store

  const fetchBookings = useCallback(async () => {
    setIsLoadingPage(true); // Start loading
    const token = await getToken();
    if (!token) {
      console.log("No token available for fetching bookings.");
      setBookings([]); // Clear bookings or handle error appropriately
      return;
    }
    try {
      const res = await listBookings(token);
      console.log(res.data.result);
      setBookings(res.data.result || []); // Ensure bookings is always an array
    } catch (error) {
      console.log("Error fetching bookings:", error);
      setBookings([]); // Clear bookings on error
    } finally {
      setIsLoadingPage(false); // Stop loading regardless of outcome
    }
  }, [getToken]); // getToken is a dependency of fetchBookings

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]); // fetchBookings is now a stable dependency

  const sortedAndFilteredBookings = bookings.filter((booking) => {
    const now = new Date();
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);

    // Ensure all status fields exist, defaulting to false if not present
    const paymentStatus = booking.paymentStatus || false;
    const confirmStatus = booking.confirmStatus || false;
    const checkInStatus = booking.checkInStatus || false;
    const checkOutStatus = booking.checkOutStatus || false;
    const reviewed = booking.reviewed || false; // Get reviewed status
    const cancelledByUserStatus = booking.cancelledByUserStatus || false; // Updated field name

    switch (activeFilter) {
      case FILTER_OPTIONS.WAITING_PAYMENT:
        // Show if paymentStatus is false, guest has not checked out yet, AND booking is not cancelled by user.
        return !paymentStatus && !checkOutStatus && !cancelledByUserStatus;
      case FILTER_OPTIONS.UPCOMING:
        // Show if paid, confirmed by host, not yet checked-in, not yet checked-out, and check-in date is in the future.
        return (
          paymentStatus &&
          confirmStatus &&
          !checkInStatus &&
          !checkOutStatus &&
          checkInDate > now
        );
      case FILTER_OPTIONS.AWAITING_REVIEW:
        // Show if paid, confirmed, checked-in, checked-out, and the check-out date is in the past.
        // AND not yet reviewed
        return (
          paymentStatus &&
          confirmStatus &&
          checkInStatus &&
          checkOutStatus &&
          !reviewed // Condition for Awaiting Review as per request
        );
      case FILTER_OPTIONS.CANCELLED:
        // Show if cancelledByUserStatus is true
        return cancelledByUserStatus;
      case FILTER_OPTIONS.TOTAL:
      default:
        return true;
    }
  }).sort((a, b) => {
    // Sort by createdAt in descending order (newest first)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const getBookingDisplayStatus = (booking) => {
    const now = new Date();
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);

    const paymentStatus = booking.paymentStatus || false;
    const confirmStatus = booking.confirmStatus || false;
    const checkInStatus = booking.checkInStatus || false;
    const checkOutStatus = booking.checkOutStatus || false;
    const reviewed = booking.reviewed || false; // Get reviewed status
    const cancelledByUserStatus = booking.cancelledByUserStatus || false; // Updated field name

    if (cancelledByUserStatus) {
      return {
        text: "Cancelled",
        styleClasses: "bg-red-100 text-red-700 border border-red-300",
      };
    }

    if (!paymentStatus && !checkOutStatus) {
      return {
        text: "Waiting for Payment",
        styleClasses: "bg-orange-100 text-orange-700 border border-orange-300",
      };
    }
    if (paymentStatus && !confirmStatus && !checkOutStatus) {
      return {
        text: "Awaiting Host Confirmation",
        styleClasses: "bg-blue-100 text-blue-700 border border-blue-300",
      };
    }
    if (
      paymentStatus &&
      confirmStatus &&
      !checkInStatus &&
      !checkOutStatus &&
      checkInDate > now
    ) {
      return {
        text: "Upcoming",
        styleClasses: "bg-green-100 text-green-700 border border-green-300",
      };
    }
    if (paymentStatus && confirmStatus && checkInStatus && !checkOutStatus) {
      return {
        text: "Checked In",
        styleClasses: "bg-indigo-100 text-indigo-700 border border-indigo-300",
      };
    }
    if (
      paymentStatus &&
      confirmStatus &&
      checkInStatus &&
      checkOutStatus &&
      !reviewed // Booking is completed and awaiting review
    ) {
      return {
        text: "Completed - Awaiting Review",
        styleClasses: "bg-purple-100 text-purple-700 border border-purple-300",
      };
    }
    // If reviewed, it's just "Completed"
    if (paymentStatus && confirmStatus && checkInStatus && checkOutStatus && reviewed) {
      return {
        text: "Completed & Reviewed",
        styleClasses: "bg-purple-100 text-purple-700 border border-purple-300",
      };
    }
    // The generic "Completed" status is now covered by "Completed - Awaiting Review" or "Completed & Reviewed"
    return {
      text: "Processing",
      styleClasses: "bg-gray-100 text-gray-500 border border-gray-300",
    }; // Default/fallback status
  };

  // Placeholder action handlers
  const handlePayment = async (bookingId) => {
    console.log(`Initiate payment for booking ID: ${bookingId}`);
    setPayingBookingId(bookingId); // Set loading state for this booking
    const token = await getToken();
    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      setPayingBookingId(null); // Clear loading state
      return;
    }

    try {
      const response = await apiRetryPayment(token, bookingId);
      if (response.data && response.data.url) {
        window.location.href = response.data.url; // Redirect to Stripe
        // No need to clear payingBookingId here as page will redirect
      } else {
        console.error("Stripe session URL not found in response:", response);
        toast.error("Could not initiate payment. Please try again later.");
        setPayingBookingId(null); // Clear loading state
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to initiate payment. Please try again.";
      toast.error(errorMessage);
      setPayingBookingId(null); // Clear loading state
    }
  };

  const openCancelConfirmationModal = (bookingId) => {
    setBookingToCancelId(bookingId);
    setIsCancelConfirmModalOpen(true);
  };

  const closeCancelConfirmationModal = () => {
    setBookingToCancelId(null);
    setIsCancelConfirmModalOpen(false);
  };

  const executeCancelBooking = async () => {
    if (!bookingToCancelId) return;
    console.log(`Confirm cancel booking ID: ${bookingToCancelId}`);
    try {
      const token = await getToken();
      await apiCancelBooking(token, bookingToCancelId);
      toast.success("Booking cancelled successfully!");
      fetchBookings(); // Refetch bookings to update the list
    } catch (error) {
      console.error("Error cancelling booking:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to cancel booking. Please try again.";
      toast.error(errorMessage);
    } finally {
      closeCancelConfirmationModal();
    }
  };
  const handleOpenReviewModal = (landmarkId, bookingId, landmarkName) => {
    console.log(
      `Opening review modal for landmark ID: ${landmarkId}, booking ID: ${bookingId}, name: ${landmarkName}`
    );
    setCurrentReviewData({ landmarkId, bookingId, landmarkName });
    setIsReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false);
    setCurrentReviewData(null);
  };

  const handleSubmitReview = async (reviewData) => {
    const token = await getToken();
    try {
      await apiSubmitReview(token, reviewData);
      toast.success("Review submitted successfully!");
      handleCloseReviewModal();
      fetchBookings(); // Refetch bookings to update the 'reviewed' status and UI
    } catch (error) {
      // Error is already logged by apiSubmitReview, toast it here for user
      toast.error(error.message || "Failed to submit review. Please try again.");
      throw error; // Re-throw to let the modal handle its own error display if needed
    }
  };

  const handleBookAgain = async (landmarkId) => {
    console.log(`Book again landmark ID: ${landmarkId}`);
    if (landmarkId) {
      await actionReadCamping(landmarkId); // Fetch camping details and update store
      navigate(`/user/camping/${landmarkId}`); // Navigate to the landmark detail page
    } else {
      console.error("Landmark ID is undefined, cannot navigate to book again.");
      toast.error("Could not find landmark details to book again.");
    }
  };

  // Calculate counts for specific filters
  const nowForCounts = new Date();
  let waitingPaymentCount = 0;
  let upcomingCount = 0;
  let awaitingReviewCount = 0;

  bookings.forEach(booking => {
    const checkInDate = new Date(booking.checkIn);

    const paymentStatus = booking.paymentStatus || false;
    const confirmStatus = booking.confirmStatus || false;
    const checkInStatus = booking.checkInStatus || false;
    const checkOutStatus = booking.checkOutStatus || false;
    const reviewed = booking.reviewed || false;
    const cancelledByUserStatus = booking.cancelledByUserStatus || false;

    // Waiting for Payment
    if (!paymentStatus && !checkOutStatus && !cancelledByUserStatus) {
      waitingPaymentCount++;
    }

    // Upcoming
    if (
      paymentStatus &&
      confirmStatus &&
      !checkInStatus &&
      !checkOutStatus &&
      checkInDate > nowForCounts
    ) {
      upcomingCount++;
    }

    // Awaiting Review
    if (paymentStatus && confirmStatus && checkInStatus && checkOutStatus && !reviewed) {
      awaitingReviewCount++;
    }
  });

  // Render breadcrumbs even during loading
  const breadcrumbItems = [
    { label: "Profile", href: "/user/profile" },
    { label: "My Booking" }, // Last item, no href needed
  ];

  if (isLoadingPage) {
    return ( // Added return statement here
      <div className="container mx-auto py-8 px-4 md:px-6">
        {/* Add Breadcrumbs here */}
        <div className="mb-6"> {/* Optional: Add some margin below breadcrumbs */}
          <Breadcrums items={breadcrumbItems} />
        </div>
        <h1 className="text-2xl font-semibold mb-6">My Booking</h1>

        {/* Show spinner while loading */}
        <LoadingSpinner customText="Loading your orders..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      {/* Breadcrumbs for the main content (when not loading) */}
      <div className="mb-6">
        <Breadcrums items={breadcrumbItems} />
      </div>
      <h1 className="text-2xl font-semibold mb-6">My Booking</h1>
      <div className="mb-6 flex space-x-2 flex-wrap">
        {Object.values(FILTER_OPTIONS).map((option) => (
          <Button
            key={option}
            variant={activeFilter === option ? "default" : "outline"}
            onClick={() => setActiveFilter(option)}
            className="mb-2 cursor-pointer relative transition-transform duration-300 ease-in-out hover:scale-102"
          >
            {option}
            {option === FILTER_OPTIONS.WAITING_PAYMENT && waitingPaymentCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                {waitingPaymentCount > 9 ? '9+' : waitingPaymentCount}
              </span>
            )}
            {option === FILTER_OPTIONS.UPCOMING && upcomingCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                {upcomingCount > 9 ? '9+' : upcomingCount}
              </span>
            )}
            {option === FILTER_OPTIONS.AWAITING_REVIEW && awaitingReviewCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                {awaitingReviewCount > 9 ? '9+' : awaitingReviewCount}
              </span>
            )}
          </Button>
        ))}
      </div>

      {sortedAndFilteredBookings.length > 0 ? (
        <div className="space-y-4">

          {sortedAndFilteredBookings.map((item) => {
            const {
              id,
              totalNights,
              total,
              checkIn,
              checkOut,
              landmark,
              reviewed, // Destructure the reviewed flag
              createdAt,
            } = item;
            const propertyName = landmark?.title || "N/A";
            const propertyImage =
              landmark?.images && landmark.images.length > 0
                ? landmark.images[0]
                : "https://via.placeholder.com/150"; // Fallback image
            // Ensure all status fields exist, defaulting to false if not present for button logic
            const paymentStatus = item.paymentStatus || false;
            const confirmStatus = item.confirmStatus || false; 
            const checkInStatus = item.checkInStatus || false; 
            const checkOutStatus = item.checkOutStatus || false;
            const cancelledByUserStatus = item.cancelledByUserStatus || false; // Updated field name

            const displayStatus = getBookingDisplayStatus(item);

            return (
              <Card
                key={id}
                className="w-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="md:flex">
                  {" "}
                  {/* Clickable Image Area */}
                  <div
                    className="md:flex-shrink-0 overflow-hidden rounded-t-md md:rounded-l-md md:rounded-t-none cursor-pointer"
                    onClick={() => handleBookAgain(landmark?.id)} // Re-use handleBookAgain or create a specific navigation function
                    role="button" // For accessibility
                    tabIndex={0} // For accessibility
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleBookAgain(landmark?.id); }} // For accessibility
                  >
                    <img
                      className="h-48 w-full m-6 md:w-48 object-cover rounded-2xl transition-transform duration-300 ease-in-out hover:scale-102" // Added transform classes
                      src={propertyImage}
                      alt={`Image of ${propertyName}`}
                    />
                  </div>
                  <div className="p-3 flex-grow">
                    <CardHeader className="p-0 mb-3 mr-4">
                      <span
                        className={`inline-block w-fit px-3 py-1 text-xs font-semibold rounded-full mb-2 ${displayStatus.styleClasses}`}
                      >
                        {displayStatus.text}
                      </span>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xl font-semibold text-gray-800">
                          {propertyName}
                        </CardTitle>
                        <div className="text-lg font-semibold text-gray-700">
                          ฿ {formatNumber(total)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">Booking ID : {id}</p>
                      <p className="text-xs text-gray-400 mt-1">Booked : {formatDate(createdAt)}</p>
                    </CardHeader>
                    <CardContent className="p-3 mt-2 space-y-2 text-xs bg-gray-100 rounded-2xl">
                      {" "}
                      {/* Added mt-2 for spacing */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div className="col-span-2">
                          {" "}
                          {/* Check-In takes full width */}
                          <span className="font-medium text-gray-600">
                            Check-In:
                          </span>{" "}
                          {formatDate(checkIn)}
                        </div>
                        <div className="col-span-2">
                          {" "}
                          {/* Check-Out takes full width, appearing below Check-In */}
                          <span className="font-medium text-gray-600">
                            Check-Out:
                          </span>{" "}
                          {formatDate(checkOut)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            Nights:
                          </span>{" "}
                          {totalNights}
                        </div>
                        <div className="col-span-2">
                          {" "}
                          {/* Make this span full width of the grid */}
                          <span className="font-medium text-gray-600">
                            Booked On:
                          </span>{" "}
                          {formatDate(createdAt)}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-0 mt-4 flex flex-wrap justify-end gap-2">
                      {/* Case 1: Waiting for Payment */}
                      {!paymentStatus &&
                        !checkOutStatus &&
                        !cancelledByUserStatus && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openCancelConfirmationModal(id)}
                              className="cursor-pointer text-red-600 hover:bg-red-50 border transition-transform duration-300 ease-in-out hover:scale-102"
                            >
                              Cancel Booking
                            </Button>
                            <Button
                              disabled={payingBookingId === id}
                              onClick={() => handlePayment(id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm shadow-md hover:shadow-lg transition-shadow cursor-pointer duration-300 ease-in-out hover:scale-102"
                            >
                              {payingBookingId === id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                "Pay Now"
                              )}
                            </Button>
                            {/* Invoice button is also removed when paymentStatus is false */}
                          </>
                        )}

                      {/* Case 2: Checked Out */}
                      {checkOutStatus &&
                        !cancelledByUserStatus && ( // Ensure not cancelled
                          <>
                            {/* Review Button: Show only if all specific conditions are met */}
                            {paymentStatus && confirmStatus && checkInStatus && !reviewed && ( // checkOutStatus is true, and not reviewed
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenReviewModal(landmark?.id, id, propertyName)}
                                className="cursor-pointer transition-transform duration-300 ease-in-out hover:scale-102"
                              >
                                Review
                              </Button>
                            )}
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleBookAgain(landmark?.id)}
                              className="cursor-pointer transition-transform duration-300 ease-in-out hover:scale-102"
                            >
                              Book Again
                            </Button>
                            <BookingPDF
                              booking={item}
                              variant="outline"
                              size="sm"                              
                              className="cursor-pointer transition-transform duration-300 ease-in-out hover:scale-102"
                            />
                          </>
                        )}

                      {/* Case 3: Other (e.g., Upcoming, Confirmed, Checked In but not Out) */}
                      {paymentStatus &&
                        !checkOutStatus &&
                        !cancelledByUserStatus && ( // Ensure not cancelled
                          <>
                            {/* Show Cancel button if paid, not confirmed by host, and not checked out */}
                            {!confirmStatus && (
                              <Button
                                variant="ghost" // Or "outline" with a specific color
                                size="sm"
                                onClick={() => openCancelConfirmationModal(id)}
                                className="cursor-pointer text-red-600 hover:bg-red-50 border transition-transform duration-300 ease-in-out hover:scale-102"
                              >
                                Cancel Booking
                              </Button>
                            )}
                            <BookingPDF
                              booking={item}
                              variant="outline"
                              size="sm"
                              className="cursor-pointer transition-transform duration-300 ease-in-out hover:scale-102"
                            />
                          </>
                        )}

                      {/* Case 4: Cancelled by User */}
                      {cancelledByUserStatus && (
                        <>
                          {/* Delete button removed for bookings already cancelled by the user */}
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleBookAgain(landmark?.id)}
                            className="cursor-pointer transition-transform duration-300 ease-in-out hover:scale-102"
                          >
                            Book Again
                          </Button>
                        </>
                      )}
                    </CardFooter>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-lg text-gray-500">
            No bookings found for "{activeFilter.toLowerCase()}".
          </p>
          {activeFilter === FILTER_OPTIONS.TOTAL && (
            <p className="mt-2 text-sm text-gray-400">
              You haven't made any bookings yet.
            </p>
          )}
        </div>
      )}
      {currentReviewData && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={handleCloseReviewModal}
          onSubmitReview={handleSubmitReview}
          landmarkName={currentReviewData.landmarkName}
          bookingId={currentReviewData.bookingId}
          landmarkId={currentReviewData.landmarkId}
        />
      )}
      <ConfirmationModal
        isOpen={isCancelConfirmModalOpen}
        onClose={closeCancelConfirmationModal}
        onConfirm={executeCancelBooking}
        title="Confirm Booking Cancellation"
        description="Are you sure you want to cancel this booking? This action may not be reversible depending on the booking policy."
        confirmButtonText="Yes, Cancel Booking"
        confirmButtonVariant="destructive"
      />
    </div>
  );
};
export default MyOrders;
