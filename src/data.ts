import { Planet } from "./types";

export const planetsData: Planet[] = [
  {
    id: "mercury",
    name: "Merkurius",
    englishName: "Mercury",
    color: "#9CA3AF", // Slate grey
    secondaryColor: "#4B5563",
    accentColor: "#F3F4F6",
    baseDistance: 70,
    realDistance: "57.9 Juta km",
    baseRadius: 5,
    realSize: "4.879 km",
    orbitSpeed: 0.04,
    realOrbitPeriod: "88 Hari Bumi",
    realRotationPeriod: "58,6 Hari Bumi",
    inclination: 0.12, // ~7 degrees inclination
    temperature: "-173°C hingga 427°C",
    moonsCount: 0,
    moonsList: [],
    description: "Merkurius adalah planet terkecil di Tata Surya sekaligus yang terdekat dengan Matahari. Karena jaraknya yang begitu dekat, planet ini memiliki dinamika suhu super ekstrem antara siang dan malam.",
    atmosphere: ["Oksigen (O2)", "Natrium (Na)", "Hidrogen (H2)", "Helium (He)"],
    funFact: "Inti besi Merkurius sangat besar dan perlahan-lahan mendingin. Hal ini menyebabkan planet ini mengerut, menciptakan tebing raksasa (rupes) setinggi bermil-mil di permukaannya.",
    geology: "Sangat mirip Bulan, penuh kawah hantaman asteroid dan dataran lava purba yang luas tanpa adanya lempeng tektonik aktif."
  },
  {
    id: "venus",
    name: "Venus",
    englishName: "Venus",
    color: "#FBBF24", // Yellowish orange
    secondaryColor: "#D97706",
    accentColor: "#FEF3C7",
    baseDistance: 110,
    realDistance: "108.2 Juta km",
    baseRadius: 7.5,
    realSize: "12.104 km",
    orbitSpeed: 0.015,
    realOrbitPeriod: "224,7 Hari Bumi",
    realRotationPeriod: "243 Hari Bumi (Retrogard)",
    inclination: 0.06, // ~3.4 degrees
    temperature: "Sekitar 462°C",
    moonsCount: 0,
    moonsList: [],
    description: "Venus adalah planet terpanas di Tata Surya kita. Meskipun Merkurius lebih dekat ke Matahari, atmosfer Venus yang super padat menyerap panas dalam efek rumah kaca tak terkendali.",
    atmosphere: ["Karbon Dioksida (CO2) 96%", "Nitrogen (N2) 3.5%", "Sulfur Dioksida (SO2)"],
    funFact: "Venus berotasi berlawanan arah dengan kebanyakan planet (retrogard), sehingga Matahari terbit dari barat di planet ini. Satu hari di Venus juga lebih lama daripada satu tahunnya!",
    geology: "Penuh dengan ribuan gunung berapi aktif, aliran lava luas, dan tekanan atmosfer mendarat yang setara dengan kedalaman 900 meter di bawah laut Bumi."
  },
  {
    id: "earth",
    name: "Bumi",
    englishName: "Earth",
    color: "#3B82F6", // Oceanic blue
    secondaryColor: "#1D4ED8",
    accentColor: "#10B981", // Emerald green fields
    baseDistance: 154,
    realDistance: "149.6 Juta km",
    baseRadius: 8.5,
    realSize: "12.742 km",
    orbitSpeed: 0.01,
    realOrbitPeriod: "365,25 Hari",
    realRotationPeriod: "24 Jam",
    inclination: 0.0, // Earth reference plane
    temperature: "-89°C hingga 58°C (Rata-rata 15°C)",
    moonsCount: 1,
    moonsList: ["Bulan (Luna)"],
    description: "Bumi adalah planet ketiga dari Matahari dan satu-satunya objek astronomi yang dikenal menyimpan kehidupan. Air cair berlimpah di permukaan membentuk samudra yang indah.",
    atmosphere: ["Nitrogen (N2) 78%", "Oksigen (O2) 21%", "Argon (Ar) 0.9%", "Karbon Dioksida"],
    funFact: "Bumi memiliki perisai magnetik raksasa (Magnetosfer) yang melindungi kita dari radiasi solar mematikan. Tabrakan partikel ini menghasilkan aurora yang menakjubkan di kutub.",
    geology: "Satu-satunya planet dengan lempeng tektonik aktif yang terus meremajakan keraknya melalui gempa, pegunungan, dan aktivitas vulkanis."
  },
  {
    id: "mars",
    name: "Mars",
    englishName: "Mars",
    color: "#EF4444", // Iron oxide red
    secondaryColor: "#B91C1C",
    accentColor: "#FCA5A5",
    baseDistance: 200,
    realDistance: "227.9 Juta km",
    baseRadius: 6.2,
    realSize: "6.779 km",
    orbitSpeed: 0.008,
    realOrbitPeriod: "687 Hari Bumi",
    realRotationPeriod: "24,6 Jam",
    inclination: 0.03, // ~1.85 degrees
    temperature: "-153°C hingga 20°C",
    moonsCount: 2,
    moonsList: ["Phobos", "Deimos"],
    description: "Mars adalah planet berdebu, dingin, dengan atmosfer yang sangat tipis. Dijuluki sebagai Planet Merah, permukaannya kaya akan Besi Oksida yang menciptakan warna karat ikonik.",
    atmosphere: ["Karbon Dioksida (CO2) 95%", "Nitrogen (N2) 2.8%", "Argon (Ar) 2%"],
    funFact: "Mars memiliki gunung berapi terbesar di Tata Surya bernama Olympus Mons. Tingginya mencapai 21,9 km, hampir tiga kali lipat tinggi puncak Gunung Everest!",
    geology: "Didominasi oleh ngarai epik (Valles Marineris) dan es kering karbon dioksida di daerah kutubnya, serta banyak jejak air cair purba yang kini membeku."
  },
  {
    id: "jupiter",
    name: "Yupiter",
    englishName: "Jupiter",
    color: "#F59E0B", // Amber banded gas giant
    secondaryColor: "#B45309",
    accentColor: "#FDE68A",
    baseDistance: 260,
    realDistance: "778.5 Juta km",
    baseRadius: 16,
    realSize: "139.820 km",
    orbitSpeed: 0.004,
    realOrbitPeriod: "12 Tahun Bumi",
    realRotationPeriod: "9,9 Jam (Sangat Cepat)",
    inclination: 0.02, // ~1.3 degrees
    temperature: "-110°C (Atmosfer Atas)",
    moonsCount: 95,
    moonsList: ["Ganymede", "Callisto", "Io", "Europa", "Amalthea", "Himalia"],
    description: "Yupiter adalah raksasa gas terbesar di Tata Surya kita dengan massa dua kali lipat dari seluruh kumpulan planet lain digabung! Komposisinya mirip bintang kecil gagl.",
    atmosphere: ["Hidrogen (H2) 89%", "Helium (He) 10%", "Metana (CH4)", "Amonia"],
    funFact: "Bintik Merah Raksasa di Yupiter adalah sebuah badai antisiklon raksasa yang berukuran lebih besar dari diameter Bumi dan telah mengamuk selama sedikitnya 300 tahun.",
    geology: "Tidak memiliki permukaan padat yang nyata. Jika Anda terjatuh di Yupiter, Anda akan tenggelam ke dalam gas panas bertekanan luar biasa hingga hancur oleh logam hidrogen cair."
  },
  {
    id: "saturn",
    name: "Saturnus",
    englishName: "Saturn",
    color: "#FCD34D", // Pale gold with rings
    secondaryColor: "#C2410C",
    accentColor: "#FDE68A",
    baseDistance: 324,
    realDistance: "1.434 Miliar km",
    baseRadius: 13.5,
    realSize: "116.460 km",
    orbitSpeed: 0.002,
    realOrbitPeriod: "29 Tahun Bumi",
    realRotationPeriod: "10,7 Jam",
    inclination: 0.04, // ~2.5 degrees
    temperature: "-140°C",
    moonsCount: 146,
    moonsList: ["Titan", "Rhea", "Iapetus", "Dione", "Tethys", "Enceladus", "Mimas"],
    description: "Saturnus adalah planet keenam dari Matahari dan terbesar kedua. Terkenal berkat sistem cincin memukau yang terbuat dari miliaran serpihan es, debu kosmis, dan bebatuan.",
    atmosphere: ["Hidrogen (H2) 96%", "Helium (He) 3%", "Metana", "Etana"],
    funFact: "Kepadatan air Saturnus sangat rendah! Jika Anda bisa menemukan kolam air raksasa yang menampung Saturnus, planet indah ini akan mengapung di permukaan air seperti gabus berkelana.",
    geology: "Sama seperti Yupiter, Saturnus adalah raksasa gas tanpa daratan padat. Cincin raksasanya sangat tipis, hanya sekitar 10 meter hingga 1 kilometer tebalnya saja."
  },
  {
    id: "uranus",
    name: "Uranus",
    englishName: "Uranus",
    color: "#67E8F9", // Ice cyan green
    secondaryColor: "#0891B2",
    accentColor: "#CFFAFE",
    baseDistance: 380,
    realDistance: "2.871 Miliar km",
    baseRadius: 10,
    realSize: "50.724 km",
    orbitSpeed: 0.0009,
    realOrbitPeriod: "84 Tahun Bumi",
    realRotationPeriod: "17,2 Jam (Mundur)",
    inclination: 0.013, // ~0.77 degrees
    temperature: "-224°C (Terdingin)",
    moonsCount: 28,
    moonsList: ["Titania", "Oberon", "Umbriel", "Ariel", "Miranda", "Puck"],
    description: "Uranus adalah raksasa es berwarna biru muda pucat akibat metana di atmosfernya. Ia unik karena berputar miring ekstrim hampir 98 derajat menyamping.",
    atmosphere: ["Hidrogen (H2) 82.5%", "Helium (He) 15.2%", "Metana (CH4) 2.3%"],
    funFact: "Uranus mengorbit Matahari seperti bola boling yang menggelinding! Kemiringan ekstrim poros rotasinya diduga akibat tabrakan hebat dengan planet seukuran Bumi pada masa awal terbentuknya.",
    geology: "Mantel mantel air es, amonia, dan metana cair di atas inti berbatu padat kecil. Uranus juga memiliki cincin abu-abu gelap vertikal berdebu."
  },
  {
    id: "neptune",
    name: "Neptunus",
    englishName: "Neptune",
    color: "#3B82F6", // Cobalt blue deep
    secondaryColor: "#1E3A8A",
    accentColor: "#93C5FD",
    baseDistance: 430,
    realDistance: "4.495 Miliar km",
    baseRadius: 9.8,
    realSize: "49.244 km",
    orbitSpeed: 0.0005,
    realOrbitPeriod: "164,8 Tahun Bumi",
    realRotationPeriod: "16 Jam",
    inclination: 0.03, // ~1.77 degrees
    temperature: "-218°C",
    moonsCount: 16,
    moonsList: ["Triton", "Proteus", "Nereid", "Larissa", "Galatea"],
    description: "Neptunus adalah planet kedelapan dan terjauh dari Matahari. Ia adalah dunia es raksasa biru gelap yang beku dengan sistem badai atmosfer paling ganas di seluruh Tata Surya.",
    atmosphere: ["Hidrogen (H2) 80%", "Helium (He) 19%", "Metana (CH4) 1.5%"],
    funFact: "Neptunus memiliki hembusan angin tercepat di Tata Surya, mencapai kecepatan mengerikan hingga 2.100 km/jam—lebih cepat dari kecepatan suara di Bumi!",
    geology: "Inti berbatu padat bermassa 1,2 kali Bumi, dikelilingi oleh lautan ionik air, amonia, dan metana cair superkonduktif di bawah tekanan atmosfer raksasa."
  }
];
