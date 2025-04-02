"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "../_trpc/client";
import { Loader2 } from "lucide-react";
import { Suspense, useEffect } from "react";

const AuthCallback = () => {
  return (
    <Suspense fallback={<div>Loading search parameters...</div>}>
      <SearchParamsComponent />
    </Suspense>
  );
};

const SearchParamsComponent = () => {
  const router = useRouter();

  const searchParams = useSearchParams();
  const origin = searchParams.get("origin");

  const { data, error } = trpc.authCallback.useQuery(undefined, {
    select: (data) => ({ success: data.success }),
    retry: false,
    retryDelay: 500,
  });

  useEffect(() => {
    console.log("error", error);
    if (error && error.data) {
      if (error.data.code === "UNAUTHORIZED") {
        router.push("/");
      }
    }

    if (data?.success) {
      router.push(origin ? `/${origin}` : `/dashboard`);
    }
  }, [data, error, origin, router]);

  return (
    <div className="w-full mt-24 flex justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-800" />
        <h1 className="font-semibold text-xl">Setting up your account...</h1>
        <p>You will be redirected automatically</p>
      </div>
    </div>
  );
};

export default AuthCallback;
