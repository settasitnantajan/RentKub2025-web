import axios from "axios";

export const uploadImage = async (token, form) => {
  return await axios.post(
    "https://rentkub2025-api.vercel.app/api/images",
    {
      image: form,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};
