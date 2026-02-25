import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Cassidy's judge panel...");

  const judgeData = [
    {
      name: "Cassidy Monroe",
      role: "Music Director & Panel Chair",
      expertiseArea: "Overall curation and rotation strategy",
      bio: "20+ years in radio programming. Cassidy sets the creative direction for all rotation decisions and makes final tier placement calls.",
    },
    {
      name: "Dakota Wells",
      role: "Production Engineer",
      expertiseArea: "Technical assessment and production quality",
      bio: "Award-winning producer and audio engineer. Evaluates recording quality, mixing, mastering, and broadcast-readiness. Critical gatekeeper for Gold/Platinum consideration.",
    },
    {
      name: "Maya Reeves",
      role: "Programming Director",
      expertiseArea: "Commercial viability and programming fit",
      bio: "Former major label A&R rep. Focuses on rotation compatibility, listener appeal, commercial potential, and daypart programming fit.",
    },
    {
      name: "Jesse Coleman",
      role: "Performance Specialist",
      expertiseArea: "Live performance and artistic merit",
      bio: "Touring musician and vocal coach. Assesses vocal performance, emotional delivery, artist authenticity, and long-term career development potential.",
    },
    {
      name: "Dr. Sam Chen",
      role: "Musicologist",
      expertiseArea: "Cultural significance and musical analysis",
      bio: "PhD in Ethnomusicology. Evaluates artistic depth, genre authenticity, cultural impact, lyrical storytelling, and innovation within tradition.",
    },
    {
      name: "Whitley Cross",
      role: "Audience Analyst",
      expertiseArea: "Audience engagement and growth potential",
      bio: "Data-driven audience researcher. Predicts listener response, tracks streaming performance, assesses social media engagement, and identifies breakout potential.",
    },
  ];

  for (const j of judgeData) {
    const existing = await prisma.judge.findFirst({
      where: { name: j.name },
    });

    if (existing) {
      console.log(`  Skipped ${j.name} (already exists)`);
      continue;
    }

    await prisma.judge.create({
      data: {
        name: j.name,
        role: j.role,
        expertiseArea: j.expertiseArea,
        bio: j.bio,
        isActive: true,
        totalSubmissionsJudged: 0,
      },
    });
    console.log(`  Created ${j.name} — ${j.role}`);
  }

  const count = await prisma.judge.count({ where: { isActive: true } });
  console.log(`\nDone! ${count} active judges in the panel.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
