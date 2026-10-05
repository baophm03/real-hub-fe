import { PublicHeader } from "@/components/layout/public/header";
import { PublicFooter } from "@/components/layout/public/footer";
import { Toaster } from "sonner";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="flex-1 pt-16">
        {children}
        <Toaster richColors />
      </main>
      <PublicFooter />
    </div>
  );
}
