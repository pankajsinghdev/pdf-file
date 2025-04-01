import { LucideCopyright } from "lucide-react";

const Footer = () => {
  return (
    <div className="absolute bottom-0 left-0 right-0">
      <div className="flex justify-center items-center">
        <div className="flex gap-2 font-bold">
          Copyright <LucideCopyright />
          <span> 2025</span>
        </div>
      </div>
    </div>
  );
};

export default Footer;
