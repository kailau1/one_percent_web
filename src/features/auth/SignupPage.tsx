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
  firstName: z.string().trim().min(1, 'Enter your first name'),
  lastName: z.string().trim().min(1, 'Enter your last name'),
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters'),
})
type FormValues = z.infer<typeof schema>

export function SignupPage() {
  const { register: createAccount } = useAuth()
  const [searchParams] = useSearchParams()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createAccount(values)
    } catch (error) {
      const message = getErrorMessage(error)
      // "An account with this email already exists." belongs next to the email field
      if (/email/i.test(message)) setError('email', { message })
      else setError('root', { message })
    }
  })

  const loginLink = searchParams.get('next') ? `/login?${searchParams}` : '/login'

  return (
    <AuthLayout
      title="Create your account"
      footer={
        <>
          Already have an account?{' '}
          <Link to={loginLink} className="font-medium text-action underline-offset-4 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" autoComplete="given-name" autoFocus error={errors.firstName?.message} {...register('firstName')} />
          <Field label="Last name" autoComplete="family-name" error={errors.lastName?.message} {...register('lastName')} />
        </div>
        <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Field label="Password" type="password" autoComplete="new-password" hint="At least 8 characters" error={errors.password?.message} {...register('password')} />
        {errors.root && (
          <p role="alert" className="text-sm text-danger">
            {errors.root.message}
          </p>
        )}
        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? 'Creating your account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  )
}
