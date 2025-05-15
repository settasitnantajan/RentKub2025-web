import { useEffect } from "react";
import BookingCaendar from "./BookingCaendar";
import BookingForm from "./BookingForm";
import useBookingStore from "@/store/booking-store.jsx";

const BookingContainer = ({ campingId, price, totalRooms, initialUnavailableDates }) => { // <-- Add initialUnavailableDates prop
  // console.log("[BookingContainer] Received initialUnavailableDates:", initialUnavailableDates); // Optional: for debugging
  console.log(totalRooms, "totalRooms")// <-- Add totalRooms prop
  useEffect(() => {
    useBookingStore.setState({
      campingId,
      price,
      totalRooms,
    });
  }, [campingId, price, totalRooms]);

  return (
    // Use grid layout: 1 column on small screens, 2 columns on medium screens and up
    // Added gap for spacing between columns/rows
    // --- Apply grid layout for responsiveness ---
    <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 md:gap-8"> {/* Changed grid-cols-1 to lg:grid-cols-2 */}
      {/* Calendar will be in the first column */}
      <BookingCaendar
        totalRooms={totalRooms}
        campingId={campingId}
        unavailableDates={initialUnavailableDates} // <-- Pass the prop here
      />
      {/* BookingForm will now be in the second column on md+ screens */}
      <BookingForm />
    </div>
  );
};
export default BookingContainer;
