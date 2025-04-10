"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { trpc } from "@/app/_trpc/client";

const UpgradeButton = () => {
  const { mutateAsync: createOrder } = trpc.paymentProvide.useMutation({
    onSuccess: ({ options }) => {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    },
  });

  const handleClick = async () => {
    createOrder({
      amount: 499,
    });
  };

  return (
    <>
      <Button onClick={handleClick} className="w-full">
        Upgrade now <ArrowRight className="h-5 w-5 ml-1.5" />
      </Button>
    </>
  );
};

export default UpgradeButton;
