import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router"; // Corrected import for react-router-dom
import { useAuth } from "@clerk/clerk-react"; // For fetching token
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Star,
  CircleUser,
  ExternalLink,
  Home,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { formatNumber } from "@/utils/formats"; // Assuming you have this utility
import useCampingStore from "@/store/camping-store";

const HostProfileModal = ({ isOpen, onClose, host }) => {
  const { getToken } = useAuth();
  const actionListCamping = useCampingStore((state) => state.actionListCamping);
  const campingsFromStore = useCampingStore((state) => state.campings);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && host?.id) {
      const fetchHostLandmarks = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const token = await getToken();
          if (!token) {
            throw new Error("Authentication token not available.");
          }
          // Call the action to fetch landmarks for the host.
          // This action updates the Zustand store.
          await actionListCamping(host.id, token);
        } catch (err) {
          console.error("Error fetching host landmarks:", err);
          setError(err.message || "Could not load host's properties.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchHostLandmarks();
    } else if (!isOpen) {
      // Reset error state when modal is closed or host is not available
      setError(null);
    }
  }, [isOpen, host?.id, getToken, actionListCamping]);

  const hostLandmarksData = useMemo(() => {
    // Ensure host.id is present, campingsFromStore is an array, and it's not empty.
    if (
      !host?.id ||
      !Array.isArray(campingsFromStore) ||
      campingsFromStore.length === 0
    ) {
      return [];
    }
    // Filter campingsFromStore to ensure each landmark's profile.id matches the current host.id.
    // This is an added safeguard, as actionListCamping should already fetch host-specific landmarks.
    return campingsFromStore
      .filter((lm) => lm.profile && lm.profile.id === host.id)
      .map((lm) => ({
        ...lm, // Includes id, title, images, averageRating, reviewCount, reviews array etc.
      }));
  }, [campingsFromStore, host?.id]);

  const hostStats = useMemo(() => {
    let totalWeightedRatingSum = 0;
    let totalEffectiveReviews = 0;
    let propertiesWithReviewsCount = 0;

    hostLandmarksData.forEach((lm) => {
      // Use averageRating and reviewCount directly from the landmark data (from backend/store)
      if (lm.averageRating > 0 && lm.reviewCount > 0) {
        totalWeightedRatingSum += lm.averageRating * lm.reviewCount;
        totalEffectiveReviews += lm.reviewCount;
        propertiesWithReviewsCount++;
      }
    });

    const overallHostAverageRating =
      totalEffectiveReviews > 0
        ? totalWeightedRatingSum / totalEffectiveReviews
        : 0;

    return {
      averageRating: overallHostAverageRating,
      totalReviews: totalEffectiveReviews,
      propertiesCount: hostLandmarksData.length,
      propertiesWithReviewsCount: propertiesWithReviewsCount,
    };
  }, [hostLandmarksData]);

  if (!host) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="pr-6">
          {" "}
          {/* Add padding for close button */}
          <DialogTitle className="text-2xl font-semibold">
            {host.username || host.firstname || "Host Profile"}
          </DialogTitle>
          <DialogDescription>
            Joined in {host.joinedDate}.
            {hostStats.averageRating > 0 && (
              <span className="block mt-1 text-sm text-gray-600">
                Overall Host Rating:{" "}
                <strong className="text-gray-800">
                  {hostStats.averageRating.toFixed(1)}
                </strong>
                <Star
                  size={14}
                  className="inline-block mx-1 mb-0.5 text-yellow-500 fill-current"
                />
                ({formatNumber(hostStats.totalReviews)} total reviews across{" "}
                {formatNumber(hostStats.propertiesWithReviewsCount)} rated
                properties)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto py-4 pr-2 space-y-6">
          <div className="flex items-start space-x-4">
            {host.imageUrl ? (
              <img
                src={host.imageUrl}
                alt={host.firstname}
                className="w-20 h-20 rounded-full object-cover bg-gray-200"
              />
            ) : (
              <CircleUser className="w-20 h-20 text-gray-400" />
            )}
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                {host.username ||
                  `${host.firstname || ""}${host.lastname ? ` ${host.lastname}` : ""}`.trim() ||
                  "Host"}
              </h3>
              <p className="text-sm text-gray-500">
                Manages {formatNumber(hostStats.propertiesCount)} properties.
              </p>
            </div>
          </div>

          <hr />

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <p className="ml-3 text-gray-600">Loading properties...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 text-red-600 bg-red-50 p-4 rounded-md">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p className="font-semibold">Error</p>
              <p className="text-sm text-center">{error}</p>
            </div>
          ) : (
            <div>
              <h4 className="text-lg font-semibold mb-3 text-gray-700 flex items-center">
                <Home size={20} className="mr-2 text-gray-500" />
                Properties by {host.username || host.firstname || "this host"} (
                {formatNumber(hostLandmarksData.length)})
              </h4>
              {hostLandmarksData.length > 0 ? (
                <div className="space-y-3">
                  {hostLandmarksData.map((lm) => (
                    <div
                      key={lm.id}
                      className={`p-3 border rounded-lg bg-white hover:bg-gray-50`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3">
                        <Link
                          to={`/user/camping/${lm.id}`}
                          onClick={onClose}
                          className="flex-shrink-0 block"
                        >
                          <img
                            src={
                              lm.images && lm.images.length > 0
                                ? lm.images[0]
                                : "https://via.placeholder.com/100x80?text=No+Image"
                            }
                            alt={lm.title}
                            className="w-full sm:w-28 h-20 object-cover rounded-md bg-gray-100 mb-2 sm:mb-0"
                          />
                        </Link>
                        <div className="flex-grow">
                          {/* Display host's avatar and name for each landmark item */}
                          <div className="flex items-center space-x-2 mb-1">
                            {host.imageUrl ? (
                              <img src={host.imageUrl} alt={host.username || host.firstname} className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                              <CircleUser className="w-5 h-5 text-gray-400" />
                            )}
                            <span className="text-xs text-gray-500 font-medium">{host.username || host.firstname || "Host"}</span>
                          </div>
                          <div className="flex justify-between items-start">
                            <h5 className="font-medium text-gray-800 mr-2">
                              <Link
                                to={`/user/camping/${lm.id}`}
                                onClick={onClose}
                                className="hover:underline"
                              >
                                {lm.title}
                              </Link>
                            </h5>
                            <Link
                              to={`/user/camping/${lm.id}`}
                              onClick={onClose}
                            >
                              <Button
                                variant="outline" // Keep existing variant
                                size="sm"
                                className="text-xs text-black hover:bg-gray-100 hover:text-black cursor-pointer" // Added cursor-pointer
                              >
                                View
                              </Button>
                            </Link>
                          </div>
                          {lm.averageRating > 0 && lm.reviewCount > 0 ? (
                            <p className="text-sm text-gray-600 mt-1">
                              <Star
                                size={14}
                                className="inline-block mr-1 mb-0.5 text-yellow-500 fill-current"
                              />
                              <strong>
                                {Number(lm.averageRating).toFixed(1)}
                              </strong>
                              <span className="ml-1">
                                ({formatNumber(lm.reviewCount)} review
                                {lm.reviewCount !== 1 ? "s" : ""})
                              </span>
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500 mt-1">
                              No reviews yet for this property.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  This host has no other properties listed, or an error occurred
                  while fetching them.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <Button onClick={onClose} variant="outline" className="w-full cursor-pointer"> {/* Added cursor-pointer */}
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HostProfileModal;
