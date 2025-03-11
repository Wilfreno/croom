import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from "vitest";
import SignupEmailInput from "@/components/page/auth/signup/SignupEmailInput";
import MockAuthProvider from "@/__tests__/mocks/MockAuthProvider";
import MockQueryClientProvider from "@/__tests__/mocks/MockQueryClientProvider";
import mock_data from "@/__tests__/mocks/mock-data";
import SignupUsernameInput from "@/components/page/auth/signup/SignupUsernameInput";
import {
  dataTagErrorSymbol,
  dataTagSymbol,
  defaultShouldDehydrateQuery,
  QueryClient,
  QueryKey,
  SetDataOptions,
  Updater,
} from "@tanstack/react-query";
import SignupDisplaynameInput from "@/components/page/auth/signup/SignupDisplaynameInput";
import { ServerResponse } from "@/lib/server/requests";
import SignupPasswordInput from "@/components/page/auth/signup/SignupPasswordInput";
import SignUpDialog from "@/components/page/auth/signup/SignUpDialog";
import React from "react";

vi.mock(import("@tanstack/react-query"), async (importOriginal) => {
  const mod = await importOriginal();

  return {
    ...mod,
  };
});

vi.mock("@/lib/server/requests", () => ({
  GETRequest: vi.fn(async (path) => {
    let response: ServerResponse = {
      data: null,
      message: "",
      status: "NOT_FOUND",
    };
    if ((path as string).startsWith("/v1/user/check/email")) {
      const path_array = (path as string).split("/");
      if (path_array.pop() === mock_data.user.email)
        response = {
          data: null,
          message: "",
          status: "OK",
        };
    }

    if ((path as string).startsWith("/v1/user/check/username")) {
      const path_array = (path as string).split("/");

      if (path_array.pop() === mock_data.user.username)
        response = {
          data: null,
          message: "",
          status: "OK",
        };
    }
    return response;
  }),
}));

vi.mock("@/components/hooks/useDebounce", () => ({ default: vi.fn((value) => value) }));

describe("Signing up", () => {
  let query_client: QueryClient;
  let setQueryData: MockInstance<
    <
      TQueryFnData = unknown,
      TTaggedQueryKey extends QueryKey = QueryKey,
      TInferredQueryFnData = TTaggedQueryKey extends {
        [dataTagSymbol]: infer TaggedValue;
        [dataTagErrorSymbol]: unknown;
      }
        ? TaggedValue
        : TQueryFnData
    >(
      queryKey: TTaggedQueryKey,
      updater: Updater<NoInfer<TInferredQueryFnData> | undefined, NoInfer<TInferredQueryFnData> | undefined>,
      options?: SetDataOptions
    ) => TInferredQueryFnData | undefined
  >;

  beforeEach(() => {
    query_client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,
        },
        dehydrate: {
          shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) || query.state.status === "pending",
        },
      },
    });
    setQueryData = vi.spyOn(query_client, "setQueryData");
  });

  describe("Email input", () => {
    beforeEach(() => {
      render(
        <MockQueryClientProvider query_client={query_client}>
          <MockAuthProvider>
            <SignupEmailInput />
          </MockAuthProvider>
        </MockQueryClientProvider>
      );
    });

    it("should display a label and an email input", () => {
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    });

    it("should call query_client when the inputs value change", async () => {
      const spy = vi.spyOn(query_client, "setQueryData");
      const email_input = screen.getByPlaceholderText("Email");
      await userEvent.type(email_input, mock_data.user.email);

      expect(spy).toBeCalled();
    });

    it("should display a message when the email is available", async () => {
      const email_input = screen.getByPlaceholderText("Email");

      await userEvent.type(email_input, "valid@email.com");

      expect(await screen.findByTestId("email-available")).toBeInTheDocument();
    });

    it("should display a message when the email is already used", async () => {
      const email_input = screen.getByPlaceholderText("Email");

      await userEvent.type(email_input, mock_data.user.email);

      expect(screen.getByTestId("email-already-used")).toBeInTheDocument();
    });

    it("should display a message when the email is invalid", async () => {
      const email_input = screen.getByPlaceholderText("Email");

      await userEvent.type(email_input, "email");

      expect(screen.getByTestId("email-invalid")).toBeInTheDocument();
    });
  });

  describe("Username input", () => {
    let username_input: HTMLElement;

    beforeEach(() => {
      render(
        <MockQueryClientProvider query_client={query_client}>
          <MockAuthProvider>
            <SignupUsernameInput />
          </MockAuthProvider>
        </MockQueryClientProvider>
      );
      username_input = screen.getByPlaceholderText("Username");
    });

    it("should display a label and a username input", () => {
      expect(screen.getByLabelText("Username")).toBeInTheDocument();
      expect(username_input).toBeInTheDocument();
    });

    it("should call query_client when inputs value change", async () => {
      await userEvent.type(username_input, mock_data.user.username);
      expect(setQueryData).toBeCalled();
    });

    it("should display a message to explain what a username is when the input is focused", async () => {
      await userEvent.click(username_input);

      expect(screen.getByTestId("username-info")).toBeInTheDocument();
    });

    it("should display a message whether the username is available or already used", async () => {
      // should display that username is available
      await userEvent.type(username_input, "@mock_test");
      expect(screen.getByTestId("username-available")).toBeInTheDocument();

      await userEvent.clear(username_input);

      // should display that username is already used
      await userEvent.type(username_input, mock_data.user.username.slice(1));
      expect(screen.getByTestId("username-already-used")).toBeInTheDocument();
    });
  });

  describe("Displayname Input", () => {
    function displayNameInput() {
      return render(
        <MockQueryClientProvider query_client={query_client}>
          <MockAuthProvider>
            <SignupDisplaynameInput />
          </MockAuthProvider>
        </MockQueryClientProvider>
      );
    }

    it("should display a label and a display name input", () => {
      displayNameInput();

      expect(screen.getByLabelText("Display name"));
      expect(screen.getByPlaceholderText("Display name"));
    });

    it("should call query_client when inputs value change", async () => {
      displayNameInput();

      const spy = vi.spyOn(query_client, "setQueryData");

      const input = screen.getByPlaceholderText("Display name");

      await userEvent.type(input, mock_data.user.display_name);

      expect(spy).toBeCalled();
    });

    it("should display a message to explain what a display name is when the input is focused", async () => {
      displayNameInput();

      const input = screen.getByPlaceholderText("Display name");

      await userEvent.click(input);

      expect(screen.getByTestId("display-name-info")).toBeInTheDocument();
    });
  });

  describe("Password input", () => {
    function passwordInput() {
      return render(
        <MockQueryClientProvider query_client={query_client}>
          <MockAuthProvider>
            <SignupPasswordInput />
          </MockAuthProvider>
        </MockQueryClientProvider>
      );
    }

    it("should display a label and an input for password and confirm password", () => {
      passwordInput();

      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
      expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Confirm Password")).toBeInTheDocument();
    });

    it("should call query_client when password's input value change", async () => {
      passwordInput();

      const spy = vi.spyOn(query_client, "setQueryData");

      const input = screen.getByPlaceholderText("Password");

      await userEvent.type(input, "password");

      expect(spy).toBeCalled();
    });

    it("should change the icon when password's eye button is clicked", async () => {
      passwordInput();

      // EyeOff is the default icon
      expect(screen.getByTestId("eye-off-1")).toBeInTheDocument();
      expect(screen.queryByTestId("eye-on-1")).not.toBeInTheDocument();

      await userEvent.click(screen.getByTestId("see-password-1"));

      expect(screen.queryByTestId("eye-off-1")).not.toBeInTheDocument();
      expect(screen.getByTestId("eye-on-1")).toBeInTheDocument();
    });

    it("should change the inputs type when password's eye button is clicked", async () => {
      passwordInput();

      const input = screen.getByPlaceholderText("Password");
      const button = screen.getByTestId("see-password-1");

      //password is the type by default
      expect(input).toHaveAttribute("type", "password");

      await userEvent.click(button);

      expect(input).toHaveAttribute("type", "text");
    });

    it("should call query_client when confirm password's input value change", async () => {
      passwordInput();

      const spy = vi.spyOn(query_client, "setQueryData");

      const input = screen.getByPlaceholderText("Confirm Password");

      await userEvent.type(input, "password");

      expect(spy).toBeCalled();
    });
    it("should change the icon when change password's eye button is clicked", async () => {
      passwordInput();

      // EyeOff is the default icon
      expect(screen.getByTestId("eye-off-2")).toBeInTheDocument();
      expect(screen.queryByTestId("eye-on-2")).not.toBeInTheDocument();

      await userEvent.click(screen.getByTestId("see-password-2"));

      expect(screen.queryByTestId("eye-off-2")).not.toBeInTheDocument();
      expect(screen.getByTestId("eye-on-2")).toBeInTheDocument();
    });

    it("should change the inputs type when confirm password's eye button is clicked", async () => {
      passwordInput();

      const input = screen.getByPlaceholderText("Confirm Password");

      // password is the type by default
      expect(input).toHaveAttribute("type", "password");

      await userEvent.click(screen.getByTestId("see-password-2"));

      expect(input).toHaveAttribute("type", "text");
    });

    it("should display a message when the password is shorter than 8 characters", async () => {
      passwordInput();

      const input = screen.getByPlaceholderText("Password");

      await userEvent.type(input, "pass");
      expect(screen.getByTestId("short-password-message")).toBeInTheDocument();
    });

    it("should display a message when the confirm password is not the same as password", async () => {
      passwordInput();

      const input = screen.getByPlaceholderText("Confirm Password");

      await userEvent.type(input, "pass");
      expect(screen.getByTestId("password-not-same")).toBeInTheDocument();
    });
  });

  describe("Signup button", () => {
    function submitButton(other_components?: React.ReactNode) {
      return render(
        <MockQueryClientProvider query_client={query_client}>
          <MockAuthProvider>
            {other_components}
            <SignUpDialog />
          </MockAuthProvider>
        </MockQueryClientProvider>
      );
    }

    it("should display a disabled submit button", () => {
      submitButton();

      const button = screen.getByRole("button", { name: "Submit" });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    describe("Sign up Dialog", () => {
      let email_input: HTMLElement;
      let username_input: HTMLElement;
      let display_name_input: HTMLElement;
      let password_input: HTMLElement;
      let confirm_password_input: HTMLElement;
      let submit_button: HTMLElement;

      beforeEach(async () => {
        submitButton(
          <>
            <SignupEmailInput />
            <SignupUsernameInput />
            <SignupDisplaynameInput />
            <SignupPasswordInput />
          </>
        );
        email_input = screen.getByPlaceholderText("Email");
        username_input = screen.getByPlaceholderText("Username");
        display_name_input = screen.getByPlaceholderText("Display name");
        password_input = screen.getByPlaceholderText("Password");
        confirm_password_input = screen.getByPlaceholderText("Confirm Password");
        submit_button = screen.getByRole("button", { name: "Submit" });

        await userEvent.type(email_input, "test@test.email");
        await userEvent.type(username_input, mock_data.user.username);
        await userEvent.type(display_name_input, mock_data.user.display_name);
        await userEvent.type(password_input, mock_data.user.password!);
        await userEvent.type(confirm_password_input, mock_data.user.password!);
      });

      afterEach(async () => {
        await userEvent.clear(email_input);
        await userEvent.clear(username_input);
        await userEvent.clear(display_name_input);
        await userEvent.clear(password_input);
        await userEvent.clear(confirm_password_input);
      });

      it("should enable the submit button when all the form has valid values", async () => {
        expect(submit_button).toBeEnabled();
      });
    });
  });
});
