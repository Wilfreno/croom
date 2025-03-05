import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SignupNavigateToLoginPage() {
  const from = useSearchParams().get("from");
  let search_params = "";
  if (from) search_params += "?from=" + from;

  return (
    <div>
      <span>Already have an account?</span>
      <Link href={"/login" + search_params}>
        <Button variant="link" className="text-primary">
          Login
        </Button>
      </Link>
    </div>
  );
}
