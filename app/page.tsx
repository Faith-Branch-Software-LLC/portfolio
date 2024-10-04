import Image from "next/image";

export default function Home() {
  if (process.env.MVP === "true") {
    return (
      <div>
        <h1>MVP</h1>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold">This is the future home of Faith Branch Software LLC</h1>
        <Image src="/logo.svg" alt="Faith Branch Software LLC" width={100} height={100} className="w-1/2 h-1/2" />
      </div>
    );
  }
}
