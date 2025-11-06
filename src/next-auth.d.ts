import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string | number | null;
      id_card_no: string | null;
      selected_course_id: number | null;
      email: string | null;
      mobile: string | null;
      photo: string | null;
      modules: string | null;
      firstname: string | null;
      lastname: string | null;
      role: string | null;
      city_center: number | null;
      address: string | null;
      fcm_token: string | null;
      last_login_datetime: string | Date | null;
      name?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string | number;
    id_card_no?: string | null;
    selected_course_id?: number | null;
    email: string | null;
    mobile?: string | null;
    photo?: string | null;
    modules?: string | null;
    firstname?: string | null;
    lastname?: string | null;
    role: string | null;
    address?: string | null;
    fcm_token?: string | null;
    last_login_datetime?: string | Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string | number;
    id_card_no?: string | null;
    selected_course_id?: number | null;
    email?: string | null;
    mobile?: string | null;
    photo?: string | null;
    modules?: string | null;
    firstname?: string | null;
    lastname?: string | null;
    role?: string | null;
    address?: string | null;
    fcm_token?: string | null;
    last_login_datetime?: string | Date | null;
    name?: string | null;
  }
}