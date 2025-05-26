import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChoreService, Chore, RecurringChore } from '../services/chore.service';


/**
 * ChoresComponent manages household chore assignments and tracking
 * Includes features for creating, completing, postponing and managing both
 * one-time and recurring household chores
 */
@Component({
  selector: 'app-chores',
  templateUrl: './chores.component.html',
  styleUrl: './chores.component.css',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ChoresComponent implements OnInit {
  // Core data collections
  user: any = null;
  chores: Chore[] = [];                // All chores for the current group
  recurringChores: RecurringChore[] = []; // Recurring chore templates
  
  // UI and filtering state
  loading = true;                      // Loading indicator
  error: string | null = null;         // Error message display
  activeTab: 'all' | 'yours' | 'overdue' | 'completed' = 'all'; // Current filter tab
  
  // Create new chore UI state
  showNewChoreForm = false;            // Controls visibility of new chore form
  isRecurringChore = false;            // Toggle between individual and recurring chore
  
  // Form data for new individual chore
  newIndividualChore = {
    title: '',                         // Chore title/name
    description: '',                   // Details about the chore
    assigned_to: '',                   // User ID the chore is assigned to
    due_date: this.formatDate(new Date()), // Default to today
    points: 5                          // Points awarded for completion
  };
  
  // Form data for new recurring chore
  newRecurringChore = {
    title: '',                         // Recurring chore title
    description: '',                   // Details about the recurring chore
    frequency: 'weekly' as 'daily' | 'weekly' | 'biweekly' | 'monthly', // How often it repeats
    points: 5                          // Points awarded for each instance
  };
  
  // // Household group context
  // groupName: string = "Pantry";        // Current household name
  
  // Available household members for assignments
  availableRoommates: {id: string, name: string, username: string}[] = [];
  
  constructor(
    private apiService: ApiService,     // Service for user and auth operations
    private choreService: ChoreService,  // Service for chore CRUD operations
    private router: Router           // Angular router for navigation
  ) {}
  
  /**
   * Initialize the component by loading chores, recurring templates,
   * and available roommates for assignments
   */
  ngOnInit(): void {
    this.apiService.user$.subscribe((userData) => {
      this.user = userData;
      if (this.user) {
        this.loadGroupChores();
        this.loadRecurringChores();
        this.loadRoommates();
      }
      this.loading = false;
    });
  }
  
  /**
   * Helper to format JavaScript Date to YYYY-MM-DD format for form inputs
   * @param date - Date to format
   * @returns Formatted date string
   */
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  /**
   * Load available household members for chore assignment
   */
  loadRoommates(): void {
    this.apiService.getGroupMembers(this.user.groupName).subscribe({
      next: (members) => {
        this.availableRoommates = members.map((member: any) => ({
          id: member._id,  // MongoDB ObjectID for the user
          name: member.name || `${member.firstName} ${member.lastName}`,
          username: member.username
        }));
      },
      error: (error) => {
        console.error('Error loading group members:', error);
        this.error = 'Failed to load group members. Please try again.';
        setTimeout(() => this.error = null, 3000);
      }
    });
  }
  
  /**
   * Load all chores for the current household group
   */
  loadGroupChores(): void {
    this.loading = true;
    this.error = null;
    console.log('Loading chores for group:', this.user.groupName);
    this.choreService.getGroupChores(this.user.groupName).subscribe({
      next: (chores) => {
        this.chores = chores;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading chores:', error);
        this.error = 'Failed to load chores. Please try again.';
        this.loading = false;
      }
    });
  }
  
  /**
   * Load recurring chore templates for the current household
   */
  loadRecurringChores(): void {
    this.choreService.getRecurringChores(this.user.groupName).subscribe({
      next: (recurringChores) => {
        this.recurringChores = recurringChores;
      },
      error: (error) => {
        console.error('Error loading recurring chores:', error);
      }
    });
  }
  
  /**
   * Check if a chore has passed its due date
   * @param chore - The chore to check
   */
  isOverdue(chore: Chore): boolean {
    return chore.status === 'overdue';
  }
  
  /**
   * Determine if the current user is assigned to a chore
   * @param chore - The chore to check
   * @returns True if the current user is assigned to this chore
   */
  isYourTurn(chore: Chore): boolean {
    const currentUser = this.apiService.getCurrentUser();
    if (!currentUser) return false;

    // First check the assigned_to field with user ID
    if (chore.assigned_to === currentUser.id) return true;

    // If not found by ID, try to find by username
    const roommate = this.availableRoommates.find(r => r.id === chore.assigned_to);
    if (roommate) {
      return roommate.id === currentUser.id;
    }
    
    return false;
  }
  
  /**
   * Mark a chore as completed and earn points
   * @param choreId - ID of the chore to complete
   */
  completeChore(choreId: string): void {
    const currentUser = this.apiService.getCurrentUser();
    if (!currentUser) return;
    
    this.choreService.completeChore(choreId, currentUser.id).subscribe({
      next: (response) => {
        console.log(`Chore completed! Earned ${response.points_earned} points. New score: ${response.new_score}`);
        // Reload chores to get updated list after completion
        this.loadGroupChores();
      },
      error: (error) => {
        console.error('Error completing chore:', error);
        this.error = 'Failed to complete chore. Please try again.';
        setTimeout(() => this.error = null, 3000);
      }
    });
  }
  
  /**
   * Postpone a chore's due date by 2 days
   * @param choreId - ID of the chore to postpone
   */
  postponeChore(choreId: string): void {
    // Find the chore in the local collection
    const chore = this.chores.find(c => c.id === choreId);
    if (!chore) return;
    
    // Calculate new due date (2 days later)
    const currentDueDate = new Date(chore.due_date);
    currentDueDate.setDate(currentDueDate.getDate() + 2);
    currentDueDate.setHours(0, 0, 0, 0);
    const newDueDate = currentDueDate.toISOString();
    
    // Update the chore due date
    this.choreService.updateChore({
      chore_id: choreId,
      due_date: newDueDate
    }).subscribe({
      next: (updatedChore) => {
        // Update the local chore in the collection
        const index = this.chores.findIndex(c => c.id === choreId);
        if (index !== -1) {
          this.chores[index] = updatedChore;
        }
        
        console.log('Chore postponed successfully!');
        
      },
      error: (error) => {
        console.error('Error postponing chore:', error);
        this.error = 'Failed to postpone chore. Please try again.';
        setTimeout(() => this.error = null, 3000);
      }
    });
  }
  
  /**
   * Create a new chore based on form type selection (individual or recurring)
   */
  createNewChore(): void {
    if (this.isRecurringChore) {
      this.createRecurringChore();
    } else {
      this.createIndividualChore();
    }
  }
  
  /**
   * Create a new one-time individual chore
   */
  createIndividualChore(): void {
    if (!this.newIndividualChore.title || !this.newIndividualChore.assigned_to) {
      this.error = "Please fill in all required fields.";
      setTimeout(() => this.error = null, 3000);
      return;
    }
    console.log(this.user.groupName)
    
    // Calculate the due_date as the UTC start of the next day to cover the full selected day locally
    const selectedDate = new Date(this.newIndividualChore.due_date);
    selectedDate.setDate(selectedDate.getDate() + 1);
    selectedDate.setHours(0, 0, 0, 0);
    const dueDateISO = selectedDate.toISOString();

    const choreData = {
      title: this.newIndividualChore.title,
      description: this.newIndividualChore.description,
      group_name: this.user.groupName,
      assigned_to: this.newIndividualChore.assigned_to, // Send username
      due_date: dueDateISO, // Send UTC start of the next day so user gets full local day
      points: this.newIndividualChore.points
    };
    
    this.choreService.createIndividualChore(choreData).subscribe({
      next: (newChore) => {
        // Find the display name from available roommates using the ID
        const assignedRoommate = this.availableRoommates.find(r => r.id === newChore.assigned_to);
        if (assignedRoommate) {
          (newChore as any).assignee_name = assignedRoommate.name; // Add the name
        } else {
          // Fallback: try finding by username just in case, though ID should be primary
          const roommateByUsername = this.availableRoommates.find(r => r.username === this.newIndividualChore.assigned_to);
          (newChore as any).assignee_name = roommateByUsername ? roommateByUsername.name : newChore.assigned_to; 
        }
        
        // Add the new chore (now with assignee_name) to the local collection
        this.chores.unshift(newChore);
        
        // Reset the form after successful creation
        this.resetChoreForm();
        
        console.log('Individual chore created successfully!');
      },
      error: (error) => {
        console.error('Error creating individual chore:', error);
        this.error = 'Failed to create chore. Please try again.';
        setTimeout(() => this.error = null, 3000);
      }
    });
  }
  
  /**
   * Create a new recurring chore template
   */
  createRecurringChore(): void {
    if (!this.newRecurringChore.title) {
      this.error = "Please provide a title for the recurring chore.";
      setTimeout(() => this.error = null, 3000);
      return;
    }
    
    // Show loading indicator during creation
    this.loading = true;
    
    const choreData = {
      title: this.newRecurringChore.title,
      description: this.newRecurringChore.description,
      group_name: this.user.groupName,
      frequency: this.newRecurringChore.frequency,
      points: this.newRecurringChore.points
    };
    
    this.choreService.createRecurringChore(choreData).subscribe({
      next: (newRecurringChore) => {
        console.log('Recurring chore created successfully!');
        
        // Add the recurring template to the collection
        this.recurringChores.unshift(newRecurringChore);
        
        // Create a temporary chore instance for immediate UI feedback
        const currentUser = this.apiService.getCurrentUser();
        const username = currentUser ? 
          `${currentUser.firstName.toLowerCase()}_${currentUser.lastName.toLowerCase()}` : 
          (this.availableRoommates.length > 0 ? this.availableRoommates[0].username : 'john_doe');
        
        // Create temporary chore instance with UI-only ID
        const newChoreInstance: any = {
          id: 'chore' + Date.now(),
          title: newRecurringChore.title,
          description: newRecurringChore.description,
          group_name: this.user.groupName,
          assigned_to: username,
          due_date: new Date().toISOString(),
          points: newRecurringChore.points,
          status: 'pending',
          type: 'recurring',
          recurring_id: newRecurringChore.id
        };
        
        // Add temporary instance to local collection for immediate display
        this.chores.unshift(newChoreInstance);
        
        // Reset UI state
        this.resetChoreForm();
        this.loading = false;
        
        // Get the actual server-created instances
        this.reloadChores();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error creating recurring chore:', error);
        this.error = 'Failed to create recurring chore. Please try again.';
        setTimeout(() => this.error = null, 3000);
      }
    });
  }
  
  /**
   * Reload all chores from the server to update the list
   */
  reloadChores(): void {
    // Clear current chores collection
    this.chores = [];
    
    // Load the updated collection from server
    this.choreService.getGroupChores(this.user.groupName).subscribe({
      next: (chores) => {
        this.chores = chores;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        console.error('Error reloading chores:', error);
        this.error = 'Failed to load updated chores. Please refresh the page.';
        setTimeout(() => this.error = null, 3000);
      }
    });
  }
  
  /**
   * Delete a chore from the system
   * @param choreId - ID of the chore to delete
   */
  deleteChore(choreId: string): void {
    this.choreService.deleteChore(choreId).subscribe({
      next: () => {
        // Remove the deleted chore from local collection
        this.chores = this.chores.filter(c => c.id !== choreId);
        console.log('Chore deleted successfully!');
      },
      error: (error) => {
        console.error('Error deleting chore:', error);
        this.error = 'Failed to delete chore. Please try again.';
        setTimeout(() => this.error = null, 3000);
      }
    });
  }
  
  /**
   * Toggle visibility of the new chore form
   */
  toggleNewChoreForm(): void {
    this.showNewChoreForm = !this.showNewChoreForm;
    if (!this.showNewChoreForm) {
      this.resetChoreForm();
    }
  }
  
  /**
   * Reset all chore form fields to default values
   */
  resetChoreForm(): void {
    this.newIndividualChore = {
      title: '',
      description: '',
      assigned_to: '',
      due_date: this.formatDate(new Date()),
      points: 5
    };
    
    this.newRecurringChore = {
      title: '',
      description: '',
      frequency: 'weekly',
      points: 5
    };
    
    this.isRecurringChore = false;
    this.showNewChoreForm = false;
  }
  
  /**
   * Get a user's display name from their ID or username
   * @param userIdOrUsername - The user ID or username to look up
   * @returns Human-readable name for display
   */
  getUserDisplayName(userIdOrUsername: string): string {
    // First check if we have the assignee name directly from the backend
    const chore = this.chores.find(c => c.assigned_to === userIdOrUsername);
    if (chore?.assignee_name) {
      return chore.assignee_name;
    }

    // If not found by username or no assignee_name, try to find by ID
    let roommate = this.availableRoommates.find(r => r.id === userIdOrUsername);
    if (roommate) {
      return roommate.name;
    }
    
    // If still not found, try to find by username in availableRoommates
    roommate = this.availableRoommates.find(r => r.username === userIdOrUsername);
    if (roommate) {
      return roommate.name;
    }
    
    // If all lookups fail, return the original value
    return userIdOrUsername;
  }
  
  /**
   * Change the active tab filter for chores display
   * @param tab - Filter tab to activate
   */
  setActiveTab(tab: 'all' | 'yours' | 'overdue' | 'completed'): void {
    this.activeTab = tab;
  }
  
  /**
   * Filter chores based on the currently active tab
   * Used in template to determine which chores to display
   */
  get filteredChores(): Chore[] {
    switch (this.activeTab) {
      case 'yours':
        return this.chores.filter(chore => this.isYourTurn(chore));
      case 'overdue':
        return this.chores.filter(chore => chore.status === 'overdue');
      case 'completed':
        return this.chores.filter(chore => chore.status === 'completed');
      default:
        return this.chores;
    }
  }
  
  /**
   * Convert recurring frequency value to human-readable label
   * @param frequency - The frequency value from the API
   * @returns Human-readable frequency label
   */
  getRecurringFrequencyLabel(frequency: string): string {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'biweekly': return 'Bi-weekly';
      case 'monthly': return 'Monthly';
      default: return frequency;
    }
  }
}