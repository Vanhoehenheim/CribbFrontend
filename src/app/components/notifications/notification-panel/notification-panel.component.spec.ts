/// <reference types="jasmine" />
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, Subject } from 'rxjs';
import { NotificationPanelComponent } from './notification-panel.component';
import { NotificationService } from '../../../services/notification.service';
import { NotificationItemComponent } from '../notification-item/notification-item.component';
import { Notification, NotificationType } from '../../../models/notification.model';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('NotificationPanelComponent', () => {
  let component: NotificationPanelComponent;
  let fixture: ComponentFixture<NotificationPanelComponent>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let notificationsSubject: Subject<Notification[]>;

  // Mock notifications for testing
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: NotificationType.EXPIRED,
      message: 'Milk has expired',
      item_name: 'Milk',
      item_id: 'milk-123',
      is_read: false,
      created_at: '2023-10-12T10:30:00Z',
      group_id: 'group1',
      read_by: []
    },
    {
      id: '2',
      type: NotificationType.EXPIRING,
      message: 'Eggs are expiring soon',
      item_name: 'Eggs',
      item_id: 'eggs-123',
      is_read: true,
      created_at: '2023-10-11T09:15:00Z',
      group_id: 'group1',
      read_by: ['user1']
    }
  ];

  beforeEach(async () => {
    // Create mock service with a subject we can control
    notificationsSubject = new Subject<Notification[]>();
    
    notificationService = jasmine.createSpyObj('NotificationService', 
      ['markAsRead', 'deleteNotification']);
      
    // Set default return values with controlled subjects
    notificationService.markAsRead.and.returnValue(of({ message: 'Notification marked as read' }));
    notificationService.deleteNotification.and.returnValue(of({ message: 'Notification deleted' }));
    notificationService.notifications$ = notificationsSubject.asObservable();

    await TestBed.configureTestingModule({
      imports: [
        NotificationPanelComponent,
        NotificationItemComponent
      ],
      providers: [
        { provide: NotificationService, useValue: notificationService },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationPanelComponent);
    component = fixture.componentInstance;
    // Manually set initial notifications to empty array
    component.notifications = [];
  });

  it('should create', () => {
    fixture.detectChanges();
    // @ts-ignore: Jasmine typing issue
    expect(component).toBeDefined();
  });

  it('should subscribe to notifications on init', fakeAsync(() => {
    fixture.detectChanges();
    
    // Initial state should be empty
    // @ts-ignore: Jasmine typing issue
    expect(component.notifications.length).toBe(0);
    
    // Emit notifications
    notificationsSubject.next(mockNotifications);
    tick(); // Process async operations
    fixture.detectChanges();
    
    // @ts-ignore: Jasmine typing issue
    expect(component.notifications.length).toBe(2);
    // @ts-ignore: Jasmine typing issue
    expect(component.notifications[0].id).toBe('1');
  }));

  it('should default to pantry tab', () => {
    fixture.detectChanges();
    
    // @ts-ignore: Jasmine typing issue
    expect(component.activeTab).toBe('pantry');
    
    // Check tab is active by finding the active tab button
    const activeTabButton = fixture.debugElement.query(By.css('button.border-blue-500'));
    // @ts-ignore: Jasmine typing issue
    expect(activeTabButton).toBeTruthy();
    // @ts-ignore: Jasmine typing issue
    expect(activeTabButton.nativeElement.textContent.trim()).toContain('Pantry');
  });

  /* // Test commented out as Chores tab is disabled in template
  it('should switch tabs', () => {
    fixture.detectChanges();
    
    // Switch to chores tab
    component.switchTab('chores');
    fixture.detectChanges();
    
    // @ts-ignore: Jasmine typing issue
    expect(component.activeTab).toBe('chores');
    
    // Check tab is active by finding the active tab button for chores
    const activeTabButton = fixture.debugElement.query(By.css('button.border-blue-500'));
    // @ts-ignore: Jasmine typing issue
    expect(activeTabButton).toBeTruthy();
    // @ts-ignore: Jasmine typing issue
    expect(activeTabButton.nativeElement.textContent.trim()).toContain('Chores');
  });
  */

  it('should handle tab clicks from the template', () => {
    fixture.detectChanges();
    
    /* // Part commented out as Chores tab is disabled
    // Find and click the chores tab button
    const choresTabButton = fixture.debugElement.queryAll(By.css('button'))[1]; 
    choresTabButton.triggerEventHandler('click', null);
    fixture.detectChanges();
    
    // @ts-ignore: Jasmine typing issue
    expect(component.activeTab).toBe('chores');
    */
    
    // Find and click the pantry tab button
    const pantryTabButton = fixture.debugElement.queryAll(By.css('button'))[0];
    pantryTabButton.triggerEventHandler('click', null);
    fixture.detectChanges();
    
    // @ts-ignore: Jasmine typing issue
    expect(component.activeTab).toBe('pantry');
  });

  it('should mark notification as read', () => {
    fixture.detectChanges();
    
    component.markAsRead('1');
    
    // @ts-ignore: Jasmine typing issue
    expect(notificationService.markAsRead).toHaveBeenCalledWith('1');
  });

  it('should delete notification', () => {
    fixture.detectChanges();
    
    component.deleteNotification('1');
    
    // @ts-ignore: Jasmine typing issue
    expect(notificationService.deleteNotification).toHaveBeenCalledWith('1');
  });

  it('should handle notification updates after marked as read', fakeAsync(() => {
    // Set up component with initial notifications
    component.notifications = [...mockNotifications];
    fixture.detectChanges();
    
    // Check initial state
    // @ts-ignore: Jasmine typing issue
    expect(component.notifications.length).toBe(2);
    
    // Mark one as read
    component.markAsRead('1');
    
    // Simulate service updating the notifications with the read item
    const updatedNotifications = [...mockNotifications];
    updatedNotifications[0] = {...updatedNotifications[0], is_read: true};
    notificationsSubject.next(updatedNotifications);
    tick(); // Process async operations
    fixture.detectChanges();
    
    // @ts-ignore: Jasmine typing issue
    expect(component.notifications[0].is_read).toBeTrue();
  }));

  it('should handle notification updates after deletion', fakeAsync(() => {
    // Set up component with initial notifications
    component.notifications = [...mockNotifications];
    fixture.detectChanges();
    
    // Check initial state
    // @ts-ignore: Jasmine typing issue
    expect(component.notifications.length).toBe(2);
    
    // Delete one
    component.deleteNotification('1');
    
    // Simulate service updating the notifications with the deleted item removed
    notificationsSubject.next([mockNotifications[1]]);
    tick(); // Process async operations
    fixture.detectChanges();
    
    // @ts-ignore: Jasmine typing issue
    expect(component.notifications.length).toBe(1);
    // @ts-ignore: Jasmine typing issue
    expect(component.notifications[0].id).toBe('2');
  }));

  it('should emit event when navigating to all notifications', () => {
    fixture.detectChanges();
    
    // Set up spy on output event
    spyOn(component.closeDropdown, 'emit');
    
    // Navigate to all
    component.navigateToAll();
    
    // @ts-ignore: Jasmine typing issue
    expect(component.closeDropdown.emit).toHaveBeenCalled();
  });

  it('should display notification items when there are notifications', fakeAsync(() => {
    // Set initial notifications directly on the component
    component.notifications = [...mockNotifications];
    fixture.detectChanges();
    
    // Check if NotificationItemComponent is created
    const notificationItems = fixture.debugElement.queryAll(By.directive(NotificationItemComponent));
    
    // @ts-ignore: Jasmine typing issue
    expect(notificationItems.length).toBe(2);
  }));

  it('should display empty state when there are no notifications', () => {
    // Ensure notifications are empty
    component.notifications = [];
    fixture.detectChanges();
    
    // Find empty state message by text content
    const emptyStateText = fixture.debugElement.query(By.css('p'));
    
    // @ts-ignore: Jasmine typing issue
    expect(emptyStateText).toBeTruthy();
    // @ts-ignore: Jasmine typing issue
    expect(emptyStateText.nativeElement.textContent).toContain('No new notifications');
  });

  it('should pass notification to notification-item component', fakeAsync(() => {
    // Set notifications directly
    component.notifications = [...mockNotifications];
    fixture.detectChanges();
    
    // Get first notification item component instance if it exists
    const notificationItemDebug = fixture.debugElement.query(By.directive(NotificationItemComponent));
    
    // @ts-ignore: Jasmine typing issue
    expect(notificationItemDebug).toBeTruthy();
    if (notificationItemDebug) {
      const notificationItemComponent = notificationItemDebug.componentInstance;
      // @ts-ignore: Jasmine typing issue
      expect(notificationItemComponent.notification).toEqual(mockNotifications[0]);
    }
  }));

  it('should handle events from notification-item components', fakeAsync(() => {
    // Set notifications directly
    component.notifications = [...mockNotifications];
    fixture.detectChanges();
    tick();
    
    // Set up spies
    spyOn(component, 'markAsRead');
    spyOn(component, 'deleteNotification');
    
    // Get first notification item component instance
    const notificationItemDebug = fixture.debugElement.query(By.directive(NotificationItemComponent));
    
    // Make sure it exists before proceeding
    if (notificationItemDebug) {
      const notificationItemComponent = notificationItemDebug.componentInstance;
      
      // Trigger events
      notificationItemComponent.markAsRead.emit('1');
      notificationItemComponent.delete.emit('1');
      
      // @ts-ignore: Jasmine typing issue
      expect(component.markAsRead).toHaveBeenCalledWith('1');
      // @ts-ignore: Jasmine typing issue
      expect(component.deleteNotification).toHaveBeenCalledWith('1');
    }
  }));

  it('should show "Show All" button', () => {
    fixture.detectChanges();
    
    // Find the show all button
    const showAllButton = fixture.debugElement.query(By.css('button.w-full'));
    
    // @ts-ignore: Jasmine typing issue
    expect(showAllButton).toBeTruthy();
    // @ts-ignore: Jasmine typing issue
    expect(showAllButton.nativeElement.textContent.trim()).toContain('Show All');
  });

  it('should navigate when "Show All" button is clicked', () => {
    fixture.detectChanges();
    
    // Set up spy on component method
    spyOn(component, 'navigateToAll');
    
    // Find and click the show all button
    const showAllButton = fixture.debugElement.query(By.css('button.w-full'));
    showAllButton.triggerEventHandler('click', null);
    
    // @ts-ignore: Jasmine typing issue
    expect(component.navigateToAll).toHaveBeenCalled();
  });

  /* // Test commented out as Chores tab is disabled in template
  it('should render the "Coming Soon" message for chores tab', () => {
    // Switch to chores tab
    component.switchTab('chores');
    fixture.detectChanges();
    
    // Find the coming soon text (directly in the DOM since selector issues)
    const text = fixture.nativeElement.textContent;
    
    // @ts-ignore: Jasmine typing issue
    expect(text).toContain('Chores notifications coming soon');
  });
  */

  it('should cleanup subscriptions on destroy', () => {
    fixture.detectChanges();
    
    // Set up spy on subscription unsubscribe
    spyOn(component['subscription'], 'unsubscribe');
    
    // Destroy component
    component.ngOnDestroy();
    
    // @ts-ignore: Jasmine typing issue
    expect(component['subscription'].unsubscribe).toHaveBeenCalled();
  });
}); 