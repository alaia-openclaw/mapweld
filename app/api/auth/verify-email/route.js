import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { sendWelcomeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function baseUrl() {
  return (
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export async function GET(request) {
  const token = request.nextUrl.searchParams.get("token");
  const root = baseUrl();

  if (!token) {
    return NextResponse.redirect(`${root}/login?error=invalid_token`);
  }

  await connectMongo();
  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: new Date() },
  });

  if (!user) {
    return NextResponse.redirect(`${root}/login?error=invalid_token`);
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: { emailVerified: true },
      $unset: { verificationToken: 1, verificationTokenExpires: 1 },
    }
  );

  try {
    await sendWelcomeEmail({ to: user.email, name: user.name || undefined });
  } catch (e) {
    console.error("Welcome email after verify failed", e);
  }

  return NextResponse.redirect(`${root}/login?verified=1`);
}
