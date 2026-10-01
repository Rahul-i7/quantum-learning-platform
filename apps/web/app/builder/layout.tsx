import RequireAuth from '@/components/auth/RequireAuth'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RequireAuth roles={['student', 'instructor', 'admin', 'guest']}>{children}</RequireAuth>
}