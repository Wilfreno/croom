"use client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AtSign, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import LoginForgetPasswordButton from "./LoginForgetPasswordButton";

export default function LoginForm() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [view_password, setViewPassword] = useState(false);

  const { login } = useAuth();

  return (
    <form
      data-testid="login-form"
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);

        await login("LOCAL", {
          username: credentials.username,
          password: credentials.password,
        });
        setLoading(false);
      }}
    >
      <div className="relative">
        <AtSign className="h-4 w-auto absolute left-3 top-1/2 -translate-y-1/2" />

        <Input
          className="pl-10"
          placeholder="Username"
          value={credentials.username}
          onChange={(e) => setCredentials((prev) => ({ ...prev, username: e.target.value }))}
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
            data-testid="view-password-button"
            className="p-2 absolute right-2 top-1/2 -translate-y-1/2"
            size="icon"
            variant="ghost"
            tabIndex={-1}
            onClick={() => setViewPassword((prev) => !prev)}
            type="button"
          >
            {view_password ? <Eye className="h-full w-full" /> : <EyeOff className="h-full w-full" />}
          </Button>
        </div>
        <LoginForgetPasswordButton />
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
