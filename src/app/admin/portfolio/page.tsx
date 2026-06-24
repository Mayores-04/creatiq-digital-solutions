import { redirect } from "next/navigation";

export default function LegacyPortfolioPage() {
  redirect("/admin/projects");
}
