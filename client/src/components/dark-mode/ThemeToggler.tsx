"use client";

import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

export function ThemeToggler() {
  const { setTheme, theme, systemTheme } = useTheme();
  const [is_light, setIsLight] = useState(systemTheme === "light");

  useEffect(() => {
    if (theme === "dark") {
      setIsLight(false);
    }
    if (theme === "light") {
      setIsLight(true);
    }
  }, [theme]);
  const SunIconMotion = motion(SunIcon);
  const MoonIconMotion = motion(MoonIcon);
  return (
    <Button
      variant="ghost"
      className="aspect-square w-10 h-auto p-2"
      onClick={() => {
        setIsLight((prev) => !prev);
        setTheme(is_light ? "dark" : "light");
      }}
    >
      <AnimatePresence mode="wait">
        {is_light ? (
          <SunIconMotion
            className="h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            key="sun"
          />
        ) : (
          <MoonIconMotion
            className="h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            key="moon"
          />
        )}
      </AnimatePresence>
    </Button>
  );
}
