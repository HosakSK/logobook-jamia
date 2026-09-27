import { redirect } from "next/navigation";
import { DEFAULT_LOCALE } from "@/lib/i18n";

export default async function DefaultManualPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  redirect(`/manual/${domain}/${DEFAULT_LOCALE}`);
}
