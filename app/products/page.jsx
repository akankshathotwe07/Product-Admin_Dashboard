"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getProducts,
  searchProducts,
  deleteProduct,
} from "@/services/productService";
import { getCategories } from "@/services/categoryService";
import { useDebounce } from "@/hooks/useDebounce";
import { isProductDeleted } from "@/utils/productStorage";

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deleteProductId, setDeleteProductId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const searchFromUrl = searchParams.get("search") || "";
  const categoryFromUrl = searchParams.get("category") || "";
  const sortFromUrl = searchParams.get("sort") || "";

  const pageParam = Number(searchParams.get("page"));
  const limitParam = Number(searchParams.get("limit"));

  const page =
    Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const limit = [10, 20, 50].includes(limitParam)
    ? limitParam
    : 10;

  const skip = (page - 1) * limit;

  const totalPages = Math.ceil(total / limit);

  const [search, setSearch] = useState(searchFromUrl);

  const debouncedSearch = useDebounce(search, 500);

  // Sync search input with URL
  useEffect(() => {
    setSearch(searchFromUrl);
  }, [searchFromUrl]);

  // Debounced search
  useEffect(() => {
    if (debouncedSearch === searchFromUrl) {
      return;
    }

    const params = new URLSearchParams();

    params.set("page", "1");
    params.set("limit", String(limit));

    if (debouncedSearch.trim()) {
      params.set("search", debouncedSearch.trim());
    }

    if (sortFromUrl) {
      params.set("sort", sortFromUrl);
    }

    router.push(`/products?${params.toString()}`);
  }, [
    debouncedSearch,
    searchFromUrl,
    limit,
    sortFromUrl,
    router,
  ]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();

        setCategories(data);
        setCategoriesLoaded(true);
      } catch (error) {
        console.error("Failed to load categories");
        setCategoriesLoaded(true);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!categoriesLoaded) {
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const [sortBy, order] = sortFromUrl.split("-");

        const getData = async (requestLimit, requestSkip) => {
          if (searchFromUrl.trim()) {
            const searchText = searchFromUrl.trim().toLowerCase();

            const matchingCategory = categories.find(
              (category) =>
                category.name.toLowerCase() === searchText ||
                category.slug.toLowerCase() === searchText
            );

            if (matchingCategory) {
              return await getProducts(
                requestLimit,
                requestSkip,
                matchingCategory.slug,
                sortBy,
                order
              );
            }

            return await searchProducts(
              searchText,
              requestLimit,
              requestSkip,
              sortBy,
              order
            );
          }

          return await getProducts(
            requestLimit,
            requestSkip,
            categoryFromUrl,
            sortBy,
            order
          );
        };

        const firstData = await getData(limit, skip);

        const deletedProducts = JSON.parse(
          localStorage.getItem("deletedProducts") || "[]"
        );

        if (deletedProducts.length === 0) {
          setProducts(firstData.products);
          setTotal(firstData.total);
          return;
        }

        const requiredProducts = Math.min(
          firstData.total,
          skip + limit + deletedProducts.length
        );

        const completeData = await getData(
          requiredProducts,
          0
        );

        const visibleProducts = completeData.products.filter(
          (product) => !isProductDeleted(product.id)
        );

        const deletedFromResults = completeData.products.filter(
          (product) => isProductDeleted(product.id)
        ).length;

        const visibleTotal =
          completeData.total - deletedFromResults;

        const pageProducts = visibleProducts.slice(
          skip,
          skip + limit
        );

        setProducts(pageProducts);
        setTotal(visibleTotal);
      } catch (error) {
        console.error(error);
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [
    router,
    searchFromUrl,
    categoryFromUrl,
    sortFromUrl,
    limit,
    skip,
    categoriesLoaded,
  ]);

  // Delete product
  const handleDelete = async () => {
    if (!deleteProductId || deleting) {
      return;
    }

    try {
      setDeleting(true);

      await deleteProduct(deleteProductId);

      const deletedProducts = JSON.parse(
        localStorage.getItem("deletedProducts") || "[]"
      );

      if (!deletedProducts.includes(Number(deleteProductId))) {
        deletedProducts.push(Number(deleteProductId));
      }

      localStorage.setItem(
        "deletedProducts",
        JSON.stringify(deletedProducts)
      );

      setProducts((currentProducts) =>
        currentProducts.filter(
          (product) => product.id !== deleteProductId
        )
      );

      setTotal((currentTotal) =>
        Math.max(0, currentTotal - 1)
      );

      setDeleteProductId(null);
    } catch (error) {
      console.error(error);
      setError("Failed to delete product.");
    } finally {
      setDeleting(false);
    }
  };

  // Change page
  const changePage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) {
      return;
    }

    const params = new URLSearchParams();

    params.set("page", String(newPage));
    params.set("limit", String(limit));

    if (searchFromUrl) {
      params.set("search", searchFromUrl);
    }

    if (categoryFromUrl && !searchFromUrl) {
      params.set("category", categoryFromUrl);
    }

    if (sortFromUrl) {
      params.set("sort", sortFromUrl);
    }

    router.push(`/products?${params.toString()}`);
  };

  // Change page size
  const changeLimit = (e) => {
    const newLimit = Number(e.target.value);

    const params = new URLSearchParams();

    params.set("page", "1");
    params.set("limit", String(newLimit));

    if (searchFromUrl) {
      params.set("search", searchFromUrl);
    }

    if (categoryFromUrl && !searchFromUrl) {
      params.set("category", categoryFromUrl);
    }

    if (sortFromUrl) {
      params.set("sort", sortFromUrl);
    }

    router.push(`/products?${params.toString()}`);
  };

  // Change category
  const changeCategory = (e) => {
    const newCategory = e.target.value;

    const params = new URLSearchParams();

    params.set("page", "1");
    params.set("limit", String(limit));

    if (newCategory) {
      params.set("category", newCategory);
    }

    if (sortFromUrl) {
      params.set("sort", sortFromUrl);
    }

    router.push(`/products?${params.toString()}`);
  };

  // Change sorting
  const changeSort = (e) => {
    const newSort = e.target.value;

    const params = new URLSearchParams();

    params.set("page", "1");
    params.set("limit", String(limit));

    if (searchFromUrl) {
      params.set("search", searchFromUrl);
    }

    if (categoryFromUrl && !searchFromUrl) {
      params.set("category", categoryFromUrl);
    }

    if (newSort) {
      params.set("sort", newSort);
    }

    router.push(`/products?${params.toString()}`);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  // Loading
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-black"></div>

          <p className="text-lg font-medium text-black">
            Loading products...
          </p>
        </div>
      </main>
    );
  }

  // Error
  if (error && products.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100">
        <p className="text-red-600">{error}</p>

        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-black px-5 py-2 text-white"
        >
          Retry
        </button>
      </main>
    );
  }

  const start = total === 0 ? 0 : skip + 1;
  const end = Math.min(skip + products.length, total);

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-black md:text-3xl">
            Product Admin Dashboard
          </h1>

          <div className="flex gap-2">
            <button
              onClick={() => router.push("/products/new")}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 md:px-5 md:text-base"
            >
              + Add Product
            </button>

            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-black hover:bg-gray-100 md:px-5 md:text-base"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Search / Filter / Sort */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black placeholder-gray-500 outline-none focus:border-black"
          />

          <select
            value={categoryFromUrl}
            onChange={changeCategory}
            disabled={Boolean(searchFromUrl)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-black disabled:cursor-not-allowed disabled:bg-gray-200"
          >
            <option value="">All Categories</option>

            {categories.map((category) => (
              <option
                key={category.slug}
                value={category.slug}
              >
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={sortFromUrl}
            onChange={changeSort}
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-black"
          >
            <option value="">Sort By</option>

            <option value="price-asc">
              Price: Low to High
            </option>

            <option value="price-desc">
              Price: High to Low
            </option>

            <option value="rating-asc">
              Rating: Low to High
            </option>

            <option value="rating-desc">
              Rating: High to Low
            </option>

            <option value="title-asc">
              Title: A to Z
            </option>

            <option value="title-desc">
              Title: Z to A
            </option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Empty */}
        {products.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <p className="text-gray-600">
              No products found.
            </p>
          </div>
        ) : (
          <>
            {/* Pagination info */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing {start}–{end} of {total}
              </p>

              <select
                value={limit}
                onChange={changeLimit}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-black"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* ================= DESKTOP TABLE ================= */}
            <div className="hidden overflow-x-auto rounded-xl bg-white shadow md:block">
              <table className="w-full text-left">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-black">
                      Image
                    </th>

                    <th className="px-6 py-4 text-black">
                      Title
                    </th>

                    <th className="px-6 py-4 text-black">
                      Category
                    </th>

                    <th className="px-6 py-4 text-black">
                      Price
                    </th>

                    <th className="px-6 py-4 text-black">
                      Rating
                    </th>

                    <th className="px-6 py-4 text-black">
                      Stock
                    </th>

                    <th className="px-6 py-4 text-black">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            router.push(
                              `/products/${product.id}`
                            )
                          }
                        >
                          <img
                            src={product.thumbnail}
                            alt={product.title}
                            loading="lazy"
                            className="h-14 w-14 rounded-lg object-cover"
                          />
                        </button>
                      </td>

                      <td className="px-6 py-4 font-medium text-black">
                        <button
                          onClick={() =>
                            router.push(
                              `/products/${product.id}`
                            )
                          }
                          className="text-left hover:underline"
                        >
                          {product.title}
                        </button>
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {product.category}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        ${product.price}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {product.rating}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {product.stock}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/products/${product.id}/edit`
                              )
                            }
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black hover:bg-gray-100"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              setDeleteProductId(product.id)
                            }
                            className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ================= MOBILE CARDS ================= */}
            <div className="grid gap-4 md:hidden">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl bg-white p-4 shadow"
                >
                  {/* Image */}
                  <button
                    onClick={() =>
                      router.push(`/products/${product.id}`)
                    }
                    className="mb-4 block w-full"
                  >
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      loading="lazy"
                      className="h-48 w-full rounded-lg object-cover"
                    />
                  </button>

                  {/* Title */}
                  <button
                    onClick={() =>
                      router.push(`/products/${product.id}`)
                    }
                    className="mb-3 text-left text-lg font-bold text-black hover:underline"
                  >
                    {product.title}
                  </button>

                  {/* Product Information */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">
                        Category
                      </span>

                      <span className="text-right font-medium text-black">
                        {product.category}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">
                        Price
                      </span>

                      <span className="font-medium text-black">
                        ${product.price}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">
                        Rating
                      </span>

                      <span className="font-medium text-black">
                        ⭐ {product.rating}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">
                        Stock
                      </span>

                      <span className="font-medium text-black">
                        {product.stock}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() =>
                        router.push(
                          `/products/${product.id}/edit`
                        )
                      }
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-black hover:bg-gray-100"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        setDeleteProductId(product.id)
                      }
                      className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => changePage(page - 1)}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => changePage(pageNumber)}
                  className={`rounded-lg px-4 py-2 ${
                    pageNumber === page
                      ? "bg-black text-white"
                      : "border border-gray-300 bg-white text-black"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                onClick={() => changePage(page + 1)}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Popup */}
      {deleteProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-black">
              Delete Product?
            </h2>

            <p className="mt-3 text-gray-600">
              Are you sure you want to delete this product?
              This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteProductId(null)}
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

/* Required for Next.js useSearchParams build */
export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-100">
          <p className="text-lg font-medium text-black">
            Loading products...
          </p>
        </main>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}