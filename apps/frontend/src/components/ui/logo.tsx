"use client";

import useWindowDimension from "@/app/hooks/useWindowDimension";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

export const Logo = () => {
  const windowSize = useWindowDimension();

  const logoSize = () => {
    let size: number;
    if (windowSize === "small") {
      size = 30;
    } else if (windowSize === "mid") {
      size = 35;
    } else {
      size = 40;
    }
    return size;
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        windowSize === "small"
          ? "text-2xl"
          : windowSize === "mid"
            ? "text-3xl"
            : "text-5xl"
      )}
    >
      <FileText size={logoSize()} className="text-rose-500" />
      <span className="text-rose-500"> Pdf </span>
      <span>File</span>
    </div>
  );
};

export const LogoIcon = () => {
  return (
    <div>
      <FileText size={28} className="text-rose-500" />
    </div>
  );
};
