import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
export const sendVerificationEmail = async (to, token) => {
    const verifyUrl = `${process.env.APP_URL}/api/auth/verify-email?token=${token}`;
    await transporter.sendMail({
        from: `"Devrecruit School" <${process.env.SMTP_USER}>`,
        to,
        subject: "DevrecruitSchool Verify your email",
        html: `
      <h1>Email Verification</h1>
      <p>Click the link below to verify your email:</p>
      <a href="${verifyUrl}">Verify Email</a>
    `,
    });
};
//# sourceMappingURL=email.js.map