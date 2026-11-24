import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/layout/Layout.js';
import { HomePage } from './pages/HomePage.js';
import { CategoryPage } from './pages/CategoryPage.js';
import { SearchPage } from './pages/SearchPage.js';
import { ProductPage } from './pages/ProductPage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'category/:slug',
        element: <CategoryPage />,
      },
      {
        path: 'search',
        element: <SearchPage />,
      },
      {
        path: 'product/:id',
        element: <ProductPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
