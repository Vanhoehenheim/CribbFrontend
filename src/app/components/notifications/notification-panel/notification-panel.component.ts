import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';
import { Notification } from '../../../models/notification.model';
import { NotificationItemComponent } from '../notification-item/notification-item.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, NotificationItemComponent],
  templateUrl: './notification-panel.component.html',
  styles: []
})
export class NotificationPanelComponent implements OnInit, OnDestroy {
  @Output() closeDropdown = new EventEmitter<void>();
  
  notifications: Notification[] = [];
  activeTab: 'pantry' | 'chores' = 'pantry';
  private subscription = new Subscription();
  
  constructor(private notificationService: NotificationService) {}
  
  ngOnInit(): void {
    // Subscribe to notifications changes
    this.subscription.add(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications;
        // Reduce logging to just count
        console.log(`Panel loaded ${notifications.length} notifications`);
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  switchTab(tab: 'pantry' | 'chores'): void {
    this.activeTab = tab;
  }
  
  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId).subscribe();
  }
  
  deleteNotification(notificationId: string): void {
    this.notificationService.deleteNotification(notificationId).subscribe();
  }
  
  navigateToAll(): void {
    this.closeDropdown.emit();
  }
}