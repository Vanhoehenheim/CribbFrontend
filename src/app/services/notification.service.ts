import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of, timer, combineLatest } from 'rxjs';
import { catchError, tap, map, switchMap, shareReplay } from 'rxjs/operators';
import { Notification, NotificationResponse } from '../models/notification.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:8080/api/pantry';
  
  // State management
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  
  // Loading state
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Track if request is in progress
  private fetchInProgress = false;

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {
    this.initNotifications();
  }

  /**
   * Initialize notifications and set up polling
   */
  private initNotifications(): void {
    if (this.apiService.isLoggedIn()) {
      // Initial fetch after a short delay to ensure user data is loaded
      setTimeout(() => {
        this.fetchNotifications().pipe(
          // Only set up polling after the first fetch completes
          tap(() => {
            // Set up a timer for periodic refreshes, but don't trigger nested API calls
            timer(60000, 60000).pipe(
              switchMap(() => {
                console.log('Scheduled refresh of notifications');
                return this.fetchNotifications();
              }),
              // Prevent multiple subscription chains
              shareReplay(1)
            ).subscribe();
          })
        ).subscribe();
      }, 1000);
    }
  }

  /**
   * Get the group info and headers in one method
   */
  private getRequestOptions() {
    const headers = this.apiService.getAuthHeaders();
    const user = this.apiService.getCurrentUser();
    
    if (!user) {
      return { headers, params: new HttpParams() };
    }
    
    let params = new HttpParams();
    if (user.groupName) {
      params = params.append('group_name', user.groupName);
    } else if (user.groupCode) {
      params = params.append('group_code', user.groupCode);
    }
    
    return { headers, params };
  }

  /**
   * Fetch all notifications in one request
   */
  fetchNotifications(): Observable<Notification[]> {
    // Prevent parallel requests
    if (this.fetchInProgress) {
      console.log('Fetch already in progress, skipping');
      return this.notifications$;
    }
    
    this.fetchInProgress = true;
    this.loadingSubject.next(true);
    console.log('Fetching notifications...');
    
    const options = this.getRequestOptions();
    if (!options.params.has('group_name') && !options.params.has('group_code')) {
      this.fetchInProgress = false;
      return of([]);
    }
    
    // Create a combined call that merges all notification types
    return combineLatest([
      this.http.get<any>(`${this.apiUrl}/expiring`, options).pipe(
        catchError(() => of({ notifications: [] }))
      ),
      this.http.get<any>(`${this.apiUrl}/warnings`, options).pipe(
        catchError(() => of({ notifications: [] }))
      )
    ]).pipe(
      map(([expiringResponse, warningResponse]) => {
        // Extract and process notifications from both responses
        const expiringNotifications = this.processApiResponse(expiringResponse);
        const warningNotifications = this.processApiResponse(warningResponse);
        
        // Combine and sort all notifications
        const allNotifications = [
          ...expiringNotifications,
          ...warningNotifications
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        // Calculate unread count
        const unreadCount = allNotifications.filter(n => !n.is_read).length;
        
        // Update state
        this.notificationsSubject.next(allNotifications);
        this.unreadCountSubject.next(unreadCount);
        this.loadingSubject.next(false);
        this.fetchInProgress = false;
        
        return allNotifications;
      }),
      catchError(error => {
        console.error('Error fetching notifications:', error);
        this.loadingSubject.next(false);
        this.fetchInProgress = false;
        return of([]);
      }),
      // Share the result with multiple subscribers
      shareReplay(1)
    );
  }

  /**
   * Process API response to handle different formats
   */
  private processApiResponse(response: any): Notification[] {
    let notifications: Notification[] = [];
    
    if (Array.isArray(response)) {
      notifications = response;
    } else if (response.notifications) {
      notifications = response.notifications;
    }
    
    // Add is_read property
    const userId = this.apiService.getCurrentUser()?.id;
    return notifications.map(notification => ({
      ...notification,
      is_read: userId ? notification.read_by?.includes(userId) || false : false
    }));
  }

  /**
   * Get the latest notifications for display
   */
  getLatestNotifications(limit: number = 3): Notification[] {
    return this.notificationsSubject.value.slice(0, limit);
  }

  /**
   * Mark a notification as read
   */
  markAsRead(notificationId: string): Observable<{ message: string }> {
    const options = this.getRequestOptions();
    const { params } = options;
    
    const payload = { 
      notification_id: notificationId,
      ...(params.has('group_name') ? { group_name: params.get('group_name') } : {}),
      ...(params.has('group_code') ? { group_code: params.get('group_code') } : {})
    };
    
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/notify/read`, 
      payload, 
      { headers: options.headers }
    ).pipe(
      tap(() => {
        // Update local state
        const notifications = this.notificationsSubject.value;
        const updatedNotifications = notifications.map(n => {
          if (n.id === notificationId) {
            return { ...n, is_read: true };
          }
          return n;
        });
        
        this.notificationsSubject.next(updatedNotifications);
        
        // Update unread count
        const unreadCount = updatedNotifications.filter(n => !n.is_read).length;
        this.unreadCountSubject.next(unreadCount);
      }),
      catchError(error => {
        console.error('Error marking notification as read:', error);
        return of({ message: 'Failed to mark notification as read' });
      })
    );
  }

  /**
   * Delete a notification
   */
  deleteNotification(notificationId: string): Observable<{ message: string }> {
    const options = this.getRequestOptions();
    const { params } = options;
    
    // Build query parameters for DELETE request
    let queryParams = new HttpParams()
      .set('notification_id', notificationId);
    
    // Add group parameters
    if (params.has('group_name')) {
      queryParams = queryParams.set('group_name', params.get('group_name')!);
    } else if (params.has('group_code')) {
      queryParams = queryParams.set('group_code', params.get('group_code')!);
    }
    
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/notify/delete`, 
      { headers: options.headers, params: queryParams }
    ).pipe(
      tap(() => {
        // Update local state
        const notifications = this.notificationsSubject.value;
        const updatedNotifications = notifications.filter(n => n.id !== notificationId);
        
        this.notificationsSubject.next(updatedNotifications);
        
        // Update unread count
        const unreadCount = updatedNotifications.filter(n => !n.is_read).length;
        this.unreadCountSubject.next(unreadCount);
      }),
      catchError(error => {
        console.error('Error deleting notification:', error);
        return of({ message: 'Failed to delete notification' });
      })
    );
  }
}