import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { ApiService } from '../services/api.service';

/**
 * DashboardComponent serves as the main layout for authenticated users
 * Provides navigation, sidebar, and content area for child feature components
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent]
})
export class DashboardComponent implements OnInit {
  // UI state
  isDrawerOpen = true;          // Controls sidebar visibility state
  
  // Data state
  user: any = null;             // Stores the current user profile data
  loading = true;               // Loading state indicator
  error: string | null = null;  // Error message if data fails to load
  
  constructor(
    private apiService: ApiService,  // Service for API and authentication
    private router: Router           // Angular router for navigation
  ) {}
  
  /**
   * Initialize the dashboard by checking authentication
   * and loading user profile data
   */
  ngOnInit(): void {
    // Verify user authentication status before proceeding
    if (!this.apiService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Fetch the current user's profile data
    this.apiService.getUserProfile().subscribe({
      next: (userData) => {
        // Store user data and mark loading as complete
        this.user = userData;
        this.apiService.setUser(userData); // Share user data via ApiService
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        
        // Handle authentication errors by redirecting to login
        if (error.message === 'User not authenticated') {
          this.apiService.logout(); // Clean up any invalid tokens
          this.router.navigate(['/login']);
        } else {
          // Handle other types of errors with a message
          this.error = 'Failed to load user data. Please try again.';
        }
        this.loading = false;
      }
    });
  }
  
  /**
   * Toggle the sidebar/drawer open and closed state
   */
  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen;
  }
}