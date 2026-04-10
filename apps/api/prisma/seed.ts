import { config } from "dotenv";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // ============================================================================
  // USER & PROJECT
  // ============================================================================

  const user = await prisma.user.upsert({
    where: { email: "demo@loreum.app" },
    update: {},
    create: {
      email: "demo@loreum.app",
      name: "Demo User",
      username: "demo",
      profile: { create: {} },
      preferences: { create: {} },
    },
  });

  const project = await prisma.project.upsert({
    where: { slug: "star-wars" },
    update: {},
    create: {
      name: "Star Wars",
      slug: "star-wars",
      description:
        "The original Star Wars trilogy — a space opera following the Rebel Alliance's struggle against the Galactic Empire, and Luke Skywalker's journey from farm boy to Jedi Knight.",
      ownerId: user.id,
    },
  });

  const p = project.id;

  // ============================================================================
  // ITEM TYPES
  // ============================================================================

  const weaponType = await prisma.itemType.upsert({
    where: { projectId_slug: { projectId: p, slug: "weapons" } },
    update: {},
    create: {
      projectId: p,
      name: "Weapons",
      slug: "weapons",
      icon: "⚔️",
      color: "#ef4444",
      fieldSchema: [
        {
          key: "weapon_type",
          label: "Type",
          type: "select",
          options: ["lightsaber", "blaster", "superweapon", "melee"],
        },
        { key: "affiliation", label: "Affiliation", type: "text" },
      ],
    },
  });

  const vehicleType = await prisma.itemType.upsert({
    where: { projectId_slug: { projectId: p, slug: "vehicles" } },
    update: {},
    create: {
      projectId: p,
      name: "Vehicles & Ships",
      slug: "vehicles",
      icon: "🚀",
      color: "#3b82f6",
      fieldSchema: [
        {
          key: "ship_class",
          label: "Class",
          type: "select",
          options: [
            "starfighter",
            "freighter",
            "capital_ship",
            "space_station",
            "speeder",
          ],
        },
        { key: "manufacturer", label: "Manufacturer", type: "text" },
      ],
    },
  });

  // ============================================================================
  // CHARACTERS
  // ============================================================================

  const luke = await prisma.entity.upsert({
    where: { projectId_slug: { projectId: p, slug: "luke-skywalker" } },
    update: {},
    create: {
      projectId: p,
      type: "CHARACTER",
      name: "Luke Skywalker",
      slug: "luke-skywalker",
      summary:
        "A farm boy from Tatooine who discovers he is the son of a fallen Jedi and becomes the galaxy's last hope.",
      description:
        "Luke grows up on his uncle's moisture farm on Tatooine, yearning for adventure. When he intercepts a message from Princess Leia hidden in R2-D2, he is drawn into the Rebel Alliance's fight against the Empire. Under Obi-Wan Kenobi's guidance, he begins to learn the ways of the Force.\n\nHis journey takes him from naive farmboy to Rebel hero to Jedi Knight — and ultimately forces him to confront the truth about his father.",
      backstory:
        "Born to Anakin Skywalker and Padmé Amidala. Hidden on Tatooine as an infant by Obi-Wan Kenobi to protect him from the Emperor. Raised by his uncle Owen and aunt Beru Lars, who told him his father was a navigator on a spice freighter.",
      secrets:
        "Son of Darth Vader. Twin brother of Leia Organa. Both facts hidden from him — and from the Empire — to protect him until he was ready.",
      character: {
        create: {
          status: "alive",
          species: "Human",
          age: "19 (A New Hope) — 23 (Return of the Jedi)",
          role: "protagonist",
        },
      },
    },
  });

  const vader = await prisma.entity.upsert({
    where: { projectId_slug: { projectId: p, slug: "darth-vader" } },
    update: {},
    create: {
      projectId: p,
      type: "CHARACTER",
      name: "Darth Vader",
      slug: "darth-vader",
      summary:
        "Once the Jedi Anakin Skywalker, now the Emperor's enforcer — more machine than man, twisted and evil.",
      description:
        "Darth Vader is the feared enforcer of the Galactic Empire, a towering figure in black armor who commands the Imperial military with ruthless efficiency. He is obsessed with finding and turning Luke Skywalker, sensing the boy's power in the Force.\n\nBeneath the mask is Anakin Skywalker — a fallen Jedi consumed by the dark side, sustained by his suit's life support systems after being burned on Mustafar.",
      backstory:
        "Anakin Skywalker was a gifted Jedi who was seduced by the dark side of the Force. Palpatine exploited his fear of losing Padmé to turn him against the Jedi Order. After his duel with Obi-Wan on Mustafar left him horrifically burned, he was rebuilt in the black suit that sustains his life — and his rage.",
      secrets:
        "Father of Luke Skywalker and Leia Organa. Still has a flicker of good in him — a conflict the Emperor dismisses but Luke senses.",
      character: {
        create: {
          status: "alive",
          species: "Human (cybernetically sustained)",
          age: "41 (A New Hope) — 45 (Return of the Jedi)",
          role: "antagonist",
        },
      },
    },
  });

  const leia = await prisma.entity.upsert({
    where: { projectId_slug: { projectId: p, slug: "leia-organa" } },
    update: {},
    create: {
      projectId: p,
      type: "CHARACTER",
      name: "Leia Organa",
      slug: "leia-organa",
      summary:
        "Princess of Alderaan, leader of the Rebel Alliance, and one of the galaxy's most determined fighters for freedom.",
      description:
        "Leia is a senator, a diplomat, a general, and a princess — but above all, a leader. She is fierce, pragmatic, and unwilling to let the Empire crush the galaxy without a fight. She carries the stolen Death Star plans that set the entire saga in motion.",
      backstory:
        "Adopted daughter of Bail Organa and Queen Breha of Alderaan. She was raised in royalty and politics, secretly supporting the Rebellion from within the Imperial Senate.",
      secrets:
        "Twin sister of Luke Skywalker. Daughter of Darth Vader. Force-sensitive, though untrained.",
      character: {
        create: {
          status: "alive",
          species: "Human",
          age: "19 (A New Hope) — 23 (Return of the Jedi)",
          role: "deuteragonist",
        },
      },
    },
  });

  const han = await prisma.entity.upsert({
    where: { projectId_slug: { projectId: p, slug: "han-solo" } },
    update: {},
    create: {
      projectId: p,
      type: "CHARACTER",
      name: "Han Solo",
      slug: "han-solo",
      summary:
        "A smuggler with a heart of gold, captain of the Millennium Falcon, and reluctant hero of the Rebellion.",
      description:
        "Han Solo is a Corellian smuggler who owes money to Jabba the Hutt and wants nothing to do with the Rebellion — until he meets Luke and Leia. Brash, cynical, and self-interested on the surface, he repeatedly risks his life for his friends when it matters.",
      backstory:
        "A former Imperial cadet who deserted and fell into smuggling. Won the Millennium Falcon from Lando Calrissian in a game of sabacc. His co-pilot Chewbacca owes him a life debt.",
      character: {
        create: {
          status: "alive",
          species: "Human",
          age: "29 (A New Hope) — 33 (Return of the Jedi)",
          role: "deuteragonist",
        },
      },
    },
  });

  const obiwan = await prisma.entity.upsert({
    where: { projectId_slug: { projectId: p, slug: "obi-wan-kenobi" } },
    update: {},
    create: {
      projectId: p,
      type: "CHARACTER",
      name: "Obi-Wan Kenobi",
      slug: "obi-wan-kenobi",
      summary:
        "A Jedi Master in hiding who mentors Luke and sets him on the path to becoming a Jedi.",
      description:
        "Living as a hermit on Tatooine under the name \"Ben,\" Obi-Wan has spent nearly two decades watching over Luke from a distance. When Luke finds Leia's message, Obi-Wan seizes the moment to begin Luke's training and rejoin the fight against the Empire.",
      backstory:
        "Former Jedi Knight who trained Anakin Skywalker and fought him on Mustafar when Anakin turned to the dark side. He has carried the guilt of failing his apprentice ever since.",
      character: {
        create: {
          status: "deceased",
          species: "Human",
          age: "57 (A New Hope)",
          role: "mentor",
        },
      },
    },
  });

  const palpatine = await prisma.entity.upsert({
    where: { projectId_slug: { projectId: p, slug: "emperor-palpatine" } },
    update: {},
    create: {
      projectId: p,
      type: "CHARACTER",
      name: "Emperor Palpatine",
      slug: "emperor-palpatine",
      summary:
        "The Sith Lord who orchestrated the fall of the Republic, the destruction of the Jedi, and the rise of the Galactic Empire.",
      description:
        "Palpatine is the ultimate puppet master — a Sith Lord who manipulated galactic politics for decades to seize absolute power. He rules the Empire through fear, with the Death Star as his ultimate instrument of control. He seeks to turn Luke to the dark side as Vader's replacement.",
      character: {
        create: {
          status: "alive",
          species: "Human",
          role: "antagonist",
        },
      },
    },
  });

  const yoda = await prisma.entity.upsert({
    where: { projectId_slug: { projectId: p, slug: "yoda" } },
    update: {},
    create: {
      projectId: p,
      type: "CHARACTER",
      name: "Yoda",
      slug: "yoda",
      summary:
        "The ancient Jedi Grand Master who trains Luke in the ways of the Force on the swamp planet Dagobah.",
      description:
        "Small in stature, immense in power. Yoda is nearly 900 years old and has trained Jedi for centuries. After the fall of the Republic, he exiled himself to Dagobah. He is Luke's final teacher — and the one who confirms the truth about Vader.",
      character: {
        create: {
          status: "alive",
          species: "Unknown",
          age: "~900",
          role: "mentor",
        },
      },
    },
  });

  const chewie = await prisma.entity.upsert({
    where: { projectId_slug: { projectId: p, slug: "chewbacca" } },
    update: {},
    create: {
      projectId: p,
      type: "CHARACTER",
      name: "Chewbacca",
      slug: "chewbacca",
      summary:
        "A Wookiee warrior and Han Solo's loyal co-pilot aboard the Millennium Falcon.",
      description:
        "Chewbacca is a towering Wookiee from Kashyyyk — fiercely loyal, incredibly strong, and a skilled mechanic. He co-pilots the Falcon and would die for Han without hesitation.",
      character: {
        create: {
          status: "alive",
          species: "Wookiee",
          age: "~200",
          role: "supporting",
        },
      },
    },
  });

  const lando = await prisma.entity.upsert({
    where: { projectId_slug: { projectId: p, slug: "lando-calrissian" } },
    update: {},
    create: {
      projectId: p,
      type: "CHARACTER",
      name: "Lando Calrissian",
      slug: "lando-calrissian",
      summary:
        "The charming administrator of Cloud City who is forced to betray Han, then joins the Rebellion to make it right.",
      description:
        "Lando is a gambler, a scoundrel, and a businessman who runs Cloud City on Bespin. When the Empire arrives, he is forced to hand over Han and his friends. Racked with guilt, he helps them escape and joins the Rebellion, eventually leading the assault on the second Death Star.",
      character: {
        create: {
          status: "alive",
          species: "Human",
          role: "supporting",
        },
      },
    },
  });

  // ============================================================================
  // ORGANIZATIONS
  // ============================================================================

  const rebelAlliance = await prisma.entity.upsert({
    where: { projectId_slug: { projectId: p, slug: "rebel-alliance" } },
    update: {},
    create: {
      projectId: p,
      type: "ORGANIZATION",
      name: "Rebel Alliance",
      slug: "rebel-alliance",
      summary:
        "A coalition of freedom fighters waging guerrilla war against the Galactic Empire to restore the Republic.",
      description:
        "The Alliance to Restore the Republic — commonly known as the Rebel Alliance — is an organized resistance movement fighting the tyranny of the Empire. Outgunned and outnumbered, they rely on hit-and-run tactics, stolen intelligence, and the courage of their pilots and soldiers.",
      organization: {
        create: {
          ideology:
            "Restore democracy and the Republic. Freedom from Imperial tyranny.",
          territory: "Mobile bases — Yavin 4, Hoth, various fleet positions",
          status: "active",
        },
      },
    },
  });

  const empire = await prisma.entity.upsert({
    where: { projectId_slug: { projectId: p, slug: "galactic-empire" } },
    update: {},
    create: {
      projectId: p,
      type: "ORGANIZATION",
      name: "Galactic Empire",
      slug: "galactic-empire",
      summary:
        "The authoritarian regime that rules the galaxy through fear, military might, and the power of the dark side.",
      description:
        "Formed from the ashes of the Galactic Republic, the Empire controls thousands of star systems through a vast military and the doctrine of fear. The Emperor rules from Coruscant, with Darth Vader as his enforcer and regional governors maintaining order through force.",
      organization: {
        create: {
          ideology:
            "Order through strength. Peace through fear. The Tarkin Doctrine.",
          territory: "The entire galaxy — thousands of star systems",
          status: "active",
        },
      },
    },
  });

  const jediOrder = await prisma.entity.upsert({
    where: { projectId_slug: { projectId: p, slug: "jedi-order" } },
    update: {},
    create: {
      projectId: p,
      type: "ORGANIZATION",
      name: "Jedi Order",
      slug: "jedi-order",
      summary:
        "The ancient order of Force-wielding peacekeepers, nearly wiped out by the Empire. Only a handful survive.",
      description:
        "For thousands of generations, the Jedi Knights were the guardians of peace and justice in the Old Republic. The Emperor hunted them to near-extinction. By the time of A New Hope, only Obi-Wan and Yoda remain — the last hope for passing on the Jedi tradition.",
      organization: {
        create: {
          ideology:
            "Peace, knowledge, and harmony through the light side of the Force.",
          territory:
            "Formerly the Jedi Temple on Coruscant — now scattered and hidden",
          status: "destroyed",
        },
      },
    },
  });

  // ============================================================================
  // LOCATIONS
  // ============================================================================

  const tatooine = await prisma.entity.upsert({
    where: { projectId_slug: { projectId: p, slug: "tatooine" } },
    update: {},
    create: {
      projectId: p,
      type: "LOCATION",
      name: "Tatooine",
      slug: "tatooine",
      summary:
        "A remote desert planet on the Outer Rim — Luke's homeworld and a haven for smugglers and criminals.",
      description:
        'A harsh, sun-scorched world orbiting twin suns. Moisture farming is the primary livelihood. Mos Eisley is its most notorious spaceport — "a wretched hive of scum and villainy." Jabba the Hutt operates his criminal empire from a palace in the Dune Sea.',
      location: {
        create: {
          region: "Outer Rim Territories",
          condition: "harsh",
        },
      },
    },
  });

  const dagobah = await prisma.entity.upsert({
    where: { projectId_slug: { projectId: p, slug: "dagobah" } },
    update: {},
    create: {
      projectId: p,
      type: "LOCATION",
      name: "Dagobah",
      slug: "dagobah",
      summary:
        "A swamp planet where Yoda lives in exile, strong with the Force.",
      description:
        "A fog-shrouded world of swamps, bogs, and twisted trees. The planet teems with life but is virtually uninhabited by sentient beings. Its strong Force presence masks Yoda's location from the Empire.",
      location: {
        create: {
          region: "Outer Rim Territories",
          condition: "wild",
        },
      },
    },
  });

  const hoth = await prisma.entity.upsert({
    where: { projectId_slug: { projectId: p, slug: "hoth" } },
    update: {},
    create: {
      projectId: p,
      type: "LOCATION",
      name: "Hoth",
      slug: "hoth",
      summary:
        "A frozen wasteland that served as the Rebel Alliance's secret base — until the Empire found them.",
      description:
        "An ice planet of glaciers, blizzards, and sub-zero temperatures. The Rebels established Echo Base here, hidden in ice caverns. The Battle of Hoth forced a desperate evacuation.",
      location: {
        create: {
          region: "Outer Rim Territories",
          condition: "frozen",
        },
      },
    },
  });

  const bespin = await prisma.entity.upsert({
    where: { projectId_slug: { projectId: p, slug: "bespin" } },
    update: {},
    create: {
      projectId: p,
      type: "LOCATION",
      name: "Bespin (Cloud City)",
      slug: "bespin",
      summary:
        "A gas giant with a floating mining colony — the site of Vader's trap and Luke's devastating revelation.",
      description:
        "Cloud City floats in the upper atmosphere of Bespin, a gas giant. Lando Calrissian administers the tibanna gas mining operation. The city tries to stay neutral in the Galactic Civil War — until Vader arrives and forces Lando's hand.",
      location: {
        create: {
          region: "Outer Rim Territories",
          condition: "functional",
        },
      },
    },
  });

  const endor = await prisma.entity.upsert({
    where: { projectId_slug: { projectId: p, slug: "endor" } },
    update: {},
    create: {
      projectId: p,
      type: "LOCATION",
      name: "Endor",
      slug: "endor",
      summary:
        "A forest moon where the second Death Star's shield generator is hidden — and where the Empire falls.",
      description:
        "The forest moon of Endor is a lush world of towering trees, home to the Ewoks. The Empire built the shield generator for the second Death Star here, making it the target of the Rebel strike team that would decide the fate of the galaxy.",
      location: {
        create: {
          region: "Outer Rim Territories",
          condition: "pristine",
        },
      },
    },
  });

  // ============================================================================
  // ITEMS (Weapons & Vehicles)
  // ============================================================================

  const deathStar = await prisma.entity.upsert({
    where: { projectId_slug: { projectId: p, slug: "death-star" } },
    update: {},
    create: {
      projectId: p,
      type: "ITEM",
      name: "Death Star",
      slug: "death-star",
      summary:
        "The Empire's planet-destroying battle station — the ultimate symbol of Imperial power and hubris.",
      description:
        "A moon-sized space station armed with a superlaser capable of destroying an entire planet. The first Death Star destroyed Alderaan as a demonstration. Its thermal exhaust port vulnerability was exploited by Luke Skywalker. A second, larger Death Star was constructed over Endor.",
      item: {
        create: {
          itemTypeId: weaponType.id,
          fields: JSON.stringify({
            weapon_type: "superweapon",
            affiliation: "Galactic Empire",
          }),
        },
      },
    },
  });

  const falcon = await prisma.entity.upsert({
    where: { projectId_slug: { projectId: p, slug: "millennium-falcon" } },
    update: {},
    create: {
      projectId: p,
      type: "ITEM",
      name: "Millennium Falcon",
      slug: "millennium-falcon",
      summary:
        "The fastest hunk of junk in the galaxy — Han Solo's beloved Corellian freighter.",
      description:
        "A heavily modified YT-1300 Corellian freighter. She may not look like much, but she's got it where it counts. The Falcon made the Kessel Run in less than twelve parsecs and has outrun Imperial Star Destroyers on multiple occasions.",
      item: {
        create: {
          itemTypeId: vehicleType.id,
          fields: JSON.stringify({
            ship_class: "freighter",
            manufacturer: "Corellian Engineering Corporation",
          }),
        },
      },
    },
  });

  // ============================================================================
  // TAGS
  // ============================================================================

  const tagMap: Record<string, string> = {};
  const tagNames = [
    "protagonist",
    "antagonist",
    "jedi",
    "sith",
    "rebel",
    "imperial",
    "force-sensitive",
    "smuggler",
    "droid",
    "pilot",
    "outer-rim",
    "core-worlds",
    "dark-side",
    "light-side",
    "original-trilogy",
    "battle",
    "mentor",
    "redemption",
  ];

  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { projectId_name: { projectId: p, name } },
      update: {},
      create: { projectId: p, name },
    });
    tagMap[name] = tag.id;
  }

  await prisma.entityTag.createMany({
    data: [
      { entityId: luke.id, tagId: tagMap["protagonist"]! },
      { entityId: luke.id, tagId: tagMap["jedi"]! },
      { entityId: luke.id, tagId: tagMap["force-sensitive"]! },
      { entityId: luke.id, tagId: tagMap["pilot"]! },
      { entityId: vader.id, tagId: tagMap["antagonist"]! },
      { entityId: vader.id, tagId: tagMap["sith"]! },
      { entityId: vader.id, tagId: tagMap["dark-side"]! },
      { entityId: vader.id, tagId: tagMap["redemption"]! },
      { entityId: leia.id, tagId: tagMap["rebel"]! },
      { entityId: leia.id, tagId: tagMap["force-sensitive"]! },
      { entityId: han.id, tagId: tagMap["smuggler"]! },
      { entityId: han.id, tagId: tagMap["pilot"]! },
      { entityId: obiwan.id, tagId: tagMap["jedi"]! },
      { entityId: obiwan.id, tagId: tagMap["mentor"]! },
      { entityId: palpatine.id, tagId: tagMap["sith"]! },
      { entityId: palpatine.id, tagId: tagMap["antagonist"]! },
      { entityId: yoda.id, tagId: tagMap["jedi"]! },
      { entityId: yoda.id, tagId: tagMap["mentor"]! },
      { entityId: rebelAlliance.id, tagId: tagMap["rebel"]! },
      { entityId: empire.id, tagId: tagMap["imperial"]! },
      { entityId: jediOrder.id, tagId: tagMap["jedi"]! },
      { entityId: jediOrder.id, tagId: tagMap["light-side"]! },
      { entityId: tatooine.id, tagId: tagMap["outer-rim"]! },
      { entityId: hoth.id, tagId: tagMap["outer-rim"]! },
      { entityId: hoth.id, tagId: tagMap["battle"]! },
      { entityId: endor.id, tagId: tagMap["battle"]! },
      { entityId: deathStar.id, tagId: tagMap["imperial"]! },
      { entityId: falcon.id, tagId: tagMap["smuggler"]! },
    ],
    skipDuplicates: true,
  });

  // ============================================================================
  // RELATIONSHIPS
  // ============================================================================

  await prisma.relationship.deleteMany({ where: { projectId: p } });

  await prisma.relationship.createMany({
    data: [
      // Family
      {
        projectId: p,
        sourceEntityId: vader.id,
        targetEntityId: luke.id,
        label: "Father",
        description:
          'Vader is Luke\'s father — the central revelation of the saga. "I am your father."',
        bidirectional: false,
      },
      {
        projectId: p,
        sourceEntityId: vader.id,
        targetEntityId: leia.id,
        label: "Father (unknown)",
        description:
          "Vader is Leia's biological father, though neither knows it for most of the trilogy.",
      },
      {
        projectId: p,
        sourceEntityId: luke.id,
        targetEntityId: leia.id,
        label: "Twin siblings",
        description:
          "Separated at birth to hide them from the Empire. They don't learn the truth until Return of the Jedi.",
        bidirectional: true,
      },

      // Mentorship
      {
        projectId: p,
        sourceEntityId: obiwan.id,
        targetEntityId: luke.id,
        label: "Mentor",
        description:
          "Obi-Wan begins Luke's Jedi training and guides him toward his destiny.",
      },
      {
        projectId: p,
        sourceEntityId: yoda.id,
        targetEntityId: luke.id,
        label: "Master",
        description:
          "Yoda completes Luke's training on Dagobah, teaching him patience and the deeper mysteries of the Force.",
      },
      {
        projectId: p,
        sourceEntityId: palpatine.id,
        targetEntityId: vader.id,
        label: "Sith Master",
        description:
          "Palpatine seduced Anakin to the dark side and controls him through a combination of manipulation and the promise of power.",
      },

      // Rivalries & Conflict
      {
        projectId: p,
        sourceEntityId: luke.id,
        targetEntityId: vader.id,
        label: "Destined confrontation",
        description:
          "Luke must face his father — the Emperor wants him turned, Vader wants him as an ally, and Luke believes he can be redeemed.",
      },
      {
        projectId: p,
        sourceEntityId: rebelAlliance.id,
        targetEntityId: empire.id,
        label: "Galactic Civil War",
        description:
          "The central military conflict of the trilogy. A guerrilla uprising against overwhelming military power.",
        bidirectional: true,
      },
      {
        projectId: p,
        sourceEntityId: han.id,
        targetEntityId: leia.id,
        label: "Love interest",
        description:
          'They bicker constantly and fall in love. Han\'s carbonite freezing and Leia\'s "I love you" / "I know" is one of cinema\'s great moments.',
        bidirectional: true,
      },

      // Allegiances
      {
        projectId: p,
        sourceEntityId: han.id,
        targetEntityId: chewie.id,
        label: "Co-pilot & life debt",
        description:
          "Chewbacca swore a life debt to Han after Han saved him. They're inseparable.",
        bidirectional: true,
      },
      {
        projectId: p,
        sourceEntityId: han.id,
        targetEntityId: lando.id,
        label: "Old friend / betrayer / ally",
        description:
          "Lando loses the Falcon to Han in a card game. Later betrays him to Vader under duress. Then joins the Rebellion to make it right.",
      },
      {
        projectId: p,
        sourceEntityId: han.id,
        targetEntityId: falcon.id,
        label: "Captain",
        description:
          "Han won the Falcon from Lando and has modified her extensively. She's his pride and joy.",
      },

      // Organizational
      {
        projectId: p,
        sourceEntityId: luke.id,
        targetEntityId: rebelAlliance.id,
        label: "Pilot / Commander",
        description:
          "Luke joins as a pilot and becomes one of the Rebellion's most important figures after destroying the Death Star.",
      },
      {
        projectId: p,
        sourceEntityId: leia.id,
        targetEntityId: rebelAlliance.id,
        label: "Leader",
        description:
          "Leia is one of the Rebellion's foremost leaders, organizing resistance from within the Imperial Senate.",
      },
      {
        projectId: p,
        sourceEntityId: vader.id,
        targetEntityId: empire.id,
        label: "Supreme Commander",
        description:
          "Vader commands the Imperial fleet and answers only to the Emperor.",
      },

      // Location connections
      {
        projectId: p,
        sourceEntityId: empire.id,
        targetEntityId: deathStar.id,
        label: "Constructed",
        description:
          "The Death Star is the Empire's ultimate weapon — the physical embodiment of the Tarkin Doctrine: rule through fear of force rather than force itself.",
      },
    ],
    skipDuplicates: true,
  });

  // ============================================================================
  // TIMELINE
  // ============================================================================

  const preludeEra = await prisma.era.upsert({
    where: { projectId_slug: { projectId: p, slug: "prelude" } },
    update: {},
    create: {
      projectId: p,
      name: "Prelude",
      slug: "prelude",
      description: "The fall of the Republic and the rise of the Empire.",
      color: "#6366f1",
      startDate: -19,
      endDate: 0,
      sortOrder: 1,
    },
  });

  const civilWarEra = await prisma.era.upsert({
    where: { projectId_slug: { projectId: p, slug: "galactic-civil-war" } },
    update: {},
    create: {
      projectId: p,
      name: "Galactic Civil War",
      slug: "galactic-civil-war",
      description:
        "The Rebel Alliance fights the Empire. The original trilogy.",
      color: "#ef4444",
      startDate: 0,
      endDate: 4,
      sortOrder: 2,
    },
  });

  // Timeline Events (using BBY/ABY — Before/After Battle of Yavin)
  const jediPurge = await prisma.timelineEvent.upsert({
    where: { id: "seed-jedi-purge" },
    update: {},
    create: {
      id: "seed-jedi-purge",
      projectId: p,
      name: "The Jedi Purge (Order 66)",
      description:
        "The Emperor executes Order 66, turning the clone army against the Jedi. Nearly all Jedi are killed. Obi-Wan and Yoda go into hiding.",
      date: "19 BBY",
      dateValue: -19,
      sortOrder: 1,
      significance: "critical",
      eraId: preludeEra.id,
    },
  });

  const alderaanDestroyed = await prisma.timelineEvent.upsert({
    where: { id: "seed-alderaan" },
    update: {},
    create: {
      id: "seed-alderaan",
      projectId: p,
      name: "Destruction of Alderaan",
      description:
        "Grand Moff Tarkin orders the Death Star to destroy Alderaan as a demonstration of Imperial power. Leia is forced to watch her homeworld die.",
      date: "0 BBY",
      dateValue: 0,
      sortOrder: 2,
      significance: "critical",
      eraId: civilWarEra.id,
    },
  });

  const yavin = await prisma.timelineEvent.upsert({
    where: { id: "seed-battle-yavin" },
    update: {},
    create: {
      id: "seed-battle-yavin",
      projectId: p,
      name: "Battle of Yavin",
      description:
        "Luke Skywalker destroys the first Death Star with a proton torpedo guided by the Force. The Rebellion's first major victory.",
      date: "0 ABY",
      dateValue: 0,
      sortOrder: 3,
      significance: "critical",
      eraId: civilWarEra.id,
    },
  });

  const hothBattle = await prisma.timelineEvent.upsert({
    where: { id: "seed-battle-hoth" },
    update: {},
    create: {
      id: "seed-battle-hoth",
      projectId: p,
      name: "Battle of Hoth",
      description:
        "The Empire discovers the Rebel base on Hoth and launches a ground assault with AT-AT walkers. The Rebels are forced to evacuate.",
      date: "3 ABY",
      dateValue: 3,
      sortOrder: 4,
      significance: "major",
      eraId: civilWarEra.id,
    },
  });

  const carbonite = await prisma.timelineEvent.upsert({
    where: { id: "seed-carbonite" },
    update: {},
    create: {
      id: "seed-carbonite",
      projectId: p,
      name: "Han Solo frozen in carbonite",
      description:
        "Vader captures Han on Bespin and freezes him in carbonite as a test before attempting the same on Luke. Boba Fett takes Han to Jabba the Hutt.",
      date: "3 ABY",
      dateValue: 3,
      sortOrder: 5,
      significance: "major",
      eraId: civilWarEra.id,
    },
  });

  const iAmYourFather = await prisma.timelineEvent.upsert({
    where: { id: "seed-revelation" },
    update: {},
    create: {
      id: "seed-revelation",
      projectId: p,
      name: '"I am your father"',
      description:
        "Vader reveals to Luke that he is his father during their duel on Cloud City. Luke chooses to fall rather than join the dark side.",
      date: "3 ABY",
      dateValue: 3,
      sortOrder: 6,
      significance: "critical",
      eraId: civilWarEra.id,
    },
  });

  const endorBattle = await prisma.timelineEvent.upsert({
    where: { id: "seed-battle-endor" },
    update: {},
    create: {
      id: "seed-battle-endor",
      projectId: p,
      name: "Battle of Endor",
      description:
        "The Rebellion launches a coordinated assault — ground team disables the shield, fleet attacks the Death Star, Luke confronts the Emperor. Vader turns on Palpatine to save his son.",
      date: "4 ABY",
      dateValue: 4,
      sortOrder: 7,
      significance: "critical",
      eraId: civilWarEra.id,
    },
  });

  const vaderRedemption = await prisma.timelineEvent.upsert({
    where: { id: "seed-vader-redemption" },
    update: {},
    create: {
      id: "seed-vader-redemption",
      projectId: p,
      name: "Vader's Redemption",
      description:
        "Anakin Skywalker returns. He kills the Emperor to save Luke, fulfilling the prophecy of the Chosen One. He dies in his son's arms — finally free.",
      date: "4 ABY",
      dateValue: 4,
      sortOrder: 8,
      significance: "critical",
      eraId: civilWarEra.id,
    },
  });

  // Link entities to timeline events
  await prisma.timelineEventEntity.createMany({
    data: [
      {
        timelineEventId: jediPurge.id,
        entityId: palpatine.id,
        role: "instigator",
      },
      { timelineEventId: jediPurge.id, entityId: obiwan.id, role: "survivor" },
      { timelineEventId: jediPurge.id, entityId: yoda.id, role: "survivor" },
      {
        timelineEventId: alderaanDestroyed.id,
        entityId: leia.id,
        role: "witness",
      },
      { timelineEventId: yavin.id, entityId: luke.id, role: "hero" },
      {
        timelineEventId: hothBattle.id,
        entityId: rebelAlliance.id,
        role: "defenders",
      },
      {
        timelineEventId: hothBattle.id,
        entityId: empire.id,
        role: "attackers",
      },
      { timelineEventId: carbonite.id, entityId: han.id, role: "victim" },
      { timelineEventId: carbonite.id, entityId: vader.id, role: "instigator" },
      { timelineEventId: iAmYourFather.id, entityId: luke.id, role: "subject" },
      {
        timelineEventId: iAmYourFather.id,
        entityId: vader.id,
        role: "subject",
      },
      {
        timelineEventId: endorBattle.id,
        entityId: lando.id,
        role: "fleet commander",
      },
      {
        timelineEventId: endorBattle.id,
        entityId: han.id,
        role: "ground team leader",
      },
      {
        timelineEventId: vaderRedemption.id,
        entityId: vader.id,
        role: "subject",
      },
      {
        timelineEventId: vaderRedemption.id,
        entityId: luke.id,
        role: "catalyst",
      },
      {
        timelineEventId: vaderRedemption.id,
        entityId: palpatine.id,
        role: "victim",
      },
    ],
    skipDuplicates: true,
  });

  // ============================================================================
  // LORE ARTICLES
  // ============================================================================

  await prisma.loreArticle.upsert({
    where: { projectId_slug: { projectId: p, slug: "the-force" } },
    update: {},
    create: {
      projectId: p,
      title: "The Force",
      slug: "the-force",
      category: "mysticism",
      content: `# The Force

An energy field created by all living things. It surrounds us, penetrates us, and binds the galaxy together.

## Light Side vs Dark Side

The Force has two aspects. The light side is accessed through calm, discipline, and selflessness. The dark side feeds on anger, fear, and aggression — it is quicker, easier, more seductive, but ultimately destructive.

## The Jedi Way

The Jedi are trained to use the Force for knowledge and defense, never for attack. They practice emotional detachment, which is both their strength (clarity of purpose) and their weakness (disconnection from the people they protect).

## The Sith

The Sith embrace the dark side, using passion and anger as fuel. The Rule of Two dictates there can only ever be two Sith — a master and an apprentice. Palpatine is the master; Vader is the apprentice.

## Key Abilities

- **Telekinesis** — moving objects with the mind
- **Mind tricks** — influencing the weak-minded
- **Force sense** — feeling the presence of others, sensing danger
- **Force lightning** — a dark side attack (used by the Emperor)
- **Force ghosts** — Jedi who retain consciousness after death (Obi-Wan, Yoda, Anakin)`,
      entities: {
        create: [
          { entityId: luke.id },
          { entityId: vader.id },
          { entityId: yoda.id },
          { entityId: obiwan.id },
          { entityId: palpatine.id },
        ],
      },
    },
  });

  await prisma.loreArticle.upsert({
    where: { projectId_slug: { projectId: p, slug: "the-galactic-civil-war" } },
    update: {},
    create: {
      projectId: p,
      title: "The Galactic Civil War",
      slug: "the-galactic-civil-war",
      category: "history",
      content: `# The Galactic Civil War

The conflict between the Rebel Alliance and the Galactic Empire — the backdrop of the original trilogy.

## Origins

After Palpatine dissolved the Imperial Senate, the last vestiges of democratic governance vanished. Regional governors now had direct control, backed by the threat of the Death Star. The Rebellion, which had been building in secret for years, became an open military resistance.

## Key Battles

1. **Battle of Scarif** — The Rebels steal the Death Star plans at enormous cost
2. **Battle of Yavin** — Luke destroys the first Death Star
3. **Battle of Hoth** — The Empire strikes back, routing the Rebels from their base
4. **Battle of Endor** — The decisive engagement. The second Death Star is destroyed, the Emperor is killed, and the Empire begins to fracture

## The Rebellion's Strategy

Outgunned in every conventional metric, the Rebels rely on mobility, intelligence networks, and the willingness to sacrifice. They cannot hold territory — they can only strike and move. The destruction of the Death Star at Yavin proved that the Empire's superweapons have exploitable weaknesses.

## The Empire's Weakness

Overconfidence. The Emperor's entire strategy depends on fear — and when the Death Star is destroyed, that fear evaporates. The Empire is too vast, too rigid, and too dependent on centralized command to adapt when its leadership falls.`,
      entities: {
        create: [{ entityId: rebelAlliance.id }, { entityId: empire.id }],
      },
    },
  });

  // ============================================================================
  // STORYBOARD
  // ============================================================================

  // Plotlines
  const lukeJourney = await prisma.plotline.upsert({
    where: { projectId_slug: { projectId: p, slug: "lukes-journey" } },
    update: {},
    create: {
      projectId: p,
      name: "Luke's Journey",
      slug: "lukes-journey",
      description:
        "Luke's arc from farm boy to Jedi Knight — and his choice to redeem his father rather than destroy him.",
      thematicStatement:
        "The son will not repeat the sins of the father. Compassion succeeds where power fails.",
      sortOrder: 1,
      plotPoints: {
        create: [
          {
            sequenceNumber: 1,
            title: "The Call",
            label: "inciting incident",
            description:
              "Luke finds Leia's message in R2-D2 and meets Obi-Wan.",
            entityId: luke.id,
          },
          {
            sequenceNumber: 2,
            title: "Entering the Conflict",
            label: "rising action",
            description:
              "Luke joins the Rebellion and destroys the Death Star.",
          },
          {
            sequenceNumber: 3,
            title: "The Revelation",
            label: "midpoint",
            description:
              "Vader reveals he is Luke's father. Everything changes.",
            entityId: vader.id,
          },
          {
            sequenceNumber: 4,
            title: "The Confrontation",
            label: "climax",
            description:
              "Luke faces the Emperor, refuses the dark side, and redeems Vader.",
          },
          {
            sequenceNumber: 5,
            title: "The New Jedi",
            label: "resolution",
            description:
              "With the Emperor dead and Vader redeemed, Luke is the last Jedi — and the first of a new generation.",
          },
        ],
      },
    },
  });

  const rebelWarPlotline = await prisma.plotline.upsert({
    where: { projectId_slug: { projectId: p, slug: "rebel-war" } },
    update: {},
    create: {
      projectId: p,
      name: "The Rebellion",
      slug: "rebel-war",
      description:
        "The military struggle between the Rebel Alliance and the Galactic Empire.",
      thematicStatement:
        "A small group of committed people can topple a galactic tyranny — but the cost is enormous.",
      sortOrder: 2,
    },
  });

  const vaderRedemptionPlotline = await prisma.plotline.upsert({
    where: { projectId_slug: { projectId: p, slug: "vaders-redemption" } },
    update: {},
    create: {
      projectId: p,
      name: "Vader's Redemption",
      slug: "vaders-redemption",
      description:
        "The buried conflict within Darth Vader — Anakin Skywalker is not entirely gone.",
      thematicStatement:
        "No one is beyond redemption, but redemption costs everything.",
      sortOrder: 3,
    },
  });

  // Works
  const aNewHope = await prisma.work.upsert({
    where: { projectId_slug: { projectId: p, slug: "a-new-hope" } },
    update: {},
    create: {
      projectId: p,
      title: "Episode IV: A New Hope",
      slug: "a-new-hope",
      chronologicalOrder: 4,
      releaseOrder: 1,
      synopsis:
        "A farm boy, a princess, a smuggler, and an old wizard take on the most powerful weapon in the galaxy.",
      status: "complete",
    },
  });

  const empireStrikesBack = await prisma.work.upsert({
    where: {
      projectId_slug: { projectId: p, slug: "the-empire-strikes-back" },
    },
    update: {},
    create: {
      projectId: p,
      title: "Episode V: The Empire Strikes Back",
      slug: "the-empire-strikes-back",
      chronologicalOrder: 5,
      releaseOrder: 2,
      synopsis:
        "The Empire retaliates. Luke trains with Yoda. Han is captured. Vader reveals the truth.",
      status: "complete",
    },
  });

  const returnOfTheJedi = await prisma.work.upsert({
    where: { projectId_slug: { projectId: p, slug: "return-of-the-jedi" } },
    update: {},
    create: {
      projectId: p,
      title: "Episode VI: Return of the Jedi",
      slug: "return-of-the-jedi",
      chronologicalOrder: 6,
      releaseOrder: 3,
      synopsis:
        "The Rebels launch their final assault on the Empire. Luke confronts Vader and the Emperor. Anakin Skywalker returns.",
      status: "complete",
    },
  });

  // Chapters & Scenes for A New Hope
  const anhCh1 = await prisma.chapter.create({
    data: {
      workId: aNewHope.id,
      title: "Tatooine",
      sequenceNumber: 1,
      notes:
        "Introduce Luke, the droids, Obi-Wan. Establish the ordinary world, then shatter it.",
    },
  });

  const anhCh2 = await prisma.chapter.create({
    data: {
      workId: aNewHope.id,
      title: "Mos Eisley & The Falcon",
      sequenceNumber: 2,
      notes: "Introduce Han and Chewie. Get everyone off Tatooine.",
    },
  });

  const anhCh3 = await prisma.chapter.create({
    data: {
      workId: aNewHope.id,
      title: "The Death Star",
      sequenceNumber: 3,
      notes: "Rescue Leia. Obi-Wan confronts Vader. Escape.",
    },
  });

  const anhCh4 = await prisma.chapter.create({
    data: {
      workId: aNewHope.id,
      title: "Battle of Yavin",
      sequenceNumber: 4,
      notes:
        "The trench run. Luke trusts the Force. The Death Star is destroyed.",
    },
  });

  await prisma.scene.createMany({
    data: [
      {
        chapterId: anhCh1.id,
        title: "Binary Sunset",
        sequenceNumber: 1,
        plotlineId: lukeJourney.id,
        locationId: tatooine.id,
        description:
          "Luke stares at the twin suns, yearning for something more. The Force theme swells. This is the moment the audience falls in love with him.",
      },
      {
        chapterId: anhCh1.id,
        title: "Leia's Message",
        sequenceNumber: 2,
        plotlineId: lukeJourney.id,
        description: '"Help me, Obi-Wan Kenobi. You\'re my only hope."',
      },
      {
        chapterId: anhCh2.id,
        title: "Cantina",
        sequenceNumber: 1,
        plotlineId: rebelWarPlotline.id,
        description:
          "Luke and Obi-Wan meet Han Solo and Chewbacca in Mos Eisley Cantina. Han agrees to fly them to Alderaan.",
      },
      {
        chapterId: anhCh3.id,
        title: "Rescue the Princess",
        sequenceNumber: 1,
        plotlineId: rebelWarPlotline.id,
        description:
          "Luke, Han, and Chewie disguise themselves as stormtroopers and break Leia out of the detention block.",
      },
      {
        chapterId: anhCh3.id,
        title: "Obi-Wan vs Vader",
        sequenceNumber: 2,
        plotlineId: vaderRedemptionPlotline.id,
        description:
          'Obi-Wan faces Vader one last time. "If you strike me down, I shall become more powerful than you can possibly imagine." He sacrifices himself.',
      },
      {
        chapterId: anhCh4.id,
        title: "The Trench Run",
        sequenceNumber: 1,
        plotlineId: lukeJourney.id,
        description:
          'Luke flies into the Death Star trench. Vader is on his tail. Han returns at the last moment. "Use the Force, Luke." He fires. The Death Star explodes.',
      },
    ],
  });

  // Add POV characters to scenes via SceneCharacter join table
  const scenes = await prisma.scene.findMany({
    where: { chapter: { work: { projectId: project.id } } },
  });
  const sceneByTitle = (title: string) =>
    scenes.find((s) => s.title === title)!;

  await prisma.sceneCharacter.createMany({
    data: [
      { sceneId: sceneByTitle("Binary Sunset").id, entityId: luke.id, isPov: true },
      { sceneId: sceneByTitle("Leia's Message").id, entityId: luke.id, isPov: true },
      { sceneId: sceneByTitle("Obi-Wan vs Vader").id, entityId: obiwan.id, isPov: true },
      { sceneId: sceneByTitle("The Trench Run").id, entityId: luke.id, isPov: true },
    ],
  });

  console.log("\nSeed complete!");
  console.log(`  User: ${user.email}`);
  console.log(`  Project: ${project.name} (/${project.slug})`);
  console.log(`  Item types: Weapons, Vehicles & Ships`);
  console.log(
    `  Characters: Luke, Vader, Leia, Han, Obi-Wan, Palpatine, Yoda, Chewbacca, Lando`,
  );
  console.log(`  Organizations: Rebel Alliance, Galactic Empire, Jedi Order`);
  console.log(`  Locations: Tatooine, Dagobah, Hoth, Bespin, Endor`);
  console.log(`  Items: Death Star, Millennium Falcon`);
  console.log(`  Tags: ${tagNames.length}`);
  console.log(`  Timeline events: 8 (Jedi Purge through Vader's Redemption)`);
  console.log(`  Lore articles: 2 (The Force, The Galactic Civil War)`);
  console.log(`  Plotlines: 3 | Works: 3 (original trilogy)`);
  console.log(`  Chapters: 4 | Scenes: 6 (A New Hope)`);
  console.log(`  Relationships: 16`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
