'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

const GENERIC_MESSAGE = "If that email is registered, we've sent a reset link."

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } finally {
      // Always show the same confirmation, success or failure — don't leak
      // whether the request succeeded, let alone whether the email exists.
      setSubmitting(false)
      setSubmitted(true)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <Alert>
              <AlertDescription>{GENERIC_MESSAGE}</AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
          )}

          <p className="mt-4 text-sm text-muted-foreground">
            <Link href="/login" className="underline">
              Back to log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
