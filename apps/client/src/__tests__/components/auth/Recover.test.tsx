import mockData from "@/__tests__/mocks/mock-data";
import MockAuthProvider from "@/__tests__/mocks/MockAuthProvider";
import Page from "@/app/(auth)/recover/page";
import ChangePassPage from "@/app/(auth)/recover/[email]/page";
import LoginForgetPasswordButton from "@/components/page/auth/login/LoginForgetPasswordButton";
import { ServerResponse } from "@/lib/server/requests";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query";
import MockQueryClientProvider from "@/__tests__/mocks/MockQueryClientProvider";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn((path) => path),
  }),
  useSearchParams: () => ({
    get: vi.fn((params) => params),
  }),
  useParams: vi.fn(() => ({ email: mockData.user.email })),
}));

vi.mock("@/lib/server/requests", () => ({
  GETRequest: vi.fn(async (path) => {
    let response: ServerResponse = {
      data: null,
      message: "",
      status: "NOT_FOUND",
    };

    const pathArray = (path as string).split("/");
    if (pathArray.pop() === mockData.user.email)
      response = {
        data: null,
        message: "",
        status: "OK",
      };

    return response;
  }),
  POSTRequest: vi.fn(async (path, body) => {
    let response: ServerResponse = {
      data: null,
      message: "",
      status: "NOT_FOUND",
    };

    if (body.pin === mockData.otp.pin)
      response = {
        data: null,
        message: "",
        status: "OK",
      };

    return response;
  }),
}));

describe("Recover Account", () => {
  it("should display a link element", () => {
    render(<LoginForgetPasswordButton />);
    expect(screen.getByRole("link", { name: "forgot your password?" }));
  });

  describe("Find account", () => {
    beforeEach(() => {
      render(
        <MockAuthProvider>
          <Page />
        </MockAuthProvider>
      );
    });

    it("should display a form, a label, an input, and a button", () => {
      expect(screen.getByTestId("recover-page-form")).toBeInTheDocument();
      expect(screen.getByText("Search your email")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Search your email")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
    });

    it("should display a disabled button while the input has no value", async () => {
      const button = screen.getByRole("button", { name: "Search" });

      // disabled by default
      expect(button).toBeDisabled();

      await userEvent.type(screen.getByPlaceholderText("Search your email"), mockData.user.email);

      // is enabled when the input has value
      expect(button).toBeEnabled();
    });

    it("should display a message if the email is invalid", async () => {
      await userEvent.type(screen.getByPlaceholderText("Search your email"), "email");
      await userEvent.click(screen.getByRole("button", { name: "Search" }));

      expect(await screen.findByTestId("recover-email-invalid")).toBeInTheDocument();
    });

    it("should display a message if the email is not found", async () => {
      await userEvent.type(screen.getByPlaceholderText("Search your email"), "test@test.com");
      await userEvent.click(screen.getByRole("button", { name: "Search" }));

      expect(await screen.findByTestId("recover-email-not-found")).toBeInTheDocument();
    });
  });

  describe("Change password", () => {
    beforeEach(() => {
      document.elementFromPoint = vi.fn(() => null);

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
          },
          dehydrate: {
            shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) || query.state.status === "pending",
          },
        },
      });

      render(
        <MockQueryClientProvider queryClient={queryClient}>
          <MockAuthProvider>
            <ChangePassPage />
          </MockAuthProvider>
        </MockQueryClientProvider>
      );
    });

    it("should have a back button", () => {
      expect(screen.getByTestId("recover-back-button"));
    });

    describe("OTP confirmation", () => {
      it("should have a form, an otp input, resend button", () => {
        expect(screen.getByTestId("recover-otp-form")).toBeInTheDocument();
        expect(screen.getByTestId("recover-otp-input")).toBeInTheDocument();
        expect(screen.getByTestId("recover-otp-resend")).toBeInTheDocument();
        expect(screen.getByTestId("recover-otp-confirm")).toBeInTheDocument();
      });

      it("should have a disabled button when the value of the otp input is less than 6 characters", async () => {
        let pin = " ";

        for (pin = "A"; pin.length < 6; pin += "A") {
          await userEvent.type(screen.getByTestId("recover-otp-input"), pin);
          expect(screen.getByTestId("recover-otp-confirm")).toBeDisabled();
          await userEvent.clear(screen.getByTestId("recover-otp-input"));
        }

        await userEvent.type(screen.getByTestId("recover-otp-input"), pin);
        expect(screen.getByTestId("recover-otp-confirm")).toBeEnabled();
      });

      it("should display an error if the pin is invalid", async () => {
        await userEvent.type(screen.getByTestId("recover-otp-input"), "123abc");
        await userEvent.click(screen.getByTestId("recover-otp-confirm"));

        expect(screen.getByTestId("recover-invalid-pin")).toBeInTheDocument();
      });
    });
  });
});
