import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of, BehaviorSubject } from 'rxjs';
import { catchError, tap, delay } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8080'; // Updated based on API documentation
  private isSimulatedMode = false; // Set to false to use actual API

  // BehaviorSubject to track current user state
  private currentUserSubject: BehaviorSubject<User | null>;
  // Public observable that components can subscribe to
  public currentUser$: Observable<User | null>;

  private userSubject = new BehaviorSubject<any>(null); // Shared user state
  user$ = this.userSubject.asObservable(); // Observable for user data

  constructor(private http: HttpClient) {
    // Initialize the BehaviorSubject with user data from localStorage (if available)
    const storedUserData = localStorage.getItem('user_data');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUserData ? JSON.parse(storedUserData) : null
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  // Authentication related API calls
  login(username: string, password: string): Observable<any> {
    if (this.isSimulatedMode) {
      // Simulate successful login response
      console.log('Simulating login for:', username);
      
      // Create mock response with all required User properties
      const mockResponse = {
        success: true,
        token: 'simulated-jwt-token-' + Math.random().toString(36).substring(2),
        user: {
          id: '12345',
          email: username,
          firstName: 'John',
          lastName: 'Doe',
          phone: '1234567890',
          roomNo: '101',     // Added missing required property
          groupName: 'Pantry', // Providing common properties for completeness
          groupCode: 'ABC123'
        } as User, // Cast as User to ensure type compatibility
        message: 'Login successful'
      };
      
      // Return simulated response with a delay to mimic network request
      return of(mockResponse).pipe(
        delay(800), // 800ms delay to simulate network request
        tap(response => {
          // Store token in localStorage
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('user_data', JSON.stringify(response.user));
          
          // Update the BehaviorSubject with the new user data
          this.currentUserSubject.next(response.user);
          
          console.log('Login successful (simulated):', response);
        })
      );
    }
    
    // Real API call to the backend
    return this.http.post<any>(`${this.baseUrl}/api/login`, { username, password })
      .pipe(
        tap(response => {
          // Store token in localStorage or handle auth state
          if (response && response.token) {
            localStorage.setItem('auth_token', response.token);
            if (response.user) {
              // Ensure the user object conforms to our User interface
              const user: User = {
                ...response.user,
                // Set default values for any potentially missing required properties
                roomNo: response.user.roomNo || response.user.room_number || ''
              };
              localStorage.setItem('user_data', JSON.stringify(user));
              // Update the BehaviorSubject with the properly formatted user data
              this.currentUserSubject.next(user);
            }
          }
        }),
        catchError(this.handleError)
      );
  }

  register(userData: {
    username: string;
    password: string;
    name: string;
    phone_number: string;
    room_number: string;
    group?: string;
    groupCode?: string;
  }): Observable<any> {
    if (this.isSimulatedMode) {
      // Simulate successful registration
      console.log('Simulating registration for:', userData.username);
      
      // Create mock response with properties mapped to the required User fields
      const mockResponse = {
        success: true,
        token: 'simulated-jwt-token-' + Math.random().toString(36).substring(2),
        user: {
          id: 'user-' + Math.random().toString(36).substring(2),
          email: userData.username,
          firstName: userData.name.split(' ')[0],
          lastName: userData.name.split(' ')[1] || '',
          phone: userData.phone_number,
          roomNo: userData.room_number,
          group: userData.group,
          groupCode: userData.groupCode,
          password: userData.password
        },
        message: 'Registration successful'
      };
      
      return of(mockResponse).pipe(
        delay(1000), // 1000ms delay to simulate network request
        tap(response => {
          // Store token in localStorage
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('user_data', JSON.stringify(response.user));
          
          // Update the BehaviorSubject with the new user data
          this.currentUserSubject.next(response.user);
          
          console.log('Registration successful (simulated):', response);
        })
      );
    }
    
    return this.http.post<any>(`${this.baseUrl}/api/register`, userData)
      .pipe(
        tap(response => {
          // Store token if provided
          if (response && response.token) {
            localStorage.setItem('auth_token', response.token);
            if (response.user) {
              localStorage.setItem('user_data', JSON.stringify(response.user));
              // Update the BehaviorSubject with the new user data
              this.currentUserSubject.next(response.user);
            }
          }
        }),
        catchError(this.handleError)
      );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    // Update the BehaviorSubject with null to indicate no user is logged in
    this.currentUserSubject.next(null);
    console.log('User logged out');
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  // Get current user data
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Get auth token
  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Add authorization header to requests
  getAuthHeaders(): HttpHeaders {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No auth token available');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // User profile related API calls
  getUserProfile(): Observable<User> {
    if (this.isSimulatedMode) {
      const userData = this.getCurrentUser();
      
      if (!userData) {
        return throwError(() => new Error('User not authenticated'));
      }
      
      const mockProfile = {
        ...userData,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        aptNo: userData.roomNo || '101',
        groupId: userData.groupId || 'group-123',
      };
      
      return of(mockProfile).pipe(
        delay(800),
        tap(profile => {
          // Update local storage and BehaviorSubject with fresh profile data
          localStorage.setItem('user_data', JSON.stringify(profile));
          this.currentUserSubject.next(profile);
        })
      );
    }
    
    try {
      const headers = this.getAuthHeaders();
      return this.http.get<User>(`${this.baseUrl}/api/users/profile`, { headers })
        .pipe(
          tap(profile => {
            // Update local storage and BehaviorSubject with fresh profile data
            localStorage.setItem('user_data', JSON.stringify(profile));
            this.currentUserSubject.next(profile);
          }),
          catchError(this.handleError)
        );
    } catch (error) {
      return throwError(() => new Error('User not authenticated'));
    }
  }

  // Group related API calls
  joinGroup(username: string, group_name: string): Observable<any> {
    if (this.isSimulatedMode) {
      const currentUser = this.getCurrentUser();
      
      if (!currentUser) {
        return throwError(() => new Error('User not authenticated'));
      }
      
      // Mock group data
      const mockGroup = {
        id: 'group-' + Math.random().toString(36).substring(2),
        name: group_name,
        members: [currentUser.id],
        createdAt: new Date().toISOString()
      };
      
      // Update user with group info
      const updatedUser = {
        ...currentUser,
        groupId: mockGroup.id,
        groupName: group_name
      };
      
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      // Update the BehaviorSubject with updated user data
      this.currentUserSubject.next(updatedUser);
      
      return of({
        success: true,
        group: mockGroup,
        message: 'Successfully joined group',
        user: updatedUser
      }).pipe(delay(1000));
    }
    
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.baseUrl}/api/groups/join`, { 
      username, 
      group_name 
    }, { headers })
      .pipe(
        tap(response => {
          if (response && response.success) {
            // If the API returns updated user data, use it to update the state
            if (response.user) {
              localStorage.setItem('user_data', JSON.stringify(response.user));
              this.currentUserSubject.next(response.user);
            } 
            // Otherwise update the existing user with the new group info
            else {
              const currentUser = this.getCurrentUser();
              if (currentUser) {
                const updatedUser = {
                  ...currentUser,
                  groupName: group_name
                };
                localStorage.setItem('user_data', JSON.stringify(updatedUser));
                this.currentUserSubject.next(updatedUser);
              }
            }
          }
        }),
        catchError(this.handleError)
      );
  }

  createGroup(name: string): Observable<any> {
    if (this.isSimulatedMode) {
      const currentUser = this.getCurrentUser();
      
      if (!currentUser) {
        return throwError(() => new Error('User not authenticated'));
      }
      
      // Mock group data
      const mockGroup = {
        id: 'group-' + Math.random().toString(36).substring(2),
        name: name,
        members: [currentUser.id],
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id
      };
      
      // Update user with group info
      const updatedUser = {
        ...currentUser,
        groupId: mockGroup.id,
        isGroupAdmin: true
      };
      
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      
      return of({
        success: true,
        group: mockGroup,
        message: 'Group created successfully'
      }).pipe(delay(1000));
    }
    
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.baseUrl}/api/groups`, { name }, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get group members
  getGroupMembers(group_name: string): Observable<any> {
    if (this.isSimulatedMode) {
      return of([
        {
          id: '1',
          username: 'user1',
          name: 'User One',
          phone_number: '1234567890',
          score: 10
        },
        {
          id: '2',
          username: 'user2',
          name: 'User Two',
          phone_number: '0987654321',
          score: 20
        }
      ]).pipe(delay(800));
    }
    
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.baseUrl}/api/groups/members?group_name=${encodeURIComponent(group_name)}`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get users sorted by score
  getUsersByScore(): Observable<any> {
    if (this.isSimulatedMode) {
      return of([
        {
          id: '1',
          username: 'user1',
          name: 'User One',
          phone_number: '1234567890',
          score: 25
        },
        {
          id: '2',
          username: 'user2',
          name: 'User Two',
          phone_number: '0987654321',
          score: 15
        }
      ]).pipe(delay(800));
    }
    
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.baseUrl}/api/users/by-score`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  setUser(user: any): void {
    this.userSubject.next(user); // Update shared user state
  }

  getUser(): any {
    return this.userSubject.value; // Get current user value
  }

  // Generic error handler
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
