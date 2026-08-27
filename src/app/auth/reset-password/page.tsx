import type { Metadata } from 'next'
import ResetPasswordClient from './ResetPasswordClient'

export const metadata: Metadata = {
  title: 'Set New Password — QuickTools',
  description: 'Set a new password for your QuickTools account.',
}

export default function ResetPasswordPage() {
  return <ResetPasswordClient />
}
