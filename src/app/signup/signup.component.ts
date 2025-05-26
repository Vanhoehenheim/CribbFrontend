import { Component, OnInit } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ionLockClosed, ionEyeOutline, ionEyeOffOutline } from '@ng-icons/ionicons';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { initFlowbite, Modal } from 'flowbite';
import { ApiService } from '../services/api.service';
import { Router } from '@angular/router';

// Custom validator for password with at least one number
export function passwordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    
    if (!value) {
      return null;
    }
    
    const hasNumber = /[0-9]/.test(value);
    
    return !hasNumber ? { noNumber: true } : null;
  };
}

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  standalone: true,
  imports: [
    NgIcon,
    FormsModule,
    ReactiveFormsModule,
    CommonModule
  ],
  viewProviders: [provideIcons({ ionLockClosed, ionEyeOutline, ionEyeOffOutline })]
})
export class SignupComponent implements OnInit {
  signupForm: FormGroup;
  joinGroupForm: FormGroup;
  createGroupForm: FormGroup;
  submitted = false;
  joinSubmitted = false;
  createSubmitted = false;
  
  // Password visibility toggles
  showPassword = false;
  loading = false;
  errorMessage: string | null = null;
  registrationType: 'join' | 'create' | null = null;

  // Modal instances
  private joinModal: Modal | null = null;
  private createModal: Modal | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.signupForm = this.formBuilder.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8), passwordValidator()]]
    });

    this.joinGroupForm = this.formBuilder.group({
      groupCode: ['', [Validators.required]],
      roomNo: ['', [Validators.required]]
    });

    this.createGroupForm = this.formBuilder.group({
      group: ['', [Validators.required]],
      roomNo: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Initialize Flowbite when component mounts
    initFlowbite();
    
    // Initialize modal instances
    const joinModalElement = document.getElementById('join-modal');
    const createModalElement = document.getElementById('create-modal');
    
    if (joinModalElement) {
      this.joinModal = new Modal(joinModalElement);
    }
    
    if (createModalElement) {
      this.createModal = new Modal(createModalElement);
    }
  }

  // Convenience getters for easy access to form fields
  get f() { return this.signupForm.controls; }
  get jf() { return this.joinGroupForm.controls; }
  get cf() { return this.createGroupForm.controls; }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Close modal methods
  closeJoinModal(): void {
    if (this.joinModal) {
      this.joinModal.hide();
    }
  }
  
  closeCreateModal(): void {
    if (this.createModal) {
      this.createModal.hide();
    }
  }

  // Open Join modal
  openJoinModal(): void {
    this.submitted = true;
    this.errorMessage = null;
    
    // Stop and show validation errors if form is invalid
    if (this.signupForm.invalid) {
      return;
    }
    
    this.registrationType = 'join';
    
    // Open the join modal
    if (this.joinModal) {
      // Reset any previous join group form validation state
      this.joinSubmitted = false;
      this.joinModal.show();
    }
  }
  
  // Open Create modal
  openCreateModal(): void {
    this.submitted = true;
    this.errorMessage = null;
    
    // Stop and show validation errors if form is invalid
    if (this.signupForm.invalid) {
      return;
    }
    
    this.registrationType = 'create';
    
    // Open the create modal
    if (this.createModal) {
      // Reset any previous create group form validation state
      this.createSubmitted = false;
      this.createModal.show();
    }
  }

  // Register with join group
  joinGroup() {
    this.joinSubmitted = true;
    this.errorMessage = null;
    
    if (this.joinGroupForm.invalid || this.signupForm.invalid) {
      return;
    }
    
    this.loading = true;
    
    const signupData = this.signupForm.value;
    const joinData = this.joinGroupForm.value;
    
    const registrationData = {
      username: signupData.username,
      password: signupData.password,
      name: `${signupData.firstName} ${signupData.lastName}`,
      phone_number: signupData.phone,
      room_number: joinData.roomNo,  // Changed from roomNo to room_number
      groupCode: joinData.groupCode
    };
    
    this.apiService.register(registrationData).subscribe({
      next: (response) => {
        console.log('Registration successful', response);
        this.loading = false;
        this.closeJoinModal();
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.errorMessage = 'Registration failed: ' + (error.message || 'Please try again');
        this.loading = false;
      }
    });
  }

  // Register with create group
  createGroup() {
    this.createSubmitted = true;
    this.errorMessage = null;
    
    if (this.createGroupForm.invalid || this.signupForm.invalid) {
      return;
    }
    
    this.loading = true;
    
    const signupData = this.signupForm.value;
    const createData = this.createGroupForm.value;
    
    const registrationData = {
      username: signupData.username,
      password: signupData.password,
      name: `${signupData.firstName} ${signupData.lastName}`,
      phone_number: signupData.phone,
      room_number: createData.roomNo,
      group: createData.group
    };
    
    this.apiService.register(registrationData).subscribe({
      next: (response) => {
        console.log('Registration successful', response);
        this.loading = false;
        this.closeCreateModal();
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.errorMessage = 'Registration failed: ' + (error.message || 'Please try again');
        this.loading = false;
      }
    });
  }
}