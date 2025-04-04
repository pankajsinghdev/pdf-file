import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { privateProcedure, publicProcedure, router } from "./trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@repo/db/client";
import { z } from "zod";
import { Storage } from "@google-cloud/storage";
import { v4 as uuid } from "uuid";

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL,
    private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME as string);

export const appRouter = router({
  authCallback: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      console.log("UNAUTHORIZED");
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const dbUser = await db.user.findFirst({
      where: {
        id: user.id,
      },
    });
    if (!dbUser) {
      await db.user.create({
        data: {
          id: user.id,
          email: user.email,
        },
      });
    }
    return { success: true };
  }),

  getUserFiles: privateProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;
    return await db.file.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),

  getFile: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const file = await db.file.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!file) throw new TRPCError({ code: "NOT_FOUND" });
      return file;
    }),

  uploadFile: privateProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.string(),
        size: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;

      // Generate a unique filename
      const fileId = uuid();
      const extension = input.name.split(".").pop();
      const fileName = `${fileId}.${extension}`;

      // Create signed URL for direct upload
      const [signedUrl] = await bucket.file(fileName).getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: input.type,
      });
      console.log("signed url", signedUrl, "filename", fileName);
      // Create file record in database
      const file = await db.file.create({
        data: {
          name: input.name,
          key: fileName,
          userId,
          url: ` https://storage.googleapis.com/${bucket.name}/${fileName}`,
          uploadStatus: "PROCESSING",
        },
      });

      return {
        signedUrl,
        fileId: file.id,
      };
    }),

  completeUpload: privateProcedure
    .input(
      z.object({
        fileId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("start", input);
      const { userId } = ctx;
      console.log("completing", userId);

      const file = await db.file.update({
        where: {
          id: input.fileId,
          userId,
        },
        data: {
          uploadStatus: "SUCCESS",
        },
      });
      console.log("completed");
      return { file };
    }),

  deleteFile: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;

      const file = await db.file.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!file) throw new TRPCError({ code: "NOT_FOUND" });

      // Delete from Google Cloud Storage
      await bucket.file(file.key).delete();

      // Delete from database
      await db.file.delete({
        where: {
          id: input.id,
        },
      });

      return { success: true };
    }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
