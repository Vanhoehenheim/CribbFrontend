import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ApiService } from '../services/api.service';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiService = jasmine.createSpyObj('ApiService', ['login']);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        RouterTestingModule
      ],
      providers: [
        FormBuilder,
        { provide: ApiService, useValue: apiService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.loginForm.get('username')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should have invalid form when empty', () => {
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTrue();
  });

  it('should not submit if form is invalid', () => {
    component.loginForm.controls['username'].setValue('');
    component.loginForm.controls['password'].setValue('');
    component.onSubmit();
    expect(component.submitted).toBeTrue();
    expect(component.loading).toBeFalse();
    expect(apiService.login).not.toHaveBeenCalled();
  });

  it('should show success message temporarily', () => {
    const appendChildSpy = spyOn(document.body, 'appendChild').and.callThrough();
    const removeChildSpy = spyOn(document.body, 'removeChild').and.callThrough();

    component['showSuccessMessage']();

    expect(appendChildSpy).toHaveBeenCalled();
    setTimeout(() => {
      expect(removeChildSpy).toHaveBeenCalled();
    }, 2500); // Wait for the message to disappear
  });

  it('should login correctly with valid credentials', () => {
    const mockResponse = { success: true, token: 'mock-token' };
    apiService.login.and.returnValue(of(mockResponse));

    component.loginForm.controls['username'].setValue('poiuyt');
    component.loginForm.controls['password'].setValue('poiuytrewq1');
    component.onSubmit();

    expect(component.submitted).toBeTrue();
    expect(component.loading).toBeFalse();
    expect(apiService.login).toHaveBeenCalledWith('poiuyt', 'poiuytrewq1');
    expect(apiService.login).toHaveBeenCalledTimes(1);
  });

  it('should fail login with invalid credentials', () => {
    const mockError = { error: 'Invalid credentials' };
    apiService.login.and.returnValue(throwError(mockError));

    component.loginForm.controls['username'].setValue('invalidUser');
    component.loginForm.controls['password'].setValue('invalidPass');
    component.onSubmit();

    expect(component.submitted).toBeTrue();
    expect(component.loading).toBeFalse();
    expect(apiService.login).toHaveBeenCalledWith('invalidUser', 'invalidPass');
    expect(apiService.login).toHaveBeenCalledTimes(1);
    expect(component.errorMessage).toBe('Login failed. Please check your credentials and try again.');
  });

});