import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { AdminPage } from '@/pages/AdminPage'
import { EatPage } from '@/pages/EatPage'
import { GuidePage } from '@/pages/GuidePage'
import { HomePage } from '@/pages/HomePage'
import { ReviewDetailPage } from '@/pages/ReviewDetailPage'
import { ReviewNewPage } from '@/pages/ReviewNewPage'
import { ReviewsPage } from '@/pages/ReviewsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="guide" element={<GuidePage />} />
        <Route path="eat" element={<EatPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="reviews/new" element={<ReviewNewPage />} />
        <Route path="reviews/:id" element={<ReviewDetailPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
