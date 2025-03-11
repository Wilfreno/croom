"use client";
import React, { Suspense } from "react";
import SignupEmailInput from "./SignupEmailInput";
import SignupUsernameInput from "./SignupUsernameInput";
import SignupDisplaynameInput from "./SignupDisplaynameInput";
import SignupPasswordInput from "./SignupPasswordInput";
import SignUpDialog from "./SignUpDialog";
import SignupNavigateToLoginPage from "./SignupNavigateToLoginPage";

export default function SignUpForm() {
  return (
    <section className="grid gap-12">
      <form data-testid="signup-form" className="grid gap-8" autoComplete="off">
        <div className="grid gap-4">
          <SignupEmailInput />
          <SignupUsernameInput />
          <SignupDisplaynameInput />
          <SignupPasswordInput />
        </div>
        <SignUpDialog />
      </form>
      <Suspense>
        <SignupNavigateToLoginPage />
      </Suspense>
    </section>
  );
}
