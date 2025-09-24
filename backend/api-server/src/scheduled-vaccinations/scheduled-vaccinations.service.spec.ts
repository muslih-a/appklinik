import { Test, TestingModule } from '@nestjs/testing';
import { ScheduledVaccinationsService } from './scheduled-vaccinations.service';

describe('ScheduledVaccinationsService', () => {
  let service: ScheduledVaccinationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScheduledVaccinationsService],
    }).compile();

    service = module.get<ScheduledVaccinationsService>(ScheduledVaccinationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
