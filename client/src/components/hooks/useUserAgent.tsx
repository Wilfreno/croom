"use client";

import { useEffect, useState } from "react";

export default function useUserAgent() {
  const [on_mobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (navigator) {
      setIsMobile(
        /Mobi|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(
          navigator.userAgent
        )
      );
    }
  }, []);

  return {
    on_mobile,
  };
}
