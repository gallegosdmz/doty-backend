import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1773770328779 implements MigrationInterface {
  name = 'Init1773770328779';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(254), "phone" character varying(20) NOT NULL, "password" character varying(254) NOT NULL, "firstName" character varying(100) NOT NULL, "lastName" character varying(150) NOT NULL, "avatarUrl" character varying(254), "isVerified" boolean NOT NULL DEFAULT false, "isPhoneVerified" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "isDeleted" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."events_type_enum" AS ENUM('sports', 'social', 'tournament')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."events_accessmode_enum" AS ENUM('free', 'paid')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."events_admissiontype_enum" AS ENUM('direct', 'request')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."events_status_enum" AS ENUM('draft', 'published', 'cancelled', 'completed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organizerId" uuid NOT NULL, "title" character varying(200) NOT NULL, "description" text NOT NULL, "type" "public"."events_type_enum" NOT NULL, "accessMode" "public"."events_accessmode_enum" NOT NULL, "admissionType" "public"."events_admissiontype_enum" NOT NULL DEFAULT 'direct', "price" numeric(10,2), "currency" character varying(3), "latitude" numeric(10,7) NOT NULL, "longitude" numeric(10,7) NOT NULL, "address" character varying(500) NOT NULL, "capacity" integer NOT NULL, "waitlistEnabled" boolean NOT NULL DEFAULT false, "startsAt" TIMESTAMP WITH TIME ZONE NOT NULL, "endsAt" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."events_status_enum" NOT NULL DEFAULT 'draft', "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "isDeleted" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_58095308749008e0a54eabf0ff" ON "events" ("latitude", "longitude") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_03dcebc1ab44daa177ae9479c4" ON "events" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5c751ba5c02239663b81996563" ON "events" ("type") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'paid', 'cancelled', 'refunded')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "registrationId" uuid NOT NULL, "userId" uuid NOT NULL, "eventId" uuid NOT NULL, "amount" numeric(10,2) NOT NULL, "currency" character varying(3) NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending', "paymentMethod" character varying(50), "transactionRef" character varying(254), "paidAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "isDeleted" boolean NOT NULL DEFAULT false, CONSTRAINT "REL_4a8f915bf1b13efe6e8d426588" UNIQUE ("registrationId"), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."event_registrations_status_enum" AS ENUM('pending', 'approved', 'rejected', 'waitlisted', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "event_registrations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "eventId" uuid NOT NULL, "userId" uuid NOT NULL, "status" "public"."event_registrations_status_enum" NOT NULL DEFAULT 'pending', "registeredAt" TIMESTAMP NOT NULL DEFAULT now(), "resolvedAt" TIMESTAMP WITH TIME ZONE, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "isDeleted" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_953d3b862c2487289a92b2356e9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3e336bd6dd7985b01d2e6f0f8f" ON "event_registrations" ("eventId", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "tickets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "registrationId" uuid NOT NULL, "code" character varying(100) NOT NULL, "isUsed" boolean NOT NULL DEFAULT false, "usedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "isDeleted" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_c6e20a830c0f8b571abd331b775" UNIQUE ("code"), CONSTRAINT "REL_fc686f77d4e560cfec4a3e441d" UNIQUE ("registrationId"), CONSTRAINT "PK_343bc942ae261cf7a1377f48fd0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c6e20a830c0f8b571abd331b77" ON "tickets" ("code") `,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ADD CONSTRAINT "FK_1024d476207981d1c72232cf3ca" FOREIGN KEY ("organizerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_4a8f915bf1b13efe6e8d4265887" FOREIGN KEY ("registrationId") REFERENCES "event_registrations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_5b901b19ed973dd447a275cddaa" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_registrations" ADD CONSTRAINT "FK_e4e6dce237a527e4515f3d430f1" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_registrations" ADD CONSTRAINT "FK_7a072346484fe1d7ee0fb9dfaa8" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "FK_fc686f77d4e560cfec4a3e441d1" FOREIGN KEY ("registrationId") REFERENCES "event_registrations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_fc686f77d4e560cfec4a3e441d1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_registrations" DROP CONSTRAINT "FK_7a072346484fe1d7ee0fb9dfaa8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_registrations" DROP CONSTRAINT "FK_e4e6dce237a527e4515f3d430f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_5b901b19ed973dd447a275cddaa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_4a8f915bf1b13efe6e8d4265887"`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" DROP CONSTRAINT "FK_1024d476207981d1c72232cf3ca"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c6e20a830c0f8b571abd331b77"`,
    );
    await queryRunner.query(`DROP TABLE "tickets"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3e336bd6dd7985b01d2e6f0f8f"`,
    );
    await queryRunner.query(`DROP TABLE "event_registrations"`);
    await queryRunner.query(
      `DROP TYPE "public"."event_registrations_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5c751ba5c02239663b81996563"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_03dcebc1ab44daa177ae9479c4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_58095308749008e0a54eabf0ff"`,
    );
    await queryRunner.query(`DROP TABLE "events"`);
    await queryRunner.query(`DROP TYPE "public"."events_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."events_admissiontype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."events_accessmode_enum"`);
    await queryRunner.query(`DROP TYPE "public"."events_type_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
