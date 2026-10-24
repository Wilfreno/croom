import Link from 'next/link';

export default function LoginForgetPasswordButton() {
  return (
    <Link href="/recover" className="text-primary text-left text-bold text-sm my-2 w-fit hover:underline">
      forgot your password?
    </Link>
  );
}
