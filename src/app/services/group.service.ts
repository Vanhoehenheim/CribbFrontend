import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, throwError, of } from "rxjs";
import { catchError, delay } from "rxjs/operators";
import { ApiService } from "./api.service";

export interface GroupDetails {
  id: string;
  name: string;
  group_code: string;
  created_at: string;
  updated_at: string;
  member_count: number;
  total_points: number;
}

@Injectable({ providedIn: 'root' })
export class GroupService {
  private baseUrl = 'http://localhost:8080/api/groups';

  constructor(private http: HttpClient, private api: ApiService) {}

  /**
   * Fetch metadata about the specified group (household)
   * @param groupName Name of the group/household
   */
  getGroupDetails(groupName: string): Observable<GroupDetails> {
    if (this.api['isSimulatedMode']) {
      // Return fake data when the ApiService simulation flag is enabled
      const mock: GroupDetails = {
        id: 'group-' + Math.random().toString(36).substring(2),
        name: groupName,
        group_code: 'MOCK123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        member_count: 4,
        total_points: 250
      };
      return of(mock).pipe(delay(600));
    }

    const headers = this.api.getAuthHeaders();
    return this.http
      .get<GroupDetails>(`${this.baseUrl}/details`, {
        params: { group_name: groupName },
        headers
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Fetch the group leaderboard (members ordered by score)
   * @param groupName Name of the group/household
   */
  getGroupLeaderboard(groupName: string): Observable<any[]> {
    if (this.api['isSimulatedMode']) {
      const mock = [
        { id: '1', name: 'Alice', username: 'alice', score: 120 },
        { id: '2', name: 'Bob', username: 'bob', score: 100 },
        { id: '3', name: 'Charlie', username: 'charlie', score: 80 },
        { id: '4', name: 'Dana', username: 'dana', score: 60 }
      ];
      return of(mock).pipe(delay(600));
    }

    const headers = this.api.getAuthHeaders();
    return this.http
      .get<any[]>(`${this.baseUrl}/leaderboard`, {
        params: { group_name: groupName },
        headers
      })
      .pipe(catchError(this.handleError));
  }

  private handleError = (error: any) => {
    console.error('[GroupService] Error:', error);
    return throwError(() => error);
  };
} 