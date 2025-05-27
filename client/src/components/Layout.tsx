import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <MobileNav />
    </>
  );
}
