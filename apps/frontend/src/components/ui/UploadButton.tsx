import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./dialog";
import { Button } from "./button";

const UploadButton = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) {
          setIsOpen(false);
        }
      }}
    >
      <DialogTrigger onClick={() => setIsOpen(true)} asChild>
        <Button variant={"blue"}>Upload Pdf</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>example</DialogTitle>
      </DialogContent>
    </Dialog>
  );
};

export default UploadButton;
