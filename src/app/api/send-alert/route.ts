import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, name, email } = body;

    // 1. Setup Gmail Transporter
    // NOTE: Requires GMAIL_APP_PASSWORD in .env.local
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'founder30minutesmarket@gmail.com', 
        pass: process.env.GMAIL_APP_PASSWORD,      
      },
    });

    // 2. Configure the Email
    const mailOptions = {
      from: '"Mission Control" <founder30minutesmarket@gmail.com>',
      to: 'founder30minutesmarket@gmail.com', // Sends to you
      subject: `🚨 ACTION REQUIRED: New ${type} Verification`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #0f172a;">New Verification Request</h2>
          <p><strong>Type:</strong> ${type}</p>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Applicant Email:</strong> ${email}</p>
          <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;" />
          <a href="https://30minutes.in/admin/verification" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Open Console to Approve
          </a>
        </div>
      `,
    };

    // 3. Send
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Email Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
