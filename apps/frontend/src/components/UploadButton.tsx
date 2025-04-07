import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import DropZone, { FileWithPath } from "react-dropzone";
import { Cloud, File, Loader2 } from "lucide-react";
import { Progress } from "./ui/progress";
import { trpc } from "@/app/_trpc/client";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const UploadDropZone = ({ isOpen }: { isOpen: boolean }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file, setFile] = useState<FileWithPath | null>(null);
  const utils = trpc.useUtils();
  const router = useRouter();

  const { mutateAsync: startUpload } = trpc.uploadFile.useMutation();
  const { mutateAsync: processing } = trpc.processInPinecone.useMutation({
    onSuccess: () => {
      toast.success("PDF processed successfully", {
        position: "top-center",
        autoClose: 2000,
      });
    },
    onError: () => {
      toast.error("Error While Processing PDF, Please try again later ", {
        position: "top-center",
        autoClose: 2000,
      });
    },
  });
  const { mutateAsync: startPolling } = trpc.getFile.useMutation({
    onSuccess: ({ file }) => {
      router.push(`/dashboard/${file.id}`);
    },
    onError: () => {
      toast.error("Error while polling.  Please try again later", {
        position: "top-center",
        autoClose: 2000,
      });
    },
    retry: true,
    retryDelay: 300,
  });

  const startSimulatedProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 100);
    return interval;
  };

  const handleFileDrop = async (acceptedFiles: FileWithPath[]) => {
    if (!acceptedFiles[0]) return;

    const file = acceptedFiles[0];
    setFile(file);
    setIsUploading(true);

    const progressInterval = startSimulatedProgress();

    try {
      // Step 1: Get signed URL from backend
      const { signedUrl, fileId, fileName } = await startUpload({
        name: file.name,
        type: file.type,
        size: file.size,
      });

      // Step 2: Upload directly to GCS using the signed URL
      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        toast.error("Failed to upload PDF. Please try again later.", {
          position: "top-center",
          autoClose: 2000,
        });
      } else {
        setUploadProgress(100);
        //polling so that we can redirecting
        await startPolling({ id: fileId });
      }

      //processing in pinecone
      await processing({ fileName, fileId });

      // Invalidate cache to refresh file list
      utils.getUserFiles.invalidate();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error occured while uploading pdf",
        {
          position: "top-center",
          autoClose: 2000,
        }
      );
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
      if (!isOpen) setFile(null);

      if (isOpen) {
        setTimeout(() => setUploadProgress(0), 1000);
      }
    }
  };

  return (
    <DropZone
      multiple={false}
      accept={{ "application/pdf": [".pdf"] }}
      maxSize={4 * 1024 * 1024} // 4MB
      onDrop={handleFileDrop}
      onDropRejected={() => {
        toast.warning("PDF rejected", {
          position: "top-center",
          autoClose: 2000,
        });
      }}
      disabled={isUploading}
    >
      {({ getRootProps, getInputProps, acceptedFiles }) => (
        <div
          {...getRootProps()}
          className="border h-64 m-4 border-dashed border-gray-300 rounded-lg"
        >
          <div className="flex items-center justify-center h-full w-full">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-full rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 relative"
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 text-zinc-500 animate-spin mb-4" />
                    <p className="text-sm text-zinc-700 mb-2 max-w-60 truncate">
                      Uploading {file?.name}
                    </p>
                    <div className="w-full mt-4 max-w-xs mx-auto">
                      <Progress
                        value={uploadProgress}
                        className="h-2 w-full bg-zinc-200"
                        indicatorColor={
                          uploadProgress === 100 ? "bg-green-500" : ""
                        }
                      />
                      {uploadProgress === 100 ? (
                        <p className="flex-1 gap-1 items-center justify-center text-sm text-zinc-700 text-center pt-1">
                          <Loader2 className="h-3 w-3 animate-spin" />{" "}
                          Finalizing upload...
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Cloud className="h-6 w-6 text-zinc-500 mb-2" />
                    <p className="mb-2 text-sm text-zinc-700">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-zinc-500">PDF (up to 4MB)</p>
                  </div>

                  {acceptedFiles && acceptedFiles[0] && (
                    <div className="max-w-xs bg-white flex items-center rounded-md overflow-hidden outline-1 outline-zinc-200 divide-x divide-zinc-200">
                      <div className="px-3 py-2 h-full grid place-items-center">
                        <File className="h-4 w-4 text-primary" />
                      </div>
                      <div className="px-3 py-2 h-full text-sm truncate">
                        {acceptedFiles[0].name}
                      </div>
                      <button
                        type="button"
                        className="px-3 py-2 h-full grid place-items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                      ></button>
                    </div>
                  )}
                </>
              )}
            </label>
          </div>
        </div>
      )}
    </DropZone>
  );
};

const UploadButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) setIsOpen(false);
      }}
    >
      <DialogTrigger onClick={() => setIsOpen(true)} asChild>
        <Button variant="default">Upload PDF</Button>
      </DialogTrigger>
      <DialogContent
        className="bg-white sm:max-w-[425px]"
        aria-describedby={undefined}
      >
        <DialogTitle className="text-center mb-2">Upload PDF</DialogTitle>
        <UploadDropZone isOpen={isOpen} />
      </DialogContent>
    </Dialog>
  );
};

export default UploadButton;
