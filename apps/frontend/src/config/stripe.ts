export const PLANS = [
  {
    name: "Free",
    slug: "free",
    quota: 10,
    pagesPerPDf: 5,
    price: {
      amount: 0,
      priceIds: {
        test: "",
        production: "",
      },
    },
  },
  {
    name: "Pro",
    slug: "pro",
    quota: 50,
    pagesPerPDf: 25,
    price: {
      amount: 499,
      priceIds: {
        test: "", // skydo key
        production: "",
      },
    },
  },
];
