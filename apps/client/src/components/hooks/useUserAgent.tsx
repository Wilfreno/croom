"use client";

import { useEffect, useState } from "react";

export default function useUserAgent() {
  const [onMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (navigator) {
      if (
        /Mobi|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(
          navigator.userAgent
        )
      ) {
        setIsMobile(true);
      } else {
        setIsMobile(window.innerWidth < 768);
      }
    }
  }, []);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    onMobile,
  };
}
