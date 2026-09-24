export const saveUpdatedProduct = (product) => {
  const existingProducts = JSON.parse(
    localStorage.getItem("updatedProducts") || "{}"
  );

  existingProducts[product.id] = product;

  localStorage.setItem(
    "updatedProducts",
    JSON.stringify(existingProducts)
  );
};

export const getUpdatedProduct = (id) => {
  const existingProducts = JSON.parse(
    localStorage.getItem("updatedProducts") || "{}"
  );

  return existingProducts[id] || null;
};

export const saveDeletedProduct = (id) => {
  const deletedProducts = JSON.parse(
    localStorage.getItem("deletedProducts") || "[]"
  );

  if (!deletedProducts.includes(Number(id))) {
    deletedProducts.push(Number(id));
  }

  localStorage.setItem(
    "deletedProducts",
    JSON.stringify(deletedProducts)
  );
};

export const isProductDeleted = (id) => {
  const deletedProducts = JSON.parse(
    localStorage.getItem("deletedProducts") || "[]"
  );

  return deletedProducts.includes(Number(id));
};