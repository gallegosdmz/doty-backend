import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoverImageUrlToEvent1774036278291 implements MigrationInterface {
  name = 'AddCoverImageUrlToEvent1774036278291';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "events" ADD "coverImageUrl" character varying(500)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "coverImageUrl"`);
  }
}
