import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YesnoDialogComponent } from './yesno-dialog.component';

describe('YesnoDialogComponent', () => {
  let component: YesnoDialogComponent;
  let fixture: ComponentFixture<YesnoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ YesnoDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(YesnoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
