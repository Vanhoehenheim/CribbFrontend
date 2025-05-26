import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingComponent } from './landing.component';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent, RouterTestingModule]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render main heading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('h1');
    expect(heading).toBeTruthy();
  });

  it('should contain welcome text', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Welcome');
  });

  it('should navigate to login when login button is clicked', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    const compiled = fixture.nativeElement as HTMLElement;
    const loginButton = compiled.querySelector('button:nth-child(1)') as HTMLButtonElement;
    loginButton?.click();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should navigate to signup when signup button is clicked', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    const compiled = fixture.nativeElement as HTMLElement;
    const signupButton = compiled.querySelector('button:nth-child(2)') as HTMLButtonElement;
    signupButton?.click();
    expect(router.navigate).toHaveBeenCalledWith(['/signup']);
  });
});
