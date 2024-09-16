import UpdateAccountForm from "@/components/page/new/UpdateAccountForm";

  export default function Page() {
  return (
    <main className="grid grid-rows-[auto_1fr] gap-8 p-10 h-dvh w-screen">
      <div className="justify-self-center">
        <h1 className="text-xl font-bold">Setup your Account</h1>
        <h2 className="text-sm font-medium">Set up your new Account</h2>
      </div>
      <UpdateAccountForm />
    </main>
  );
}
