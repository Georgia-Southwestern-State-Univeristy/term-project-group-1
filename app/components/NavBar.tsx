"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_LINKS = [
  { href: "/demo", label: "Demo" },
  { href: "/call", label: "Call" },
  { href: "/history", label: "History" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("token"));
  }, [pathname]);

  if (pathname === "/login") return null;

  function handleLogout() {
    localStorage.removeItem("token");
    document.cookie = "token=; Path=/; Max-Age=0";
    router.push("/login");
  }

  return (
    <nav className="flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-6">
        <span className="text-lg font-semibold">Sentinel</span>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-medium ${
              pathname === link.href
                ? "text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      {loggedIn && (
        <button
          onClick={handleLogout}
          className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
        >
          Logout
        </button>
      )}
    </nav>
  );
}
