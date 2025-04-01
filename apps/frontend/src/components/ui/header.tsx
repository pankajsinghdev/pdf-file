"use client";

import { redirect, useRouter } from "next/navigation";
import { Button } from "./button";
import { Logo } from "./logo";
import { ModeToggle } from "./theme-toggle";

const Header = () => {
  return (
    <div className="h-20 w-full absolute top-0 left-0 right-0 flex justify-center items-center">
      <div className="flex justify-between  items-center w-full h-full">
        <div
          role="button"
          className="cursor-pointer"
          onClick={() => redirect("/")}
        >
          <Logo />
        </div>

        <div className="flex gap-2 text-2xl items-center justify-center ">
          <Button className="font-semibold">Pricing</Button>
          <div className="flex justify-evenly gap-0">
            <Button
              onClick={() => {
                redirect("/login");
              }}
              className="cursor-pointer font-semibold"
            >
              Login
            </Button>
            <Button
              onClick={() => {
                redirect("/signup");
              }}
              className="cursor-pointer font-semibold"
            >
              SignUp
            </Button>
          </div>
          <ModeToggle />
        </div>
      </div>
    </div>
  );
};

export default Header;
