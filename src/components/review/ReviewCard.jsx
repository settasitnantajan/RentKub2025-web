import { useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StarRatingDisplay from "@/components/review/StarRatingDisplay";
import { formatDate } from "@/utils/formats"; // Assuming you have this utility
import { Button } from "@/components/ui/button"; // Import Button
import { Textarea } from "@/components/ui/textarea"; // Import Textarea for comments
import { CircleUser, Loader2 } from "lucide-react"; // Import Loader2 for submitting state
import { useAuth } from "@clerk/clerk-react"; // Import useAuth for token
import { createHostReplyComment } from "../../api/review"; // API functions, createComment removed


const ReviewCard = ({
  reviewId, // Add reviewId prop
  username,
  imageUrl,
  firstName,
  lastName,
  createdAt,
  rating,
  text,
  comments = [], // Default to empty array
  // hostReply, // This prop is no longer directly used; actualHostReply is derived from comments
  landmarkHostProfile, // { id?: string, clerkId?: string, username?: string, firstname?: string, lastname?: string, imageUrl?: string }
  loggedInUserId, // ID of the currently logged-in user
  onReplySubmitted, // Callback function after reply submission: (reviewId, newComment) => void
  statusComment // Add statusComment prop
}) => {
  const [showFullText, setShowFullText] = useState(false);
  const [showFullHostReplyText, setShowFullHostReplyText] = useState(false); // State for host reply text
  const { getToken } = useAuth(); // Get getToken from Clerk
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false); // For a hypothetical reply modal
  const [replyText, setReplyText] = useState(""); // For a hypothetical reply input
  const [isCommenting, setIsCommenting] = useState(false);
  // Find the host's reply from the comments array
  const actualHostReply = useMemo(() => {
    return comments.find(comment => comment.profileId === landmarkHostProfile?.clerkId);
  }, [comments, landmarkHostProfile?.clerkId]);

  const MAX_TEXT_LENGTH = 150;
  // console.log({ username, imageUrl, firstName, lastName, createdAt, rating, text, hostReply, landmarkHostProfile });

  // Prioritize username, then first/last name, then "Anonymous"
  const reviewerName = username ||
      `${firstName || ""} ${lastName || ""}`.trim() ||
      "Anonymous"
  const reviewerInitials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.trim() || "AN";

  // Prepare host display information
  const hostDisplayName = landmarkHostProfile?.username ||
    `${landmarkHostProfile?.firstname || ""} ${landmarkHostProfile?.lastname || ""}`.trim() ||
    "The Host";

  // Determine if the current user is the host of this landmark's review
  const isCurrentUserTheHost = loggedInUserId && landmarkHostProfile?.clerkId && loggedInUserId === landmarkHostProfile.clerkId;

  const handleOpenReplyModal = () => {
    setIsReplyModalOpen(true);
    // Potentially pre-fill replyText if editing, etc.
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      alert("Reply text cannot be empty."); // Or use a more sophisticated notification
      return;
    }
    if (!reviewId) {
      console.error("Review ID is missing, cannot submit reply.");
      alert("An error occurred. Missing review ID.");
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication token not available.");
      }
      // createHostReplyComment now returns the new comment object from the backend
      const newComment = await createHostReplyComment(token, reviewId, replyText);
      alert("Reply submitted successfully!"); // Replace with a toast notification
      setIsReplyModalOpen(false);
      setReplyText("");
      
      if (onReplySubmitted) {
        onReplySubmitted(reviewId, newComment); // Notify parent to refresh or update
      }
    } catch (error) {
      console.error("Failed to submit host reply:", error);
      alert(`Error submitting reply: ${error.message || "Please try again."}`); // Replace with a toast
    }
  };

  const hostInitials = landmarkHostProfile ?
    `${landmarkHostProfile.firstname?.[0] || ''}${landmarkHostProfile.lastname?.[0] || ''}`.trim() || "H" : "H";

  return (
    <div className="py-6 border-b border-gray-200 last:border-b-0">
      {/* Reviewer Information */}
      <div className="flex items-start space-x-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={imageUrl} alt={reviewerName} />
          <AvatarFallback>
            {/* Show initials if image was provided (even if it failed to load) AND initials are available, otherwise show icon */}
            {imageUrl && reviewerInitials ? reviewerInitials : <CircleUser size={24} />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              {/* Ensure final name isn't an empty string */}
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-gray-900">{reviewerName === "" ? "Anonymous" : reviewerName}</h4>
                {/* Indicator if host has replied (based on actualHostReply from comments) */}
              </div>
              <p className="text-xs text-gray-500">{createdAt ? formatDate(createdAt) : "Date unknown"}</p>
            </div>
            <StarRatingDisplay rating={rating || 0} />
          </div>
          {text && text.length > 0 && (
            <div className="mt-2 text-xs text-gray-700">
              <p className="whitespace-pre-wrap">
                {showFullText || text.length <= MAX_TEXT_LENGTH
                  ? text
                  : `${text.substring(0, MAX_TEXT_LENGTH)}...`}
              </p>
              {text.length > MAX_TEXT_LENGTH && (
                <Button
                  variant="link"
                  className="p-0 mt-2 h-auto text-xs text-gray-800 font-extrabold underline hover:cursor-pointer hover:text-gray-400"
                  onClick={() => setShowFullText(!showFullText)}
                >
                  {showFullText ? "Show less" : "Show more"}
                </Button>
              )}
            </div>
          )}
          {!text && <p className="mt-2 text-sm text-gray-500 italic">No review text provided.</p>}
        </div>
      </div>

      
      {/* Display Status Comment */}
      {statusComment && (
        <div className="mt-3 ml-14 text-xs text-orange-700 italic bg-orange-50 px-3 py-1.5 rounded-md border border-orange-200 shadow-sm">
          <span className="font-semibold text-orange-800">Status:</span> {statusComment}
        </div>
      )}

      {/* Host Reply Section (driven by actualHostReply from comments) */}
      {actualHostReply && (
        <div className="mt-4 ml-10 bg-gray-50 p-4 rounded-lg shadow-sm"> {/* Indented and styled reply box */}
          <div className="flex items-start space-x-3">
            <Avatar className="h-9 w-9"> {/* Host avatar */}
              <AvatarImage src={landmarkHostProfile?.imageUrl} alt={hostDisplayName} />
              <AvatarFallback>
                {landmarkHostProfile?.imageUrl && hostInitials ? hostInitials : <CircleUser size={20} />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h5 className="text-xs font-semibold text-gray-800">
                Response from {hostDisplayName}
              </h5>
              {actualHostReply.createdAt && (
                <p className="text-xs text-gray-500 mb-1">
                  {formatDate(actualHostReply.createdAt)}
                </p>
              )}
              {actualHostReply.text && actualHostReply.text.length > 0 && (
                <div className="text-xs text-gray-700">
                  <p className="whitespace-pre-wrap">
                    {showFullHostReplyText || actualHostReply.text.length <= MAX_TEXT_LENGTH
                      ? actualHostReply.text
                      : `${actualHostReply.text.substring(0, MAX_TEXT_LENGTH)}...`}
                  </p>
                  {actualHostReply.text.length > MAX_TEXT_LENGTH && (
                    <Button
                      variant="link"
                      className="p-0 mt-1 h-auto text-xs text-gray-800 font-extrabold underline hover:cursor-pointer hover:text-gray-400"
                      onClick={() => setShowFullHostReplyText(!showFullHostReplyText)}
                    >
                      {showFullHostReplyText ? "Show less" : "Show more"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Comments Section */}
      {comments.filter(comment => comment.profileId !== landmarkHostProfile?.clerkId).length > 0 && ( // Show non-host comments
        <div className="mt-4 ml-10 space-y-3">
          <h6 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Comments:</h6>
          {comments.map((comment) => {
            const commenterName = comment.profile?.username ||
              `${comment.profile?.firstname || ""} ${comment.profile?.lastname || ""}`.trim() ||
              "User";
            const commenterInitials = `${comment.profile?.firstname?.[0] || ''}${comment.profile?.lastname?.[0] || ''}`.trim() || "U";

            // Skip rendering host's reply here if it's already handled by actualHostReply section
            if (comment.profileId === landmarkHostProfile?.clerkId) return null;

            return (
              <div key={comment.id} className="flex items-start space-x-3 pt-3 border-t border-gray-100 first:border-t-0 first:pt-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.profile?.imageUrl} alt={commenterName} />
                  <AvatarFallback>
                    {comment.profile?.imageUrl && commenterInitials ? commenterInitials : <CircleUser size={18} />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-800">
                      {commenterName}
                    </span>
                    <span className="text-xs text-gray-500">{comment.createdAt ? formatDate(comment.createdAt) : "Date unknown"}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 whitespace-pre-wrap">{comment.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

    {/* Host Reply Button - Show if current user is the host and no actual host reply (comment from host) exists yet */}
    {isCurrentUserTheHost && !actualHostReply && (
      <div className="mt-4 ml-10">
        <Button onClick={handleOpenReplyModal} variant="outline" size="sm">
          Reply to this review
        </Button>
      </div>
    )}
    {/* "Add Comment" section for regular users has been removed entirely. */}
    {/* Hypothetical Reply Modal (very basic example) */}
    {isReplyModalOpen && (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/10">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Reply as {hostDisplayName}</h3>
          <textarea
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            rows={4}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write your reply..."
          />
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="ghost" onClick={() => setIsReplyModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitReply}>Submit Reply</Button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default ReviewCard;