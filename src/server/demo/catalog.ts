// "ХОТЫН БУУЗ" бол зохиомол демо ресторан. Бодит бизнестэй холбоогүй.

export type DemoOption = { kind: "OPTION" | "ADDON"; groupName?: string; name: string; priceDelta: number; isDefault?: boolean };
export type DemoItem = {
  name: string;
  description: string;
  price: number;
  artKey: string;
  weight: number;
  ingredients?: string[];
  options?: DemoOption[];
  popular?: boolean;
  featured?: boolean;
  available?: boolean;
  prep?: number;
};
export type DemoCategory = { name: string; description?: string; items: DemoItem[] };

const tea: DemoOption = { kind: "ADDON", name: "Сүүтэй цай (аяга)", priceDelta: 3500 };

export const DEMO_MENU: DemoCategory[] = [
  {
    name: "Бууз",
    description: "Өдөр бүр гараар чимхэж, уураар жигнэнэ.",
    items: [
      {
        name: "Бууз",
        description: "Гар хийцийн уламжлалт бууз, үхэр хонины холимог махтай.",
        price: 18000,
        artKey: "buuz",
        weight: 30,
        popular: true,
        featured: true,
        prep: 14,
        ingredients: ["Сонгино", "Сармис", "Хар перец"],
        options: [
          { kind: "OPTION", groupName: "Хэмжээ", name: "6 ширхэг", priceDelta: 0, isDefault: true },
          { kind: "OPTION", groupName: "Хэмжээ", name: "10 ширхэг", priceDelta: 11000 },
          { kind: "ADDON", name: "Байцааны салат", priceDelta: 3000 },
          tea,
        ],
      },
      {
        name: "Хонины махтай бууз",
        description: "Зөвхөн хонины мах, сонгино, давс. Илүү шүүслэг.",
        price: 21000,
        artKey: "buuz",
        weight: 12,
        prep: 15,
        ingredients: ["Сонгино", "Хар перец"],
        options: [
          { kind: "OPTION", groupName: "Хэмжээ", name: "6 ширхэг", priceDelta: 0, isDefault: true },
          { kind: "OPTION", groupName: "Хэмжээ", name: "10 ширхэг", priceDelta: 13000 },
          tea,
        ],
      },
      {
        name: "Ногоотой бууз",
        description: "Байцаа, лууван, мөөг, төмстэй цагаан хоолтны бууз.",
        price: 16000,
        artKey: "buuz",
        weight: 6,
        prep: 13,
        ingredients: ["Мөөг", "Сармис"],
      },
      {
        name: "Хуушуур",
        description: "Шинэхэн шарсан, шаржигнуур хальстай. 3 ширхэг.",
        price: 16500,
        artKey: "khuushuur",
        weight: 14,
        popular: true,
        prep: 10,
        ingredients: ["Сонгино", "Хар перец"],
        options: [{ kind: "ADDON", name: "Нэмэлт 1 ширхэг", priceDelta: 5000 }, tea],
      },
      {
        name: "Шарсан банш",
        description: "Тосонд шарсан жижиг банш, шар буурцгийн соустай.",
        price: 15000,
        artKey: "bansh",
        weight: 6,
        prep: 9,
      },
    ],
  },
  {
    name: "Шөл",
    description: "Ясан шөлөн дээр удаан чанасан.",
    items: [
      { name: "Банштай шөл", description: "Гар хийцийн банш, ногоо, тунгалаг ясан шөл.", price: 16000, artKey: "soup", weight: 11, popular: true, prep: 10, ingredients: ["Ногоон сонгино", "Хар перец"] },
      { name: "Гурилтай шөл", description: "Гар гурил, үхрийн мах, төмс, лууван.", price: 15500, artKey: "noodleSoup", weight: 9, prep: 10, ingredients: ["Ногоон сонгино"] },
      { name: "Бантан", description: "Хэрчсэн махтай, зөөлөн гурилан шөл. Өглөөний хамгийн тохиромжтой сонголт.", price: 9500, artKey: "soup", weight: 4, prep: 7 },
      { name: "Борщ", description: "Улаан манжин, байцаа, үхрийн мах, цөцгий.", price: 15000, artKey: "borscht", weight: 4, prep: 8, ingredients: ["Цөцгий"] },
    ],
  },
  {
    name: "Үндсэн хоол",
    description: "Гал дээр шууд бэлтгэнэ.",
    items: [
      {
        name: "Цуйван",
        description: "Гар гурил, үхрийн мах, байцаа, лууван, хуурсан сонгино.",
        price: 22000,
        artKey: "tsuivan",
        weight: 26,
        popular: true,
        featured: true,
        prep: 16,
        ingredients: ["Сонгино", "Сармис", "Байцаа"],
        options: [
          { kind: "OPTION", groupName: "Хэмжээ", name: "Энгийн", priceDelta: 0, isDefault: true },
          { kind: "OPTION", groupName: "Хэмжээ", name: "Том", priceDelta: 6000 },
          { kind: "ADDON", name: "Хайруулын өндөг", priceDelta: 2500 },
          { kind: "ADDON", name: "Нэмэлт мах", priceDelta: 6000 },
        ],
      },
      { name: "Будаатай хуурга", description: "Үхрийн мах, ногоо, жигнэсэн будаа.", price: 21000, artKey: "rice", weight: 10, prep: 14, options: [{ kind: "ADDON", name: "Хайруулын өндөг", priceDelta: 2500 }] },
      { name: "Гуляш", description: "Удаан шатаасан үхрийн мах, будаа эсвэл пюре.", price: 23500, artKey: "goulash", weight: 8, prep: 12, options: [
        { kind: "OPTION", groupName: "Гарнир", name: "Будаа", priceDelta: 0, isDefault: true },
        { kind: "OPTION", groupName: "Гарнир", name: "Төмсний пюре", priceDelta: 1500 },
      ] },
      { name: "Хонины шорлог", description: "Нүүрсэн дээр шарсан хонины мах, шарсан ногоо.", price: 32000, artKey: "grill", weight: 6, featured: true, prep: 20 },
      { name: "Хорхог (2 хүний)", description: "Чулуугаар болгосон хонины мах, төмс, лууван. 40 минутын өмнө захиална уу.", price: 68000, artKey: "khorkhog", weight: 2, prep: 40 },
      { name: "Шарсан будаа", description: "Өндөг, ногоо, хиамтай хуурсан будаа.", price: 18500, artKey: "rice", weight: 7, prep: 10, ingredients: ["Ногоон сонгино", "Хиам"] },
    ],
  },
  {
    name: "Салат",
    items: [
      { name: "Төмсний салат", description: "Төмс, өргөст хэмх, лууван, майонез.", price: 9000, artKey: "salad", weight: 8, prep: 4 },
      { name: "Ногоон салат", description: "Улирлын навч, улаан лооль, өргөст хэмх, чидун жимсний тос.", price: 12500, artKey: "salad", weight: 5, prep: 5, ingredients: ["Улаан сонгино", "Чидун"] },
      { name: "Байцааны салат", description: "Шинэхэн байцаа, лууван, цууны амтлагч.", price: 7500, artKey: "salad", weight: 7, prep: 3 },
      { name: "Үхрийн махтай салат", description: "Чанасан үхрийн мах, өргөст хэмх, кунжут, шар буурцгийн амтлагч.", price: 16000, artKey: "salad", weight: 4, prep: 6, ingredients: ["Кунжут", "Сармис"] },
    ],
  },
  {
    name: "Өглөөний цай",
    description: "Өдөр бүр 08:00-11:00 цагт.",
    items: [
      { name: "Өглөөний багц", description: "3 бууз, байцааны салат, сүүтэй цай.", price: 14500, artKey: "breakfast", weight: 9, prep: 10 },
      { name: "Омлет", description: "3 өндөг, сүү, бяслаг, шарсан талх.", price: 12000, artKey: "omelette", weight: 5, prep: 8, ingredients: ["Бяслаг", "Ногоон сонгино"] },
      { name: "Боорцог, өрөм", description: "Гэрийн боорцог, шинэ өрөм, зөгийн бал.", price: 9000, artKey: "boortsog", weight: 4, prep: 3 },
    ],
  },
  {
    name: "Амттан",
    items: [
      { name: "Чацарганатай чизкейк", description: "Зөөлөн чизкейк, чацарганын соус.", price: 13000, artKey: "cake", weight: 5, featured: true, prep: 2 },
      { name: "Цагаан идээний таваг", description: "Ааруул, ээзгий, өрөм, боорцог.", price: 14000, artKey: "dairy", weight: 3, prep: 3 },
      { name: "Зөгийн балтай боорцог", description: "Шинэхэн шарсан боорцог, хар зөгийн бал.", price: 8000, artKey: "boortsog", weight: 4, prep: 4 },
    ],
  },
  {
    name: "Ундаа",
    items: [
      { name: "Сүүтэй цай", description: "Уламжлалт давстай сүүтэй цай. Аяга.", price: 3500, artKey: "milkTea", weight: 22, popular: true, prep: 1, options: [
        { kind: "OPTION", groupName: "Хэмжээ", name: "Аяга", priceDelta: 0, isDefault: true },
        { kind: "OPTION", groupName: "Хэмжээ", name: "Сав (1 л)", priceDelta: 8500 },
      ] },
      { name: "Чацарганын шүүс", description: "Шинэ чацарганаар гаргасан, бага чихэртэй.", price: 7000, artKey: "juice", weight: 8, prep: 2 },
      { name: "Кола", description: "0.33 л лаазтай.", price: 4000, artKey: "soda", weight: 12, prep: 1 },
      { name: "Айраг", description: "Улирлын чанартай. Зуны саруудад.", price: 8000, artKey: "airag", weight: 0, available: false, prep: 1 },
      { name: "Рашаан ус", description: "0.5 л хийжүүлээгүй.", price: 2500, artKey: "water", weight: 7, prep: 1 },
    ],
  },
  {
    name: "Кофе",
    items: [
      { name: "Американо", description: "Давхар эспрессо, халуун ус.", price: 7000, artKey: "coffee", weight: 7, prep: 3, options: [
        { kind: "OPTION", groupName: "Хэмжээ", name: "Дунд", priceDelta: 0, isDefault: true },
        { kind: "OPTION", groupName: "Хэмжээ", name: "Том", priceDelta: 1500 },
      ] },
      {
        name: "Латте",
        description: "Давхар эспрессо, хөөсөрүүлсэн сүү.",
        price: 9000,
        artKey: "latte",
        weight: 13,
        popular: true,
        prep: 4,
        options: [
          { kind: "OPTION", groupName: "Хэмжээ", name: "Дунд", priceDelta: 0, isDefault: true },
          { kind: "OPTION", groupName: "Хэмжээ", name: "Том", priceDelta: 2000 },
          { kind: "OPTION", groupName: "Сүү", name: "Үнээний сүү", priceDelta: 0, isDefault: true },
          { kind: "OPTION", groupName: "Сүү", name: "Овъёосны сүү", priceDelta: 1500 },
          { kind: "ADDON", name: "Нэмэлт эспрессо", priceDelta: 2000 },
          { kind: "ADDON", name: "Ваниль сироп", priceDelta: 1500 },
        ],
      },
      { name: "Капучино", description: "Эспрессо, өтгөн сүүн хөөс.", price: 9000, artKey: "latte", weight: 7, prep: 4 },
      { name: "Флэт уайт", description: "Давхар ристретто, нимгэн сүүн хөөс.", price: 9500, artKey: "latte", weight: 4, prep: 4 },
      { name: "Хүйтэн латте", description: "Мөстэй, давхар эспрессо, сүү.", price: 10000, artKey: "iced", weight: 5, prep: 3 },
    ],
  },
];

export const DEMO_TABLES: Array<{ number: number; seats: number; zone: string; shape: "ROUND" | "SQUARE" | "RECT"; posX: number; posY: number }> = [
  { number: 1, seats: 2, zone: "Цонхны эгнээ", shape: "SQUARE", posX: 8, posY: 14 },
  { number: 2, seats: 2, zone: "Цонхны эгнээ", shape: "SQUARE", posX: 8, posY: 38 },
  { number: 3, seats: 2, zone: "Цонхны эгнээ", shape: "SQUARE", posX: 8, posY: 62 },
  { number: 4, seats: 4, zone: "Цонхны эгнээ", shape: "SQUARE", posX: 8, posY: 86 },
  { number: 5, seats: 4, zone: "Үндсэн танхим", shape: "ROUND", posX: 32, posY: 22 },
  { number: 6, seats: 4, zone: "Үндсэн танхим", shape: "ROUND", posX: 52, posY: 22 },
  { number: 7, seats: 4, zone: "Үндсэн танхим", shape: "ROUND", posX: 72, posY: 22 },
  { number: 8, seats: 6, zone: "Үндсэн танхим", shape: "RECT", posX: 34, posY: 54 },
  { number: 9, seats: 6, zone: "Үндсэн танхим", shape: "RECT", posX: 60, posY: 54 },
  { number: 10, seats: 4, zone: "Үндсэн танхим", shape: "ROUND", posX: 32, posY: 84 },
  { number: 11, seats: 4, zone: "Үндсэн танхим", shape: "ROUND", posX: 52, posY: 84 },
  { number: 12, seats: 4, zone: "Үндсэн танхим", shape: "ROUND", posX: 72, posY: 84 },
  { number: 13, seats: 8, zone: "VIP өрөө", shape: "RECT", posX: 91, posY: 34 },
  { number: 14, seats: 10, zone: "VIP өрөө", shape: "RECT", posX: 91, posY: 72 },
];

export const FIRST_NAMES = [
  "Бат", "Сараа", "Тэмүүлэн", "Номин", "Ану", "Билгүүн", "Энхжин", "Мөнх-Эрдэнэ", "Солонго", "Тэлмэн",
  "Ганзориг", "Оюунаа", "Хулан", "Батбаяр", "Амараа", "Мишээл", "Түвшин", "Уянга", "Дөлгөөн", "Энхтуул",
  "Ариунаа", "Бямбаа", "Золбоо", "Цэцэг", "Наран", "Ундрах", "Мөнхзул", "Дэлгэр", "Гэрэлмаа", "Ерөөлт",
  "Халиун", "Чингүүн", "Отгонбаяр", "Сувд", "Тэргэл", "Анхбаяр", "Нандин", "Төгөлдөр", "Марал", "Баярмаа",
  "Энэрэл", "Сэлэнгэ", "Хонгор", "Лхагва", "Ганаа", "Пүрэв", "Оргил", "Сарнай", "Мандах", "Есүй",
];

export const REVIEW_COMMENTS = [
  "Бууз нь үнэхээр шүүслэг, үйлчилгээ хурдан байлаа.",
  "QR-аар захиалах маш амар байсан. Хоол 15 минутад ирсэн.",
  "Цуйван нь гэрийнх шиг амттай. Дахин ирнэ.",
  "Ширээгээ урьдчилан захиалсан тул хүлээлгүй суусан.",
  "Латте нь сайхан, гэхдээ оргил цагаар бага зэрэг удаж байсан.",
  "Гэр бүлээрээ ирэхэд VIP өрөө тохилог байсан.",
];

export const RESERVATION_NOTES = [
  "Төрсөн өдөр, бялуу авчирна.",
  "Цонхны дэргэд суух хүсэлттэй.",
  "Хүүхдийн сандал хэрэгтэй.",
  "Ажлын уулзалт, чимээгүй ширээ.",
  null,
  null,
  null,
];
