import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { iconoirBellNotification } from '@ng-icons/iconoir';

import { NotificationService } from '../../../services/notification.service';
import { Notification } from '../../../models/notification.model';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationPanelComponent, NgIcon],
  providers: [provideIcons({ iconoirBellNotification })],
  templateUrl: './notification-dropdown.component.html',
  styleUrls: ['./notification-dropdown.component.css']
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  private subscription = new Subscription();
  
  isDropdownOpen = false;
  notifications: Notification[] = [];

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to unread count changes
    this.subscription.add(
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      })
    );
    
    // Subscribe to notifications
    this.subscription.add(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications;
      })
    );
    
    // Refresh notifications on init
    this.notificationService.fetchNotifications().subscribe(notifications => {
      console.log('Notifications refreshed, received:', notifications.length);
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    
    this.isDropdownOpen = !this.isDropdownOpen;

    if (this.isDropdownOpen) {
      // Trigger a fetch when opening
      this.notificationService.fetchNotifications().subscribe();
    }
  }

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId).subscribe(() => {
      // Refresh after action
      this.notificationService.fetchNotifications().subscribe();
    });
  }

  deleteNotification(notificationId: string): void {
    this.notificationService.deleteNotification(notificationId).subscribe(() => {
      // Refresh after action
      this.notificationService.fetchNotifications().subscribe();
    });
  }

  navigateToAllNotifications(): void {
    this.router.navigate(['/dashboard/pantry']);
    this.isDropdownOpen = false;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }
}