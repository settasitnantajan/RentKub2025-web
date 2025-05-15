import ReviewCard from "./ReviewCard";

const ReviewList = ({ reviews, landmarkHostProfile, loggedInUserId, maxReviewsToShow = 5 }) => {
  if (!reviews || reviews.length === 0) {
    return <p className="text-gray-600 py-4">Be the first to review this spot!</p>;
  }

  // const [showAll, setShowAll] = useState(false);
  // const displayedReviews = showAll ? reviews : reviews.slice(0, maxReviewsToShow);
  // For now, just show all reviews passed to it. Pagination/ShowMore can be added later.

  return (
    <div className="space-y-0"> {/* No space-y here, ReviewCard handles its own padding/border */}
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          reviewId={review.id} // Pass the review ID
          username={review.profile?.username}
          imageUrl={review.profile?.imageUrl}
          firstName={review.profile?.firstname} // Corrected: use lowercase 'firstname'
          lastName={review.profile?.lastname}   // Corrected: use lowercase 'lastname'
          createdAt={review.createdAt}
          rating={review.overallRating || review.rating || 0} // Ensure rating is passed
          text={review.text}
          // hostReply={review.hostReply} // Removed as ReviewCard now derives this from comments
          comments={review.comments} // Pass host reply object
          statusComment={review.statusComment} // Pass statusComment
          landmarkHostProfile={landmarkHostProfile} // Pass landmark host's profile
          loggedInUserId={loggedInUserId} // Pass the logged-in user's ID
        />
      ))}
      {/* {reviews.length > maxReviewsToShow && !showAll && (
        <Button variant="outline" onClick={() => setShowAll(true)} className="mt-4">
          Show all {reviews.length} reviews
        </Button>
      )} */}
    </div>
  );
};

export default ReviewList;