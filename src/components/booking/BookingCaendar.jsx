import { Calendar } from "@/components/ui/calendar";
import { useEffect, useState } from "react"; // Removed useMemo
import useBookingStore from "@/store/booking-store.jsx";
import { listBookingsByCampingId } from "@/api/booking"; // <-- Import the NEW function
import { useAuth, useUser } from "@clerk/clerk-react"; // <-- Import useAuth and useUser
import { parseISO, eachDayOfInterval, startOfDay, addDays, isBefore, isValid, areIntervalsOverlapping } from "date-fns"; // Import necessary date-fns functions, including isValid and areIntervalsOverlapping
import { Loader2 } from "lucide-react"; // <-- Import Loader icon
import { createAlert } from "@/utils/createAlert"; // <-- Import createAlert
const defaultSelected = {
  from: undefined,
  to: undefined,
};
import { differenceInCalendarDays } from "date-fns"; // <-- Import differenceInCalendarDays

// // Helper function to count bookings overlapping a specific day (used for min available calculation)
// const countBookingsOnDay = (day, bookingsMap) => {
//   const dayKey = startOfDay(day).toISOString().split('T')[0];
//   return bookingsMap.get(dayKey) || 0;
// };

const BookingCaendar = ({
  campingId,
  totalRooms = 1,
  unavailableDates: initialUnavailableDates, // Accept prop for non-logged-in users
}) => {
  const [range, setRange] = useState(defaultSelected);
  const [minAvailableDuringSelection, setMinAvailableDuringSelection] = useState(null);
  const [userHasOverlappingBooking, setUserHasOverlappingBooking] = useState(false); // <-- State for user overlap
  const [bookings, setBookings] = useState([]); // <-- State for fetched bookings
  const [isLoading, setIsLoading] = useState(true); // <-- Loading state
  const [dailyBookingCounts, setDailyBookingCounts] = useState(new Map()); // <-- State for daily counts
  const [fullyBookedDays, setFullyBookedDays] = useState(new Set()); // <-- State for fully booked days
  const [error, setError] = useState(null); // <-- Error state

  const { getToken, isSignedIn } = useAuth(); // <-- Get Clerk token function and isSignedIn status
  const { user } = useUser(); // <-- Get user info to check for their own bookings
  // const campingId = useBookingStore((state) => state.campingId); // <-- REMOVE: Get campingId from prop instead

  useEffect(() => {
    console.log("[BookingCalendar] Props Received:", { campingId, totalRooms, initialUnavailableDates });
  }, [campingId, totalRooms, initialUnavailableDates]);

  // --- Effect to load booking data or use initial unavailable dates ---
  useEffect(() => {
    const loadData = async () => {
      if (!campingId) return; // Don't fetch if campingId isn't set yet

      setIsLoading(true);
      setError(null);
      setBookings([]); // Reset bookings state
      setDailyBookingCounts(new Map());
      // setFullyBookedDays(new Set()); // We will set this from initialUnavailableDates first

      // --- Step 1: ALWAYS process initialUnavailableDates first to set a baseline ---
      const processedInitialUnavailableDays = new Set();
      // CRITICAL LOG: What is the value of initialUnavailableDates at this exact moment?
      console.log("[BookingCalendar] loadData EFFECT: Prop 'initialUnavailableDates' before processing loop:", JSON.stringify(initialUnavailableDates));

      // Assuming initialUnavailableDates are "YYYY-MM-DD" strings from props
      if (initialUnavailableDates && Array.isArray(initialUnavailableDates) && initialUnavailableDates.length > 0) {
        initialUnavailableDates.forEach(dateInput => {
          if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
            processedInitialUnavailableDays.add(dateInput);
          } else {
            console.warn(`[BookingCalendar] loadData EFFECT: Skipping invalid/malformed date string in initialUnavailableDates:`, dateInput);
          }
        });
      }
      setFullyBookedDays(processedInitialUnavailableDays);
      console.log("[BookingCalendar] loadData EFFECT: State 'fullyBookedDays' set to (from props):", JSON.stringify(Array.from(processedInitialUnavailableDays)));

      if (!isSignedIn) {
        // --- Non-logged-in user ---
        console.log("[BookingCalendar] User NOT signed in. Using initialUnavailableDates processed from props.");
        // Ensure dailyBookingCounts is empty for non-signed-in users as they don't see detailed counts
        setDailyBookingCounts(new Map());
        setIsLoading(false);
      } else {
        // --- Logged-in user ---
        // For logged-in users, fullyBookedDays will be calculated based on fetched bookings in the next effect.
        console.log(`BookingCalendar: User signed in. Fetching bookings for campingId: ${campingId}`);
        try {
          const token = await getToken();
          if (!token) {
            console.warn("[BookingCalendar] User signed in but getToken() returned null.");
            setError("Authentication error. Please try logging in again.");
            setIsLoading(false);
            return;
          }
          const response = await listBookingsByCampingId(token, campingId);
          const fetchedBookings = response.data.result || [];
          console.log("[BookingCalendar] Fetched Bookings for signed-in user:", fetchedBookings);
          setBookings(fetchedBookings); // This will trigger the next useEffect to calculate counts
        } catch (err) {
          // If fetching bookings fails, we still have the initial set of fullyBookedDays from props.
          console.error("[BookingCalendar] Error fetching bookings for signed-in user:", err.response?.data || err.message || err);
          setError(err.message || "Failed to load booking data.");
          createAlert("error", "Could not load existing bookings.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadData();
  }, [campingId, getToken, isSignedIn, initialUnavailableDates]); // Key dependencies

  // Calculate daily booking counts and fully booked days using useEffect
  // This effect is now primarily for LOGGED-IN users, as non-logged-in users get `fullyBookedDays` directly.
  // For signed-in users, this will overwrite the initial `fullyBookedDays` (from props) with a calculation based on fetched bookings.
  useEffect(() => {
    if (!isSignedIn) {
      // For non-signed-in users, fullyBookedDays is set from initialUnavailableDates in the loadData effect.
      // Ensure dailyBookingCounts is clear if this effect somehow runs for them.
      setDailyBookingCounts(new Map());
      console.log("[BookingCalendar] useEffect[bookings, totalRooms]: Skipping detailed count for non-signed-in user. Using fullyBookedDays from props.");
      return;
    }

    // This part onwards is for signed-in users.
    // It will calculate daily counts and fully booked days based on the fetched `bookings`.
    // If `bookings` array is empty, `calculatedCounts` and `calculatedFullyBooked` will be empty,
    // correctly reflecting no booked days based on this (empty) data source.
    console.log("[BookingCalendar] useEffect[bookings, totalRooms]: Calculating detailed counts for signed-in user based on fetched bookings:", bookings);

    const calculatedCounts = new Map(); // Map to store counts for each day: YYYY-MM-DD -> count
    bookings.forEach(booking => {
      try {
        // --- ADDED: Filter for paid bookings before counting ---
        // This ensures client-side calculation for "fully booked" aligns with server's likely criteria for public unavailability.
        if (booking.paymentStatus !== true) {
          console.log("[BookingCalendar] Skipping daily count for unpaid booking:", booking.id);
          return; // Skip this iteration if the booking is not paid
        }

        // --- FIX: Use correct field names 'checkIn' and 'checkOut' ---
        if (!booking || typeof booking.checkIn !== 'string' || typeof booking.checkOut !== 'string') {
          console.warn("[BookingCalendar] Skipping daily count for booking with invalid dates:", booking);
          return; // Skip this iteration
        }

        const startDate = startOfDay(parseISO(booking.checkIn));
        const endDate = startOfDay(parseISO(booking.checkOut)); // Check-out day is not included in stay

        // Get all days the guest is *actually staying* (occupying a unit).
        // Includes check-in day, excludes check-out day.
        const intervalDays = eachDayOfInterval({ start: startDate, end: addDays(endDate, -1) });
        intervalDays.forEach(day => {
          const dayKey = day.toISOString().split('T')[0]; // Use YYYY-MM-DD string as key
          calculatedCounts.set(dayKey, (calculatedCounts.get(dayKey) || 0) + 1);
        });
      } catch (e) {
        console.error("[BookingCalendar] Error processing booking interval:", booking, e);
      }
    });

    // Identify fully booked days
    const calculatedFullyBooked = new Set();
    calculatedCounts.forEach((count, dayKey) => {
      if (count >= totalRooms) {
        calculatedFullyBooked.add(dayKey); // Add the YYYY-MM-DD string directly
      }
    });

    console.log("[BookingCalendar] useEffect[bookings, totalRooms]: Calculated Daily Booking Counts (for signed-in user):", calculatedCounts);
    console.log("[BookingCalendar] useEffect[bookings, totalRooms]: Calculated Fully Booked Days (for signed-in user, from fetched bookings):", JSON.stringify(Array.from(calculatedFullyBooked)));
    setDailyBookingCounts(calculatedCounts); // This should be before setFullyBookedDays if it depends on it, but it doesn't here.
    console.log("[BookingCalendar] SIGNED-IN: Setting fullyBookedDays based on fetched bookings:", JSON.stringify(Array.from(calculatedFullyBooked)));
    setFullyBookedDays(calculatedFullyBooked); // Overwrites if previously set by initialUnavailableDates, which is fine for logged-in.
  }, [bookings, totalRooms, isSignedIn]); // Added isSignedIn

  // Calculate minimum available rooms in the selected range
  // This will only be meaningful for logged-in users due to `dailyBookingCounts`
  useEffect(() => {
    if (range?.from && range?.to) {
      // Get all days the user intends to *stay* based on their selection.
      const stayDays = eachDayOfInterval({ start: range.from, end: addDays(range.to, -1) });

      let maxBookedOnAnyStayDay = 0;
      stayDays.forEach(day => {
        const dayKey = day.toISOString().split('T')[0];
        const bookedCount = dailyBookingCounts.get(dayKey) || 0;
        if (bookedCount > maxBookedOnAnyStayDay) {
          maxBookedOnAnyStayDay = bookedCount;
        }
      });

      console.log("[BookingCalendar] useEffect[range]: Max booked on any day in selection (for signed-in user):", maxBookedOnAnyStayDay);
      const minAvailable = Math.max(0, totalRooms - maxBookedOnAnyStayDay);
      setMinAvailableDuringSelection(minAvailable);
    } else {
      setMinAvailableDuringSelection(null); // Reset if range is incomplete or cleared
    }
  
    // Check if the user has an existing booking overlapping the selected range
    let overlapFound = false;
    if (range?.from && range?.to && bookings.length > 0) {
      const selectedInterval = { start: startOfDay(range.from), end: startOfDay(range.to) }; // User's selection interval

      for (const booking of bookings) {
        try { // Check only against *other* users' bookings or if the user isn't logged in
          // --- FIX: Use correct field names 'checkIn' and 'checkOut' here too ---
          if (!booking || typeof booking.checkIn !== 'string' || typeof booking.checkOut !== 'string') {
            console.warn("[BookingCalendar] Skipping overlap check for booking with invalid dates:", booking);
            continue; // Skip this booking in the loop
          }

          const existingInterval = {
            start: startOfDay(parseISO(booking.checkIn)),
            // Check-out day is not part of the stay, so subtract one day for overlap check
            end: startOfDay(addDays(parseISO(booking.checkOut), -1)) // <-- FIX: Use booking.checkOut
          };
          // Only flag overlap if the booking belongs to the *current* logged-in user
          if (user && booking.userId === user.id && areIntervalsOverlapping(selectedInterval, existingInterval, { inclusive: true })) {


            console.log("[BookingCalendar] useEffect[range]: Overlap detected with current user's existing booking:", booking);
            overlapFound = true;
            break; // Exit loop once an overlap is found
          }
        } catch (e) { console.error("[BookingCalendar] Error checking booking overlap:", booking, e); }
      }
    setUserHasOverlappingBooking(overlapFound);
    } else {
      // Reset if range is incomplete or no bookings
      setUserHasOverlappingBooking(false);
    }
  }, [range, totalRooms, dailyBookingCounts, bookings, user]); // Added user

  // Update Zustand store when range changes
  useEffect(() => {
    useBookingStore.setState({ range });
  }, [range]);

  // Function to pass to the Calendar's disabled prop
   // Function to pass to the Calendar's disabled prop
  const disableDates = (day) => {
    const dayStart = startOfDay(day);
    const dayKey = dayStart.toISOString().split('T')[0]; // For logging
    let isDisabled = false; // Default to not disabled
    let reason = "";

    // 1. Disable past dates
    if (isBefore(dayStart, startOfDay(new Date()))) {
      isDisabled = true;
      reason = "past";
    }
    // Disable if totalRooms is zero or less
    else if (totalRooms <= 0) {
      isDisabled = true;
      reason = "no rooms configured";
    }
    // 3. Disable if the day is fully booked
    else if (fullyBookedDays.has(dayKey)) { // <-- Compare using the dayKey string
      isDisabled = true;
      reason = `fully booked (in set: ${fullyBookedDays.has(dayKey)})`;
    }

    // Enhanced logging for disableDates:
    // To avoid flooding, you might want to enable this log only for specific dates you are testing,
    // e.g., if (dayKey === '2025-05-20' || dayKey === '2025-05-23') {
    // console.log(`[BookingCalendar] disableDates Check: Day ${dayKey} | Past: ${isBefore(dayStart, startOfDay(new Date()))} | No Rooms: ${totalRooms <= 0} | In fullyBookedDays Set: ${fullyBookedDays.has(dayKey)} | Result: ${isDisabled ? `DISABLED (${reason})` : 'ENABLED'}. (isSignedIn: ${isSignedIn})`);
    // }
    return isDisabled;
  };


  // Handle date range selection
  const handleSelect = (selectedRange) => {
    // If only 'from' is selected, or 'from' is re-selected, update normally
    if (!selectedRange || !selectedRange.to || selectedRange.from === selectedRange.to) {
      console.log("[BookingCalendar] handleSelect: Setting initial/single date:", selectedRange);
      setRange(selectedRange || defaultSelected);
      return;
    }

    // Check if the selected range includes any fully booked days
    const { from, to } = selectedRange;

    // --- Check for minimum stay (at least 1 night) ---
    if (differenceInCalendarDays(to, from) < 1) { // Changed from 2 to 1
      console.warn("[BookingCalendar] handleSelect: Selection rejected - minimum stay is 1 night.");
      createAlert("error", "Minimum stay is 1 night."); // Updated error message
      setRange({ from: from, to: undefined }); // Reset 'to' date, keep 'from'
      return; // Stop processing this selection
    }
    // --- END NEW CHECK ---
    
    // Re-calculate interval for checking disabled days, includes check-in day, excludes check-out day for stay duration.
    // For checking disabled status, we should check all days from 'from' up to, but not including, 'to'.
    const interval = eachDayOfInterval({ start: from, end: addDays(to, -1) }); 
    // Check if any day in the selected interval is disabled
    const isAnyDayInIntervalDisabled = interval.some(day => disableDates(day));

    if (isAnyDayInIntervalDisabled) {
      console.warn("BookingCalendar - handleSelect: Selection rejected - interval includes a disabled day.");
      createAlert("error", "Selected range includes unavailable dates.");
      setRange({ from: selectedRange.from, to: undefined });
    } else {
      console.log("[BookingCalendar] handleSelect: Valid range selected:", selectedRange);
      setRange(selectedRange);
    }
  };

  const modifiers = {
    past: day => isBefore(startOfDay(day), startOfDay(new Date())),
    fullyBooked: day => {
      const dayKey = startOfDay(day).toISOString().split('T')[0];
      // Apply only if it's a future date that's fully booked
      const isBooked = fullyBookedDays.has(dayKey) && !isBefore(startOfDay(day), startOfDay(new Date()));
      // if (isBooked) console.log(`[BookingCalendar] Modifier 'fullyBooked' TRUE for ${dayKey}. Is signedIn: ${isSignedIn}`);
      return isBooked;
    },
    noRoomsConfigured: day => totalRooms <= 0 && !isBefore(startOfDay(day), startOfDay(new Date())),
  };

  // Define class names for the modifiers
  const modifiersClassNames = {
    // Style for unavailable days (already disabled, but good for visual clarity)
    // Make it more visually distinct: grey background, stronger opacity, line-through, not-allowed cursor
    // Let's try a subtle red background and keep the line-through for clarity
    past: 'text-slate-400 line-through opacity-70 !cursor-not-allowed',
    fullyBooked: 'bg-rose-100 text-rose-500 line-through opacity-80 !cursor-not-allowed font-medium',
    noRoomsConfigured: 'bg-amber-100 text-amber-600 line-through opacity-80 !cursor-not-allowed',
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4 border rounded-md min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" /> {/* Use theme color */}
      </div>
    );
  }

  if (error) {
    return <div className="p-4 border rounded-md text-red-600 bg-red-50">Error loading calendar: {error}</div>;
  }


  return (
    <div className="flex flex-col items-center"> {/* Center the calendar and text */}
      <Calendar
        mode="range"
        onSelect={handleSelect} // Use the validation handler
        selected={range}
        disabled={disableDates} // Use our function to disable dates
        className="rounded-xl border p-5 shadow-lg bg-white" // Increased padding, stronger shadow
        modifiers={modifiers} // Apply modifiers for styling
        modifiersClassNames={modifiersClassNames} // Apply the styles
      />
      {/* Container for info text below calendar */}
      <div className="mt-4 p-3 border rounded-md bg-gray-50 w-full max-w-sm text-center text-sm text-gray-700 space-y-1">
        {isSignedIn ? (
          // Logged-in user view
          <>
            {minAvailableDuringSelection !== null && range?.from && range?.to ? (
              <p>
                Min. available during selection: <span className="font-semibold text-gray-900">{minAvailableDuringSelection} Unit(s)</span>
              </p>
            ) : (
              // Logged-in user, but no range selected or data not ready
              <p>
                {totalRooms <= 0
                  ? <span className="text-red-500 font-semibold">This property is in high demand!</span>
                  : totalRooms < 5
                  ? <span className="text-red-500 font-semibold">{`Only ${totalRooms} available!`}</span>
                  : "Select dates to check availability."}
              </p>
            )}
            {userHasOverlappingBooking && (
              <p className="text-orange-600 font-medium">You have an overlapping booking for these dates.</p>
            )}
          </>
        ) : (
          // Non-logged-in user view
          <p>
            {totalRooms > 0 ? "Select dates to check availability." : "This site is currently not available for booking."}
          </p>
        )}
      </div>
      {/* Display user overlap warning */}
      {isSignedIn && userHasOverlappingBooking && (
        <p className="mt-2 text-sm text-orange-600 font-medium">
          Note: You already have a booking during this selected period.
        </p>
      )}
    </div>
  );
};
export default BookingCaendar;
