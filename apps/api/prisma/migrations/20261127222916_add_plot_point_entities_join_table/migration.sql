-- CreateTable
CREATE TABLE "plot_point_entities" (
    "plotPointId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "role" TEXT,

    CONSTRAINT "plot_point_entities_pkey" PRIMARY KEY ("plotPointId","entityId")
);

-- AddForeignKey
ALTER TABLE "plot_point_entities" ADD CONSTRAINT "plot_point_entities_plotPointId_fkey" FOREIGN KEY ("plotPointId") REFERENCES "plot_points"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plot_point_entities" ADD CONSTRAINT "plot_point_entities_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DataMigration: copy existing entityId data to join table
INSERT INTO plot_point_entities ("plotPointId", "entityId")
SELECT id, "entityId" FROM plot_points WHERE "entityId" IS NOT NULL
ON CONFLICT DO NOTHING;
