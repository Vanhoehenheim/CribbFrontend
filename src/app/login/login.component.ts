import { Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ionLockClosed, ionEyeOutline, ionEyeOffOutline } from '@ng-icons/ionicons';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [NgIcon, ReactiveFormsModule, CommonModule],
  viewProviders: [provideIcons({ ionLockClosed, ionEyeOutline, ionEyeOffOutline })],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  submitted = false;
  loading = false;
  errorMessage: string | null = null;
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() { return this.loginForm.controls; }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = null;
    
    // Stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }
    
    const username = this.loginForm.get('username')?.value;
    const password = this.loginForm.get('password')?.value;
    
    // Log the values to console
    console.log('Login credentials:');
    console.log('Username:', username);
    console.log('Password:', password);
    
    this.loading = true;
    
    this.apiService.login(username, password).subscribe({
      next: (response) => {
        console.log('Login successful', response);
        this.loading = false;
        
        // Show success message
        this.showSuccessMessage();
        
        // Navigate to dashboard page after successful login instead of profile
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000); // Short delay for better UX
      },
      error: (error) => {
        console.error('Login failed', error);
        this.errorMessage = 'Login failed. Please check your credentials and try again.';
        this.loading = false;
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Show a temporary success message
  private showSuccessMessage() {
    // Create a success message element
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 transition-opacity duration-500';
    successDiv.textContent = 'Login Successful! Redirecting...';
    document.body.appendChild(successDiv);
    
    // Remove it after some time
    setTimeout(() => {
      successDiv.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(successDiv);
      }, 500);
    }, 2000);
  }
}