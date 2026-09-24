# Product Admin Dashboard

A responsive Product Admin Dashboard built with Next.js, React, Tailwind CSS, Axios, and the DummyJSON API.

## Features

- User authentication with login and logout
- Protected product management pages
- Product listing with responsive desktop table and mobile cards
- Product search with debounce
- Category filtering
- Product sorting by:
  - Price
  - Rating
  - Title
- Pagination
- Adjustable page size: 10, 20, 50
- Product details page
- Add new product
- Edit product
- Delete product with confirmation
- Loading, error, empty and retry states
- URL-based search, filter, sort and pagination
- Responsive design

## Tech Stack

- Next.js
- React
- JavaScript
- Tailwind CSS
- Axios
- DummyJSON API
- Git & GitHub

## Project Structure

```text
product-admin-dashboard/
│
├── app/
│   ├── login/
│   │   └── page.jsx
│   │
│   ├── products/
│   │   ├── page.jsx
│   │   ├── new/
│   │   │   └── page.jsx
│   │   └── [id]/
│   │       ├── page.jsx
│   │       └── edit/
│   │           └── page.jsx
│   │
│   └── page.js
│
├── components/
│
├── hooks/
│   └── useDebounce.js
│
├── lib/
│   ├── axios.js
│   └── auth.js
│
├── services/
│   ├── authService.js
│   ├── productService.js
│   └── categoryService.js
│
├── utils/
│   └── productStorage.js
│
├── public/
│
└── README.md
