import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Institution } from './institution.entity';
import { InstitutionService } from './institution.service';
import { InstitutionController } from './institution.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Institution])],
  providers: [InstitutionService],
  controllers: [InstitutionController],
  exports: [InstitutionService],
})
export class InstitutionModule {}
