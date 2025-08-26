import { useAuth } from "@/context/AuthContext";
import { ReactNode } from "react";
import { useLocation } from "wouter";

export function AdminV2Layout({ children }: { children: ReactNode }) {
  const { logout, user } = useAuth();
  const [, setLocation] = useLocation();
  const isOwner = (user as any)?.isOwner === true;
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="h-14 shadow bg-white flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/assets/favicon.png"
            alt="Axix logo"
            className="h-8 w-8 rounded-full"
          />
          <h1 className="font-semibold flex items-center gap-2">
            Admin Panel
            {isOwner && (
              <span
                className="text-[10px] leading-none px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200"
                title="You are owner"
              >
                You are owner
              </span>
            )}
          </h1>
        </div>
        <nav className="flex gap-4 text-sm items-center">
          <a href="/adminv2/users" className="hover:underline">
            Users
          </a>
          <a href="/adminv2/deposits" className="hover:underline">
            Deposits
          </a>
          <a href="/adminv2/withdrawals" className="hover:underline">
            Withdrawals
          </a>
          <button
            onClick={async () => {
              await logout();
              setLocation("/login");
            }}
            className="ml-4 px-3 py-1 rounded bg-gray-900 text-white hover:bg-black"
            aria-label="Log out"
          >
            Logout
          </button>
        </nav>
      </header>
      <main className="flex-1 p-4 container mx-auto w-full max-w-7xl">
        {children}
      </main>
    </div>
  );
}

export default AdminV2Layout;
