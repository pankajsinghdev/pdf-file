import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { privateProcedure, publicProcedure, router } from "./trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@repo/db/client";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { bucket, generateSignedUrl } from "@/lib/storage";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { pinecone, pineconeIndex } from "@/lib/pinecone";
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-qyery";
import { RazorpayInstance } from "@/lib/razorpay";
import { Phone } from "lucide-react";

export const appRouter = router({
  authCallback: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
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

  getFileUploadStatus: privateProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { userId } = ctx;
      const file = await db.file.findFirst({
        where: {
          id: input.fileId,
          userId,
        },
      });
      if (!file) return { status: "PENDING" as const };
      return { status: file.uploadStatus };
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
      return { file };
    }),

  getFileMessage: privateProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        fileId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { fileId, cursor } = input;
      const limit = input.limit ?? INFINITE_QUERY_LIMIT;

      const file = await db.file.findFirst({
        where: {
          id: fileId,
          userId,
        },
      });
      if (!file) throw new TRPCError({ code: "NOT_FOUND" });

      const messages = await db.message.findMany({
        take: limit + 1,
        where: {
          fileId,
        },
        orderBy: {
          createdAt: "desc",
        },
        cursor: cursor ? { id: cursor } : undefined,
        select: {
          id: true,
          isUserMessage: true,
          createdAt: true,
          text: true,
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (messages.length > limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      return {
        messages,
        nextCursor,
      };
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
      // Create file record in database
      const file = await db.file.create({
        data: {
          name: input.name,
          key: fileName,
          userId,
          url: `https://storage.googleapis.com/${bucket.name}/${fileName}`,
          uploadStatus: "PROCESSING",
        },
      });

      return {
        signedUrl,
        fileId: file.id,
        fileName: file.key,
      };
    }),

  completeUpload: privateProcedure
    .input(
      z.object({
        fileId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;

      const file = await db.file.update({
        where: {
          id: input.fileId,
          userId,
        },
        data: {
          uploadStatus: "SUCCESS",
        },
      });
      return { file };
    }),

  processInPinecone: privateProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      try {
        const googleSignedURL = await generateSignedUrl(input.fileName);

        const response = await fetch(googleSignedURL);

        const blob = await response.blob();

        if (blob.type !== "application/pdf") {
          throw new TRPCError({ code: "BAD_REQUEST" });
        }

        const loader = new PDFLoader(blob);

        const pageLevelDocs = await loader.load();

        const pineconeIndex = pinecone.index("pdffileindex");

        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY,
        });
        // Create file record in database
        await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
          pineconeIndex,
          namespace: input.fileName,
        });

        await db.file.update({
          where: {
            id: input.fileId,
            userId,
          },
          data: {
            uploadStatus: "SUCCESS",
          },
        });
        return { success: true };
      } catch (err) {
        await db.file.update({
          where: {
            id: input.fileId,
            userId,
          },
          data: {
            uploadStatus: "FAILED",
          },
        });
        return { success: false };
      }
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

      // Delete from pinecone db
      await pineconeIndex.namespace(file.key).deleteAll();

      // Delete from database
      await db.file.delete({
        where: {
          id: input.id,
        },
      });

      return { success: true };
    }),

  paymentProvide: privateProcedure
    .input(
      z.object({
        amount: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const order = await RazorpayInstance.orders.create({
        amount: Number(input.amount * 100),
        currency: "INR",
      });

      const options = {
        key: process.env.RAZORPAY_API_KEY,
        amount: order.amount,
        currency: "INR",
        name:
          !user.given_name || !user.family_name
            ? "Your Account"
            : `${user.given_name} ${user.family_name}`,
        description: "Test Transaction",
        order_id: order.id,
        callback_url: "http://localhost:3000/dashboard",
        prefill: {
          email: user.email,
          phone: user.phone_number,
        },
        theme: {
          color: "#F37254",
        },
      };
      return { options };
    }),

  // createStripeSession: privateProcedure.mutation(async ({ ctx }) => {
  //   const { userId } = ctx;

  //   const billingURL = absoluteURL("/dashboard/billing");

  //   if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

  //   const dbUser = await db.user.findFirst({
  //     where: {
  //       id: userId,
  //     },
  //   });

  //   if (!dbUser) throw new TRPCError({ code: "UNAUTHORIZED" });

  //   const subscriptionsPlans = await getUserSubscriptionPlan();

  //   if (subscriptionsPlans.isSubscribed && dbUser.stripeCustomerId) {
  //     const stripeSession = await stripe.billingPortal.session.create({
  //       customer: dbUser.stripeCustomerId,
  //       return_url: billingURL,
  //     });

  //     return { url: stripeSession.url };
  //   }

  //   const stripeSession = await stripe.checkout.sessions.create({
  //     success_url: billingURL,
  //     cancel_url: billingURL,
  //     payment_method_types: ["card", "paypal"],
  //     mode: "subscription",
  //     billing_address_collection: "auto",
  //     line_items: [
  //       {
  //         price: PLANS.find((plan) => plan.name === "Pro")?.price.priceIds.test,
  //         quantity: 1,
  //       },
  //     ],
  //     metadata: {
  //       userId: userId,
  //     },
  //   });
  //   return {url :stripeSession.url}
  // }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
