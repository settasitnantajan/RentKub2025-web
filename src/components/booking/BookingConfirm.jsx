import { SignInButton, useAuth } from "@clerk/clerk-react";
import Buttons from "../form/Buttons";
import useBookingStore from "@/store/booking-store";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { createBooking } from "@/api/booking";
import { useNavigate } from "react-router";

const BookingConfirm = () => {
  //zustand
  const range = useBookingStore((state) => state.range);
  const checkIn = range?.from;
  const checkOut = range?.to;
  const campingId = useBookingStore((state) => state.campingId);

  //Clerk
  const { getToken, userId } = useAuth();

  //Hook form
  const { handleSubmit, setValue, formState } = useForm();
  const { isSubmitting } = formState;

  //Navigate
  const navigate = useNavigate();

  if (!userId) {
    return (
      <div className="flex justify-center items-center mt-2">
        <SignInButton
          mode="modal"
          forceRedirectUrl={`/user/camping/${campingId}`}
        >
          <Button>Sign-in</Button>
        </SignInButton>
      </div>
    );
  }

  useEffect(() => {
    if (campingId) setValue("campingId", campingId);
    if (checkIn) setValue("checkIn", checkIn);
    if (checkOut) setValue("checkOut", checkOut);
  }, [range]);

  const hdlBooking = async (value) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const token = await getToken();
    try {
      const res = await createBooking(token, value);
      console.log(res.data.result);
      const bookingId = res.data.result;
      navigate(`/user/checkout/${bookingId}`);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex justify-center items-center mt-2">
      <form onSubmit={handleSubmit(hdlBooking)}>
        <Buttons text="Confirm Booking" isPending={isSubmitting} />
      </form>
    </div>
  );
};
export default BookingConfirm;
