import { PlusIcon } from "@radix-ui/react-icons";
import { Button } from "../../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import NewRoomForm from "./NewRoomForm";

export default function CreateNewRoomButton() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="h-fit aspect-square p-2 bg-accent"
              >
                <PlusIcon className="h-5 " />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-center">
                  Create New Room
                </DialogTitle>
              </DialogHeader>
              <NewRoomForm />
            </DialogContent>
          </Dialog>
        </TooltipTrigger>
        <TooltipContent
          className="bg-secondary"
          side="right"
          align="start"
          alignOffset={-5}
        >
          <p className="text-primary">create a room</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
