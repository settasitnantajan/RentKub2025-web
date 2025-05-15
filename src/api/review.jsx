import axios from "axios";

// Assume your backend API is running on port 3000, adjust if different
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://rentkub2025-api.vercel.app/api";

/**
 * Submits a new review.
 * @param {string} token - The authentication token.
 * @param {object} reviewData - The review data.
 * @param {number} reviewData.bookingId - ID of the booking being reviewed.
 * @param {number} reviewData.landmarkId - ID of the landmark being reviewed.
 * @param {number} reviewData.overallRating - Overall rating (1-5).
 * @param {number} [reviewData.customerSupportRating] - Customer support rating (0-5).
 * @param {number} [reviewData.convenienceRating] - Convenience rating (0-5).
 * @param {number} [reviewData.signalQualityRating] - Signal quality rating (0-5).
 * @param {string} [reviewData.text] - Optional review comment.
 * @returns {Promise<object>} The response from the API.
 */
export const submitReview = async (token, reviewData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/reviews`, reviewData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error submitting review:", error.response?.data || error.message || error);
    throw error.response?.data || new Error("Failed to submit review. Please try again.");
  }
};

/**
 * Creates a host's reply comment to a review.
 * @param {string} token - The authentication token of the host.
 * @param {string} reviewId - The ID of the review being replied to.
 * @param {string} replyText - The text of the host's reply.
 * @returns {Promise<object>} The response from the API (likely the updated review or host reply object).
 */
export const createHostReplyComment = async (token, reviewId, replyText) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/reviews/${reviewId}/reply`, // Endpoint for host reply
      { text: replyText },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data; // Assuming the backend returns the updated review or the new reply
  } catch (error) {
    console.error("Error submitting host reply:", error.response?.data || error.message || error);
    throw error.response?.data || new Error("Failed to submit host reply. Please try again.");
  }
};