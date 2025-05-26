import { Component, OnInit } from "@angular/core";
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { ApiService } from '../services/api.service';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    standalone: true,
    imports: [CommonModule, NavbarComponent]
})

export class ProfileComponent implements OnInit {
    user: any = null;
    loading = true;
    error: string | null = null;

    constructor(
        private apiService: ApiService,
        private router: Router
    ) {}

    ngOnInit(): void {
        // Check if user is logged in
        if (!this.apiService.isLoggedIn()) {
            this.router.navigate(['/login']);
            return;
        }

        // Load user profile data
        this.apiService.getUserProfile().subscribe({
            next: (userData) => {
                this.user = userData;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading profile:', error);
                // If the error is due to authentication, redirect to login
                if (error.message === 'User not authenticated') {
                    this.apiService.logout(); // Clear any stale tokens
                    this.router.navigate(['/login']);
                } else {
                    this.error = 'Failed to load profile data. Please try again.';
                }
                this.loading = false;
            }
        });
    }
}