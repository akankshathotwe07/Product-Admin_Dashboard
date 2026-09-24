import api from "@/lib/axios";

export const getCategories = async () => {
  const response = await api.get("/products/categories");

  return response.data;
};