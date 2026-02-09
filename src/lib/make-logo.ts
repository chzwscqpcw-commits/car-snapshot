const MAKE_TO_FILE: Record<string, string> = {
  audi: "audi",
  bmw: "bmw",
  citroen: "citroen",
  dacia: "dacia",
  fiat: "fiat",
  ford: "ford",
  honda: "honda",
  hyundai: "hyundai",
  jaguar: "jaguar",
  kia: "kia",
  "land rover": "land-rover",
  "land-rover": "land-rover",
  landrover: "land-rover",
  mazda: "mazda",
  "mercedes-benz": "mercedes-benz",
  mercedes: "mercedes-benz",
  mg: "mg",
  mini: "mini",
  nissan: "nissan",
  peugeot: "peugeot",
  porsche: "porsche",
  renault: "renault",
  seat: "seat",
  skoda: "skoda",
  subaru: "subaru",
  suzuki: "suzuki",
  tesla: "tesla",
  toyota: "toyota",
  vauxhall: "vauxhall",
  volkswagen: "volkswagen",
  vw: "volkswagen",
  volvo: "volvo",
};

export function getMakeLogoPath(make?: string): string | null {
  if (!make) return null;
  const key = make.toLowerCase().trim();
  const file = MAKE_TO_FILE[key];
  return file ? `/logos/${file}.svg` : null;
}
