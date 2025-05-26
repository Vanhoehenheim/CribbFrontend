import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, delay } from 'rxjs/operators';
import { User } from '../models/user.model';
import { ApiService } from './api.service';

/**
 * UserService handles all user-related operations and state management
 * This service centralizes user data handling to maintain consistency
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  // BehaviorSubject that tracks the current user's score
  private userScoreSubject = new BehaviorSubject<number>(0);
  public userScore$ = this.userScoreSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {
    // Listen for user changes from ApiService and update score
    this.apiService.currentUser$.subscribe(user => {
      if (user && user.score !== undefined) {
        this.userScoreSubject.next(user.score);
      } else {
        this.userScoreSubject.next(0);
      }
    });
  }
  
  /**
   * Update user profile information
   * @param userData - Partial user data to update
   * @returns Observable with updated user profile
   */
  updateProfile(userData: Partial<User>): Observable<User> {
    const headers = this.apiService.getAuthHeaders();
    return this.http.put<User>(`${this.apiService['baseUrl']}/api/users/profile`, userData, { headers })
      .pipe(
        tap(updatedUser => {
          // Update the user in ApiService to maintain consistency
          const currentUser = this.apiService.getCurrentUser();
          if (currentUser) {
            const mergedUser: User = { ...currentUser, ...updatedUser };
            localStorage.setItem('user_data', JSON.stringify(mergedUser));
            this.apiService['currentUserSubject'].next(mergedUser);
          }
        }),
        catchError(this.handleError)
      );
  }
  
  /**
   * Get the current user's score
   * @returns Current user score or 0 if not available
   */
  getUserScore(): number {
    const user = this.apiService.getCurrentUser();
    return user?.score || 0;
  }
  
  /**
   * Update user score locally
   * @param newScore - New score value
   */
  updateLocalScore(newScore: number): void {
    const user = this.apiService.getCurrentUser();
    if (user) {
      // Update the score in the user object
      user.score = newScore;
      // Update localStorage and BehaviorSubject
      localStorage.setItem('user_data', JSON.stringify(user));
      this.apiService['currentUserSubject'].next(user);
      // Update the score BehaviorSubject
      this.userScoreSubject.next(newScore);
    }
  }
  
  /**
   * Get user's group information
   * @returns Observable with the user's group details
   */
  getUserGroup(): Observable<any> {
    const user = this.apiService.getCurrentUser();
    if (!user || !user.groupId) {
      return throwError(() => new Error('User not in a group'));
    }
    
    const headers = this.apiService.getAuthHeaders();
    return this.http.get<any>(`${this.apiService['baseUrl']}/api/groups/${user.groupId}`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }
  
  /**
   * Handle HTTP errors
   * @param error - The HTTP error response
   * @returns Observable with error message
   */
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
    
    console.error('UserService error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}