// Curated make/model "Did you know?" trivia — POC starter set.
//
// Keys are NORMALISED "MAKE|MODEL" (uppercase, matched against the expanded
// lookupModel, with MERCEDES→MERCEDES BENZ / VW→VOLKSWAGEN / LANDROVER→LAND ROVER
// aliases applied in model-facts.ts). makeTrivia is the make-level fallback.
//
// Facts are hand-curated and deliberately conservative (widely-known heritage,
// records, production milestones). Before scaling this list, run a
// fact-generation + adversarial-verification pass — a wrong "fact" on a public
// page is a brand risk.

export const modelTrivia: Record<string, string[]> = {
  "FORD|FIESTA": [
    "The Ford Fiesta was Britain's best-selling car for over a decade before production ended in 2023.",
    "Launched in 1976, more than 4.8 million Fiestas were sold in the UK across seven generations.",
    "The Fiesta name was chosen personally by Henry Ford II.",
  ],
  "FORD|FOCUS": [
    "The Ford Focus replaced the long-running Escort in 1998 and quickly became a UK best-seller.",
    "Ford confirmed the Focus will end production in 2025 as it shifts towards electric models.",
    "The hot Focus RS and ST became cult performance hatchbacks.",
  ],
  "FORD|PUMA": [
    "The modern Ford Puma revived a name first used on a sporty 1990s coupe.",
    "It has been one of Britain's best-selling new cars since launching in 2019.",
  ],
  "VAUXHALL|CORSA": [
    "The Corsa was sold as the Vauxhall Nova in the UK until 1993.",
    "It was Britain's best-selling new car in both 2021 and 2022.",
    "Now in its sixth generation, the Corsa is also sold as a fully electric model.",
  ],
  "VAUXHALL|ASTRA": [
    "The Astra was built at Vauxhall's Ellesmere Port plant in Cheshire for decades.",
    "It first appeared in 1979, replacing the Vauxhall Viva.",
  ],
  "VOLKSWAGEN|GOLF": [
    "The VW Golf has been in production since 1974 — over 35 million have been built worldwide.",
    "The original Golf was styled by Italian designer Giorgetto Giugiaro.",
    "The Golf GTI, launched in 1976, helped create the 'hot hatch' class.",
  ],
  "VOLKSWAGEN|POLO": [
    "The VW Polo has been on sale since 1975, sitting just below the Golf in VW's range.",
    "Early Polos were closely related to the Audi 50.",
  ],
  "NISSAN|QASHQAI": [
    "The Nissan Qashqai is built in Sunderland and helped kick-start the UK's crossover boom when it launched in 2007.",
    "It's one of the best-selling cars ever made in Britain.",
  ],
  "FIAT|500": [
    "The original Fiat 500 — the 'Cinquecento' — launched in 1957; the modern 500 arrived in 2007 to mark its 50th anniversary.",
    "The all-electric Fiat 500e is built in Turin, Italy.",
  ],
  "BMW|3 SERIES": [
    "The BMW 3 Series has been the brand's best-selling model since it launched in 1975.",
    "More than 16 million 3 Series have been sold across seven generations.",
  ],
  "MERCEDES BENZ|C CLASS": [
    "The Mercedes C-Class replaced the 190 — the original 'Baby Benz' — in 1993.",
    "It's one of Mercedes-Benz's best-selling models worldwide.",
  ],
  "AUDI|A3": [
    "The Audi A3 launched in 1996 and brought premium branding to the compact hatchback class.",
    "It shares much of its engineering with the VW Golf.",
  ],
  "AUDI|A4": [
    "The Audi A4 replaced the Audi 80 in 1994.",
    "The high-performance RS4 is one of Audi's most celebrated fast estates.",
  ],
  "TOYOTA|YARIS": [
    "The Toyota Yaris was European Car of the Year in 2000 and again in 2021.",
    "It's regularly among the most reliable small cars on UK roads.",
  ],
  "TOYOTA|COROLLA": [
    "The Toyota Corolla is the best-selling car nameplate in history, with over 50 million sold since 1966.",
  ],
  "TOYOTA|PRIUS": [
    "The Toyota Prius was the world's first mass-produced hybrid car, launched in Japan in 1997.",
  ],
  "LAND ROVER|DEFENDER": [
    "The original Land Rover — later the Defender — was in production from 1948 to 2016.",
    "Its shape was reportedly first sketched in the sand on a beach in Anglesey.",
  ],
  "HONDA|CIVIC": [
    "The Honda Civic has been in production since 1972.",
    "The Civic Type R is regarded as one of the great hot hatchbacks.",
  ],
  "MAZDA|MX-5": [
    "The Mazda MX-5 is the best-selling two-seat sports car in history, with over a million built.",
    "It holds a Guinness World Record as the best-selling roadster.",
  ],
  "RENAULT|CLIO": [
    "The Renault Clio has been a European best-seller since 1990 and was twice European Car of the Year.",
    "Its 1990s 'Papa and Nicole' adverts became a British TV phenomenon.",
  ],
  "PEUGEOT|208": [
    "The Peugeot 208 was European Car of the Year in 2020.",
    "The all-electric e-208 shares its body with the petrol model.",
  ],
  "TESLA|MODEL 3": [
    "The Tesla Model 3 is one of the best-selling electric cars of all time.",
  ],
  "TESLA|MODEL Y": [
    "The Tesla Model Y was the world's best-selling car of any kind in 2023.",
  ],
  "PORSCHE|911": [
    "The Porsche 911 has been in continuous production since 1963.",
    "Its rear-engine layout has stayed a constant for over 60 years.",
  ],
  "VOLKSWAGEN|BEETLE": [
    "The original VW Beetle was produced for over 65 years, with more than 21 million built — one of the best-selling cars of all time.",
    "Its design traces back to Ferdinand Porsche in the 1930s.",
  ],
  "VOLKSWAGEN|TIGUAN": [
    "The Tiguan is one of Volkswagen's best-selling models worldwide.",
    "Its name blends the German words for 'tiger' and 'iguana'.",
  ],
  "FORD|MONDEO": [
    "'Mondeo Man' became 1990s shorthand for the average British voter.",
    "The Mondeo replaced the Sierra in 1993; UK sales ended in 2022.",
  ],
  "FORD|MUSTANG": [
    "The Ford Mustang, launched in 1964, created the 'pony car' class and is one of the best-selling sports cars ever.",
  ],
  "NISSAN|LEAF": [
    "The Nissan Leaf, launched in 2010, was the first mass-market electric car — and was built in Sunderland for Europe.",
  ],
  "NISSAN|MICRA": [
    "The Nissan Micra won European Car of the Year in 1993 — the first Japanese car to take the title.",
  ],
  "NISSAN|JUKE": [
    "The Nissan Juke's bold, divisive styling made it a surprise hit and helped spark the small-crossover craze.",
  ],
  "LAND ROVER|RANGE ROVER": [
    "The Range Rover, launched in 1970, effectively created the luxury SUV.",
    "An early Range Rover was once exhibited at the Louvre as an example of industrial design.",
  ],
  "LAND ROVER|DISCOVERY": [
    "The Land Rover Discovery arrived in 1989 to sit between the rugged Defender and the luxury Range Rover.",
  ],
  "BMW|5 SERIES": [
    "The BMW 5 Series, launched in 1972, was the first BMW to use the now-familiar 'Series' naming.",
  ],
  "BMW|X5": [
    "The BMW X5, launched in 1999, was the brand's very first SUV.",
  ],
  "MERCEDES BENZ|A CLASS": [
    "The first Mercedes A-Class (1997) famously tipped over in the Swedish 'moose test', prompting a swift redesign.",
  ],
  "AUDI|TT": [
    "The Audi TT's distinctive rounded design made it an instant icon when it launched in 1998.",
  ],
  "TOYOTA|RAV4": [
    "The Toyota RAV4 (1994) helped create the compact-SUV class — its name stands for 'Recreational Active Vehicle with 4-wheel drive'.",
  ],
  "HONDA|JAZZ": [
    "The Honda Jazz is loved for its clever folding 'Magic Seats' and strong reliability record.",
  ],
  "HONDA|CR-V": [
    "The Honda CR-V is one of the best-selling SUVs in the world.",
  ],
  "PEUGEOT|205": [
    "The Peugeot 205 (1983) is often credited with saving the company — and the 205 GTI is a hot-hatch legend.",
  ],
  "PEUGEOT|3008": [
    "The Peugeot 3008 was named European Car of the Year in 2017.",
  ],
  "CITROEN|2CV": [
    "The Citroën 2CV was designed to carry farmers across fields without breaking the eggs — and stayed in production for 42 years.",
  ],
  "FIAT|PANDA": [
    "The Fiat Panda has been a European city-car staple since 1980.",
  ],
  "RENAULT|MEGANE": [
    "The Renault Mégane's 'shake that ass' advert became a 2000s pop-culture moment in Britain.",
  ],
  "RENAULT|ZOE": [
    "The Renault Zoe was one of Europe's best-selling electric cars throughout the 2010s.",
  ],
  "SUZUKI|JIMNY": [
    "The tiny Suzuki Jimny has a cult following as a genuinely capable off-roader.",
  ],
  "TESLA|MODEL S": [
    "The Tesla Model S (2012) was the car that proved an electric car could be genuinely desirable and fast.",
  ],
  "MINI|COOPER": [
    "The Mini Cooper name honours John Cooper, whose tuned Minis won the Monte Carlo Rally in the 1960s.",
  ],
};

export const makeTrivia: Record<string, string[]> = {
  "FORD": ["Ford is the UK's most popular car brand, with over 4 million cars on British roads."],
  "VAUXHALL": ["Vauxhall is one of Britain's oldest carmakers, with roots going back to a London engineering firm founded in 1857."],
  "VOLKSWAGEN": ["'Volkswagen' means 'people's car' in German."],
  "BMW": ["BMW started out building aircraft engines in 1916."],
  "AUDI": ["The name 'Audi' is a Latin translation of founder August Horch's surname — it means 'listen'."],
  "MERCEDES BENZ": ["Mercedes-Benz traces its roots to Karl Benz, who built the first petrol-powered car in 1886."],
  "TOYOTA": ["Toyota is the world's largest carmaker by volume."],
  "HONDA": ["Honda is the world's largest manufacturer of engines — it makes far more than just cars."],
  "NISSAN": ["Nissan's Sunderland plant is one of the largest car factories in the UK."],
  "FIAT": ["'Fiat' stands for Fabbrica Italiana Automobili Torino."],
  "RENAULT": ["Renault, founded in 1899, is one of France's oldest carmakers."],
  "PEUGEOT": ["Peugeot started out making coffee mills and bicycles long before it built cars."],
  "KIA": ["Kia is South Korea's oldest carmaker, founded in 1944."],
  "SKODA": ["Škoda, founded in 1895, is one of the world's oldest car manufacturers."],
  "MINI": ["The classic Mini launched in 1959 and stayed in production for 41 years; BMW relaunched the modern MINI in 2001."],
  "MG": ["MG was founded in 1924 in Oxford as Morris Garages."],
  "TESLA": ["Tesla is named after the inventor and electrical engineer Nikola Tesla."],
  "JAGUAR": ["Jaguar began in 1922 making motorcycle sidecars, as the Swallow Sidecar Company."],
  "VOLVO": ["Volvo invented the modern three-point seatbelt in 1959 — and gave the patent away to save lives."],
  "HYUNDAI": ["Hyundai is South Korea's largest carmaker; the name means 'modernity' in Korean."],
  "CITROEN": ["Citroën's double-chevron badge represents the helical gear teeth its founder, André Citroën, first manufactured."],
  "SEAT": ["SEAT was founded in Spain in 1950 and has been part of the Volkswagen Group since the late 1980s."],
  "SUZUKI": ["Suzuki began by building weaving looms, and today makes motorcycles and outboard motors as well as cars."],
  "DACIA": ["Dacia is a Romanian brand owned by Renault, known for value — its cars are among the cheapest new cars on sale."],
  "LEXUS": ["Lexus is Toyota's luxury brand, launched in 1989 to take on the established German marques."],
  "SUBARU": ["Subaru is famous for its 'boxer' engines and all-wheel drive — and its parent company started out building aircraft."],
  "MITSUBISHI": ["Mitsubishi's three-diamond emblem dates back to the 1870s, long before it built cars."],
  "ALFA ROMEO": ["Alfa Romeo was founded in Milan in 1910; its badge carries a cross and a crowned serpent from the city's heraldry."],
  "ABARTH": ["Abarth, Fiat's performance arm, wears a scorpion badge — the zodiac sign of founder Carlo Abarth."],
  "PORSCHE": ["Porsche's first production car, the 356, arrived in 1948 — and Ferdinand Porsche had earlier designed the original VW Beetle."],
  "LAND ROVER": ["The first Land Rover was unveiled in 1948, inspired by the wartime Jeep."],
  "BENTLEY": ["Bentley was founded in 1919, won Le Mans five times in the 1920s, and is now part of the Volkswagen Group."],
  "ASTON MARTIN": ["Aston Martin was founded in 1913 and is famous the world over as James Bond's car of choice."],
  "MASERATI": ["Maserati, founded in 1914, takes its trident badge from a statue of Neptune in its home city of Bologna."],
  "SMART": ["The Smart city car was a joint project between Mercedes-Benz and watchmaker Swatch — hence the name 'S-M-A-R-T'."],
  "DS": ["DS became a standalone premium brand in 2014, reviving a name from Citroën's iconic 1955 DS."],
  "BYD": ["BYD — now one of the world's biggest electric-car makers — started out making rechargeable batteries."],
};
