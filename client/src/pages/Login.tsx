import React from "react";
import { SignIn } from "@clerk/clerk-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { LegalLinks } from "@/pages/Legal";
import { Wordmark } from "@/components/common/Wordmark";

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) setLocation("/");
  }, [loading, isAuthenticated, setLocation]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 space-y-2 text-center">
          <h1>
            <Wordmark size="lg" />
          </h1>
          <p className="text-sm text-ink-2">ระบบบัญชีการเงินคริสตจักร</p>
        </div>

        {/* Clerk Sign-In component — handles all auth providers */}
        <SignIn
          routing="hash"
          signUpUrl="/register"
          fallbackRedirectUrl="/"
          forceRedirectUrl="/"
          appearance={{
            variables: {
              colorPrimary: "#a34a24",
              colorBackground: "#FFFDF8",
              borderRadius: "0.375rem",
              fontFamily: '"IBM Plex Sans Thai", sans-serif',
            },
          }}
        />
        <LegalLinks />
      </div>
    </div>
  );
}
