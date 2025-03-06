import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginForm from "@/components/page/auth/login/LoginForm";
import userEvent from "@testing-library/user-event";
import mock_data from "@/__tests__/mocks/mock-data";
import MockAuthProvider from "@/__tests__/mocks/MockAuthProvider";
import { toast } from "sonner";
import { AuthContextType } from "@/components/providers/AuthProvider";
import LoginWGoogle from "@/components/page/auth/login/LoginWGoogle";
import { useRouter } from "next/navigation";
import Page from "@/app/(auth)/(form)/login/page";
import NavigateToSignUpButton from "@/components/page/auth/login/NavigateToSignUpButton";

// mocks the module sonner so toast.error()  can be accessed on the test environment
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn((message) => message),
  },
}));

// creates a mock module for next/navigation so push()  can be accessed on the test environment
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

    expect(
      screen.getByRole("heading", { name: "Connect and Chat with your friends and Communities" })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "we're excited to see you" })).toBeInTheDocument();
  });

  it("should display a link to signup page", () => {
    render(<NavigateToSignUpButton />);

    expect(screen.getByRole("link", { name: "Sign Up" }));
  });
  describe("Login w/ credentials", () => {
    beforeEach(() => {
      render(
        <MockAuthProvider>
          <LoginForm />
        </MockAuthProvider>
      );
    });

    it("should display a form, username input, password input, and a button", () => {
      expect(screen.getByTestId("login-form")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    });

    it("disables login button when username or password input is empty", async () => {
      const login_button = screen.getByRole("button", { name: /login/i });
      const username_input = screen.getByPlaceholderText(/username/i);
      const password_input = screen.getByPlaceholderText(/password/i);

      // button is disabled by default
      expect(login_button).toBeDisabled();

      // button is disabled when only the username input has a value
      await userEvent.type(username_input, mock_data.user.username);
      expect(login_button).toBeDisabled();

      // button is disabled when only the password input has a value
      await userEvent.type(password_input, mock_data.user.password!);
      await userEvent.clear(username_input);
      expect(login_button).toBeDisabled();
    });

    it("renders succinct error message message that is displayed temporarily.", async () => {
      // renders the LoginForm component with the MockAuthProvider and simulates the login function that is context by the MockAuthProvider
      render(
        <MockAuthProvider
          mock_data={{
            login: vi.fn<AuthContextType["login"]>(async (_, credentials) => {
              if (credentials?.username !== mock_data.user.username) {
                toast.error("User does not exist");
                return;
              }
              if (credentials.password !== mock_data.user.password) {
                toast.error("Incorrect Password");
                return;
              }
            }),
          }}
        >
          <LoginForm />
        </MockAuthProvider>
      );

      const login_button = screen.getByRole("button", { name: /login/i });
      const username_input = screen.getByPlaceholderText(/username/i);
      const password_input = screen.getByPlaceholderText(/password/i);

      // input a username that does not exist
      await userEvent.type(username_input, "username");
      await userEvent.type(password_input, mock_data.user.password!);
      await userEvent.click(login_button);
      expect(toast.error).toHaveBeenCalledWith("User does not exist");

      //clear existing inputs
      vi.clearAllMocks();
      await userEvent.clear(username_input);
      await userEvent.clear(password_input);

      // input an incorrect password
      await userEvent.type(username_input, mock_data.user.username);
      await userEvent.type(password_input, "incorrect-password");
      await userEvent.click(login_button);
      expect(toast.error).toHaveBeenCalledWith("Incorrect Password");

      //clear existing inputs
      vi.clearAllMocks();
      await userEvent.clear(username_input);
      await userEvent.clear(password_input);

      //input a valid credentials
      await userEvent.type(username_input, mock_data.user.username);
      await userEvent.type(password_input, mock_data.user.password!);
      await userEvent.click(login_button);

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

      expect(screen.getByRole("button", { name: "Continue with GOOGLE" })).toBeInTheDocument();
    });

    it('redirects to GOOGLE OAuth when the user click the "Continue with Google" button', async () => {
      const router = useRouter();
      render(
        <MockAuthProvider
          mock_data={{
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

  describe("Forgot password", () => {});
});
