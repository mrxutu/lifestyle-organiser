import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { CredentialsSignin } from '@auth/core/errors'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { isAuthSessionCurrent, normalizeEmail } from './auth-input'
import { clearAuthRateLimit, consumeAuthRateLimit, getTrustedSourceIp } from './auth-rate-limit'
import { prisma } from './prisma'

const DUMMY_PASSWORD_HASH = '$2b$12$Fz.DbnR90u3GMVJiTRqCZ.tICFIoWqPReKaKeabfCI5EGN2ZPNCmW'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export class AccountDisabledSignin extends CredentialsSignin {
  code = 'account_disabled'
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(rawCredentials, request) {
        const parsed = credentialsSchema.safeParse(rawCredentials)
        if (!parsed.success) return null

        const email = normalizeEmail(parsed.data.email)
        const { password } = parsed.data
        const [accountLimit, ipLimit] = await Promise.all([
          consumeAuthRateLimit('LOGIN_ACCOUNT', email),
          consumeAuthRateLimit('LOGIN_IP', getTrustedSourceIp(request)),
        ])
        const user = await prisma.user.findUnique({ where: { email } })
        const passwordValid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH)
        if (!accountLimit.allowed || !ipLimit.allowed || !user?.passwordHash || !passwordValid) return null

        if (!user.isActive) throw new AccountDisabledSignin()

        await clearAuthRateLimit('LOGIN_ACCOUNT', email)
        return { id: user.id, email: user.email, name: user.name, authVersion: user.authVersion }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.authVersion = user.authVersion
        return token
      }

      if (typeof token.id !== 'string') return null

      const currentUser = await prisma.user.findUnique({
        where: { id: token.id },
        select: { authVersion: true, isActive: true },
      })
      if (!isAuthSessionCurrent(token.authVersion, currentUser)) return null

      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string
      return session
    },
  },
})
