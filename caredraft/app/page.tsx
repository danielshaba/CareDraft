import { redirect } from 'next/navigation'

export default function RootPage() {
  // Redirect to dashboard for now to work around CSS preloading bug
  redirect('/dashboard')
}
