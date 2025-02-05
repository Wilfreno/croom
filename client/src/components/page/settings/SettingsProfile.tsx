"use client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import SettingsChangeDisplayname from "./profile/SettingsChangeDisplayname";
import SettingsChangeUserName from "./profile/SettingsChangeUserName";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import SettingsChangePhoto from "./profile/SettingsChangePhoto";

export default function SettingsProfile() {
  const [collapsible_is_open, setCollapsibleIsOpen] = useState(false);

  return (
    <Collapsible onOpenChange={setCollapsibleIsOpen} className="border-t overflow-hidden">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full h-auto rounded-none justify-between font-semibold text-xl py-4"
        >
          <span>Profile</span>
          {collapsible_is_open ? (
            <ChevronDown className="h-4 w-auto" />
          ) : (
            <ChevronRight className="h-4 w-auto" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-6 grid gap-4">
        <SettingsChangeDisplayname />
        <SettingsChangeUserName />
        <SettingsChangePhoto />
      </CollapsibleContent>
    </Collapsible>
  );
}
