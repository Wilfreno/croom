import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginForm from "@/components/page/auth/login/LoginForm";
import userEvent from "@testing-library/user-event";
import mockData from "@/__tests__/mocks/mock-data";
import MockAuthProvider from "@/__tests__/mocks/MockAuthProvider";
import { toast } from "sonner";
import { AuthContextType } from "@repo/types";
import LoginWGoogle from "@/components/page/auth/login/LoginWGoogle";
import { useRouter } from "next/navigation";
import Page from "@/app/(auth)/(form)/login/page";
import NavigateToSignUpButton from "@/components/page/auth/login/NavigateToSignUpButton";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn((message) => message),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn((path) => path),
  }),
  useSearchParams: () => ({
    get: vi.fn((params) => params),
  }),
}));

describe("Logging in", () => {
  it("should display headers", () => {
    render(
      <MockAuthProvider>
        <Page />
      </MockAuthProvider>
    );

    expect(screen.getByTestId("login-page-h1")).toBeInTheDocument();
    expect(screen.getByTestId("login-page-h2")).toBeInTheDocument();
  });

  it("should display a link to signup page", () => {
    render(<NavigateToSignUpButton />);

    expect(screen.getByRole("link", { name: "Sign Up" }));
  });

  describe("Login w/ credentials", () => {
    it("should display a form, username input, password input, and a button", () => {
      render(
        <MockAuthProvider>
          <LoginForm />
        </MockAuthProvider>
      );

      expect(screen.getByTestId("login-form")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    });

    it("disables login button when username or password input is empty", async () => {
      render(
        <MockAuthProvider>
          <LoginForm />
        </MockAuthProvider>
      );

      const loginButton = screen.getByRole("button", { name: /login/i });
      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);

      expect(loginButton).toBeDisabled();

      await userEvent.type(usernameInput, mockData.user.username);
      expect(loginButton).toBeDisabled();

      await userEvent.type(passwordInput, mockData.user.password!);
      await userEvent.clear(usernameInput);
      expect(loginButton).toBeDisabled();
    });

    it("renders succinct error message message that is displayed temporarily.", async () => {
      render(
        <MockAuthProvider
          mockData={{
            login: vi.fn<AuthContextType["login"]>(async (_, credentials) => {
              if (credentials?.username !== mockData.user.username) {
                toast.error("User does not exist");
                return;
              }
              if (credentials.password !== mockData.user.password) {
                toast.error("Incorrect Password");
                return;
              }
            }),
          }}
        >
          <LoginForm />
        </MockAuthProvider>
      );

      const loginButton = screen.getByRole("button", { name: "Login" });
      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);

      await userEvent.type(usernameInput, "username");
      await userEvent.type(passwordInput, mockData.user.password!);
      await userEvent.click(loginButton);
      expect(toast.error).toHaveBeenCalledWith("User does not exist");

      vi.clearAllMocks();
      await userEvent.clear(usernameInput);
      await userEvent.clear(passwordInput);

      await userEvent.type(usernameInput, mockData.user.username);
      await userEvent.type(passwordInput, "incorrect-password");
      await userEvent.click(loginButton);
      expect(toast.error).toHaveBeenCalledWith("Incorrect Password");

      vi.clearAllMocks();
      await userEvent.clear(usernameInput);
      await userEvent.clear(passwordInput);

      await userEvent.type(usernameInput, mockData.user.username);
      await userEvent.type(passwordInput, mockData.user.password!);
      await userEvent.click(loginButton);

      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe("Login w/ GOOGLE", () => {
    it("should display a button to login with google", () => {
      render(
        <MockAuthProvider>
          <LoginWGoogle />
        </MockAuthProvider>
      );

      expect(screen.getByTestId("login-w-google")).toBeInTheDocument();
    });

    it('redirects to GOOGLE OAuth when the user click the "Continue with Google" button', async () => {
      const router = useRouter();
      render(
        <MockAuthProvider
          mockData={{
            login: vi.fn(async () => {
              router.push("/");
            }),
          }}
        >
          <LoginWGoogle />
        </MockAuthProvider>
      );

      const button = screen.getByRole("button", { name: /Continue with GOOGLE/i });

      await userEvent.click(button);
      expect(router.push).toHaveBeenCalledWith("/");
    });
  });
});
