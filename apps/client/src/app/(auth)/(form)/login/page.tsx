import LoginForm from '@/components/page/auth/login/LoginForm'
import LoginWGoogle from '@/components/page/auth/login/LoginWGoogle'
import NavigateToSignUpButton from '@/components/page/auth/login/NavigateToSignUpButton'
import { Suspense } from 'react'

export default function Page() {
  return (
    <section className='h-full grow flex flex-col justify-evenly md:px-[10vw]'>
      <div className='hidden md:inline-block'>
        <h1
          data-testid='login-page-h1'
          className='text-6xl text-start w-[30vw] font-semibold bg-gradient-to-r from-[#7f00ff] to-[#e100ff]  bg-clip-text text-transparent'
        >
          Connect and Chat with your friends and Communities
        </h1>
        <h2 data-testid='login-page-h2' className='text-muted-foreground font-medium'>
          <span className='font-bold'>Welcome! </span>
          we&apos;re excited to see you
        </h2>
      </div>
      <div className=' grid grid-rows-[1fr_auto] md:gap-8 '>
        <div className='flex flex-col gap-4'>
          <LoginForm />
          <LoginWGoogle />
        </div>
        <Suspense>
          <NavigateToSignUpButton />
        </Suspense>
      </div>
    </section>
  )
}
