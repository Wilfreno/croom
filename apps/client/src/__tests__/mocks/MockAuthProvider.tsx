import AuthProvider, { AuthContext } from '@/components/providers/AuthProvider';
import { AuthContextType } from '@repo/types';
import React from 'react';
import { mockCreateOTPMutation, mockSubmitSignUpMutation } from './mock-mutation';

type props = {
  /**
   *  A React {@link HTMLElement} or a Custom component
   */
  children: React.ReactNode;

  /**
   *  A Partial data of {@link AuthContextType}
   * @example
   *   <MockAuthProvider
        mockData={{
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
          update: mockData?.session?.update ?? (async () => {}),
        },
        logout: mockData?.logout ?? (async () => {}),
        login: mockData?.login ?? (async () => {}),
        signup: {
          submitSignUpFormMutation:
            mockData?.signup?.submitSignUpFormMutation ?? mockSubmitSignUpMutation(),
          createOTPMutation:
            mockData?.signup?.createOTPMutation ?? mockCreateOTPMutation(),
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// re-exported so a test can reach the real provider when it needs one
export { AuthProvider };
