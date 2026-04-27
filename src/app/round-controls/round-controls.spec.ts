import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoundControls } from './round-controls';

describe('RoundControls', () => {
  let component: RoundControls;
  let fixture: ComponentFixture<RoundControls>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoundControls],
    }).compileComponents();

    fixture = TestBed.createComponent(RoundControls);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
