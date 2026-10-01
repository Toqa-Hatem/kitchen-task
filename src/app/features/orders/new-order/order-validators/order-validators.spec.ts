import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderValidators } from './order-validators';

describe('OrderValidators', () => {
  let component: OrderValidators;
  let fixture: ComponentFixture<OrderValidators>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderValidators],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderValidators);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
