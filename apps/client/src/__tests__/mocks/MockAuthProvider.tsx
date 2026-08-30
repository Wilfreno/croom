import { AuthContext } from "@/components/providers/AuthProvider";
import { AuthContextType } from "@repo/types";
import React from "react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import AuthProvider from "@/components/providers/AuthProvider";

type props = {
  /**
   *  A React {@link HTMLElement} or a Custom component
   */
  children: React.ReactNode;

  /**
   *  A Partial data of {@link AuthContextType}
   * @example 
   *   <MockAuthProvider
        mock_data={{
          login: vi.fn(async () => {
            // your mock function statements here..
          }),
        }}
      >
       { // your react element or component here.. }
      </MockAuthProvider>
   */
  mockData?: Partial<AuthContextType>;
};

/**
 *  A Component used to mock the {@link AuthProvider}
 *
 * @param props
 * @returns {@link AuthContext} with the mock values
 * @see {@link AuthProvider}
 */

export default function MockAuthProvider({ children, mockData }: props) {
  return (
    <AuthContext.Provider
      value={{
        session: {
          user: mockData?.session?.user || null,
          update: mockData?.session?.update
            ? mockData?.session?.update
            : async () => {},
        },
        logout: mockData?.logout ? mockData?.logout : async () => {},
        login: mockData?.login ? mockData?.login : async () => {},
        signup: {
          submitForm: mockData?.signup?.submitForm
            ? mockData?.signup?.submitForm
            : async () => {},
          createOTP: mockData?.signup?.createOTP
            ? mockData?.signup?.createOTP
            : async () => {},
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
