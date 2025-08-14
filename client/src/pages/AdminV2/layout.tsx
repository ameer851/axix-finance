import { ReactNode } from "react";

export function AdminV2Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="h-14 shadow bg-white flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/assets/favicon.png"
            alt="Axix logo"
            className="h-8 w-8 rounded-full"
          />
          <h1 className="font-semibold">Admin Panel v2</h1>
        </div>
        <nav className="flex gap-4 text-sm">
          <a href="/adminv2/users" className="hover:underline">
            Users
          </a>
          <a href="/adminv2/deposits" className="hover:underline">
            Deposits
          </a>
          <a href="/adminv2/withdrawals" className="hover:underline">
            Withdrawals
          </a>
        </nav>
      </header>
      <main className="flex-1 p-4 container mx-auto w-full max-w-7xl">
        {children}
      </main>
    </div>
  );
}

export default AdminV2Layout;
