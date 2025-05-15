import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StarRatingInput from "@/components/ui/StarRatingInput";
import { Loader2 } from 'lucide-react';

const ReviewModal = ({ isOpen, onClose, onSubmitReview, landmarkName, bookingId, landmarkId }) => {
  const [overallRating, setOverallRating] = useState(0);
  const [customerSupportRating, setCustomerSupportRating] = useState(0);
  const [convenienceRating, setConvenienceRating] = useState(0);
  const [signalQualityRating, setSignalQualityRating] = useState(0);
  const [reviewText, setReviewText] = useState(''); // For the comment
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Reset form when modal opens or relevant IDs change
    if (isOpen) {
      setOverallRating(0);
      setCustomerSupportRating(0);
      setConvenienceRating(0);
      setSignalQualityRating(0);
      setReviewText('');
      setError('');
      setIsLoading(false);
    }
  }, [isOpen, bookingId, landmarkId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (overallRating === 0) {
      setError('Overall rating is required (must be at least 1 star).');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmitReview({
        bookingId,
        landmarkId,
        overallRating,
        customerSupportRating,
        convenienceRating,
        signalQualityRating,
        text: reviewText, // Pass the comment
      });
      // Parent component (MyOrders) will handle closing and success messages
    } catch (err) {
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Write a Review for {landmarkName}</DialogTitle>
          <DialogDescription>
            Share your experience to help others. Overall rating is required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <StarRatingInput
            label="Overall Experience*"
            rating={overallRating}
            onRatingChange={setOverallRating}
          />
          <StarRatingInput
            label="Customer Support"
            rating={customerSupportRating}
            onRatingChange={setCustomerSupportRating}
          />
          <StarRatingInput
            label="Convenience"
            rating={convenienceRating}
            onRatingChange={setConvenienceRating}
          />
          <StarRatingInput
            label="Signal Quality"
            rating={signalQualityRating}
            onRatingChange={setSignalQualityRating}
          />

          <div>
            <label htmlFor="reviewText" className="block text-sm font-medium text-gray-700 mb-1">
              Your Comment (Optional)
            </label>
            <Textarea
              id="reviewText"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell us more about your experience..."
              rows={4}
              className="w-full"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || overallRating === 0}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;