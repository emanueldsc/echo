import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoteSummary } from './vote-summary';

describe('VoteSummary', () => {
  let component: VoteSummary;
  let fixture: ComponentFixture<VoteSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoteSummary],
    }).compileComponents();

    fixture = TestBed.createComponent(VoteSummary);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
