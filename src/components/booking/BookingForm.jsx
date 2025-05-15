import useBookingStore from "@/store/booking-store";
import { Card, CardTitle } from "../ui/card";
import { calTotal } from "@/utils/booking";
import { formatNumber } from "@/utils/formats";
import BookingConfirm from "./BookingConfirm";

const BookingForm = () => {
  const price = useBookingStore((state) => state.price);
  const range = useBookingStore((state) => state.range);

  const checkIn = range?.from;
  const checkOut = range?.to;

  const result = calTotal(checkIn, checkOut, price);

  if (!range || !range.from || !range.to) {
    return null;
  }

  return (
    <div>
      <Card className="p-8 my-2">
        <CardTitle className="mb-4">Total</CardTitle>
        <p className="flex justify-between items-center">
          <span>{`฿${formatNumber(price)} x ${
            result.totalNights
          } nights`}</span>
          <span className="font-semibold">{formatNumber(result.total)}</span>
        </p>
      </Card>
      {/* confirmBooking */}
      <BookingConfirm />
    </div>
  );
};
export default BookingForm;
