"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Button } from "@loreum/ui/button";
import { GoogleIcon } from "@/components/google-icon";
import { googleLoginUrl } from "@/lib/auth-urls";

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpInner />
    </Suspense>
  );
}

function SignUpInner() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return_to");

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <BookOpen className="h-8 w-8" />
          <h1>Create an account</h1>
          <p className="text-sm text-muted-foreground">
            Get started with Loreum
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
          Already have an account?{" "}
          <Link
            href={`/auth/signin${returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : ""}`}
            className="underline underline-offset-4 hover:text-foreground"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
