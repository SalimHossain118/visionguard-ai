import axios from "axios";

// const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const BASE_URL = process.env.REACT_APP_API_URL || "";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 seconds — LLM calls can be slow
});

export const inspectImage = async (imageFile, category) => {
  const formData = new FormData();
  formData.append("file", imageFile);

  const response = await api.post(
    `/api/v1/inspect?category=${category}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

export const getHistory = async () => {
  const response = await api.get("/api/v1/history");
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get("/api/v1/categories");
  return response.data;
};

export default api;
