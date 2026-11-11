import type { Metadata } from "next";
import { ProfileView } from "@/components/account/ProfileView";

export const metadata: Metadata = { title: "My details", robots: { index: false, follow: false } };

export default function ProfilePage() {
  return <ProfileView />;
}
