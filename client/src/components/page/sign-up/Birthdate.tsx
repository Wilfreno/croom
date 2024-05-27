import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@/lib/types/user-type";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

export default function Birthdate({
  user,
  setUser,
}: {
  user: User;
  setUser: Dispatch<SetStateAction<User>>;
}) {
  const [month, setMonth] = useState<number>();
  const [day, setDay] = useState<number>();
  const [year, setYear] = useState<number>();

  const month_list = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];

  useEffect(() => {
    if (year && month && day) {
      setUser((prev) => ({ ...prev, birth_date: new Date(year, month, day) }));
    }
  }, [year, month, day]);
  return (
    <div className="space-y-3">
      <p className="px-2 ">Date of Birth</p>
      <div className="flex space-x-2">
        <Select onValueChange={(value) => setYear(Number(value))}>
          <SelectTrigger>
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea>
              <SelectGroup>
                {Array.from({ length: 100 }).map((_, index) => (
                  <SelectItem key={index} value={String(index)} className="cursor-pointer">
                    {new Date().getFullYear() - index}
                  </SelectItem>
                ))}
              </SelectGroup>
            </ScrollArea>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) => setMonth(Number(value))}
          disabled={!year}
        >
          <SelectTrigger>
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea>
              <SelectGroup>
                {month_list.map((month, index) => (
                  <SelectItem
                    value={String(index + 1)}
                    className="cursor-pointer"
                    key={index}
                  >
                    {month.slice(0, 1).toUpperCase() + month.slice(1)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </ScrollArea>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) => setDay(Number(value))}
          disabled={!month}
        >
          <SelectTrigger>
            <SelectValue placeholder="Day" />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea>
              <SelectGroup>
                {Array.from({
                  length:
                    month === 2
                      ? year! % 4 === 0
                        ? 29
                        : 28
                      : month === 4 ||
                        month === 6 ||
                        month === 9 ||
                        month === 11
                      ? 30
                      : 31,
                }).map((_, index) => (
                  <SelectItem
                  key={index}
                    value={String(index + 1)}
                    className="cursor-pointer"
                  >
                    {index + 1}
                  </SelectItem>
                ))}
              </SelectGroup>
            </ScrollArea>
          </SelectContent>
        </Select>{" "}
      </div>
    </div>
  );
}
