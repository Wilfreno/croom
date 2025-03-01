import { AuthContext, AuthContextType } from "@/components/providers/AuthProvider";
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
  mock_data?: Partial<AuthContextType>;
};

/**
 *  A Component used to mock the {@link AuthProvider}
 *
 * @param props
 * @returns {@link AuthContext} with the mock values
 * @see {@link AuthProvider}
 */

export default function MockAuthProvider({ children, mock_data }: props) {
  return (
    <AuthContext.Provider
      value={{
        session: {
          user: mock_data?.session?.user || null,
          update: mock_data?.session?.update
            ? mock_data?.session?.update
            : async () => {},
        },
        logout: mock_data?.logout ? mock_data?.logout : async () => {},
        login: mock_data?.login ? mock_data?.login : async () => {},
        signup: {
          submitForm: mock_data?.signup?.submitForm
            ? mock_data?.signup?.submitForm
            : async () => {},
          createOTP: mock_data?.signup?.createOTP
            ? mock_data?.signup?.createOTP
            : async () => {},
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
