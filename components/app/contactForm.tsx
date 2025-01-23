"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { MailIcon, PhoneIcon } from "lucide-react";
import { FaDiscord, FaLinkedin } from "react-icons/fa";
import { Separator } from "../ui/separator";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";
import { Form } from "../ui/form";
import { z } from "zod";
import GenericFormField from "../ui/GenericFormField";
import { Button } from "../ui/button";
import { sendContactEmail } from "@/lib/actions/email";
import { useToast } from "@/components/ui/use-toast"
import UnderlineLink from "../ui/underline-link";

const contactSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string()
    .min(10, "Phone number must be at least 10 characters long")
    .max(15, "Phone number can not be longer than 15 characters")
    .optional()
    .or(z.literal("")),
  message: z.string()
    .min(10, "Message must be at least 10 characters long")
    .max(1000, "Message must be less than 1000 characters long"),
});

export default function ContactForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof contactSchema>) {
    const result = await sendContactEmail(values.name, values.email, values.phone, values.message);
    
    if (result) {
      toast({
        variant: "default",
        title: "Email sent successfully!",
        description: "Thank you for contacting us! We will get back to you as soon as possible.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Email failed to send",
        description: "Please try again later.",
      });
    }
  }

  return (
    <Card className="min-w-fit">
      <CardHeader className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <UnderlineLink href="mailto:sneiswanger@faithbranch.com" icon={MailIcon} iconSize={24} color="black">
          sneiswanger@faithbranch.com
        </UnderlineLink>
        <UnderlineLink href="tel:+13309930338" icon={PhoneIcon} iconSize={24} color="black">
          (330) 993-0338
        </UnderlineLink>
        <UnderlineLink href="https://www.linkedin.com/in/sebastian-neiswanger/" icon={FaLinkedin} iconSize={24} color="black">
          in/sebastian-neiswanger
        </UnderlineLink>
        <UnderlineLink href="https://discordapp.com/users/Sebastian_Neiswanger" icon={FaDiscord} iconSize={24} color="black">
          @Sebastian_Neiswanger
        </UnderlineLink>
      </CardHeader>
      <CardContent>
        <Separator orientation="horizontal" className="mb-3" />
        <CardTitle>Contact Us</CardTitle>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <GenericFormField form={form} type="text" name={"name"} label={"Name"} placeholder={"Mr. Bean"} description={"Please enter your name"} required />
            <GenericFormField form={form} type="email" name={"email"} label={"Email"} placeholder={"me@place.com"} description={"Please enter your email"} required />
            <GenericFormField form={form} type="phone" name={"phone"} label={"Phone"} placeholder={"123-456-7890"} description={"Please enter your phone number"} />
            <GenericFormField form={form} type="textarea" name={"message"} label={"Message"} placeholder={"Please enter your message"} description={"Please enter your message"} required />
            <Button type="submit" className="w-fit">Submit</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}