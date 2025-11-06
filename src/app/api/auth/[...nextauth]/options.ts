import logger from "@/lib/logger";
import { NextApiRequest } from "next";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const getHost = (req: NextApiRequest) => req.headers.host;

export const options: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {},
      async authorize(credentials: any, req: any) {
        const { otp, mobileNo } = credentials ?? {};
        try {
          const hostname = getHost(req);
          const dynamicAuthUrl = hostname?.startsWith("localhost")
            ? `http://${hostname}/api/verifyotp`
            : `https://${hostname}/api/verifyotp`;

          const response = await fetch(dynamicAuthUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ otp, mobileNo }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.log("NextAuth authorize - error response:", errorText);
            return null;
          }

          // Expect a user object from /api/verifyotp containing (at least) the fields you want
          const user = await response.json();
          console.log("NextAuth authorize - user data:", user);
          logger.info(`successfully loaded user: ${JSON.stringify(user)}`);

          return user; // returned as `user` in the first jwt() call
        } catch (error) {
          logger.error(`authorize error: ${error}`);
          console.error("Error in authorize function:", error);
          return null;
        }
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  jwt: {
    maxAge: 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
    error: "/error",
  },

  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return url;
    },

    async jwt({ token, user }) {
      // On initial sign-in
      if (user) {
        const u: any = user;
        console.log("🔑 NextAuth JWT - Received user data:", JSON.stringify(u, null, 2));
        // ── Store everything on the token (source of truth)
        token.id = u.id ?? token.id;
        token.id_card_no = u.id_card_no ?? token.id_card_no;
        token.email = u.email ?? token.email;
        token.mobile = u.mobile ?? u.phone ?? token.mobile; // keep as 'mobile' per your request
        token.photo = u.photo ?? u.profilePic ?? token.photo;
        token.modules = (u.modules ?? token.modules)?.toString?.() ?? "";
        token.firstname = u.firstname ?? token.firstname;
        token.lastname = u.lastname ?? token.lastname;
        token.role = u.role ?? token.role;
        token.address = u.address ?? token.address;
        token.selected_course_id = u.selected_course_id ?? token.selected_course_id;
        token.fcm_token = u.fcm_token ?? token.fcm_token;
        token.last_login_datetime = u.last_login_datetime ?? token.last_login_datetime;
        
        console.log("🔑 NextAuth JWT - Stored in token:", {
          id: token.id,
          email: token.email,
          mobile: token.mobile,
          firstname: token.firstname,
          lastname: token.lastname,
          role: token.role,
          modules: token.modules
        });
      }

      return token;
    },

    async session({ session, token }) {
      // Ensure object exists
      const s = (session as any);
      s.user = s.user ?? {};

      // ── Expose 1:1 from token to session.user
      s.user.id = token.id ?? null;
      s.user.id_card_no = token.id_card_no ?? null;
      s.user.email = token.email ?? null;
      s.user.mobile = token.mobile ?? null;            // <- 'mobile' as requested
      s.user.photo = token.photo ?? null;
      s.user.modules = token.modules ?? null;
      s.user.firstname = token.firstname ?? null;
      s.user.lastname = token.lastname ?? null;
      s.user.role = token.role ?? null;
      s.user.address = token.address ?? null;
      s.user.selected_course_id = token.selected_course_id ?? null;
      s.user.fcm_token = token.fcm_token ?? null;
      s.user.last_login_datetime = token.last_login_datetime ?? null;

      // Keep default NextAuth 'name' for convenience
      s.user.name = token.name ?? s.user.name ?? null;

      console.log("NextAuth SESSION - Exposing to client:", {
        id: s.user.id,
        email: s.user.email,
        mobile: s.user.mobile,
        firstname: s.user.firstname,
        lastname: s.user.lastname,
        role: s.user.role,
        modules: s.user.modules
      });

      return session;
    },
  },
};
