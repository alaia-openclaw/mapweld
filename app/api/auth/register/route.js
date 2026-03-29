import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectMongo } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { sendVerificationEmail } from "@/lib/email";

const MIN_PASSWORD = 8;
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!email || !isValidEmail(email))
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    if (password.length < MIN_PASSWORD) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD} characters` },
        { status: 400 }
      );
    }

    await connectMongo();
    const existing = await User.findOne({ email });
    if (existing) {
      const message = existing.passwordHash
        ? "An account with this email already exists"
        : "This email is registered with Google. Sign in with Google instead.";
      return NextResponse.json({ error: message }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + VERIFICATION_TTL_MS);

    await User.create({
      email,
      passwordHash,
      name: name || "",
      emailVerified: false,
      verificationToken,
      verificationTokenExpires,
    });

    try {
      await sendVerificationEmail({ to: email, name: name || undefined, token: verificationToken });
    } catch (err) {
      console.error("Verification email failed", err);
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err.code === 11000)
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    console.error(err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
