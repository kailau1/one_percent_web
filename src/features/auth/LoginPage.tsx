import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router'
import { z } from 'zod'
import { getErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { AuthLayout } from './AuthLayout'
import { useAuth } from './useAuth'

const schema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})
type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { login, sessionExpired } = useAuth()
  const [searchParams] = useSearchParams()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  // On success there's nothing to do here: PublicOnly sees the user and redirects to `next`.
  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values)
    } catch (error) {
      setError('root', { message: getErrorMessage(error) })
    }
  })

  const signupLink = searchParams.get('next') ? `/signup?${searchParams}` : '/signup'

  return (
    <AuthLayout
      title="Log in"
      footer={
        <>
          New here?{' '}
          <Link to={signupLink} className="font-medium text-action underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {sessionExpired && (
        <p role="status" className="mb-6 rounded-control border border-warning-line bg-warning-wash px-4 py-3 text-sm">
          Your session expired. Log in again to pick up where you left off.
        </p>
      )}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <Field label="Email" type="email" autoComplete="email" autoFocus error={errors.email?.message} {...register('email')} />
        <Field label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        {errors.root && (
          <p role="alert" className="text-sm text-danger">
            {errors.root.message}
          </p>
        )}
        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthLayout>
  )
}
