"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AtSign, Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginForm() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [view_password, setViewPassword] = useState(false);
  const from = useSearchParams().get("from");
  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const sign_in = await signIn("credentials", {
          username: "@" + credentials.username,
          password: credentials.password,
          redirect: true,
          callbackUrl: from ? from : "/",
        });
        if (sign_in?.error) toast.error(sign_in.error);

        setLoading(false);
      }}
    >
      <div className="relative">
        <AtSign className="h-4 w-auto absolute left-3 top-1/2 -translate-y-1/2" />

        <Input
          className="pl-10"
          placeholder="Username"
          value={credentials.username}
          onChange={(e) =>
            setCredentials((prev) => ({ ...prev, username: e.target.value }))
          }
        />
      </div>
      <div>
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
            {view_password ? (
              <Eye className="h-full w-full" />
            ) : (
              <EyeOff className="h-full w-full" />
            )}
          </Button>
        </div>

        <Link
          href="#"
          className="text-primary text-left text-bold text-sm my-2"
        >
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
