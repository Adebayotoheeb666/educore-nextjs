import nodemailer from "nodemailer";

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM = process.env.SMTP_FROM ?? "Educore <noreply@educore.ng>";

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const transporter = createTransport();
  await transporter.sendMail({ from: FROM, to, subject, html });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
): Promise<void> {
  await sendEmail(
    to,
    "Reset your Educore password",
    `<div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#6A5ACD">Password Reset</h2>
      <p>Hi ${name},</p>
      <p>You requested a password reset. Click the button below to set a new password.
         This link expires in <strong>1 hour</strong>.</p>
      <p style="text-align:center;margin:2rem 0">
        <a href="${resetUrl}"
           style="background:#6A5ACD;color:white;padding:12px 28px;border-radius:8px;
                  text-decoration:none;font-weight:700;font-size:15px">
          Reset Password
        </a>
      </p>
      <p>If you didn't request this, ignore this email — your account is safe.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:2rem 0"/>
      <p style="font-size:12px;color:#888">Educore School Management System</p>
    </div>`
  );
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  role: string,
  defaultPassword?: string
): Promise<void> {
  await sendEmail(
    to,
    "Welcome to Educore",
    `<div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#6A5ACD">Welcome to Educore!</h2>
      <p>Hi ${name},</p>
      <p>Your <strong>${role.replace(/_/g, " ")}</strong> account has been created.</p>
      ${defaultPassword
        ? `<p>Your temporary password is: <strong style="font-size:18px;letter-spacing:2px">${defaultPassword}</strong></p>
           <p>Please change it after your first login.</p>`
        : ""}
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.educore.ng"}/login"
           style="background:#6A5ACD;color:white;padding:12px 28px;border-radius:8px;
                  text-decoration:none;font-weight:700">
          Login to Educore
        </a>
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:2rem 0"/>
      <p style="font-size:12px;color:#888">Educore School Management System</p>
    </div>`
  );
}
