import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Expand, Loader2, X } from "lucide-react";
import SimpleBar from "simplebar-react";
import { Document, Page } from "react-pdf";
import { toast } from "react-toastify";
import { useResizeDetector } from "react-resize-detector";
import { DialogTitle } from "@radix-ui/react-dialog";

interface PdfFullScreenProps {
  fileUrl: string;
}

const PdfFullScreen = ({ fileUrl }: PdfFullScreenProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [numPages, setNumPages] = useState<number>(1);
  const { width, ref } = useResizeDetector();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button aria-label="fullscreen" variant="ghost" className="gap-1.5">
          <Expand className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] w-screen max-h-[90vh] min-w-2/4 h-full bg-white ">
        {/* <div className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
          <X
            className="h-4 w-4 cursor-pointer"
            onClick={() => setIsOpen(false)}
          />
          <span className="sr-only">Close</span>
        </div> */}
        <DialogTitle title="component" />

        <SimpleBar
          autoHide={false}
          className="max-h-[calc(100vh-9rem)] mt-2  min-w-2/4"
        >
          <div ref={ref} className="flex justify-center">
            <Document
              loading={
                <div className="flex justify-center">
                  <Loader2 className="my-24 h-6 w-6 animate-spin" />
                </div>
              }
              onLoadError={() => {
                toast.error("Error Loading PDF", {
                  position: "top-center",
                  autoClose: 2000,
                });
              }}
              file={fileUrl}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              className="max-h-full"
            >
              {new Array(numPages).fill(0).map((_, i) => (
                <Page
                  key={i}
                  width={width ? Math.min(width, 1200) : 1}
                  renderTextLayer={false}
                  pageNumber={i + 1}
                  className="border border-border shadow-sm"
                />
              ))}
            </Document>
          </div>
        </SimpleBar>
      </DialogContent>
    </Dialog>
  );
};

export default PdfFullScreen;
