"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.ReSendKey);

export async function sendEmail(email: string, subject: string, message: string) {
  const {data, error} = await resend.emails.send({
    from: "sneiswanger@faithbranch.com",
    to: email,
    subject: subject,
    html: message,
  });

  if (error) {
    console.error(error);
    throw new Error("Failed to send email");
  }

  return data;
}

export async function sendContactEmail(name: string, email: string, phone: string | undefined, message: string) {
  const HTMLmessage = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600&family=Gelasio&display=swap');
          body { 
            font-family: 'Gelasio', Georgia, serif; 
            line-height: 1.6; 
            color: #2E294E; 
            background-color: #FFFFFF;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            padding: 20px; 
          }
          .header { 
            background-color: #1B998B; 
            padding: 20px; 
            border-radius: 5px;
            color: #FFFFFF;
          }
          .header h2 {
            font-family: 'Fraunces', Georgia, serif;
            margin: 0;
            font-weight: 600;
          }
          .content { 
            margin-top: 20px; 
            background-color: #FFFFFF;
            padding: 20px;
            border: 1px solid #D9D9D9;
            border-radius: 5px;
          }
          .field { 
            margin-bottom: 20px; 
            padding-bottom: 15px;
            border-bottom: 1px solid #D9D9D9;
          }
          .field:last-of-type { 
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
          }
          .label { 
            font-family: 'Fraunces', Georgia, serif;
            font-weight: bold; 
            color: #F46036;
          }
          .message-content {
            margin-top: 10px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 3px;
          }
        </style>
        <meta charset="UTF-8">
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Contact Form Submission</h2>
          </div>
          <div class="content">
            <div class="field">
              <span class="label">Name:</span> ${name}
            </div>
            <div class="field">
              <span class="label">Email:</span> ${email}
            </div>
            <div class="field">
              <span class="label">Phone:</span> ${phone || "N/A"}
            </div>
            <div class="field">
              <span class="label">Message:</span>
              <div class="message-content">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail("sneiswanger@faithbranch.com", "Website Contact Form Submission", HTMLmessage);
}
