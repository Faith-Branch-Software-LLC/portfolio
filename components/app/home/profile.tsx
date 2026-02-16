import Image from "next/image";

/**
 * Displays a team member profile with image and description
 */
export default function Profile({
  imageUrl,
  name,
  description
}: {
  imageUrl: string,
  name: string,
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center text-white">
      <Image
        src={imageUrl}
        alt={name}
        width={1000}
        height={1000}
        className="w-1/4 aspect-square rounded-full shadow-card"
      />
      <div className="mt-5 flex flex-col items-center gap-2">
        <h3 className="text-3xl font-bold font-fraunces">{name}</h3>
        <p className="text-md font-gelasio max-w-prose text-center">
          {description}
        </p>
      </div>
    </div>
  );
}
