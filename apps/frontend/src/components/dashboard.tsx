"use client";

import { trpc } from "@/app/_trpc/client";
import UploadButton from "./UploadButton";
import { Ghost, Loader2, MessageSquare, Plus, Trash } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "./ui/button";
import { useState } from "react";
import { toast } from "react-toastify";

const Dashboard = () => {
  const [currentlyDeletingFile, setCurrentlyDeletingFile] = useState<
    string | null
  >(null);
  const { data, isLoading } = trpc.getUserFiles.useQuery();

  const utils = trpc.useUtils();

  const { mutate: deleteFile } = trpc.deleteFile.useMutation({
    onSuccess: () => {
      utils.getUserFiles.invalidate();
      toast.success("Deleted", {
        position: "top-center",
      });
    },
    onMutate: ({ id }) => {
      setCurrentlyDeletingFile(id);
    },
    onSettled() {
      setCurrentlyDeletingFile(null);
    },
  });

  return (
    <main className="mx-auto max-w-7xl md:p-10 p-2">
      <div className="mt-8 flex flex-col items-start justify-between gap-4 border-b border-gray-300 pb-5 sm:flex-row sm:items-center sm:gap-0">
        <h1 className="mb-3 font-bold text-5xl text-gray-900">My data</h1>
        <UploadButton />
      </div>

      {/* {display user flies} */}

      {data && data.length !== 0 ? (
        <ul
          className="
        mt-8 grid grid-cols-1 gap-6 divide-y divide-zinc-200 md:grid-cols-2 lg:grid-cols-3"
        >
          {data
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .map((file) => (
              <li
                key={file.id}
                className="col-span-1 divide-y divide-gray-200  rounded-lg shadow transition hover:shadow-lg"
              >
                <Link
                  href={`/dashboard/${file.id}`}
                  className="flex flex-col gap-2 items-center justify-center"
                >
                  <div className="py-6 px-6 flex w-full items-center justify-center space-x-6 ">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                    <div className="flex-1 truncate">
                      <div className="flex items-center space-x-3">
                        <h3 className="truncate text-lg font-medium text-zinc-900">
                          {file.name}
                        </h3>
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="px-6 mt-4 grid grid-cols-3 place-items-center py-2 gap-6 text-xs test-zinc-500">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />{" "}
                    {format(new Date(file.createdAt), "MMM yyyy")}{" "}
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> mocked
                  </div>
                  <Button
                    onClick={() => deleteFile({ id: file.id })}
                    size={"sm"}
                    className="w-full"
                    variant={"red"}
                  >
                    {currentlyDeletingFile === file.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </li>
            ))}
        </ul>
      ) : isLoading ? (
        <div>
          <Skeleton height={100} className="my-2" count={3} />
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center gap-2">
          <Ghost className="h-8 w-8 text-zinc-800" />
          <h3 className="font-semibold text-xl">Pretty Empty around here</h3>
          <p>Lets upload your first PDF.</p>
        </div>
      )}
    </main>
  );
};

export default Dashboard;
