import AppHeader from '@/shared/layout/AppHeader'
import ErrorPage from '@/shared/ui/ErrorPage'

export default function NotFoundPage() {
  return (
    <>
      <AppHeader />
      <ErrorPage status={404} />
    </>
  )
}
