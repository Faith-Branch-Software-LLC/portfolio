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
    <div className="flex flex-col items-center justify-center">
      <Image 
        src={imageUrl} 
        alt={name} 
        width={1000} 
        height={1000} 
        className="w-1/4 aspect-square rounded-full shadow-card" 
      />
      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-fraunces">{name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-md font-gelasio max-w-prose">
            {description}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}