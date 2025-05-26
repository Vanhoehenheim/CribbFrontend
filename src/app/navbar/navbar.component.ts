import { Component, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ApiService } from '../services/api.service';
import { NotificationDropdownComponent } from '../components/notifications/notification-dropdown/notification-dropdown.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, NotificationDropdownComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements AfterViewInit {
  isMenuOpen = false;
  
  @ViewChild(NotificationDropdownComponent) notificationDropdown?: NotificationDropdownComponent;
  
  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngAfterViewInit() {
    // Check if notification dropdown component was successfully loaded
    setTimeout(() => {
      if (this.notificationDropdown) {
        console.log('Notification dropdown component loaded successfully');
      } else {
        console.error('Notification dropdown component not found');
      }
    }, 1000);
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const dropdown = document.querySelector('#user-menu-button')?.parentElement;
    
    if (dropdown && !dropdown.contains(target)) {
      this.isMenuOpen = false;
    }
  }

  signOut() {
    this.apiService.logout();
    // Navigate to login page after logout
    this.router.navigate(['/login']);
  }

  get userName(): string {
    const user = this.apiService.getCurrentUser();
    return user ? `${user.firstName} ${user.lastName}` : 'User';
  }
  
  // For debugging - manually toggle the notification dropdown
  debugToggleNotifications(event: MouseEvent) {
    if (this.notificationDropdown) {
      this.notificationDropdown.toggleDropdown(event);
      console.log('Manually toggled notifications dropdown');
    }
  }
}
