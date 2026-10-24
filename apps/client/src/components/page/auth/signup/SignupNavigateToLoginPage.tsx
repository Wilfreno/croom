import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SignupNavigateToLoginPage() {
  const from = useSearchParams().get("from");
  let searchParams = "";
  if (from) searchParams += "?from=" + from;

  return (
    <div>
      <span>Already have an account?</span>
      <Link href={"/login" + searchParams}>
        <Button variant="link" className="text-primary">
          Login
        </Button>
      </Link>
    </div>
  );
}
