import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (credentials.password === process.env.ADMIN_PASSWORD) {
          return { name: "admin", role: "admin" }; // هتتحفظ في jwt
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 أيام
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 7, // نفس المدة
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role; // ضيف role في jwt
      }
      return token;
    },
    async session({ session, token }) {
      session.role = token.role; // ضيف role في السيشن
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
