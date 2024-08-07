"use client";
import LoadingSvg from "@/components/svg/LoadingSvg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function LoginForm() {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [view_password, setViewPassword] = useState(false);
  const [sign_in_error, setSignInError] = useState("");

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const sign_in = await signIn("credentials", {
          email: credentials.email,
          password: credentials.password,
          redirect: false,
        });
        if (sign_in?.error) setSignInError(sign_in.error);

        setLoading(false);
      }}
    >
      <Input
        placeholder="Email"
        className=" text-base py-5"
        value={credentials.email}
        onChange={(e) =>
          setCredentials((prev) => ({ ...prev, email: e.target.value }))
        }
      />
      <div>
        <div className="relative">
          <Input
            placeholder="Password"
            type={view_password ? "text" : "password"}
            className="text-base py-5"
            value={credentials.password}
            onChange={(e) =>
              setCredentials((prev) => ({ ...prev, password: e.target.value }))
            }
          />
          <Button
            className="aspect-square p-2 absolute right-2 top-1/2 -translate-y-1/2"
            size="icon"
            variant="ghost"
            tabIndex={-1}
            onClick={() => setViewPassword((prev) => !prev)}
            type="button"
          >
            {view_password ? (
              <EyeOpenIcon className="h-full w-full" />
            ) : (
              <EyeClosedIcon className="h-full w-full" />
            )}
          </Button>
        </div>
        {sign_in_error && (
          <p className="text-red-600 text-xs mx-3 my-1">{sign_in_error}</p>
        )}
        <Link
          href="#"
          className="text-primary text-center text-bold text-sm mx-2"
        >
          forgot your password?
        </Link>
      </div>
      <Button
        disabled={!credentials.email || !credentials.password}
        className="w-full text-base"
        type="submit"
      >
        {loading ? (
          <LoadingSvg className="h-6 fill-secondary-foreground" />
        ) : (
          "Login"
        )}
      </Button>
      <p className="text-sm">
        Don't have an account?{" "}
        <Link href="/signup" as="/signup" prefetch className="text-primary">
          Signup
        </Link>
      </p>
    </form>
  );
}
