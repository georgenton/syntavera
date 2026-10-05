import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getContactChannelStatus } from "@/modules/contact/status.server";

export const dynamic = "force-dynamic";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const channel = getContactChannelStatus();
  return (
    <>
      <SiteHeader contactAvailable={channel.available} />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </>
  );
}
