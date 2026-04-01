import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectMongo } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { EmailNotVerified } from "@/lib/auth-errors";

/**
 * @param {{ email: string; name?: string; image?: string }} params
 */
async function upsertGoogleUser({ email, name, image }) {
  const normalized = email.toLowerCase().trim();
  let user = await User.findOne({ email: normalized });
  if (!user) {
    return User.create({
      email: normalized,
      passwordHash: null,
      name: name || "",
      image: image || "",
      emailVerified: true,
    });
  }
  const patch = {};
  if (name && !user.name) patch.name = name;
  if (image && !user.image) patch.image = image;
  if (user.emailVerified !== true) patch.emailVerified = true;
  if (Object.keys(patch).length) await User.updateOne({ _id: user._id }, { $set: patch });
  return User.findById(user._id);
}

const providers = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;
      await connectMongo();
      const email = String(credentials.email).toLowerCase().trim();
      const user = await User.findOne({ email });
      if (!user?.passwordHash) return null;
      const ok = await bcrypt.compare(String(credentials.password), user.passwordHash);
      if (!ok) return null;
      if (user.emailVerified === false) throw new EmailNotVerified();
      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name || undefined,
        image: user.image || undefined,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  trustHost: true,
  pages: { signIn: "/login" },
  providers,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        if (!profile?.email || profile.email_verified === false) return false;
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        await connectMongo();
        const dbUser = await upsertGoogleUser({
          email: profile.email,
          name: typeof profile.name === "string" ? profile.name : "",
          image: typeof profile.picture === "string" ? profile.picture : "",
        });
        token.sub = dbUser._id.toString();
        token.email = dbUser.email;
        token.name = dbUser.name;
        token.picture = dbUser.image;
        return token;
      }
      if (account?.provider === "credentials" && user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        return token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        if (token.email) session.user.email = token.email;
        if (token.name) session.user.name = token.name;
        if (token.picture) session.user.image = token.picture;
      }
      return session;
    },
  },
});
