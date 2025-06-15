import { Component, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ApiService } from '../services/api.service';
import { NotificationDropdownComponent } from '../components/notifications/notification-dropdown/notification-dropdown.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { 
    iconoirClipboardCheck, 
  iconoirBox, 
  iconoirCart, 
  iconoirProfileCircle,
  iconoirUser,
  iconoirBellNotification,
  iconoirGarage
} from '@ng-icons/iconoir';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, NotificationDropdownComponent, NgIcon],
  providers: [provideIcons({ 
    iconoirProfileCircle, 
    iconoirUser,
    iconoirBox, 
    iconoirCart, 
    iconoirClipboardCheck,
    iconoirBellNotification,
    iconoirGarage
  })],
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
    // Check if notification dropdown loaded (for debugging)
    setTimeout(() => {
      console.log('Notification dropdown:', this.notificationDropdown);
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Elements for top profile menu
    const topButton = document.getElementById('user-menu-button');
    const topMenu = topButton?.nextElementSibling;

    // Elements for bottom slide-up menu
    const bottomButton = document.getElementById('bottom-user-menu-button');
    const bottomMenu = document.getElementById('bottom-profile-menu');

    const clickedInsideTop = topButton && (topButton.contains(target) || (topMenu && topMenu.contains(target)));
    const clickedInsideBottom = bottomButton && (bottomButton.contains(target) || (bottomMenu && bottomMenu.contains(target)));

    if (!clickedInsideTop && !clickedInsideBottom) {
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
}
