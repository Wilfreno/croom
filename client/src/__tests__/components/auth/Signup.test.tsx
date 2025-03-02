import mock_data from "@/__tests__/mocks/mock-data";
import MockAuthProvider from "@/__tests__/mocks/MockAuthProvider";
import Page from "@/app/(auth)/sign-up/page";
import SignUpForm from "@/components/page/auth/signup/SignupForm";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn((path) => path),
  }),
  useSearchParams: () => ({
    get: vi.fn((params) => params),
  }),
}));

describe("Signing up", () => {
  it("checks whether all the elements is rendered for signup page", () => {
    render(
      <MockAuthProvider>
        <Page />
      </MockAuthProvider>
    );

    const heading_1 = screen.getByRole("heading", { name: /Welcome!/i });
    const heading_2 = screen.getByRole("heading", { name: /Sign Up for a great experience/i });
    const form = screen.getByTestId("signup-form");
    const email_input = screen.getByPlaceholderText(/Email/i);
    const username_input = screen.getByPlaceholderText(/Username/i);
    const display_name_input = screen.getByPlaceholderText(/Display name/i);
    const password_input = screen.getByPlaceholderText("Password");
    const confirm_password_input = screen.getByPlaceholderText("Confirm Password");
    const dialog_button = screen.getByRole("button", { name: /Submit/i });
    const navigate_to_login_page_button = screen.getByRole("button", { name: /Login/i });

    expect(heading_1).toBeInTheDocument();
    expect(heading_2).toBeInTheDocument();
    expect(form).toBeInTheDocument();
    expect(email_input).toBeInTheDocument();
    expect(username_input).toBeInTheDocument();
    expect(display_name_input).toBeInTheDocument();
    expect(password_input).toBeInTheDocument();
    expect(confirm_password_input).toBeInTheDocument();
    expect(dialog_button).toBeInTheDocument();
    expect(navigate_to_login_page_button).toBeInTheDocument();
  });

  it("displays an info to explain what username and display name is", async () => {
    render(
      <MockAuthProvider>
        <SignUpForm />
      </MockAuthProvider>
    );
    const username_input = screen.getByPlaceholderText(/Username/i);
    const display_name_input = screen.getByPlaceholderText(/Display name/i);

    await userEvent.type(username_input, mock_data.user.username);
    const username_info = screen.getByTestId("username-info");
    expect(username_info).toBeInTheDocument();

    await userEvent.type(display_name_input, mock_data.user.display_name);
    const display_name_info = screen.getByTestId("display-name-info");
    expect(display_name_info).toBeInTheDocument();
  });

  it("enable the submit button only when all the input has value", async () => {
    render(
      <MockAuthProvider>
        <SignUpForm />
      </MockAuthProvider>
    );
    const email_input = screen.getByPlaceholderText(/Email/i);
    const username_input = screen.getByPlaceholderText(/Username/i);
    const display_name_input = screen.getByPlaceholderText(/Display name/i);
    const password_input = screen.getByPlaceholderText("Password");
    const confirm_password_input = screen.getByPlaceholderText("Confirm Password");
    const submit_button = screen.getByRole("button", { name: /Submit/i });

    // button is disabled by default
    expect(submit_button).toBeDisabled();

    // button will be disabled when only some input has value

    await userEvent.type(email_input, mock_data.user.email);
    expect(submit_button).toBeDisabled();

    await userEvent.type(username_input, mock_data.user.username);
    expect(submit_button).toBeDisabled();

    await userEvent.type(display_name_input, mock_data.user.display_name);
    expect(submit_button).toBeDisabled();

    await userEvent.type(password_input, mock_data.user.password!);
    expect(submit_button).toBeDisabled();

    await userEvent.type(confirm_password_input, mock_data.user.password!);
    expect(submit_button).toBeEnabled();
  });

  it("disable the submit button when password and confirm password does not meet a desired criteria", async () => {
    render(
      <MockAuthProvider>
        <SignUpForm />
      </MockAuthProvider>
    );
    const username_input = screen.getByPlaceholderText(/Username/i);
    const display_name_input = screen.getByPlaceholderText(/Display name/i);
    const password_input = screen.getByPlaceholderText("Password");
    const confirm_password_input = screen.getByPlaceholderText("Confirm Password");
    const submit_button = screen.getByRole("button", { name: /Submit/i });

    await userEvent.type(username_input, mock_data.user.username);
    await userEvent.type(display_name_input, mock_data.user.display_name);

    // when the password has lower than 8 characters the button is disabled and a message will the rendered
    await userEvent.type(password_input, "short");
    const password_too_short_message = screen.getByTestId("short-password-message");
    expect(password_too_short_message).toBeInTheDocument();
    expect(submit_button).toBeDisabled();

    await userEvent.clear(password_input);
    await userEvent.type(password_input, mock_data.user.password!);

    // when the password and confirm password value is not the same the signup button will be disabled and a message will be displayed
    await userEvent.type(confirm_password_input, "not-the-same-password");
    const password_not_same_message = screen.getByTestId("password-not-same");
    expect(password_not_same_message).toBeInTheDocument();
    expect(submit_button).toBeDisabled();
  });
});
