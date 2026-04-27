import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoteCardGrid } from './vote-card-grid';

describe('VoteCardGrid', () => {
  let component: VoteCardGrid;
  let fixture: ComponentFixture<VoteCardGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoteCardGrid],
    }).compileComponents();

    fixture = TestBed.createComponent(VoteCardGrid);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
