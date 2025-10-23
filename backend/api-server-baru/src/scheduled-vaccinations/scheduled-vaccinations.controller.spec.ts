import { Test, TestingModule } from '@nestjs/testing';
import { ScheduledVaccinationsController } from './scheduled-vaccinations.controller';

describe('ScheduledVaccinationsController', () => {
  let controller: ScheduledVaccinationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScheduledVaccinationsController],
    }).compile();

    controller = module.get<ScheduledVaccinationsController>(ScheduledVaccinationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
