import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap, delay } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface Chore {
  id: string;
  title: string;
  description: string;
  group_name: string;
  assigned_to: string;
  assignee_name?: string;  
  due_date: string;
  points: number;
  status: 'pending' | 'completed' | 'overdue';
  type: 'individual' | 'recurring';
  recurring_id?: string;
}

export interface RecurringChore {
  id: string;
  title: string;
  description: string;
  group_name: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  points: number;
  is_active: boolean;
}

export interface ChoreCompletionResponse {
  points_earned: number;
  new_score: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChoreService {
  private baseUrl = 'http://localhost:8080/api/chores';
  private isSimulatedMode = false; 

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) { }

  // Get chores for the current user
  getUserChores(): Observable<Chore[]> {
    if (this.isSimulatedMode) {
      const currentUser = this.apiService.getCurrentUser();
      if (!currentUser) {
        return throwError(() => new Error('User not authenticated'));
      }

      const username = `${currentUser.firstName.toLowerCase()}_${currentUser.lastName.toLowerCase()}`;
      
      // Mock data
      const mockChores: Chore[] = [
        {
          id: 'chore1',
          title: 'Clean Kitchen',
          description: 'Wipe counters, clean dishes, sweep floor',
          group_name: 'Apartment 101',
          assigned_to: username,
          due_date: new Date().toISOString(),
          points: 5,
          status: 'pending',
          type: 'individual'
        },
        {
          id: 'chore2',
          title: 'Take out trash',
          description: 'Empty all trash cans and take to dumpster',
          group_name: 'Apartment 101',
          assigned_to: username,
          due_date: new Date(Date.now() + 86400000).toISOString(),
          points: 3,
          status: 'pending',
          type: 'recurring',
          recurring_id: 'rec1'
        }
      ];
      
      return of(mockChores).pipe(delay(800));
    }

    const currentUser = this.apiService.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }
    const username = `${currentUser.firstName.toLowerCase()}_${currentUser.lastName.toLowerCase()}`;
    const headers = this.apiService.getAuthHeaders();
    return this.http.get<Chore[]>(`${this.baseUrl}/user?username=${username}`, { headers });
  }

  // Get all chores for a group
  getGroupChores(groupName: string): Observable<Chore[]> {
    if (this.isSimulatedMode) {
      // Mock data
      const mockChores: Chore[] = [
        {
          id: 'chore1',
          title: 'Clean Kitchen',
          description: 'Wipe counters, clean dishes, sweep floor',
          group_name: 'Apartment 101',
          assigned_to: 'john_doe',
          due_date: new Date().toISOString(),
          points: 5,
          status: 'pending',
          type: 'individual'
        },
        {
          id: 'chore2',
          title: 'Take out trash',
          description: 'Empty all trash cans and take to dumpster',
          group_name: 'Apartment 101',
          assigned_to: 'jane_smith',
          due_date: new Date(Date.now() + 86400000).toISOString(),
          points: 3,
          status: 'pending',
          type: 'recurring',
          recurring_id: 'rec1'
        },
        {
          id: 'chore3',
          title: 'Clean Bathroom',
          description: 'Clean toilet, shower, and sink',
          group_name: 'Apartment 101',
          assigned_to: 'robert_johnson',
          due_date: new Date(Date.now() - 86400000).toISOString(),
          points: 7,
          status: 'overdue',
          type: 'recurring',
          recurring_id: 'rec2'
        },
        {
          id: 'chore4',
          title: 'Wash Dishes',
          description: 'Wash all dishes in the sink',
          group_name: 'Apartment 101',
          assigned_to: 'john_doe',
          due_date: new Date(Date.now() - 172800000).toISOString(),
          points: 4,
          status: 'completed',
          type: 'individual'
        }
      ];
      
      return of(mockChores).pipe(delay(800));
    }

    const headers = this.apiService.getAuthHeaders();
    return this.http.get<Chore[]>(`${this.baseUrl}/group?group_name=${encodeURIComponent(groupName)}`, { headers });
  }

  // Get recurring chores for a group
  getRecurringChores(groupName: string): Observable<RecurringChore[]> {
    if (this.isSimulatedMode) {
      // Mock data
      const mockRecurringChores: RecurringChore[] = [
        {
          id: 'rec1',
          title: 'Take out trash',
          description: 'Empty all trash cans and take to dumpster',
          group_name: 'Apartment 101',
          frequency: 'weekly',
          points: 3,
          is_active: true
        },
        {
          id: 'rec2',
          title: 'Clean Bathroom',
          description: 'Clean toilet, shower, and sink',
          group_name: 'Apartment 101',
          frequency: 'biweekly',
          points: 7,
          is_active: true
        },
        {
          id: 'rec3',
          title: 'Vacuum Common Areas',
          description: 'Vacuum living room and hallways',
          group_name: 'Apartment 101',
          frequency: 'weekly',
          points: 5,
          is_active: true
        }
      ];
      
      return of(mockRecurringChores).pipe(delay(800));
    }

    const headers = this.apiService.getAuthHeaders();
    return this.http.get<RecurringChore[]>(`${this.baseUrl}/group/recurring?group_name=${encodeURIComponent(groupName)}`, { headers });
  }

  // Create individual chore
  createIndividualChore(chore: {
    title: string;
    description: string;
    group_name: string;
    assigned_to: string;
    due_date: string;
    points: number;
  }): Observable<Chore> {
    if (this.isSimulatedMode) {
      const mockChore: Chore = {
        id: 'chore' + Date.now(),
        ...chore,
        status: 'pending',
        type: 'individual'
      };
      
      return of(mockChore).pipe(delay(800));
    }

    const headers = this.apiService.getAuthHeaders();
    return this.http.post<Chore>(`${this.baseUrl}/individual`, chore, { headers });
  }

  // Create recurring chore
  createRecurringChore(chore: {
    title: string;
    description: string;
    group_name: string;
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    points: number;
  }): Observable<RecurringChore> {
    if (this.isSimulatedMode) {
      const mockRecurringChore: RecurringChore = {
        id: 'rec' + Date.now(),
        ...chore,
        is_active: true
      };
      
      return of(mockRecurringChore).pipe(delay(800));
    }

    const headers = this.apiService.getAuthHeaders();
    return this.http.post<RecurringChore>(`${this.baseUrl}/recurring`, chore, { headers });
  }

  // Mark chore as complete
  completeChore(choreId: string, userId: string): Observable<ChoreCompletionResponse> {
    if (this.isSimulatedMode) {
      const mockResponse: ChoreCompletionResponse = {
        points_earned: Math.floor(Math.random() * 10) + 1,
        new_score: Math.floor(Math.random() * 100) + 50
      };
      
      return of(mockResponse).pipe(delay(800));
    }

    const headers = this.apiService.getAuthHeaders();
    return this.http.post<ChoreCompletionResponse>(`${this.baseUrl}/complete`, {
      chore_id: choreId,
      user_id: userId
    }, { headers });
  }

  // Update a chore
  updateChore(chore: {
    chore_id: string;
    title?: string;
    description?: string;
    assigned_to?: string;
    due_date?: string;
    points?: number;
  }): Observable<Chore> {
    if (this.isSimulatedMode) {
      const mockChore: Chore = {
        id: chore.chore_id,
        title: chore.title || 'Updated Chore',
        description: chore.description || 'Updated description',
        group_name: 'Apartment 101',
        assigned_to: chore.assigned_to || 'john_doe',
        due_date: chore.due_date || new Date().toISOString(),
        points: chore.points || 5,
        status: 'pending',
        type: 'individual'
      };
      
      return of(mockChore).pipe(delay(800));
    }

    const headers = this.apiService.getAuthHeaders();
    return this.http.put<Chore>(`${this.baseUrl}/update`, chore, { headers });
  }

  // Delete a chore
  deleteChore(choreId: string): Observable<{message: string}> {
    if (this.isSimulatedMode) {
      return of({ message: 'Chore deleted successfully' }).pipe(delay(800));
    }

    const headers = this.apiService.getAuthHeaders();
    return this.http.delete<{message: string}>(`${this.baseUrl}/delete?chore_id=${choreId}`, { headers });
  }

  // Update a recurring chore
  updateRecurringChore(recurringChore: {
    recurring_chore_id: string;
    title?: string;
    description?: string;
    frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    points?: number;
    is_active?: boolean;
  }): Observable<RecurringChore> {
    if (this.isSimulatedMode) {
      const mockRecurringChore: RecurringChore = {
        id: recurringChore.recurring_chore_id,
        title: recurringChore.title || 'Updated Recurring Chore',
        description: recurringChore.description || 'Updated description',
        group_name: 'Apartment 101',
        frequency: recurringChore.frequency || 'weekly',
        points: recurringChore.points || 5,
        is_active: recurringChore.is_active !== undefined ? recurringChore.is_active : true
      };
      
      return of(mockRecurringChore).pipe(delay(800));
    }

    const headers = this.apiService.getAuthHeaders();
    return this.http.put<RecurringChore>(`${this.baseUrl}/recurring/update`, recurringChore, { headers });
  }

  // Delete a recurring chore
  deleteRecurringChore(recurringChoreId: string): Observable<{message: string}> {
    if (this.isSimulatedMode) {
      return of({ message: 'Recurring chore deleted successfully' }).pipe(delay(800));
    }

    const headers = this.apiService.getAuthHeaders();
    return this.http.delete<{message: string}>(`${this.baseUrl}/recurring/delete?recurring_chore_id=${recurringChoreId}`, { headers });
  }
}