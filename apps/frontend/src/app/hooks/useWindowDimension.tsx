"use client";

import { useEffect, useState } from "react";

const useWindowDimension = () => {
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWidth(window.innerWidth);

      const handleResize = () => {
        setWidth(window.innerWidth);
      };
      window.addEventListener("resize", handleResize);

      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  let windowSize: "small" | "mid" | "large";

  if (width < 768) {
    windowSize = "small";
  } else if (width > 768 && width < 1100) {
    windowSize = "mid";
  } else {
    windowSize = "large";
  }
  return windowSize;
};

export default useWindowDimension;
