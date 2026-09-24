import api from "@/lib/axios";

export const getProducts = async (
  limit = 10,
  skip = 0,
  category = "",
  sortBy = "",
  order = ""
) => {
  const endpoint = category
    ? `/products/category/${category}`
    : "/products";

  const response = await api.get(endpoint, {
    params: {
      limit,
      skip,
      ...(sortBy && { sortBy }),
      ...(order && { order }),
    },
  });

  return response.data;
};

export const searchProducts = async (
  query,
  limit = 10,
  skip = 0,
  sortBy = "",
  order = ""
) => {
  const response = await api.get("/products/search", {
    params: {
      q: query,
      limit,
      skip,
      ...(sortBy && { sortBy }),
      ...(order && { order }),
    },
  });

  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);

  return response.data;
};

export const addProduct = async (product) => {
  const response = await api.post("/products/add", product);

  return response.data;
};

export const updateProduct = async (id, product) => {
  const response = await api.patch(`/products/${id}`, product);

  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);

  return response.data;
};