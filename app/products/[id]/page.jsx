"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProductById, deleteProduct } from "@/services/productService";
import {
  getUpdatedProduct,
  saveDeletedProduct,
} from "@/utils/productStorage";
import { isAuthenticated } from "@/lib/auth";

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  
 const productId = params.id;

useEffect(() => {
  if (!isAuthenticated()) {
    router.push("/login");
  }
}, [router]);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const updatedProduct = getUpdatedProduct(productId);

        if (updatedProduct) {
          setProduct(updatedProduct);
          return;
        }

        const data = await getProductById(productId);

        setProduct(data);
      } catch (error) {
        console.error(error);
        setError("Product not found.");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleDelete = async () => {
    if (deleting) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteProduct(productId);

      // Remember the deleted product locally
      saveDeletedProduct(productId);

      // Close popup
      setShowDeletePopup(false);

      // Go back to products
      router.push("/products");
    } catch (error) {
      console.error(error);
      setError("Failed to delete product. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

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

  if (error && !product) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100">
        <p className="text-red-600">
          {error}
        </p>

        <button
          onClick={() => router.push("/products")}
          className="rounded-lg bg-black px-5 py-2 text-white hover:bg-gray-800"
        >
          Back to Products
        </button>
      </main>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push("/products")}
            className="text-sm text-gray-600 hover:text-black"
          >
            ← Back to Products
          </button>

          <div className="flex gap-3">
            <button
              onClick={() =>
                router.push(`/products/${product.id}/edit`)
              }
              className="rounded-lg bg-black px-5 py-3 text-white hover:bg-gray-800"
            >
              Edit Product
            </button>

            <button
              onClick={() => setShowDeletePopup(true)}
              className="rounded-lg bg-red-600 px-5 py-3 text-white hover:bg-red-700"
            >
              Delete Product
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Product Details */}
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="grid gap-8 md:grid-cols-2">

            {/* Image */}
            <div className="flex items-center justify-center rounded-xl bg-gray-50 p-6">
              <img
                src={product.thumbnail}
                alt={product.title}
                className="max-h-96 w-full object-contain"
              />
            </div>

            {/* Information */}
            <div>
              <h1 className="mb-4 text-3xl font-bold text-black">
                {product.title}
              </h1>

              <div className="space-y-4">

                <div>
                  <p className="text-sm text-gray-500">
                    Category
                  </p>

                  <p className="font-medium text-black">
                    {product.category}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Price
                  </p>

                  <p className="text-2xl font-bold text-black">
                    ${product.price}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Rating
                  </p>

                  <p className="font-medium text-black">
                    ⭐ {product.rating}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Stock
                  </p>

                  <p className="font-medium text-black">
                    {product.stock}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Description
                  </p>

                  <p className="leading-7 text-gray-700">
                    {product.description}
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        {product.reviews && product.reviews.length > 0 && (
          <div className="mt-6 rounded-xl bg-white p-6 shadow">
            <h2 className="mb-5 text-2xl font-bold text-black">
              Reviews
            </h2>

            <div className="space-y-4">
              {product.reviews.map((review, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium text-black">
                      {review.reviewerName}
                    </p>

                    <p className="text-sm text-gray-600">
                      ⭐ {review.rating}
                    </p>
                  </div>

                  <p className="text-gray-700">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

            <h2 className="text-xl font-bold text-black">
              Delete Product?
            </h2>

            <p className="mt-3 text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-black">
                {product.title}
              </span>
              ?
            </p>

            <p className="mt-2 text-sm text-gray-500">
              This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">

              <button
                onClick={() => setShowDeletePopup(false)}
                disabled={deleting}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-black hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>

            </div>
          </div>
        </div>
      )}
    </main>
  );
}