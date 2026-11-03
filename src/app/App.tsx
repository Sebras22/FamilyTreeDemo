import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { useBrandStyling } from '@/shared/theme/design'
import NotFoundPage from '@/features/errors/pages/NotFoundPage'
import TreesPage from '@/features/trees/pages/TreesPage'
import RouteFallback from './RouteFallback'

const PrivacyPage = lazy(() => import('@/features/account/pages/PrivacyPage'))
const TreePage = lazy(() => import('@/features/trees/pages/TreePage'))
const PersonPage = lazy(() => import('@/features/persons/pages/PersonPage').then((m) => ({ default: m.PersonPage })))

export default function App() {
  useBrandStyling()
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/" element={<TreesPage />} />
        <Route path="/trees/:treeId" element={<TreePage />} />
        <Route path="/trees/:treeId/persons/:personId" element={<PersonPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
