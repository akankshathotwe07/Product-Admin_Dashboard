"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getProductById,
  updateProduct,
} from "@/services/productService";
import { saveUpdatedProduct } from "@/utils/productStorage";
import { isAuthenticated } from "@/lib/auth";


export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();

  const productId = params.id;
  useEffect(() => {
  if (!isAuthenticated()) {
    router.push("/login");
  }
}, [router]);

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    category: "",
    stock: "",
    description: "",
    thumbnail: "",
    rating: "",
  });

  // Store the complete original product
  const [existingProduct, setExistingProduct] = useState(null);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch existing product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getProductById(productId);

        // Keep the complete product
        setExistingProduct(data);

        setFormData({
          title: data.title || "",
          price: data.price ?? "",
          category: data.category || "",
          stock: data.stock ?? "",
          description: data.description || "",
          thumbnail: data.thumbnail || "",
          rating: data.rating ?? "",
        });
      } catch (error) {
        console.error(error);
        setError("Failed to load product.");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required.";
    }

    if (!formData.price) {
      newErrors.price = "Price is required.";
    } else if (Number(formData.price) <= 0) {
      newErrors.price = "Price must be greater than 0.";
    }

    if (!formData.category.trim()) {
      newErrors.category = "Category is required.";
    }

    if (formData.stock === "") {
      newErrors.stock = "Stock is required.";
    } else if (Number(formData.stock) < 0) {
      newErrors.stock = "Stock cannot be negative.";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) {
      return;
    }

    setError("");

    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    try {
      setSaving(true);

      const updatedFields = {
        title: formData.title.trim(),
        price: Number(formData.price),
        category: formData.category.trim(),
        stock: Number(formData.stock),
        description: formData.description.trim(),
        thumbnail: formData.thumbnail.trim(),
      };

      const data = await updateProduct(
        productId,
        updatedFields
      );

      /*
       * Keep the complete original product data
       * and replace only the fields that were edited.
       *
       * This preserves reviews, images, rating, etc.
       */
      const productToSave = {
        ...existingProduct,
        ...data,
        ...updatedFields,

        id: Number(productId),

        // Preserve original rating
        rating: existingProduct.rating,

        // Preserve original reviews
        reviews: existingProduct.reviews,

        // Preserve original images
        images: existingProduct.images,
      };

      saveUpdatedProduct(productToSave);

      router.push(`/products/${productId}`);
    } catch (error) {
      console.error(error);
      setError(
        "Failed to update product. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-black"></div>

          <p className="text-lg font-medium text-black">
            Loading product...
          </p>
        </div>
      </main>
    );
  }

  // Error
  if (error && !formData.title) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100">
        <p className="text-red-600">
          {error}
        </p>

        <button
          onClick={() => router.push("/products")}
          className="rounded-lg bg-black px-5 py-2 text-white"
        >
          Back to Products
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() =>
              router.push(`/products/${productId}`)
            }
            className="text-sm text-gray-600 hover:text-black"
          >
            ← Back to Product
          </button>

          <h1 className="mt-3 text-3xl font-bold text-black">
            Edit Product
          </h1>
        </div>

        {/* Form */}
        <div className="rounded-xl bg-white p-6 shadow">
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-medium text-black">
                Title
              </label>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter product title"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-black"
              />

              {errors.title && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.title}
                </p>
              )}
            </div>

            {/* Price + Stock */}
            <div className="grid gap-5 md:grid-cols-2">

              {/* Price */}
              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  Price
                </label>

                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Enter price"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-black"
                />

                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.price}
                  </p>
                )}
              </div>

              {/* Stock */}
              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  Stock
                </label>

                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                  placeholder="Enter stock"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-black"
                />

                {errors.stock && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.stock}
                  </p>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-medium text-black">
                Category
              </label>

              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Enter category"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-black"
              />

              {errors.category && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.category}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-black">
                Description
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter product description"
                rows={5}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-black"
              />

              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Image */}
            <div>
              <label className="mb-2 block text-sm font-medium text-black">
                Image URL
              </label>

              <input
                type="url"
                name="thumbnail"
                value={formData.thumbnail}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-black"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-2">

              <button
                type="button"
                onClick={() =>
                  router.push(`/products/${productId}`)
                }
                className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-black hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-black px-5 py-3 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>
          </form>
        </div>
      </div>
    </main>
  );
}