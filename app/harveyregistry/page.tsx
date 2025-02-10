import { ArrowRight, ChevronRight } from "lucide-react";
import Image from "next/image";
import { FaAmazon, FaBullseye } from "react-icons/fa";

export default function HarveyRegistry() {
  return (
    <div className="w-full bg-white h-full mt-52 md:mt-80 flex flex-col justify-center items-center relative">
      <Image 
        src="/mak_and_jo.jpeg" 
        alt="Harvey Registry" 
        width={300} 
        height={300} 
        className="object-top absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-[2/3] rounded-full w-2/3 md:w-96 border-[25px] border-white box-border" 
      />
      <h1 className="text-4xl md:text-6xl font-bold text-center z-10 -mt-16 md:-mt-0 font-sendFlowers leading-[1.1]">Makayla & Josiah <br /> <span className="text-4xl">Wedding Registries</span></h1>
      <Image src="/flower-sep.svg" alt="Flower Separator" width={300} height={300} className="w-3/4 md:w-1/2 my-2" />
      <RegistryLink href="https://www.amazon.com/wedding/registry/SVL6RG278P85?tag=wedch-995-20"><FaAmazon className="w-4 h-4 md:w-6 md:h-6" /> Amazon Registry</RegistryLink>
      <RegistryLink href="https://www.target.com/gift-registry/gift-giver?registryId=12ba1620-2145-11ef-8226-81af0ec493a8&type=WEDDING"><FaBullseye className="w-4 h-4 md:w-6 md:h-6" /> Target Registry</RegistryLink>

    </div>
  );
}

function RegistryLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <a href={href} className="flex items-center gap-2 mt-2 md:mt-4 border border-[#FF69B4] text-[#FF69B4] hover:bg-[#ff69b425] p-2 rounded-lg shadow-md text-xl font-sourGummy">
      {children}
      <ArrowRight className="w-4 h-4 md:w-6 md:h-6" />
    </a>
  );

}
