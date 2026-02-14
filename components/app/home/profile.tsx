import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex flex-col items-center justify-center max-w-lg">
      <Image 
        src={imageUrl} 
        alt={name} 
        width={1000} 
        height={1000} 
        className="w-40 md:w-52 aspect-square rounded-full shadow-card" 
      />
      <Card className="mt-5">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl md:text-3xl font-bold font-fraunces">{name}</CardTitle>
          <p className="text-sm font-gelasio text-black/60">Founder &amp; Lead Developer</p>
        </CardHeader>
        <CardContent>
          <p className="font-gelasio max-w-prose leading-relaxed text-center">
            {description}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
