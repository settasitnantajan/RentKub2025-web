// /Users/duke/Documents/GitHub/RentKub/client/src/pages/user/Profile.jsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth, useUser } from "@clerk/clerk-react"; // Removed ClerkUserProfile as it's not used directly here
import { Link, useNavigate } from "react-router"; // Corrected import for react-router-dom
import { toast } from "sonner";
import {
  CalendarDays,
  Heart,
  UserCog,
  Save,
  XCircle,
  Edit3,
  Edit,
} from "lucide-react";

import { ProfileSchema } from "@/utils/schemas";
import { createProfile, getProfile, updateProfile } from "@/api/profile";
import { listBookings } from "@/api/booking";
import { listFavorites } from "@/api/camping";
import Breadcrums from "@/components/campings/Breadcrums"; // Import the Breadcrums component

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import FormInputs from "@/components/form/FormInputs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Profile = () => {
  // --- Hooks ---
  const { getToken, userId, isLoaded: isAuthLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser(); // Get user object for update
  const navigate = useNavigate();

  // --- State ---
  const [profileData, setProfileData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileExists, setProfileExists] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [bookingCount, setBookingCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);

  // --- React Hook Form ---
  const { register, handleSubmit, formState, reset, setValue } = useForm({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      username: "", // Add username
    },
  });
  const { errors, isSubmitting } = formState;

  // --- Render Breadcrumbs early ---
  // Render breadcrumbs before any loading or access checks
  const breadcrumbItems = [{ label: "My Profile" }];

  // --- Effects ---

  // Fetch Profile Data
  useEffect(() => {
    if (!isAuthLoaded || !userId) {
      setIsLoadingProfile(false);
      return;
    }

    let isMounted = true;
    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      setProfileExists(false); // Reset on fetch
      try {
        const token = await getToken();
        if (!token || !isMounted) return;

        const profileResponse = await getProfile(token);
        if (isMounted) {
          setProfileData(profileResponse.data);
          setProfileExists(true);
          reset(profileResponse.data); // Populate form with fetched data
          console.log("Profile data fetched:", profileResponse.data);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to fetch profile:", error);
        setProfileData(null); // Clear profile data on error
        if (error.response && error.response.status === 404) {
          setProfileExists(false);
          // Pre-fill form with Clerk data if profile not found
          const initialData = {
            firstname: user?.firstName || "",
            lastname: user?.lastName || "",
            username: user?.username || "", // Pre-fill username from Clerk if available
          };
          reset(initialData);
          // Automatically open edit mode if profile is missing but Clerk has names
          if (user?.firstName || user?.lastName) {
             setIsEditingDetails(true);
             toast.info("Please confirm or update your profile details.");
          }
        } else {
          toast.error("Error fetching profile data.");
        }
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    };

    fetchProfile();

    return () => { isMounted = false; };
    // Ensure reset is included if it's used within the effect for setting initial values
  }, [userId, getToken, isAuthLoaded, user?.firstName, user?.lastName, user?.username, reset]);

  // Fetch Counts (Bookings & Favorites) - No changes needed here
  useEffect(() => {
    if (!userId) {
      setBookingCount(0);
      setFavoriteCount(0);
      return;
    }

    let isMounted = true;
    const fetchCounts = async () => {
      setIsLoadingCounts(true);
      setBookingCount(0);
      setFavoriteCount(0);
      try {
        const token = await getToken();
        if (!token || !isMounted) return;

        const [bookingsResponse, favoritesResponse] = await Promise.allSettled([
          listBookings(token),
          listFavorites(token),
        ]);

        if (isMounted) {
          if (bookingsResponse.status === 'fulfilled') {
            setBookingCount(bookingsResponse.value.data?.result?.length ?? bookingsResponse.value.data?.length ?? 0);
          } else {
            console.error("Booking fetch error:", bookingsResponse.reason);
          }
          if (favoritesResponse.status === 'fulfilled') {
            setFavoriteCount(favoritesResponse.value.data?.result?.length ?? favoritesResponse.value.data?.length ?? 0);
          } else {
             console.error("Favorite fetch error:", favoritesResponse.reason);
          }
        }
      } catch (countError) {
        if (isMounted) console.error("Failed to fetch counts:", countError);
      } finally {
        if (isMounted) setIsLoadingCounts(false);
      }
    };

    fetchCounts();

    return () => { isMounted = false; };
  }, [userId, getToken]);

  // --- Handlers ---

  const onSubmitDetails = async (data) => {
    const token = await getToken();
    if (!token) {
        toast.error("Authentication error. Please log in again.");
        return;
    }
    try {
      // 1. Save profile to your backend
      let response;
      if (profileExists) {
        response = await updateProfile(token, data);
        toast.success("Profile updated successfully!");
      } else {
        response = await createProfile(token, data);
        toast.success("Profile created successfully!");
        setProfileExists(true); // Mark profile as existing now
      }

      // 2. Update Clerk user session
      // Check if user object and update method exist before calling
      if (user && typeof user.update === 'function') {
        try {
          // Use the submitted data (data.firstname, data.lastname)
          // Map to Clerk's expected fields (firstName, lastName)
          await user.update({
            firstName: data.firstname,
            lastName: data.lastname,
            username: data.username, // Sync username with Clerk
          });
          console.log("Clerk user session updated successfully.");
          // Optional: toast.info("User session updated.");
        } catch (clerkUpdateError) {
          // Log the error, but don't block the process if backend save succeeded
          console.error("Failed to update Clerk user session:", clerkUpdateError);
          toast.warning("Profile saved, but session update failed. A refresh might be needed to see changes everywhere.");
        }
      } else {
         console.warn("Clerk user object or update method not available for session update.");
         toast.warning("Profile saved, but couldn't update the current session automatically. Please refresh if needed.");
      }

      // 3. Update local state and UI
      setProfileData(response.data); // Update local display data
      reset(response.data); // Reset form with the saved data
      setIsEditingDetails(false); // Close the edit form

    } catch (err) {
      console.error("Profile save failed:", err);
      toast.error(err.response?.data?.message || "Failed to save profile.");
      // Keep the form open on error
    }
    // No finally block needed here as isSubmitting is handled by react-hook-form
  };

  const handleCancelEdit = () => {
    setIsEditingDetails(false);
    // Reset form to the last known good state (fetched profile or initial Clerk data)
    reset(profileData || {
      firstname: user?.firstName || "",
      lastname: user?.lastName || "",
      username: profileData?.username || user?.username || "", // Reset username
    });
  };

  // --- Loading / Auth States ---
  // No changes needed here
  // Render breadcrumbs even during loading
  return (
    <TooltipProvider>
      <div className="mb-4 ml-6"> {/* Optional: Add some margin below breadcrumbs */}
        <Breadcrums items={breadcrumbItems} />
      </div>

      {/* Conditional rendering for the main content */}
      {(() => {
        if (!isAuthLoaded || !isUserLoaded || isLoadingProfile) {
          return (
            <section className="max-w-3xl mx-auto mt-8 p-4 md:p-6">
              {/* Skeleton Loader */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 p-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 rounded-md" />
              <Skeleton className="h-4 w-64 rounded-md" />
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <Separator />
            <div>
              <Skeleton className="h-6 w-32 mb-4 rounded-md" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />
              </div>
            </div>
            <Separator />
            <div>
              <Skeleton className="h-6 w-32 mb-4 rounded-md" />
              <div className="flex flex-wrap gap-4">
                <Skeleton className="h-10 w-36 rounded-md" />
                <Skeleton className="h-10 w-36 rounded-md" />
              </div>
            </div>
            <Separator />
             <div>
              <Skeleton className="h-6 w-40 mb-4 rounded-md" />
              <Skeleton className="h-10 w-48 rounded-md" />
            </div>
          </CardContent>
        </Card>
            </section>
          );
        }

        if (!userId) {
          return (
            <div className="text-center mt-10 p-6">
              {/* Access Denied */}
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Please log in to view or manage your profile.
            </CardDescription>
          </CardHeader>
        </Card>
            </div>
          );
        }

        // --- Render Profile Page ---
        return (
          <section className="max-w-3xl mx-auto mt-8 p-4 md:p-6 space-y-8">
        {/* --- User Header --- */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-center gap-4 p-6">
            {/* Avatar with Edit Button */}
            <div className="relative"> {/* Removed group class if hover effect for border is not needed without edit button */}
              <Avatar className="w-20 h-20"> {/* Removed hover border transition */}
                <AvatarImage src={user?.imageUrl} alt="User profile picture" />
                <AvatarFallback className="text-2xl">
                  {user?.firstName?.charAt(0).toUpperCase()}
                  {user?.lastName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            {/* User Name and Email */}
            <div className="text-center sm:text-left">
              <CardTitle className="text-2xl">
                {/* Display Clerk names first, fallback to profileData if Clerk is lagging */}
                {user?.firstName || profileData?.firstname}{" "}
                {user?.lastName || profileData?.lastname}
              </CardTitle>
              {/* Display username if available */}
              {(user?.username || profileData?.username) && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  @{user?.username || profileData?.username}
                </p>
              )}
              {user?.primaryEmailAddress && (
                <CardDescription className="text-base mt-1"> {/* Adjusted margin for spacing */}
                  {user.primaryEmailAddress.emailAddress}
                </CardDescription>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* --- Personal Details Section --- */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Personal Details</CardTitle>
              {!isEditingDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingDetails(true)}
                  // Disable edit button if profile doesn't exist and we are already forcing edit mode
                  disabled={!profileExists && (user?.firstName || user?.lastName)}
                >
                  <Edit3 className="mr-2 h-4 w-4" /> Edit
                </Button>
              )}
            </div>
            <CardDescription>
              Manage your first name, last name, and username (stored in our system).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditingDetails ? (
              <form onSubmit={handleSubmit(onSubmitDetails)} className="space-y-6">
                <FormInputs
                  label="First Name"
                  register={register}
                  name="firstname"
                  type="text"
                  placeholder="Enter your first name"
                  errors={errors}
                  defaultValue={profileData?.firstname || user?.firstName || ""}
                />
                <FormInputs
                  label="Last Name"
                  register={register}
                  name="lastname"
                  type="text"
                  placeholder="Enter your last name"
                  errors={errors}
                  defaultValue={profileData?.lastname || user?.lastName || ""}
                />
                <FormInputs
                  label="Username"
                  register={register}
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  errors={errors}
                  defaultValue={profileData?.username || user?.username || ""}
                />
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !formState.isValid} // Disable if form is invalid
                    className="w-full sm:w-auto sm:flex-grow"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span className="font-medium text-primary">First Name:</span>
                  {/* Prefer showing Clerk data if available, fallback to profileData */}
                  <span>{user?.firstName || profileData?.firstname || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-primary">Last Name:</span>
                  {/* Prefer showing Clerk data if available, fallback to profileData */}
                  <span>{user?.lastName || profileData?.lastname || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-primary">Username:</span>
                  {/* Prefer showing Clerk data if available, fallback to profileData */}
                  <span>{user?.username || profileData?.username || "Not set"}</span>
                </div>
                {/* Show a message if profile doesn't exist but Clerk has data */}
                {!profileExists && (user?.firstName || user?.lastName) && !isLoadingProfile && (
                   <p className="text-xs text-amber-600 mt-2">
                     Your name from your account is shown. Click 'Edit' to save it to your profile.
                   </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- Activity Section --- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">My Activity</CardTitle>
            <CardDescription>
              View your bookings and saved favorite campings.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {/* My Bookings Button */}
            <Button variant="outline" asChild className="relative">
              <Link to="/user/myorders">
                <CalendarDays className="mr-2 h-4 w-4" />
                My Bookings
                {!isLoadingCounts && bookingCount > 0 && (
                  <span className="absolute -top-0 -right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                    {bookingCount}
                  </span>
                )}
                {isLoadingCounts && <Skeleton className="absolute -top-2 -right-2 h-5 w-5 rounded-full transform translate-x-1/2 -translate-y-1/2" />}
              </Link>
            </Button>

            {/* My Favorites Button */}
            <Button variant="outline" asChild className="relative">
              <Link to="/user/my-favorites">
                <Heart className="mr-2 h-4 w-4" />
                My Favorites
                {!isLoadingCounts && favoriteCount > 0 && (
                  <span className="absolute -top-0 -right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                    {favoriteCount}
                  </span>
                )}
                {isLoadingCounts && <Skeleton className="absolute -top-2 -right-2 h-5 w-5 rounded-full transform translate-x-1/2 -translate-y-1/2" />}
              </Link>
            </Button>
          </CardContent>
        </Card>
          </section>
        );
      })()}
    </TooltipProvider>
  );
};

export default Profile;
