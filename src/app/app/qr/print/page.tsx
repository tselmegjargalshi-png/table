import { PrintButton } from "@/components/app/print-button";
import { LogoMark } from "@/components/brand/logo";
import { requireStaffPage } from "@/lib/auth/guard";
import { listQrCodes } from "@/server/services/qr";

export const metadata = { title: "QR код хэвлэх" };

export default async function QrPrintPage() {
  const { restaurant } = await requireStaffPage();
  const codes = await listQrCodes(restaurant.id);
  return (
    <div className="min-h-dvh bg-paper">
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-6 py-3">
        <div>
          <p className="text-sm font-semibold">QR кодыг хэвлэх</p>
          <p className="text-xs text-stone">A5 хэмжээтэй, нэг хуудсанд нэг ширээ. Хэвлэх цонхонд «Margins: None» сонгоно уу.</p>
        </div>
        <PrintButton />
      </div>
      <div className="mx-auto grid max-w-5xl gap-6 p-6 print:block print:p-0">
        {codes.map((c) => (
          <section key={c.id} className="mx-auto flex aspect-[148/210] w-full max-w-[420px] flex-col items-center justify-between rounded-2xl border border-line bg-white p-9 text-center shadow-soft print:m-0 print:h-[210mm] print:w-[148mm] print:max-w-none print:break-after-page print:rounded-none print:border-0 print:shadow-none">
            <div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl font-serif text-xl font-semibold text-white" style={{ backgroundColor: restaurant.brandColor }}>{(restaurant.logoText ?? restaurant.name).slice(0, 2).toUpperCase()}</div>
              <p className="mt-4 font-serif text-2xl tracking-tight">{restaurant.name}</p>
            </div>
            <div>
              {c.table ? (
                <p className="mb-4 font-serif text-5xl font-semibold tracking-tight">Ширээ {c.table.number}</p>
              ) : (
                <p className="mb-4 font-serif text-3xl font-semibold tracking-tight">Цахим меню</p>
              )}
              <div className="mx-auto w-[210px] [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: c.svg }} />
              <p className="mt-5 text-lg font-medium">Меню харах, захиалах</p>
              <p className="mt-1 text-sm text-stone">Утсныхаа камерыг QR код руу чиглүүлнэ үү</p>
            </div>
            <p className="flex items-center gap-2 text-xs text-stone">
              <LogoMark size={16} /> TABLE.MN
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
