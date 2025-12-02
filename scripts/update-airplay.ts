import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🎵 Updating demo artists with airplay...");

  // Get all artists
  const artists = await prisma.artist.findMany();

  for (const artist of artists) {
    let tier: any = "FREE";
    let shares = 1;

    // Give different tiers to demo artists
    if (artist.name === "Luna Star") {
      tier = "TIER_20"; // Silver
      shares = 25;
    } else if (artist.name === "Marcus Chen") {
      tier = "TIER_5"; // Bronze
      shares = 5;
    }

    await prisma.artist.update({
      where: { id: artist.id },
      data: {
        airplayTier: tier,
        airplayActivatedAt: new Date(),
        airplayShares: shares,
      },
    });

    console.log(`✅ ${artist.name}: ${tier} (${shares} shares)`);
  }

  console.log("\n🎉 All demo artists now have airplay activated!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
