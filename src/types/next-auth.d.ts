import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "player";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "admin" | "player";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: "admin" | "player";
  }
}
