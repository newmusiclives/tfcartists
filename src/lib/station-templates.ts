export interface StationTemplate {
  id: string;
  name: string;
  genre: string;
  formatType: string;
  tagline: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  musicEra: string;
  djPresets: Array<{
    name: string;
    tagline: string;
    bio: string;
    traits: string;
    voiceDescription: string;
    colorPrimary: string;
    vibe: string;
    age: string;
    isWeekend: boolean;
  }>;
}

export const STATION_TEMPLATES: StationTemplate[] = [
  {
    id: "americana",
    name: "Americana Station",
    genre: "Americana, Country, Singer-Songwriter",
    formatType: "americana",
    tagline: "Where the music finds you",
    description: "Roots music from the heartland. Americana, alt-country, and singer-songwriters who tell real stories.",
    primaryColor: "#b45309",
    secondaryColor: "#f59e0b",
    musicEra: "mixed",
    djPresets: [
      { name: "Hank", tagline: "Your morning companion", bio: "A warm, gravel-voiced host who starts your day with coffee-and-front-porch energy.", traits: "warm, storyteller, nostalgic", voiceDescription: "Deep, warm baritone with a slight Southern drawl", colorPrimary: "#92400e", vibe: "Front porch morning", age: "Late 50s", isWeekend: false },
      { name: "Loretta", tagline: "Midday soul", bio: "Bright and energetic, she keeps the midday rolling with deep cuts and artist interviews.", traits: "energetic, knowledgeable, upbeat", voiceDescription: "Clear, bright alto with infectious enthusiasm", colorPrimary: "#be185d", vibe: "Road trip energy", age: "Mid 30s", isWeekend: false },
      { name: "Doc", tagline: "Afternoon professor", bio: "The station's music historian, connecting songs across generations and genres.", traits: "erudite, calm, insightful", voiceDescription: "Measured, professorial tone with dry wit", colorPrimary: "#1e40af", vibe: "University radio", age: "Early 60s", isWeekend: false },
      { name: "Cody", tagline: "Drive time energy", bio: "Young and enthusiastic, bridging classic Americana with new discoveries.", traits: "enthusiastic, witty, relatable", voiceDescription: "Youthful, energetic with quick humor", colorPrimary: "#047857", vibe: "New generation country", age: "Late 20s", isWeekend: false },
    ],
  },
  {
    id: "southern-soul",
    name: "Southern Soul Station",
    genre: "Soul, R&B, Blues",
    formatType: "blues",
    tagline: "Feel it in your soul",
    description: "Deep soul, rhythm and blues, and the sounds of the South. From Stax to modern soul revival.",
    primaryColor: "#7c2d12",
    secondaryColor: "#dc2626",
    musicEra: "mixed",
    djPresets: [
      { name: "Memphis", tagline: "Sunrise soul", bio: "Named after the city that birthed soul music, Memphis brings warmth and groove to your mornings.", traits: "smooth, soulful, charismatic", voiceDescription: "Rich, velvety baritone", colorPrimary: "#7c2d12", vibe: "Beale Street at dawn", age: "Mid 40s", isWeekend: false },
      { name: "Pearl", tagline: "Midday groove", bio: "A former backing vocalist turned radio host, Pearl knows every harmony and every story.", traits: "passionate, warm, musical", voiceDescription: "Powerful contralto with gospel undertones", colorPrimary: "#9f1239", vibe: "Sunday morning church", age: "Early 50s", isWeekend: false },
    ],
  },
  {
    id: "indie-rock",
    name: "Indie Rock Station",
    genre: "Indie, Alternative, Surf Rock",
    formatType: "rock",
    tagline: "Sounds from the underground",
    description: "Independent rock, alternative, and garage sounds. Supporting the DIY music scene.",
    primaryColor: "#4338ca",
    secondaryColor: "#818cf8",
    musicEra: "modern",
    djPresets: [
      { name: "Ziggy", tagline: "Morning chaos", bio: "A caffeinated whirlwind of music trivia and unexpected segues.", traits: "chaotic, funny, surprising", voiceDescription: "Fast-talking, excitable with sudden quiet moments", colorPrimary: "#4338ca", vibe: "Basement show energy", age: "Mid 20s", isWeekend: false },
      { name: "Vinyl", tagline: "Deep cuts only", bio: "A record collector who plays nothing mainstream and loves it.", traits: "hipster, knowledgeable, dry", voiceDescription: "Deadpan delivery with occasional enthusiasm breaks", colorPrimary: "#059669", vibe: "Record store clerk", age: "Early 30s", isWeekend: false },
    ],
  },
  {
    id: "folk-roots",
    name: "Folk & Roots Station",
    genre: "Folk, Acoustic, Appalachian",
    formatType: "folk",
    tagline: "Rooted in tradition",
    description: "Traditional and contemporary folk, acoustic music, and the sounds of Appalachia.",
    primaryColor: "#365314",
    secondaryColor: "#84cc16",
    musicEra: "mixed",
    djPresets: [
      { name: "Birch", tagline: "Mountain morning", bio: "From the Blue Ridge to your speakers, Birch brings the sounds of the hills.", traits: "gentle, wise, nature-loving", voiceDescription: "Soft, lilting voice like a mountain stream", colorPrimary: "#365314", vibe: "Cabin in the woods", age: "Mid 40s", isWeekend: false },
      { name: "Sage", tagline: "Afternoon gathering", bio: "A folk festival regular who brings the communal spirit of live music to radio.", traits: "communal, warm, inclusive", voiceDescription: "Warm, inviting, campfire storyteller", colorPrimary: "#7c2d12", vibe: "Folk festival vibes", age: "Late 30s", isWeekend: false },
    ],
  },
  {
    id: "country-classic",
    name: "Classic Country Station",
    genre: "Classic Country, Honky-Tonk, Outlaw",
    formatType: "country",
    tagline: "The way country was meant to sound",
    description: "Classic country, honky-tonk, and outlaw country. From Hank Williams to Waylon Jennings.",
    primaryColor: "#78350f",
    secondaryColor: "#d97706",
    musicEra: "classic",
    djPresets: [
      { name: "Dusty", tagline: "Sunrise on the ranch", bio: "A real-deal cowboy who grew up on his grandpa's country records.", traits: "authentic, no-nonsense, genuine", voiceDescription: "Authentic country twang, unhurried", colorPrimary: "#78350f", vibe: "Ranching morning", age: "Early 50s", isWeekend: false },
      { name: "Patsy", tagline: "Honky-tonk queen", bio: "Named after Patsy Cline, she brings class and sass to classic country.", traits: "sassy, knowledgeable, fun", voiceDescription: "Strong Southern accent with playful edge", colorPrimary: "#be123c", vibe: "Honky-tonk Saturday", age: "Mid 40s", isWeekend: false },
    ],
  },
];
