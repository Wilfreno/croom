import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginForm from "@/components/page/auth/login/LoginForm";
import userEvent from "@testing-library/user-event";
import mock_data from "@/__tests__/mocks/mock-data";
import MockAuthProvider from "@/__tests__/mocks/MockAuthProvider";
import { toast } from "sonner";
import { AuthContextType } from "@/components/providers/AuthProvider";
import LoginWGoogle from "@/components/page/auth/login/LoginWGoogle";
import { useRouter } from "next/navigation";
import Page from "@/app/(auth)/login/page";

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
  it("checks whether all the element is rendered for login page", () => {
    // renders the LoginForm component with the MockAuthProvider
    render(
      <MockAuthProvider>
        <Page />
      </MockAuthProvider>
    );

    const heading_1 = screen.getByRole("heading", { name: /Connect and Chat with your friends and Communities/i });
    const heading_2 = screen.getByRole("heading", { name: /we're excited to see you/i });
    const form = screen.getByTestId("login-form");
    const username_input = screen.getByPlaceholderText(/username/i);
    const password_input = screen.getByPlaceholderText(/password/i);
    const view_password_button = screen.getByTestId("view-password-button");
    const forget_password_button = screen.getByRole("link", { name: /forgot your password?/i });
    const login_button = screen.getByRole("button", { name: /login/i });
    const continue_w_google_button = screen.getByRole("button", { name: /Continue with GOOGLE/i });
    const sign_up_link = screen.getByRole("link", { name: /Sign Up/i });

    expect(heading_1).toBeInTheDocument();
    expect(heading_2).toBeInTheDocument();
    expect(form).toBeInTheDocument();
    expect(username_input).toBeInTheDocument();
    expect(password_input).toBeInTheDocument();
    expect(view_password_button).toBeInTheDocument();
    expect(forget_password_button).toBeInTheDocument();
    expect(login_button).toBeInTheDocument();
    expect(continue_w_google_button).toBeInTheDocument();
    expect(sign_up_link).toBeInTheDocument();
  });

  it("disables login button when username or password input is empty", async () => {
    // renders the LoginForm component with the MockAuthProvider
    render(
      <MockAuthProvider>
        <LoginForm />
      </MockAuthProvider>
    );

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

  it('redirects to GOOGLE OAuth when the user click the "Continue with Google" button', async () => {
    // renders the LoginForm component with the MockAuthProvider and simulates the login function that is context by the MockAuthProvider
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
