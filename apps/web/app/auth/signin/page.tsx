"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@loreum/ui/button";
import { BookOpen } from "lucide-react";
import { googleLoginUrl } from "@/lib/auth-urls";
import { GoogleIcon } from "@/components/google-icon";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}

function SignInInner() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return_to");
  const connecting = returnTo?.startsWith("/authorize");

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <BookOpen className="h-8 w-8" />
          <h1>Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            {connecting
              ? "Sign in to connect your AI assistant to Loreum"
              : "Sign in to your Loreum account"}
          </p>
        </div>

        <div className="space-y-3">
          <a href={googleLoginUrl(returnTo)}>
            <Button variant="outline" className="w-full gap-2">
              <GoogleIcon />
              Continue with Google
            </Button>
          </a>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href={`/auth/signup${returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : ""}`}
            className="underline underline-offset-4 hover:text-foreground"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
