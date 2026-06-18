"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

type MarketingNavAuthProps = {
  children?: React.ReactNode;
};

export default function MarketingNavAuth({ children }: MarketingNavAuthProps) {
  return (
    <div className="nav-auth">
      <ThemeToggle className="theme-toggle" size={18} />
      {children ?? (
        <Link href="/dashboard" className="btn-register">
          Dashboard
        </Link>
      )}
    </div>
  );
}

export function MarketingNavAuthLinks({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  if (isAuthenticated) {
    return (
      <Link href="/dashboard" className="btn-register">
        Dashboard
      </Link>
    );
  }
  return (
    <>
      <Link href="/login" className="btn-login">
        Login
      </Link>
      <Link href="/register" className="btn-register">
        Explore
      </Link>
    </>
  );
}
