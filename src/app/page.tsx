import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ContactForm } from "@/components/marketing/contact-form";
import { HeroMockup } from "@/components/marketing/hero-mockup";
import { SiteHeader } from "@/components/marketing/site-header";
import { AnalyticsVisual, CrmVisual, DashboardVisual, FloorVisual, KdsVisual, OrderingVisual, QrMenuVisual, ReservationsVisual } from "@/components/marketing/visuals";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { appUrl } from "@/lib/urls";

export const metadata: Metadata = {
  title: { absolute: "TABLE.MN | Рестораны бизнесийг нэг дор" },
  alternates: { canonical: "/" },
};

const OVERVIEW: { icon: IconName; title: string; text: string }[] = [
  { icon: "qr", title: "QR меню", text: "Ширээ бүр өөрийн кодтой. Үйлчлүүлэгч апп суулгахгүйгээр меню үзэж захиална." },
  { icon: "receipt", title: "Онлайн захиалга", text: "Ширээн дээрээс, аваад явах, хүргэлт. Гурвыг нэг урсгалаар авна." },
  { icon: "flame", title: "Гал тогооны дэлгэц", text: "Шинэ захиалга шууд гал тогоонд очно. Цаасан тасалбар хэрэггүй." },
  { icon: "table", title: "Ширээний удирдлага", text: "Танхимын байрлал, ширээний төлөвийг нэг дэлгэцээс харна." },
  { icon: "calendar", title: "Урьдчилсан захиалга", text: "Ширээ захиалгыг цаг, хүний тоогоор бүртгэж, баталгаажуулна." },
  { icon: "chart", title: "Борлуулалтын тайлан", text: "Хамгийн их борлуулалттай хоол, ачаалалтай цагийг тоогоор харна." },
];

type Feature = { id: string; eyebrow: string; title: string; text: string; points: string[]; visual: React.ReactNode };
const FEATURES: Feature[] = [
  {
    id: "dashboard",
    eyebrow: "Хянах самбар",
    title: "Өнөөдөр юу болж байгааг нэг харцаар",
    text: "Борлуулалт, захиалгын тоо, дундаж чек, ширээний дүүрэлт, идэвхтэй захиалга зэрэг нь шууд шинэчлэгдэнэ. Менежер хэнээс ч асуухгүйгээр бодит байдлыг харна.",
    points: ["Өчигдөртэй харьцуулсан өөрчлөлт", "Идэвхтэй захиалга ба хүлээлтийн хугацаа", "Эзэмшигч, менежер, зөөгч, тогооч бүрт тусдаа эрх"],
    visual: <DashboardVisual />,
  },
  {
    id: "qr-menu",
    eyebrow: "QR меню",
    title: "Ширээнд суухад меню гар утсанд байна",
    text: "Үйлчлүүлэгч кодыг уншуулаад ангиллаар үзэж, хайж, хэмжээ болон нэмэлтээ сонгон захиалгаа өгнө. Ширээний дугаар захиалгад автоматаар орно.",
    points: ["Ангилал, хайлт, онцлох хоол", "Хэмжээ, нэмэлт, тайлбар, зураг", "Үнэ монгол төгрөгөөр, меню өөрчлөхөд шууд шинэчлэгдэнэ"],
    visual: <QrMenuVisual />,
  },
  {
    id: "ordering",
    eyebrow: "Онлайн захиалга",
    title: "Ширээнээс, аваад явахаар, хүргэлтээр",
    text: "Гурван төрлийн захиалгыг нэг урсгалаар авна. Үйлчлүүлэгч захиалгынхаа төлөвийг шууд харна: хүлээн авсан, бэлтгэж байна, бэлэн.",
    points: ["Үйлчилгээний хураамж, хүргэлтийн төлбөр автоматаар бодогдоно", "Ресторан захиалга хүлээн авахаа түр зогсоож болно", "Төлбөрийн үйлчилгээ нэмэх бэлэн бүтэцтэй"],
    visual: <OrderingVisual />,
  },
  {
    id: "kitchen",
    eyebrow: "Гал тогооны дэлгэц",
    title: "Цаасан тасалбаргүй гал тогоо",
    text: "Шинэ захиалга ШИНЭ багананд орж ирнэ. Тогооч нэг товшилтоор бэлтгэж эхэлж, бэлэн болгоно. Хугацаа хэтэрвэл тасалбар шар, улаан болж анхааруулна.",
    points: ["Холоос уншигдах том бичиг, харанхуй дэлгэц", "Хугацааны тоолуур ба яаралтай төлөв", "Шинэ захиалгад дуут мэдэгдэл асаах боломжтой"],
    visual: <KdsVisual />,
  },
  {
    id: "tables",
    eyebrow: "Ширээний удирдлага",
    title: "Танхимаа дэлгэц дээр харна",
    text: "Ширээг чирж, өөрийн танхимтай адил зохион байгуулна. Сул, захиалгатай, төлбөр хүлээж буй, цэвэрлэх ширээг өнгөөр нь ялгана.",
    points: ["Чөлөөтэй зохион байгуулалт", "Ширээ бүрийн идэвхтэй захиалга", "Нэг товчоор ширээг хааж, цэвэрлэгээнд шилжүүлнэ"],
    visual: <FloorVisual />,
  },
  {
    id: "reservations",
    eyebrow: "Урьдчилсан захиалга",
    title: "Ширээний захиалгыг дэвтэрт бичихээ больё",
    text: "Үйлчлүүлэгч меню хуудаснаас цаг, хүний тоогоо сонгон ширээ захиалж болно. Та баталгаажуулж, ширээ оноож, ирсэн эсэхийг тэмдэглэнэ.",
    points: ["Өнөөдөр, маргааш, долоо хоногоор шүүх", "Баталгаажуулах, цуцлах, ирсэн гэж тэмдэглэх", "Утасны дугаараар үйлчлүүлэгчийн түүхтэй холбогдоно"],
    visual: <ReservationsVisual />,
  },
  {
    id: "crm",
    eyebrow: "Үйлчлүүлэгчийн мэдээлэл",
    title: "Тогтмол зочдоо таньж, нэрээр нь угтаарай",
    text: "Захиалга өгсөн үйлчлүүлэгч утасны дугаараар автоматаар бүртгэгдэнэ. Зочилсон тоо, нийт зарцуулалт, дуртай хоолыг харж, тэмдэглэл үлдээнэ.",
    points: ["Хайлт, эрэмбэлэлт", "Захиалгын бүрэн түүх", "Харшил, дуртай суудал зэрэг тэмдэглэл"],
    visual: <CrmVisual />,
  },
  {
    id: "analytics",
    eyebrow: "Борлуулалтын тайлан",
    title: "Ямар хоол, ямар цагт ажиллаж байгааг мэд",
    text: "Борлуулалтын өөрчлөлт, цагийн ачаалал, гарагийн харьцуулалт, шилдэг хоол болон ангиллыг график, тоогоор харуулна. 7, 30, 90 хоногоор шүүнэ.",
    points: ["Цагийн ачаалал ба гарагаар нь харах", "Шилдэг бүтээгдэхүүн, ангилал", "Захиалгын төрлөөр хуваарилалт"],
    visual: <AnalyticsVisual />,
  },
];

const STEPS = [
  { n: "01", title: "Бүртгүүлж ресторанаа нэмнэ", text: "Нэр, хаяг, ажлын цагаа оруулна. Хэдхэн минут болно." },
  { n: "02", title: "Меню, ширээгээ оруулна", text: "Ангилал, хоол, үнэ, ширээний тоог нэмнэ. QR код өөрөө үүснэ." },
  { n: "03", title: "QR кодоо хэвлэж байрлуулна", text: "Ширээ бүрт тохирох кодыг хэвлэж тавьсан даруйд захиалга авч эхэлнэ." },
];

const PLANS = [
  {
    name: "Эхлэл",
    price: "Үнэгүй",
    unit: "14 хоногийн туршилт",
    text: "Системийг өөрийн рестораны өгөгдөл дээр туршиж үзэхэд.",
    items: ["QR меню ба онлайн захиалга", "10 хүртэлх ширээ", "Гал тогооны дэлгэц", "Үндсэн тайлан"],
    cta: "Үнэгүй эхлэх",
    href: "/register",
  },
  {
    name: "Стандарт",
    price: "89,000₮",
    unit: "сарын",
    text: "Нэг салбартай ресторан, кафед.",
    items: ["Бүх боломж, ширээний хязгааргүй", "Урьдчилсан захиалга", "Үйлчлүүлэгчийн мэдээлэл", "Дэлгэрэнгүй тайлан", "5 хүртэлх ажилтан"],
    cta: "Туршиж эхлэх",
    href: "/register",
    featured: true,
  },
  {
    name: "Сүлжээ",
    price: "Тохиролцоно",
    unit: "олон салбар",
    text: "Хэд хэдэн салбартай бизнесийн хэрэгцээнд.",
    items: ["Олон салбарын удирдлага", "Ажилтны хязгааргүй эрх", "Тусгай тохиргоо, нэгтгэл", "Хувийн дэмжлэг"],
    cta: "Холбоо барих",
    href: "#contact",
  },
];

const FAQ = [
  { q: "Үйлчлүүлэгч апп татаж авах шаардлагатай юу?", a: "Үгүй. Үйлчлүүлэгч ширээн дээрх QR кодыг утасныхаа камераар уншуулахад меню вэб хөтөч дээр шууд нээгдэнэ. Юу ч суулгах шаардлагагүй." },
  { q: "Гал тогооны дэлгэц ямар төхөөрөмж дээр ажилладаг вэ?", a: "Вэб хөтөч нээдэг дурын таблет, зөөврийн компьютер, телевиз дээр ажиллана. Тусгай техник хэрэгсэл худалдаж авах шаардлагагүй." },
  { q: "Одоо байгаа менюгээ яаж оруулах вэ?", a: "Бүртгүүлэх үед ангилал болон хоолоо шууд нэмнэ. Дараа нь меню удирдлагаас үнэ, тайлбар, зураг, хэмжээ, нэмэлтийг засаж, дарааллыг чирж өөрчилнө." },
  { q: "Төлбөрийг хэрхэн хүлээн авдаг вэ?", a: "Одоогоор бэлнээр болон картаар төлснийг кассанд тэмдэглэнэ. Онлайн төлбөрийн үйлчилгээ холбох бэлэн бүтэцтэй бөгөөд тусдаа тохиролцоогоор нэмнэ." },
  { q: "Өгөгдөл хэнд харагдах вэ?", a: "Таны рестораны мэдээллийг зөвхөн таны урьсан ажилтнууд харна. Ажилтан бүр өөрийн үүргийн хүрээнд хязгаарлагдсан эрхтэй байна." },
  { q: "Эхлэхэд тусламж авч болох уу?", a: "Болно. Доорх маягтаар хүсэлтээ илгээвэл манай баг утсаар эргэн холбогдож, эхний тохиргоог хамт хийнэ." },
];

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: "TABLE.MN", url: appUrl() },
      {
        "@type": "SoftwareApplication",
        name: "TABLE.MN",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: "Рестораны QR меню, онлайн захиалга, гал тогооны дэлгэц, ширээний удирдлага, тайлангийн платформ.",
        offers: { "@type": "Offer", price: "89000", priceCurrency: "MNT" },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
        Үндсэн агуулга руу очих
      </a>
      <SiteHeader />
      <main id="main">
        {/* ───── Hero ───── */}
        <section className="relative overflow-hidden">
          <div className="hairline-grid absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-6xl gap-14 px-5 pb-20 pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center lg:gap-10 lg:pb-28 lg:pt-20">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-3 py-1 text-xs text-charcoal">
                <span className="h-1.5 w-1.5 rounded-full bg-ember" /> Монголын ресторан, кафег зорилоо
              </p>
              <h1 className="mt-6 font-serif text-[2.6rem] leading-[1.06] tracking-[-0.03em] text-balance sm:text-6xl">Рестораны бизнесийг нэг дор.</h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone text-pretty">
                QR меню, онлайн захиалга, ширээний удирдлага, гал тогооны дэлгэц, урьдчилсан захиалга, үйлчлүүлэгчийн мэдээлэл болон борлуулалтын тайланг нэг системээс удирдаарай.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/register" size="lg" iconRight="arrowRight">
                  Үнэгүй туршиж үзэх
                </ButtonLink>
                <ButtonLink href="#how" size="lg" variant="secondary">
                  Хэрхэн ажилладаг вэ?
                </ButtonLink>
              </div>
              <p className="mt-5 text-sm text-stone">
                Бүртгэл үнэгүй, картын мэдээлэл шаардахгүй.{" "}
                <Link href="/r/hotyn-buuz" className="font-medium text-ink underline underline-offset-4">
                  Демо ресторан үзэх
                </Link>
              </p>
            </div>
            <HeroMockup />
          </div>
        </section>

        {/* ───── Overview ───── */}
        <section id="features" className="scroll-mt-20 border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-ember">Нэг систем</p>
              <h2 className="mt-3 font-serif text-4xl tracking-[-0.02em] text-balance sm:text-5xl">Рестораны бүх ажил хоорондоо холбогдсон.</h2>
              <p className="mt-5 text-lg leading-relaxed text-stone text-pretty">
                Захиалга авахаас тайлан гаргах хүртэл бүх ажил нэг дор. Ширээ, гал тогоо, меню, үйлчлүүлэгчийн мэдээлэл бие биетэйгээ холбогдсон тул дахин оруулах, давхар бичих шаардлагагүй.
              </p>
            </div>
            <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {OVERVIEW.map((o) => (
                <div key={o.title} className="bg-surface p-7">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-sand text-ink">
                    <Icon name={o.icon} size={20} />
                  </span>
                  <h3 className="mt-5 text-[17px] font-semibold">{o.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-stone">{o.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── Feature rows ───── */}
        <div className="mx-auto max-w-6xl space-y-24 px-5 py-24 lg:space-y-32 lg:py-32">
          {FEATURES.map((f, i) => (
            <section key={f.id} id={f.id} className="grid scroll-mt-24 items-center gap-10 lg:grid-cols-2 lg:gap-16" aria-labelledby={`${f.id}-title`}>
              <div className={cn(i % 2 === 1 && "lg:order-2")}>
                <p className="font-mono text-xs tracking-wider text-ember">
                  {String(i + 1).padStart(2, "0")} / {f.eyebrow.toUpperCase()}
                </p>
                <h2 id={`${f.id}-title`} className="mt-4 font-serif text-3xl tracking-[-0.02em] text-balance sm:text-4xl">
                  {f.title}
                </h2>
                <p className="mt-4 text-[17px] leading-relaxed text-stone text-pretty">{f.text}</p>
                <ul className="mt-6 space-y-3">
                  {f.points.map((p) => (
                    <li key={p} className="flex gap-3 text-[15px]">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                        <Icon name="check" size={12} />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={cn(i % 2 === 1 && "lg:order-1")}>{f.visual}</div>
            </section>
          ))}
        </div>

        {/* ───── How it works ───── */}
        <section id="how" className="scroll-mt-20 bg-ink text-paper">
          <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
            <p className="text-sm font-medium text-[#e0875f]">Хэрхэн ажилладаг вэ?</p>
            <h2 className="mt-3 max-w-2xl font-serif text-4xl tracking-[-0.02em] text-balance sm:text-5xl">Өнөөдөр бүртгүүлбэл өнөөдөр захиалга авна.</h2>
            <ol className="mt-14 grid gap-10 md:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="border-t border-white/15 pt-6">
                  <p className="font-mono text-sm text-[#e0875f]">{s.n}</p>
                  <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-paper/65">{s.text}</p>
                </li>
              ))}
            </ol>
            <div className="mt-14 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-serif text-xl">Эхлээд өөрөө турших уу?</p>
                <p className="mt-1 text-sm text-paper/60">«Хотын бууз» демо ресторанаар захиалга өгөөд, хянах самбар болон гал тогооны дэлгэцээс харна уу.</p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <ButtonLink href="/r/hotyn-buuz" variant="secondary" className="!border-transparent">
                  Демо меню
                </ButtonLink>
                <ButtonLink href="/login" variant="secondary" className="!border-transparent">
                  Демо самбар
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>

        {/* ───── Pricing ───── */}
        <section id="pricing" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-ember">Үнэ</p>
              <h2 className="mt-3 font-serif text-4xl tracking-[-0.02em] text-balance sm:text-5xl">Ил тод, энгийн үнэ.</h2>
              <p className="mt-5 text-lg text-stone">Нууц хураамж, захиалга бүрийн шимтгэл байхгүй. Сар бүр нэг тогтмол төлбөр.</p>
            </div>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {PLANS.map((p) => (
                <div key={p.name} className={cn("flex flex-col rounded-2xl border p-7", p.featured ? "border-ink bg-surface shadow-raised" : "border-line bg-surface")}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{p.name}</h3>
                    {p.featured ? <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs text-paper">Түгээмэл</span> : null}
                  </div>
                  <p className="mt-5 font-serif text-4xl tracking-tight">{p.price}</p>
                  <p className="text-sm text-stone">{p.unit}</p>
                  <p className="mt-4 text-[15px] text-stone">{p.text}</p>
                  <ul className="mt-6 flex-1 space-y-3 border-t border-line pt-6">
                    {p.items.map((it) => (
                      <li key={it} className="flex gap-3 text-[15px]">
                        <Icon name="check" size={16} className="mt-1 shrink-0 text-success" />
                        {it}
                      </li>
                    ))}
                  </ul>
                  <ButtonLink href={p.href} size="lg" variant={p.featured ? "primary" : "secondary"} className="mt-8 w-full">
                    {p.cta}
                  </ButtonLink>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-stone-light">Эцсийн үнийг гэрээгээр тохирно.</p>
          </div>
        </section>

        {/* ───── FAQ ───── */}
        <section id="faq" className="scroll-mt-20 border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[1fr_1.6fr] lg:py-28">
            <div>
              <p className="text-sm font-medium text-ember">Түгээмэл асуулт</p>
              <h2 className="mt-3 font-serif text-4xl tracking-[-0.02em] text-balance">Таны асуулт энд байж магадгүй.</h2>
              <p className="mt-4 text-stone">
                Хариу олдохгүй бол{" "}
                <a href="#contact" className="font-medium text-ink underline underline-offset-4">
                  бидэнд бичээрэй
                </a>
                .
              </p>
            </div>
            <div className="divide-y divide-line border-y border-line">
              {FAQ.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left text-[17px] font-medium [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <Icon name="plus" size={20} className="mt-0.5 shrink-0 text-stone transition-transform duration-200 group-open:rotate-45" />
                  </summary>
                  <p className="mt-3 max-w-xl leading-relaxed text-stone">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ───── Contact ───── */}
        <section id="contact" className="scroll-mt-20">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[1fr_1.2fr] lg:py-28">
            <div>
              <p className="text-sm font-medium text-ember">Холбоо барих</p>
              <h2 className="mt-3 font-serif text-4xl tracking-[-0.02em] text-balance sm:text-5xl">Рестораныхаа тухай ярилцъя.</h2>
              <p className="mt-5 max-w-md text-lg text-stone">Хүсэлтээ үлдээвэл манай баг таны утсаар эргэн холбогдож, демог танилцуулна.</p>
              <ul className="mt-8 space-y-3 text-[15px]">
                <li className="flex items-center gap-3">
                  <Icon name="clock" size={18} className="text-stone" />
                  <span>Ажлын өдөр 09:00 - 18:00</span>
                </li>
                <li className="flex items-center gap-3">
                  <Icon name="pin" size={18} className="text-stone" />
                  <span>Улаанбаатар хот</span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
              <ContactForm />
            </div>
          </div>
        </section>

        {/* ───── CTA ───── */}
        <section className="px-5 pb-20 lg:pb-28">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-ember px-8 py-16 text-center text-white sm:px-16">
            <div className="hairline-grid absolute inset-0 opacity-20 invert" aria-hidden="true" />
            <h2 className="relative mx-auto max-w-2xl font-serif text-4xl tracking-[-0.02em] text-balance sm:text-5xl">Захиалгаа дэвтэр, утаснаас гаргаж, нэг системд оруулъя.</h2>
            <p className="relative mx-auto mt-5 max-w-lg text-white/80">14 хоногийн туршилт үнэгүй. Хэдхэн минутын дотор менюгээ оруулж, QR кодоо хэвлэнэ.</p>
            <div className="relative mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/register" size="lg" variant="secondary" iconRight="arrowRight" className="!border-transparent !text-ink">
                Үнэгүй туршиж үзэх
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone">Монголын ресторан, кафег зорилсон захиалга, ширээ, гал тогоо, тайлангийн нэгдсэн систем.</p>
          </div>
          <FooterCol title="Бүтээгдэхүүн" links={[["Боломжууд", "#features"], ["Хэрхэн ажилладаг", "#how"], ["Үнэ", "#pricing"], ["Демо меню", "/r/hotyn-buuz"]]} />
          <FooterCol title="Компани" links={[["Түгээмэл асуулт", "#faq"], ["Холбоо барих", "#contact"]]} />
          <FooterCol title="Бүртгэл" links={[["Нэвтрэх", "/login"], ["Ресторан бүртгүүлэх", "/register"], ["Нууц үг сэргээх", "/forgot-password"]]} />
        </div>
        <div className="border-t border-line">
          <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-stone-light">© {new Date().getFullYear()} TABLE.MN. Бүх эрх хуулиар хамгаалагдсан.</p>
        </div>
      </footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm text-stone">
        {links.map(([l, h]) => (
          <li key={l}>
            {h.startsWith("/") ? (
              <Link href={h} className="hover:text-ink">
                {l}
              </Link>
            ) : (
              <a href={h} className="hover:text-ink">
                {l}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
