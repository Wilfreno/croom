"use client";

import { useEffect, useState } from "react";

export default function useUserAgent() {
  const [is_mobile, setIsMobile] = useState(false);

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
    is_mobile,
  };
}
