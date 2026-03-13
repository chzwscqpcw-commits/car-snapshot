export type CazClass = "ULEZ" | "Class B" | "Class C" | "Class D" | "ZEZ";

export type CazCharge = {
  vehicleType: string;
  dailyCharge: string;
};

export type CazFaq = {
  question: string;
  answer: string;
};

export type CazZone = {
  slug: string;
  city: string;
  zoneType: CazClass;
  launchDate: string;
  status: "active" | "deferred" | "cancelled";
  operatingHours: string;
  description: string;
  boundaries: string;
  charges: CazCharge[];
  affectedVehicles: string;
  checkUrl: string;
  officialUrl: string;
  coveredByOurChecker: boolean;
  metaDescription: string;
  faqs: CazFaq[];
};

export const CAZ_ZONES: CazZone[] = [
  {
    slug: "london",
    city: "London",
    zoneType: "ULEZ",
    launchDate: "8 April 2019 (expanded London-wide 29 August 2023)",
    status: "active",
    operatingHours: "24 hours a day, 365 days a year",
    description:
      "London's Ultra Low Emission Zone is the UK's largest and most well-known clean air charging zone. Originally covering central London, it was expanded to cover all London boroughs in August 2023. Non-compliant vehicles are charged every day they drive within the Greater London boundary.",
    boundaries:
      "The entire Greater London area, bounded by the M25. All roads within every London borough are included.",
    charges: [
      { vehicleType: "Cars & small vans", dailyCharge: "£12.50" },
      { vehicleType: "Motorcycles & mopeds", dailyCharge: "£12.50" },
      { vehicleType: "Larger vans & minibuses", dailyCharge: "£12.50" },
      { vehicleType: "Lorries, buses & coaches (LEZ)", dailyCharge: "£100–£300" },
    ],
    affectedVehicles:
      "Petrol vehicles that do not meet Euro 4 (generally pre-2006) and diesel vehicles that do not meet Euro 6 (generally pre-September 2015). Electric and hydrogen vehicles are exempt. Historic vehicles (pre-1973) are also exempt.",
    checkUrl: "/ulez-check",
    officialUrl: "https://tfl.gov.uk/modes/driving/ultra-low-emission-zone",
    coveredByOurChecker: true,
    metaDescription:
      "Check London ULEZ compliance, daily charges, exempt vehicles and zone boundaries. See if your car meets the Ultra Low Emission Zone standards.",
    faqs: [
      {
        question: "How much is the London ULEZ charge?",
        answer:
          "The ULEZ daily charge is £12.50 for non-compliant cars, motorcycles, and vans. Lorries, buses, and coaches face charges of £100–£300 under the separate Low Emission Zone scheme. Failure to pay results in a penalty charge notice of £180, reduced to £90 if paid within 14 days.",
      },
      {
        question: "Does ULEZ apply at weekends and bank holidays?",
        answer:
          "Yes. The London ULEZ operates 24 hours a day, 7 days a week, 365 days a year — including weekends, bank holidays, and Christmas Day.",
      },
      {
        question: "Is my hybrid car ULEZ compliant?",
        answer:
          "Hybrid cars are not automatically exempt. Petrol hybrids need to meet Euro 4, and diesel hybrids need to meet Euro 6. Most modern hybrids meet these standards, but older models may not. Enter your registration number to check.",
      },
      {
        question: "Can I check my ULEZ compliance for free?",
        answer:
          "Yes. Enter your registration number on our free ULEZ check page and we will show your vehicle's Euro emission standard and compliance status instantly. No signup or payment required.",
      },
    ],
  },
  {
    slug: "birmingham",
    city: "Birmingham",
    zoneType: "Class D",
    launchDate: "1 June 2021",
    status: "active",
    operatingHours: "24 hours a day, 7 days a week",
    description:
      "Birmingham's Clean Air Zone is a Class D zone, meaning it charges all non-compliant vehicle types including private cars. It covers the city centre within the A4540 Middleway ring road and is designed to reduce harmful nitrogen dioxide levels in one of the UK's most polluted cities.",
    boundaries:
      "The area within the A4540 Middleway ring road, covering Birmingham city centre. The Middleway itself is not included in the zone.",
    charges: [
      { vehicleType: "Cars", dailyCharge: "£8" },
      { vehicleType: "LGVs & vans", dailyCharge: "£8" },
      { vehicleType: "Taxis & PHVs", dailyCharge: "£8" },
      { vehicleType: "HGVs, buses & coaches", dailyCharge: "£50" },
    ],
    affectedVehicles:
      "Petrol vehicles that do not meet Euro 4 (generally pre-2006) and diesel vehicles that do not meet Euro 6 (generally pre-September 2015). Electric, hydrogen, and compliant hybrid vehicles are not charged.",
    checkUrl: "/",
    officialUrl: "https://www.brumbreathes.co.uk",
    coveredByOurChecker: false,
    metaDescription:
      "Check Birmingham Clean Air Zone charges, boundaries and vehicle compliance. See daily charges for cars, vans, taxis and HGVs in the Birmingham CAZ.",
    faqs: [
      {
        question: "How much is the Birmingham Clean Air Zone charge?",
        answer:
          "Non-compliant cars, vans, and taxis are charged £8 per day. HGVs, buses, and coaches are charged £50 per day. Failure to pay results in a penalty charge notice of £120, reduced to £60 if paid within 14 days.",
      },
      {
        question: "Where exactly is the Birmingham CAZ?",
        answer:
          "The zone covers Birmingham city centre within the A4540 Middleway ring road. The Middleway itself is not included. Signs mark the boundary and ANPR cameras enforce the zone.",
      },
      {
        question: "Can I drive through Birmingham without paying?",
        answer:
          "If your vehicle meets the required emission standards (Euro 4 petrol or Euro 6 diesel), you can drive through the zone without charge. Electric vehicles are also exempt.",
      },
      {
        question: "Is there a temporary exemption for Birmingham CAZ?",
        answer:
          "Birmingham offered temporary exemptions for some vehicle types when the zone launched, but most of these have now expired. Check the official Brum Breathes website for the latest exemption information.",
      },
    ],
  },
  {
    slug: "bath",
    city: "Bath",
    zoneType: "Class C",
    launchDate: "15 March 2021",
    status: "active",
    operatingHours: "24 hours a day, 7 days a week",
    description:
      "Bath's Clean Air Zone is a Class C zone that charges non-compliant taxis, vans, buses, coaches, and HGVs. Private cars that do not meet emission standards are also charged. The zone covers the city centre and main approach roads to reduce nitrogen dioxide pollution.",
    boundaries:
      "The zone covers Bath city centre and the main roads leading into it, including London Road, the A36, and the A4. The boundary is marked with signage.",
    charges: [
      { vehicleType: "Cars (non-compliant)", dailyCharge: "£9" },
      { vehicleType: "LGVs & vans", dailyCharge: "£9" },
      { vehicleType: "Taxis & PHVs", dailyCharge: "£9" },
      { vehicleType: "HGVs, buses & coaches", dailyCharge: "£100" },
    ],
    affectedVehicles:
      "Petrol vehicles that do not meet Euro 4 and diesel vehicles that do not meet Euro 6. Taxis, vans, and commercial vehicles are also affected. Electric vehicles are exempt.",
    checkUrl: "/",
    officialUrl: "https://www.bathnes.gov.uk/bath-clean-air-zone",
    coveredByOurChecker: false,
    metaDescription:
      "Check Bath Clean Air Zone charges, boundaries and vehicle compliance. See daily charges for cars, vans, taxis and HGVs in the Bath CAZ.",
    faqs: [
      {
        question: "How much is the Bath Clean Air Zone charge?",
        answer:
          "Non-compliant cars, vans, and taxis pay £9 per day. HGVs, buses, and coaches pay £100 per day. Failure to pay incurs a penalty charge notice.",
      },
      {
        question: "Are private cars charged in the Bath CAZ?",
        answer:
          "Yes. Bath operates a Class C zone which charges non-compliant private cars, unlike some other UK zones that only charge commercial vehicles. If your car does not meet Euro 4 (petrol) or Euro 6 (diesel), you will be charged.",
      },
      {
        question: "Is the A36 in the Bath Clean Air Zone?",
        answer:
          "Parts of the A36 passing through Bath are within the zone. Check the official Bath CAZ boundary map for exact roads included.",
      },
    ],
  },
  {
    slug: "bradford",
    city: "Bradford",
    zoneType: "Class C",
    launchDate: "26 September 2022",
    status: "active",
    operatingHours: "24 hours a day, 7 days a week",
    description:
      "Bradford's Clean Air Zone is a Class C zone covering the city centre and parts of the main road network. It primarily targets commercial vehicles but also charges non-compliant private cars. The zone was introduced to address persistently high nitrogen dioxide levels in the city centre.",
    boundaries:
      "The zone covers Bradford city centre, bounded by key roads including the A6181, A650, and surrounding routes. Clear signage marks the zone boundary.",
    charges: [
      { vehicleType: "Cars (non-compliant)", dailyCharge: "£12.50" },
      { vehicleType: "LGVs & vans", dailyCharge: "£12.50" },
      { vehicleType: "Taxis & PHVs", dailyCharge: "£12.50" },
      { vehicleType: "HGVs, buses & coaches", dailyCharge: "£50" },
    ],
    affectedVehicles:
      "Petrol vehicles that do not meet Euro 4 and diesel vehicles that do not meet Euro 6. All vehicle categories including private cars are charged if non-compliant.",
    checkUrl: "/",
    officialUrl: "https://www.bradford.gov.uk/clean-air-zone",
    coveredByOurChecker: false,
    metaDescription:
      "Check Bradford Clean Air Zone charges, boundaries and vehicle compliance. See daily charges and which vehicles are affected in the Bradford CAZ.",
    faqs: [
      {
        question: "How much is the Bradford Clean Air Zone charge?",
        answer:
          "Non-compliant cars, vans, and taxis pay £12.50 per day. HGVs, buses, and coaches pay £50 per day. These charges apply every day you drive within the zone.",
      },
      {
        question: "Are private cars charged in Bradford's CAZ?",
        answer:
          "Yes. Bradford operates a Class C zone which includes charges for non-compliant private cars, as well as vans, taxis, and commercial vehicles.",
      },
      {
        question: "What emission standard do I need for Bradford CAZ?",
        answer:
          "Petrol vehicles need Euro 4 or later, and diesel vehicles need Euro 6 or later. Electric and hydrogen vehicles are exempt from charges.",
      },
    ],
  },
  {
    slug: "bristol",
    city: "Bristol",
    zoneType: "Class D",
    launchDate: "28 November 2022",
    status: "active",
    operatingHours: "24 hours a day, 7 days a week",
    description:
      "Bristol's Clean Air Zone is a Class D zone covering the city centre. It charges all non-compliant vehicle types including private cars. Bristol was the first UK city to be ordered by the courts to implement a clean air plan, and the zone is designed to bring nitrogen dioxide levels within legal limits.",
    boundaries:
      "The zone covers Bristol city centre, roughly bounded by the A4044, A38, and the harbour area. The exact boundary follows specific roads with ANPR cameras at entry and exit points.",
    charges: [
      { vehicleType: "Cars", dailyCharge: "£9" },
      { vehicleType: "LGVs & vans", dailyCharge: "£9" },
      { vehicleType: "Taxis & PHVs", dailyCharge: "£9" },
      { vehicleType: "HGVs, buses & coaches", dailyCharge: "£100" },
    ],
    affectedVehicles:
      "Petrol vehicles that do not meet Euro 4 and diesel vehicles that do not meet Euro 6. All vehicle categories are affected. Electric and hydrogen vehicles are exempt.",
    checkUrl: "/",
    officialUrl: "https://www.bristol.gov.uk/clean-air-zone",
    coveredByOurChecker: false,
    metaDescription:
      "Check Bristol Clean Air Zone charges, boundaries and vehicle compliance. See daily charges for cars, vans, taxis and HGVs in the Bristol CAZ.",
    faqs: [
      {
        question: "How much is the Bristol Clean Air Zone charge?",
        answer:
          "Non-compliant cars, vans, and taxis pay £9 per day. HGVs, buses, and coaches pay £100 per day. Failure to pay results in a penalty charge notice.",
      },
      {
        question: "What area does the Bristol CAZ cover?",
        answer:
          "The zone covers Bristol city centre, roughly bounded by the A4044, A38, and the harbour area. Signs and road markings indicate the zone boundary.",
      },
      {
        question: "Is the M32 in the Bristol Clean Air Zone?",
        answer:
          "The M32 motorway itself is not within the zone, but the roads it connects to in the city centre are. Check the official boundary map for details.",
      },
      {
        question: "Does Bristol CAZ apply to all cars?",
        answer:
          "Only non-compliant cars are charged. If your car meets Euro 4 (petrol) or Euro 6 (diesel), you can drive in the zone for free. Electric vehicles are also exempt.",
      },
    ],
  },
  {
    slug: "portsmouth",
    city: "Portsmouth",
    zoneType: "Class B",
    launchDate: "29 November 2021",
    status: "active",
    operatingHours: "24 hours a day, 7 days a week",
    description:
      "Portsmouth's Clean Air Zone is a Class B zone, which means it only charges non-compliant taxis, buses, coaches, and HGVs. Private cars and light goods vehicles are not charged, regardless of their emission standard. The zone covers a small area around key roads in the city centre.",
    boundaries:
      "A small area covering parts of the city centre, primarily along the A3 Mile End Road, Alfred Road, and surrounding streets near the commercial port.",
    charges: [
      { vehicleType: "Private cars", dailyCharge: "Not charged" },
      { vehicleType: "LGVs & vans", dailyCharge: "Not charged" },
      { vehicleType: "Taxis & PHVs", dailyCharge: "£10" },
      { vehicleType: "HGVs, buses & coaches", dailyCharge: "£50" },
    ],
    affectedVehicles:
      "Only taxis, private hire vehicles, buses, coaches, and HGVs that do not meet emission standards are charged. Private cars and light vans are not affected by Portsmouth's Class B zone.",
    checkUrl: "/",
    officialUrl: "https://www.portsmouth.gov.uk/cleanairzone",
    coveredByOurChecker: false,
    metaDescription:
      "Check Portsmouth Clean Air Zone charges and affected vehicles. Private cars are not charged — see which vehicles pay in the Portsmouth Class B CAZ.",
    faqs: [
      {
        question: "Are private cars charged in Portsmouth's CAZ?",
        answer:
          "No. Portsmouth operates a Class B zone, which only charges non-compliant taxis, buses, coaches, and HGVs. Private cars and light vans are not charged regardless of their emission standard.",
      },
      {
        question: "How much does Portsmouth CAZ cost?",
        answer:
          "Non-compliant taxis pay £10 per day. HGVs, buses, and coaches pay £50 per day. Private cars and vans are not charged.",
      },
      {
        question: "Where is Portsmouth's Clean Air Zone?",
        answer:
          "The zone covers a small area in the city centre around Mile End Road, Alfred Road, and streets near the commercial port. It is one of the smallest CAZs in the UK.",
      },
    ],
  },
  {
    slug: "sheffield",
    city: "Sheffield",
    zoneType: "Class C",
    launchDate: "27 February 2023",
    status: "active",
    operatingHours: "24 hours a day, 7 days a week",
    description:
      "Sheffield's Clean Air Zone is a Class C zone covering the city centre within the inner ring road. While it is classified as Class C, Sheffield currently only charges non-compliant taxis, buses, coaches, and HGVs. Private cars are not charged at this time, though the council retains the option to include them in future if air quality targets are not met.",
    boundaries:
      "The zone covers Sheffield city centre within the inner ring road (A61, A6109). The ring road itself is not within the zone.",
    charges: [
      { vehicleType: "Private cars", dailyCharge: "Not currently charged" },
      { vehicleType: "LGVs & vans", dailyCharge: "Not currently charged" },
      { vehicleType: "Taxis & PHVs", dailyCharge: "£10" },
      { vehicleType: "HGVs, buses & coaches", dailyCharge: "£50" },
    ],
    affectedVehicles:
      "Currently only non-compliant taxis, buses, coaches, and HGVs are charged. Private cars and vans are not charged at this time, though Sheffield retains the power to include them if needed.",
    checkUrl: "/",
    officialUrl: "https://www.sheffield.gov.uk/cleanairzone",
    coveredByOurChecker: false,
    metaDescription:
      "Check Sheffield Clean Air Zone charges and affected vehicles. Private cars are not currently charged — see which vehicles pay in the Sheffield CAZ.",
    faqs: [
      {
        question: "Are private cars charged in Sheffield's CAZ?",
        answer:
          "Not currently. Although Sheffield's zone is classified as Class C (which can include cars), the council has chosen not to charge private cars at this stage. Only non-compliant taxis, buses, coaches, and HGVs are currently charged.",
      },
      {
        question: "Could Sheffield start charging cars in future?",
        answer:
          "Yes. Sheffield retains the legal power to extend charges to private cars and vans if air quality does not improve sufficiently. The situation is reviewed regularly.",
      },
      {
        question: "Where is the Sheffield Clean Air Zone?",
        answer:
          "The zone covers Sheffield city centre within the inner ring road (A61 and A6109). The ring road itself is not part of the zone.",
      },
    ],
  },
  {
    slug: "newcastle-gateshead",
    city: "Newcastle & Gateshead",
    zoneType: "Class C",
    launchDate: "30 January 2023",
    status: "active",
    operatingHours: "24 hours a day, 7 days a week",
    description:
      "The Tyneside Clean Air Zone covers parts of Newcastle and Gateshead city centres. It is a Class C zone but currently only charges non-compliant taxis, buses, coaches, and HGVs. Private cars are not charged. The zone was introduced to address nitrogen dioxide exceedances on key routes.",
    boundaries:
      "The zone covers central Newcastle and Gateshead, including the Tyne Bridge and surrounding routes. The exact boundary includes roads on both sides of the River Tyne in the city centre areas.",
    charges: [
      { vehicleType: "Private cars", dailyCharge: "Not charged" },
      { vehicleType: "LGVs & vans", dailyCharge: "Not charged" },
      { vehicleType: "Taxis & PHVs", dailyCharge: "£12.50" },
      { vehicleType: "HGVs, buses & coaches", dailyCharge: "£50" },
    ],
    affectedVehicles:
      "Only non-compliant taxis, buses, coaches, and HGVs are charged. Private cars and light vans are not affected by the Tyneside zone.",
    checkUrl: "/",
    officialUrl: "https://www.breathe-cleanair.com",
    coveredByOurChecker: false,
    metaDescription:
      "Check Newcastle & Gateshead Clean Air Zone charges and affected vehicles. Private cars are not charged — see which vehicles pay in the Tyneside CAZ.",
    faqs: [
      {
        question: "Are private cars charged in Newcastle's CAZ?",
        answer:
          "No. The Tyneside Clean Air Zone does not currently charge private cars or light vans. Only non-compliant taxis, buses, coaches, and HGVs are charged.",
      },
      {
        question: "Does the zone cover both Newcastle and Gateshead?",
        answer:
          "Yes. The zone spans both sides of the River Tyne, covering central areas of both Newcastle and Gateshead.",
      },
      {
        question: "How much does the Tyneside CAZ cost?",
        answer:
          "Non-compliant taxis pay £12.50 per day. HGVs, buses, and coaches pay £50 per day. Private cars and vans are not charged.",
      },
    ],
  },
  {
    slug: "manchester",
    city: "Manchester",
    zoneType: "Class C",
    launchDate: "Cancelled",
    status: "cancelled",
    operatingHours: "N/A",
    description:
      "Greater Manchester's Clean Air Zone was originally planned as a Class C zone covering the entire Greater Manchester area. It was due to launch in 2022 but was deferred and ultimately cancelled following significant opposition from businesses and residents. The ten Greater Manchester councils voted to abandon the scheme. Instead, the region is pursuing alternative measures to reduce air pollution, including investment in public transport and vehicle upgrade grants.",
    boundaries:
      "The proposed zone would have covered the entire Greater Manchester area, including Manchester, Salford, Trafford, Stockport, Tameside, Oldham, Rochdale, Bury, Bolton, and Wigan.",
    charges: [
      { vehicleType: "Cars", dailyCharge: "N/A — zone cancelled" },
      { vehicleType: "LGVs & vans", dailyCharge: "N/A — zone cancelled" },
      { vehicleType: "Taxis & PHVs", dailyCharge: "N/A — zone cancelled" },
      { vehicleType: "HGVs, buses & coaches", dailyCharge: "N/A — zone cancelled" },
    ],
    affectedVehicles:
      "No vehicles are currently charged. The proposed zone was cancelled before launch.",
    checkUrl: "/",
    officialUrl: "https://cleanairgm.com",
    coveredByOurChecker: false,
    metaDescription:
      "Manchester Clean Air Zone update — the proposed GM CAZ was cancelled. See what happened, why it was scrapped, and current air quality measures.",
    faqs: [
      {
        question: "Is there a Clean Air Zone in Manchester?",
        answer:
          "No. The proposed Greater Manchester Clean Air Zone was cancelled. The ten GM councils voted to abandon the charging scheme following widespread opposition. There are currently no plans to introduce a CAZ in Manchester.",
      },
      {
        question: "Why was the Manchester CAZ cancelled?",
        answer:
          "The scheme faced significant opposition from businesses, taxi drivers, and residents who argued it would impose unaffordable costs. Rising vehicle prices after COVID and supply chain issues also made it harder for people to upgrade to compliant vehicles. The councils ultimately decided to pursue alternative air quality measures.",
      },
      {
        question: "Will Manchester ever get a Clean Air Zone?",
        answer:
          "There are no current plans to reintroduce a charging CAZ in Manchester. The region is instead investing in public transport improvements, EV charging infrastructure, and vehicle upgrade grants to reduce pollution without road charges.",
      },
    ],
  },
];

export function getCazBySlug(slug: string): CazZone | undefined {
  return CAZ_ZONES.find((z) => z.slug === slug);
}

export function getAllCazSlugs(): string[] {
  return CAZ_ZONES.map((z) => z.slug);
}
