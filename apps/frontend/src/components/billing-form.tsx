// "use client";

// import { trpc } from "@/app/_trpc/client";
// import { toast } from "react-toastify";
// import MaxWidthWrapper from "./max-width-wrapper";
// import {
//   Card,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "./ui/card";
// import { Button } from "./ui/button";
// import { Loader2 } from "lucide-react";

// // interface BillingFormProps {
// //   subscriptionPlan: Awaited<ReturnType<typeof getUserSubscriptionPlan>>;
// // }

// const BillingForm = ({ subscriptionPlan }: any) => {
//   // const {} = trpc.createStripeSession.useMutation({
//   //   onSuccess: ({ url }) => {
//   //     if (url) window.location.href = url;

//   //     if (!url) window.location.href = url;
//   //     if (!url) {
//   //       toast.error("There was a problem .Please try again later", {
//   //         position: "top-center",
//   //         autoClose: 2000,
//   //       });
//   //     }
//   //   },
//   // });

//   return (
//     <MaxWidthWrapper className="max-w-5xl">
//       <form className="mt-12" onSubmit={(e) => e.preventDefault}>
//         <Card>
//           <CardHeader>
//             <CardTitle>Subscription Plan</CardTitle>
//             <CardDescription>
//               You are currently on the <strong>{subscriptionPlan.name}</strong>
//             </CardDescription>
//           </CardHeader>
//           <CardFooter className="flex- flex-col items-start space-y-2 md:flex-row md:justify-between md:space-x-0 ">
//             <Button type="submit">
//               {/* {isLoading ? <Loader2 /> : null} */}
//               {subscriptionPlan.isSubscribed
//                 ? "Manage Subscription"
//                 : "Upgrade to Pro."}
//             </Button>
//           </CardFooter>
//         </Card>
//       </form>
//     </MaxWidthWrapper>
//   );
// };

// export default BillingForm;
