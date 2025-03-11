"use client";

import { useEffect, useState } from "react";
/**
 * @param value value with `any` type
 * @param delay delay in `milliseconds`
 */
export default function useDebounce<T>(value: T, delay: number = 300) {
  const [debounced_value, setDebouncedValue] = useState<T>();

  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delay);

    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced_value;
}
