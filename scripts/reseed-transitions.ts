/**
 * Re-seed show transitions from existing audio files.
 * Run: npx tsx scripts/reseed-transitions.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const station = await prisma.station.findFirst({ where: { isActive: true } });
  if (!station) { console.error("No station"); process.exit(1); }

  const djs = await prisma.dJ.findMany({ where: { stationId: station.id } });
  const djBySlug = Object.fromEntries(djs.map(d => [d.slug, d]));

  const hank = djBySlug["hank-westwood"];
  const loretta = djBySlug["loretta-merrick"];
  const doc = djBySlug["doc-holloway"] || djBySlug["marcus-doc-holloway"];
  const cody = djBySlug["cody-rampart"];

  if (!hank || !loretta || !doc || !cody) {
    console.error("Missing DJs:", { hank: !!hank, loretta: !!loretta, doc: !!doc, cody: !!cody });
    console.log("Available slugs:", djs.map(d => d.slug));
    process.exit(1);
  }

  // Clear existing transitions
  const deleted = await prisma.showTransition.deleteMany({ where: { stationId: station.id } });
  console.log(`Cleared ${deleted.count} existing transitions`);

  const transitions = [
    // Show Intros
    {
      transitionType: "show_intro", name: "Sunrise & Steel Intro",
      hourOfDay: 6, dayOfWeek: 1, toDjId: hank.id,
      audioFilePath: "/audio/transitions/sunrise-steel-intro.mp3",
      durationSeconds: 12, scriptText: "Good morning, this is Hank Westwood and you're listening to Sunrise & Steel on North Country Radio.",
    },
    {
      transitionType: "show_intro", name: "Transatlantic Sessions Intro",
      hourOfDay: 9, dayOfWeek: 1, toDjId: loretta.id,
      audioFilePath: "/audio/transitions/transatlantic-sessions-intro.mp3",
      durationSeconds: 12, scriptText: "Welcome to The Transatlantic Sessions, I'm Loretta Merrick on North Country Radio.",
    },
    {
      transitionType: "show_intro", name: "The Deep Cuts Intro",
      hourOfDay: 12, dayOfWeek: 1, toDjId: doc.id,
      audioFilePath: "/audio/transitions/deep-cuts-intro.mp3",
      durationSeconds: 10, scriptText: "This is Doc Holloway and you've found The Deep Cuts on North Country Radio.",
    },
    {
      transitionType: "show_intro", name: "The Open Road Intro",
      hourOfDay: 15, dayOfWeek: 1, toDjId: cody.id,
      audioFilePath: "/audio/transitions/open-road-intro.mp3",
      durationSeconds: 8, scriptText: "Cody Rampart here, welcome to The Open Road on North Country Radio.",
    },

    // Show Outros
    {
      transitionType: "show_outro", name: "Sunrise & Steel Outro",
      hourOfDay: 8, dayOfWeek: 1, fromDjId: hank.id,
      audioFilePath: "/audio/transitions/sunrise-steel-outro.mp3",
      durationSeconds: 8, scriptText: "That's it for Sunrise & Steel, I'm Hank Westwood. Loretta's up next.",
    },
    {
      transitionType: "show_outro", name: "Transatlantic Sessions Outro",
      hourOfDay: 11, dayOfWeek: 1, fromDjId: loretta.id,
      audioFilePath: "/audio/transitions/transatlantic-sessions-outro.mp3",
      durationSeconds: 9, scriptText: "Thanks for spending the morning with me. I'm Loretta Merrick, Doc Holloway is on next.",
    },
    {
      transitionType: "show_outro", name: "The Deep Cuts Outro",
      hourOfDay: 14, dayOfWeek: 1, fromDjId: doc.id,
      audioFilePath: "/audio/transitions/deep-cuts-outro.mp3",
      durationSeconds: 8, scriptText: "Doc Holloway here, thanks for digging deep with me. Cody Rampart takes it from here.",
    },
    {
      transitionType: "show_outro", name: "The Open Road Outro",
      hourOfDay: 17, dayOfWeek: 1, fromDjId: cody.id,
      audioFilePath: "/audio/transitions/open-road-outro.mp3",
      durationSeconds: 7, scriptText: "Cody Rampart signing off. Safe travels out there, North Country Radio continues.",
    },

    // Handoffs — Hank to Loretta (9am)
    {
      transitionType: "handoff", name: "Hank to Loretta - Toss",
      hourOfDay: 9, dayOfWeek: 1, fromDjId: hank.id, toDjId: loretta.id,
      handoffGroupId: "hank-to-loretta", handoffPart: 1, handoffPartName: "Toss",
      audioFilePath: "/audio/transitions/morning-to-midday-handoff-part1.mp3",
      durationSeconds: 10, scriptText: "Loretta, the mic is yours. These folks are ready for The Transatlantic Sessions.",
    },
    {
      transitionType: "handoff", name: "Hank to Loretta - Response",
      hourOfDay: 9, dayOfWeek: 1, fromDjId: loretta.id, toDjId: null,
      handoffGroupId: "hank-to-loretta", handoffPart: 2, handoffPartName: "Response",
      audioFilePath: "/audio/transitions/morning-to-midday-response-part2.mp3",
      durationSeconds: 10, scriptText: "Thanks Hank! I've got some beautiful music lined up this morning.",
    },

    // Handoffs — Loretta to Doc (12pm)
    {
      transitionType: "handoff", name: "Loretta to Doc - Toss",
      hourOfDay: 12, dayOfWeek: 1, fromDjId: loretta.id, toDjId: doc.id,
      handoffGroupId: "loretta-to-doc", handoffPart: 1, handoffPartName: "Toss",
      audioFilePath: "/audio/transitions/midday-to-afternoon-handoff-part1.mp3",
      durationSeconds: 10, scriptText: "Doc, I'm passing the baton. Take good care of them.",
    },
    {
      transitionType: "handoff", name: "Loretta to Doc - Response",
      hourOfDay: 12, dayOfWeek: 1, fromDjId: doc.id, toDjId: null,
      handoffGroupId: "loretta-to-doc", handoffPart: 2, handoffPartName: "Response",
      audioFilePath: "/audio/transitions/midday-to-afternoon-response-part2.mp3",
      durationSeconds: 10, scriptText: "Always a pleasure, Loretta. Let's dig into some deep cuts.",
    },

    // Handoffs — Doc to Cody (3pm)
    {
      transitionType: "handoff", name: "Doc to Cody - Toss",
      hourOfDay: 15, dayOfWeek: 1, fromDjId: doc.id, toDjId: cody.id,
      handoffGroupId: "doc-to-cody", handoffPart: 1, handoffPartName: "Toss",
      audioFilePath: "/audio/transitions/afternoon-to-drive-handoff-part1.mp3",
      durationSeconds: 10, scriptText: "Cody, the afternoon crowd is all yours. Keep 'em rolling.",
    },
    {
      transitionType: "handoff", name: "Doc to Cody - Response",
      hourOfDay: 15, dayOfWeek: 1, fromDjId: cody.id, toDjId: null,
      handoffGroupId: "doc-to-cody", handoffPart: 2, handoffPartName: "Response",
      audioFilePath: "/audio/transitions/afternoon-to-drive-response-part2.mp3",
      durationSeconds: 10, scriptText: "Thanks Doc. Windows down, radio up — let's hit The Open Road.",
    },
  ];

  let created = 0;
  for (const t of transitions) {
    await prisma.showTransition.create({
      data: {
        stationId: station.id,
        isActive: true,
        ...t,
      },
    });
    console.log(`  CREATED: ${t.name} (${t.transitionType})`);
    created++;
  }

  console.log(`\nDone: ${created} transitions created`);
  await prisma.$disconnect();
}

main().catch(console.error);
