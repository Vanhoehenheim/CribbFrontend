import { Component, OnInit, OnDestroy, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Overlay, OverlayRef, OverlayConfig, OverlayModule } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { NotificationService } from '../../../services/notification.service';
import { Notification } from '../../../models/notification.model';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule, OverlayModule],
  templateUrl: './notification-dropdown.component.html',
  styleUrls: ['./notification-dropdown.component.css']
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  private overlayRef: OverlayRef | null = null;
  private subscription = new Subscription();

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef
  ) {}

  ngOnInit(): void {
    // Subscribe to unread count changes
    this.subscription.add(
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      })
    );
    
    // Refresh notifications on init
    this.notificationService.fetchNotifications().subscribe(notifications => {
      console.log('Notifications refreshed, received:', notifications.length);
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.closeDropdown();
  }

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    
    if (this.overlayRef) {
      this.closeDropdown();
    } else {
      // Simply open the dropdown - the panel will subscribe to notifications
      this.openDropdown(event);
      
      // Trigger a single fetch in the background
      this.notificationService.fetchNotifications().subscribe();
    }
  }

  private openDropdown(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    
    // Configure the overlay
    const config: OverlayConfig = {
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      positionStrategy: this.overlay.position()
        .flexibleConnectedTo(target)
        .withPositions([{
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
          offsetY: 8
        }])
    };
    
    // Create overlay
    this.overlayRef = this.overlay.create(config);
    
    // Handle backdrop clicks to close
    this.overlayRef.backdropClick().subscribe(() => this.closeDropdown());
    
    // Create portal for content
    const portal = new ComponentPortal(NotificationPanelComponent, this.viewContainerRef);
    const componentRef = this.overlayRef.attach(portal);
    
    // Pass data to panel component
    const panelComponent = componentRef.instance;
    panelComponent.closeDropdown.subscribe(() => this.closeDropdown());
  }

  closeDropdown(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  navigateToAllNotifications(): void {
    this.router.navigate(['/dashboard'], { fragment: 'pantry' });
    this.closeDropdown();
  }
}