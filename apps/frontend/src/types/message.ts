import { AppRouter } from "@/trpc";
import { inferRouterOutputs } from "@trpc/server";
import { ReactElement } from "react";

type RouterOutput = inferRouterOutputs<AppRouter>;

type Messages = RouterOutput["getFileMessage"]["messages"];

type OmitText = Omit<Messages[number], "text">;

type ExtendedText = {
  text: string | ReactElement;
};

export type ExtendedMessage = OmitText & ExtendedText;
