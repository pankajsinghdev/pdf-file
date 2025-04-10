import { RazorpayInstance } from "@/lib/razorpay";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  const { id: userId } = user;
  if (!userId) return new Response("Unauthorized", { status: 400 });

  const order = await RazorpayInstance.orders.create({
    amount: body.amount,
    currency: "INR",
    receipt: randomUUID(),
  });
  return order;
};

export const RAZORPAY_BASE_URL = "https://api.razorpay.com";
