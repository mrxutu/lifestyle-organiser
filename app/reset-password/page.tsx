import { findValidPasswordResetToken } from '@/lib/password-reset'
import { ResetPasswordForm } from './reset-password-form'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const isValid = token ? Boolean(await findValidPasswordResetToken(token)) : false

  return <ResetPasswordForm token={isValid && token ? token : null} />
}
