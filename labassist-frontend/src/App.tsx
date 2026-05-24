import { ToastProvider } from './components/ui/Toast'
import { AppRouter } from './router'

export default function App() {
  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  )
}
