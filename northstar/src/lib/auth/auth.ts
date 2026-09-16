import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "../db/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "database" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await db.orm.User.where({ email }).first();
        if (!user) return null;

        const valid = await bcrypt.compare(password, (user as { passwordHash: string }).passwordHash);
        if (!valid) return null;

        return {
          id: user.id as string,
          email: user.email as string,
          name: user.name as string,
          role: user.role as never,
          organizationId: user.organizationId as string,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.organizationId = user.organizationId;
      }
      return session;
    },
  },
});
