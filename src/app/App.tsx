import { Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { routes } from '@/app/routes'
import { ThemeProvider } from '@/hooks/useTheme'
import { ToastProvider } from '@/components/ui/Toast'
import { ServiceWorkerUpdatePrompt } from '@/components/ServiceWorkerUpdatePrompt'

const router = createBrowserRouter(routes)

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ServiceWorkerUpdatePrompt />
        <Suspense fallback={null}>
          <RouterProvider router={router} />
        </Suspense>
      </ToastProvider>
    </ThemeProvider>
  )
}
