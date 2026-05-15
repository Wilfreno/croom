import useDebounce from "@/components/hooks/useDebounce";
import Loading from "@/components/svg/Loading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GETRequest } from "@/lib/server/requests";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export default function SignupEmailInput() {
  const query_client = useQueryClient();
  const { data: form } = useQuery<{
    email: string;
    username: string;
    password: string;
    display_name: string;
    confirm_password: string;
    pin: string;
  }>({ queryKey: ["signup", "form"] });

  const { data: email_check } = useQuery<{ checking: boolean; status?: "ALREADY_USED" | "AVAILABLE" | "INVALID" }>({
    queryKey: ["signup", "form", "email", "check"],
    queryFn: () => ({ checking: false }),
  });

  const debounced_email_value = useDebounce(form?.email, 1000);

  useEffect(() => {
    if (!debounced_email_value) {
      query_client.setQueryData<{ checking: boolean; status?: "ALREADY_USED" | "AVAILABLE" | "INVALID" }>(
        ["signup", "form", "email", "check"],
        (prev) => {
          if (!prev) return;

          return { checking: false };
        }
      );

      return;
    }

    async function checkEmailIfAlreadyUsed() {
      try {
        query_client.setQueryData<{ checking: boolean; status?: "ALREADY_USED" | "AVAILABLE" | "INVALID" }>(
          ["signup", "form", "email", "check"],
          (prev) => {
            if (!prev) return;

            return { ...prev, checking: true };
          }
        );

        const pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

        if (!pattern.test(debounced_email_value!)) {
          query_client.setQueryData<{ checking: boolean; status?: "ALREADY_USED" | "AVAILABLE" | "INVALID" }>(
            ["signup", "form", "email", "check"],
            (prev) => {
              if (!prev) return;

              return { checking: false, status: "INVALID" };
            }
          );
          return;
        }

        const { status, message } = await GETRequest("/v1/user/check/email/" + debounced_email_value);
        if (status === "OK") {
          query_client.setQueryData<{ checking: boolean; status?: "ALREADY_USED" | "AVAILABLE" | "INVALID" }>(
            ["signup", "form", "email", "check"],
            (prev) => {
              if (!prev) return;

              return { checking: false, status: "ALREADY_USED" };
            }
          );

          return;
        }
        query_client.setQueryData<{ checking: boolean; status?: "ALREADY_USED" | "AVAILABLE" | "INVALID" }>(
          ["signup", "form", "email", "check"],
          (prev) => {
            if (!prev) return;

            return { checking: false, status: "AVAILABLE" };
          }
        );

        if (status !== "NOT_FOUND") {
          console.log({ status, message });
          return;
        }
      } catch (error) {
        throw error;
      }
    }

    checkEmailIfAlreadyUsed();
  }, [debounced_email_value]);

  return (
    <div className="grid gap-2">
      <Label htmlFor="email">Email</Label>
      <div className="grid gap-1">
        <div className="relative">
          <Input
            type="email"
            required
            id="email"
            placeholder="Email"
            value={form?.email}
            onChange={(e) =>
              query_client.setQueryData<{
                email: string;
                username: string;
                password: string;
                display_name: string;
                confirm_password: string;
                pin: string;
              }>(["signup", "form"], (prev) => {
                if (!prev) return;
                return { ...prev, email: e.target.value };
              })
            }
            className={cn(
              email_check?.status === "AVAILABLE" && "border-green-500 border-2 focus-visible:ring-green-500",
              email_check?.status === "ALREADY_USED" && "border-destructive border-2 focus-visible:ring-destructive"
            )}
          />
          {email_check?.checking && (
            <Loading
              data-testid="email-input-loading"
              className="h-4 w-auto absolute top-1/2 -translate-y-1/2 right-2"
            />
          )}
        </div>
        {email_check?.status === "AVAILABLE" && (
          <span data-testid="email-available" className="text-xs text-green-500">
            Email is available
          </span>
        )}
        {email_check?.status === "ALREADY_USED" && (
          <span data-testid="email-already-used" className="text-xs text-red-500">
            Email already used
          </span>
        )}
        {email_check?.status === "INVALID" && (
          <span data-testid="email-invalid" className="text-xs text-red-500">
            Invalid email address
          </span>
        )}
      </div>
    </div>
  );
}
