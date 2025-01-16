"use client";
<<<<<<< HEAD
import { useAuth } from "@/components/providers/SessionProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AtSign, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
=======
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AtSign, Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60

export default function LoginForm() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [view_password, setViewPassword] = useState(false);
<<<<<<< HEAD

  const { login } = useAuth();
=======
  const from = useSearchParams().get("from");
  const router = useRouter();
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
<<<<<<< HEAD

        await login("LOCAL", {
          username: credentials.username,
          password: credentials.password,
        });
=======
        const sign_in = await signIn("credentials", {
          username: "@" + credentials.username,
          password: credentials.password,
        });

        if (sign_in?.error) toast(sign_in.error);

        router.push(from ? from : "/");
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
        setLoading(false);
      }}
    >
      <div className="relative">
        <AtSign className="h-4 w-auto absolute left-3 top-1/2 -translate-y-1/2" />

        <Input
          className="pl-10"
          placeholder="Username"
          value={credentials.username}
<<<<<<< HEAD
          onChange={(e) =>
            setCredentials((prev) => ({ ...prev, username: e.target.value }))
          }
=======
          onChange={(e) => setCredentials((prev) => ({ ...prev, username: e.target.value }))}
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
        />
      </div>
      <div className=" grid gap-2">
        <div className="relative">
          <Input
            placeholder="Password"
            type={view_password ? "text" : "password"}
            value={credentials.password}
            onChange={(e) =>
              setCredentials((prev) => ({
                ...prev,
                password: e.target.value,
              }))
            }
          />
          <Button
            className="p-2 absolute right-2 top-1/2 -translate-y-1/2"
            size="icon"
            variant="ghost"
            tabIndex={-1}
            onClick={() => setViewPassword((prev) => !prev)}
            type="button"
          >
<<<<<<< HEAD
            {view_password ? (
              <Eye className="h-full w-full" />
            ) : (
              <EyeOff className="h-full w-full" />
            )}
=======
            {view_password ? <Eye className="h-full w-full" /> : <EyeOff className="h-full w-full" />}
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
          </Button>
        </div>

        <Link href="#" className="text-primary text-left text-bold text-sm my-2">
          forgot your password?
        </Link>
      </div>
      <Button
        disabled={!credentials.username || !credentials.password || loading}
        className="w-full text-base"
        type="submit"
      >
        Login
      </Button>
    </form>
  );
}
