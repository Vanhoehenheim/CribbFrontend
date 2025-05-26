/// <reference types="jasmine" />
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NotificationItemComponent } from './notification-item.component';
import { Notification, NotificationType } from '../../../models/notification.model';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ShoppingCartService } from '../../../services/shopping-cart.service';
import { ApiService } from '../../../services/api.service';
import { of } from 'rxjs';

// Mock ApiService
class MockApiService {
  getCurrentUser() {
    return { id: 'user123', groupName: 'testGroup' };
  }
  user$ = of(this.getCurrentUser());
}

// Mock ShoppingCartService
class MockShoppingCartService {
  addItem = jasmine.createSpy('addItem').and.returnValue(of({}));
}

describe('NotificationItemComponent', () => {
  let component: NotificationItemComponent;
  let fixture: ComponentFixture<NotificationItemComponent>;
  let shoppingCartService: MockShoppingCartService;

  // Mock notifications for testing all types
  const mockExpiredNotification: Notification = {
    id: '1',
    type: NotificationType.EXPIRED,
    message: 'Milk has expired',
    item_name: 'Milk',
    item_id: 'milk-123',
    is_read: false,
    created_at: '2023-10-12T10:30:00Z',
    group_id: 'group1',
    read_by: []
  };

  const mockExpiringNotification: Notification = {
    id: '2',
    type: NotificationType.EXPIRING,
    message: 'Eggs are expiring soon',
    item_name: 'Eggs',
    item_id: 'eggs-123',
    is_read: true,
    created_at: '2023-10-11T09:15:00Z',
    group_id: 'group1',
    read_by: ['user1']
  };

  const mockLowStockNotification: Notification = {
    id: '3',
    type: NotificationType.LOW_STOCK,
    message: 'Bread is running low',
    item_name: 'Bread',
    item_id: 'bread-123',
    is_read: false,
    created_at: '2023-10-10T15:45:00Z',
    group_id: 'group1',
    read_by: []
  };

  const mockOutOfStockNotification: Notification = {
    id: '4',
    type: NotificationType.OUT_OF_STOCK,
    message: 'Cheese is out of stock',
    item_name: 'Cheese',
    item_id: 'cheese-123',
    is_read: false,
    created_at: '2023-10-09T08:20:00Z',
    group_id: 'group1',
    read_by: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationItemComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiService, useClass: MockApiService },
        { provide: ShoppingCartService, useClass: MockShoppingCartService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationItemComponent);
    component = fixture.componentInstance;
    shoppingCartService = TestBed.inject(ShoppingCartService) as unknown as MockShoppingCartService;

    // Set default notification
    component.notification = mockExpiredNotification;

    fixture.detectChanges();
  });

  it('should create', () => {
    fixture.detectChanges();
    // @ts-ignore: Jasmine typing issue
    expect(component).toBeDefined();
  });

  it('should display notification content', () => {
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    // @ts-ignore: Jasmine typing issue
    expect(element.textContent).toContain('Milk');
    // @ts-ignore: Jasmine typing issue
    expect(element.textContent).toContain('Milk has expired');
  });

  it('should apply correct class based on notification type', () => {
    // Test EXPIRED type
    component.notification = mockExpiredNotification;
    fixture.detectChanges();
    // @ts-ignore: Jasmine typing issue
    expect(component.getTypeClass()).toBe('text-red-500');
    
    // Test EXPIRING type
    component.notification = mockExpiringNotification;
    fixture.detectChanges();
    // @ts-ignore: Jasmine typing issue
    expect(component.getTypeClass()).toBe('text-yellow-500');
    
    // Test LOW_STOCK type
    component.notification = mockLowStockNotification;
    fixture.detectChanges();
    // @ts-ignore: Jasmine typing issue
    expect(component.getTypeClass()).toBe('text-blue-500');
    
    // Test OUT_OF_STOCK type
    component.notification = mockOutOfStockNotification;
    fixture.detectChanges();
    // @ts-ignore: Jasmine typing issue
    expect(component.getTypeClass()).toBe('text-orange-500');
  });

  it('should return correct icons based on notification type', () => {
    // Test EXPIRED type
    component.notification = mockExpiredNotification;
    // @ts-ignore: Jasmine typing issue
    expect(component.getTypeIcon()).toBe('exclamation-circle');
    
    // Test EXPIRING type
    component.notification = mockExpiringNotification;
    // @ts-ignore: Jasmine typing issue
    expect(component.getTypeIcon()).toBe('clock');
    
    // Test LOW_STOCK type
    component.notification = mockLowStockNotification;
    // @ts-ignore: Jasmine typing issue
    expect(component.getTypeIcon()).toBe('shopping-cart');
    
    // Test OUT_OF_STOCK type
    component.notification = mockOutOfStockNotification;
    // @ts-ignore: Jasmine typing issue
    expect(component.getTypeIcon()).toBe('exclamation-triangle');
    
    // Test fallback case with mock notification type that doesn't exist
    // @ts-ignore: Testing with invalid type for coverage
    component.notification = {
      ...mockExpiredNotification,
      type: -1 as unknown as NotificationType // Force invalid type for testing default case
    };
    // @ts-ignore: Jasmine typing issue
    expect(component.getTypeIcon()).toBe('bell');
  });

  it('should format date correctly', () => {
    fixture.detectChanges();
    
    const formattedDate = component.formatDate('2023-10-12T10:30:00Z');
    const date = new Date('2023-10-12T10:30:00Z');
    const expectedFormat = date.toLocaleDateString();
    
    // @ts-ignore: Jasmine typing issue
    expect(formattedDate).toBe(expectedFormat);
  });

  it('should show appropriate icons for each notification type', () => {
    // Test EXPIRED type
    component.notification = mockExpiredNotification;
    fixture.detectChanges();
    // Fix the selector to not use *ngIf directly
    const expiredIcon = fixture.debugElement.query(By.css('svg'));
    // @ts-ignore: Jasmine typing issue
    expect(expiredIcon).toBeTruthy();
    
    // Test EXPIRING type
    component.notification = mockExpiringNotification;
    fixture.detectChanges();
    const expiringIcon = fixture.debugElement.query(By.css('svg'));
    // @ts-ignore: Jasmine typing issue
    expect(expiringIcon).toBeTruthy();
    
    // Test LOW_STOCK type
    component.notification = mockLowStockNotification;
    fixture.detectChanges();
    const lowStockIcon = fixture.debugElement.query(By.css('svg'));
    // @ts-ignore: Jasmine typing issue
    expect(lowStockIcon).toBeTruthy();
    
    // Test OUT_OF_STOCK type
    component.notification = mockOutOfStockNotification;
    fixture.detectChanges();
    const outOfStockIcon = fixture.debugElement.query(By.css('svg'));
    // @ts-ignore: Jasmine typing issue
    expect(outOfStockIcon).toBeTruthy();
  });

  it('should apply different background for unread notifications', () => {
    // Test unread notification
    component.notification = mockExpiredNotification; // is_read = false
    fixture.detectChanges();
    const notificationDiv = fixture.debugElement.query(By.css('.flex.items-center'));
    // @ts-ignore: Jasmine typing issue
    expect(notificationDiv.nativeElement.classList.contains('bg-gray-50') || 
           notificationDiv.nativeElement.classList.contains('dark:bg-gray-700')).toBeTrue();
    
    // Test read notification
    component.notification = mockExpiringNotification; // is_read = true
    fixture.detectChanges();
    const readNotificationDiv = fixture.debugElement.query(By.css('.flex.items-center'));
    // @ts-ignore: Jasmine typing issue
    expect(readNotificationDiv.nativeElement.classList.contains('bg-gray-50') || 
           readNotificationDiv.nativeElement.classList.contains('dark:bg-gray-700')).toBeFalse();
  });

  it('should emit markAsRead event when the mark as read button is clicked', () => {
    // Set up spy on output event
    spyOn(component.markAsRead, 'emit');
    fixture.detectChanges();
    
    // Find and click the mark as read button
    const markAsReadButton = fixture.debugElement.query(By.css('button[title="Mark as read"]'));
    markAsReadButton.triggerEventHandler('click', new MouseEvent('click'));
    
    // @ts-ignore: Jasmine typing issue
    expect(component.markAsRead.emit).toHaveBeenCalledWith('1');
  });

  it('should emit delete event when the delete button is clicked', () => {
    // Set up spy on output event
    spyOn(component.delete, 'emit');
    fixture.detectChanges();
    
    // Find and click the delete button
    const deleteButton = fixture.debugElement.query(By.css('button[title="Delete notification"]'));
    deleteButton.triggerEventHandler('click', new MouseEvent('click'));
    
    // @ts-ignore: Jasmine typing issue
    expect(component.delete.emit).toHaveBeenCalledWith('1');
  });

  it('should stop event propagation when clicking buttons', () => {
    fixture.detectChanges();
    
    // Create mock event
    const mockEvent = new MouseEvent('click');
    spyOn(mockEvent, 'stopPropagation');
    
    // Test mark as read
    component.onMarkAsRead(mockEvent);
    // @ts-ignore: Jasmine typing issue
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    
    // Test delete
    component.onDelete(mockEvent);
    // @ts-ignore: Jasmine typing issue
    expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(2);
  });

  it('should hide mark as read button for read notifications', () => {
    // Set notification as read
    component.notification = mockExpiringNotification; // is_read = true
    fixture.detectChanges();
    
    // Check that mark as read button is not present
    const markAsReadButton = fixture.debugElement.query(By.css('button[title="Mark as read"]'));
    // @ts-ignore: Jasmine typing issue
    expect(markAsReadButton).toBeNull();
  });
}); 