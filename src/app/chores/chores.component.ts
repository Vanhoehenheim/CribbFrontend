import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChoreService, Chore, RecurringChore } from '../services/chore.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { 
  iconoirCheck, 
  iconoirTrash, 
  iconoirEditPencil 
} from '@ng-icons/iconoir';


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
  imports: [CommonModule, FormsModule, NgIcon],
  providers: [provideIcons({ 
    iconoirCheck, 
    iconoirTrash, 
    iconoirEditPencil 
  })]
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
  selectedParticipants: string[] = [];
  
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
  
  // NEW: Celebration popup state
  showCelebration = false;             // Controls visibility of celebration modal
  celebrationPoints = 0;               // Points earned on completion
  
  // ===== DELETE CONFIRMATION MODAL =====
  deleteChoreForConfirm: Chore | null = null; // The chore selected for deletion
  showDeleteConfirm = false;
  
  // ===== EDITING STATE =====
  editingMode = false;                       // True when editing an existing chore
  editingChore: Chore | null = null;         // The chore currently being edited
  
  participantDropdownOpen = false;
  
  // Helper to display selected participant names
  get selectedParticipantsDisplay(): string {
    if (this.selectedParticipants.length === 0) return 'Select participants';
    const names = this.availableRoommates
      .filter(r => this.selectedParticipants.includes(r.username))
      .map(r => r.name);
    return names.join(', ');
  }
  
  constructor(
    private apiService: ApiService,     // Service for user and auth operations
    private choreService: ChoreService,  // Service for chore CRUD operations
    private router: Router           // Angular router for navigation
  ) {
    document.addEventListener('click', () => {
      this.participantDropdownOpen = false;
    });
  }
  
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
        // Show celebration popup with earned points
        this.celebrationPoints = response.points_earned;
        this.showCelebration = true;
        // Auto-hide after a few seconds
        setTimeout(() => this.showCelebration = false, 5000);
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
    
    // Calculate the due_date as the end (23:59) of the selected local day so the user has the full day to complete it
    const selectedDate = new Date(this.newIndividualChore.due_date);
    selectedDate.setHours(23, 59, 0, 0);
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
    
    const participants = this.selectedParticipants.length > 0 ? this.selectedParticipants : this.availableRoommates.map(r => r.username);
    
    // Compute first_due_date as end of local day, expressed in UTC ISO string
    const firstDue = new Date();
    firstDue.setHours(23, 59, 0, 0);
    const firstDueISO = firstDue.toISOString();

    const choreData = {
      title: this.newRecurringChore.title,
      description: this.newRecurringChore.description,
      group_name: this.user.groupName,
      frequency: this.newRecurringChore.frequency,
      points: this.newRecurringChore.points,
      member_usernames: participants,
      first_due_date: firstDueISO
    };
    
    this.choreService.createRecurringChore(choreData).subscribe({
      next: (newRecurringChore) => {
        console.log('Recurring chore created successfully!');
        
        if (!this.recurringChores) { this.recurringChores = []; }
        this.recurringChores.unshift(newRecurringChore);
        
        // Create a temporary chore instance with UI-only ID. The due date is set
        // to the end of the current local day (23:59) to mirror the backend logic.
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 0, 0);

        const newChoreInstance: any = {
          id: 'chore' + Date.now(),
          title: newRecurringChore.title,
          description: newRecurringChore.description,
          group_name: this.user.groupName,
          assigned_to: participants[0],
          due_date: endOfDay.toISOString(),
          points: newRecurringChore.points,
          status: 'pending',
          type: 'recurring',
          recurring_id: newRecurringChore.id
        };
        
        if (!this.chores) { this.chores = []; }
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
    this.editingMode = false;
    this.editingChore = null;
    this.selectedParticipants = [];
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
    let filtered: Chore[];
    
    switch (this.activeTab) {
      case 'yours':
        filtered = this.chores.filter(chore => this.isYourTurn(chore));
        break;
      case 'overdue':
        filtered = this.chores.filter(chore => chore.status === 'overdue');
        break;
      case 'completed':
        filtered = this.chores.filter(chore => chore.status === 'completed');
        break;
      default:
        filtered = this.chores;
    }
    
    // Sort chores: overdue first, then pending, then completed
    return filtered.sort((a, b) => {
      const statusOrder = { 'overdue': 0, 'pending': 1, 'completed': 2 };
      const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 1;
      const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 1;
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      // If same status, sort by due date (earliest first)
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
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
  
  // NEW: Close celebration popup manually
  closeCelebration(): void {
    this.showCelebration = false;
  }
  
  clearCompletedChores(): void {
    if (!this.user) return;
    if (!confirm('Are you sure you want to remove all completed chores?')) {
      return;
    }
    this.choreService.clearCompletedChores(this.user.groupName).subscribe({
      next: (res) => {
        console.log(`Deleted ${res.deleted_count} completed chores`);
        // Refresh list
        this.loadGroupChores();
        // Switch away from completed tab if nothing remains
        this.activeTab = 'all';
      },
      error: (error) => {
        console.error('Error clearing completed chores:', error);
        this.error = 'Failed to clear completed chores. Please try again.';
        setTimeout(() => this.error = null, 3000);
      }
    });
  }
  
  /** Open confirmation modal */
  openDeleteConfirm(chore: Chore): void {
    this.deleteChoreForConfirm = chore;
    this.showDeleteConfirm = true;
  }

  /** Cancel deletion */
  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deleteChoreForConfirm = null;
  }

  /** Delete only this instance */
  confirmDeleteInstance(): void {
    if (!this.deleteChoreForConfirm) { return; }
    const id = this.deleteChoreForConfirm.id;
    this.showDeleteConfirm = false;
    this.deleteChoreForConfirm = null;
    this.choreService.deleteChore(id).subscribe({
      next: () => {
        this.chores = this.chores.filter(c => c.id !== id);
      },
      error: (error) => {
        console.error('Error deleting chore:', error);
        this.error = 'Failed to delete chore. Please try again.';
        setTimeout(() => this.error = null, 3000);
      }
    });
  }

  /** Delete the recurring template (and pending instances) */
  confirmDeleteRecurring(): void {
    if (!this.deleteChoreForConfirm || this.deleteChoreForConfirm.type !== 'recurring') { return; }
    const recurringId = this.deleteChoreForConfirm.recurring_id || this.deleteChoreForConfirm.id;
    this.showDeleteConfirm = false;
    this.deleteChoreForConfirm = null;
    this.choreService.deleteRecurringChore(recurringId).subscribe({
      next: () => {
        // Remove any chores linked to this recurring template
        this.chores = this.chores.filter(c => c.recurring_id !== recurringId && c.id !== recurringId);
        // Remove template from list
        this.recurringChores = this.recurringChores.filter(rc => rc.id !== recurringId);
      },
      error: (error) => {
        console.error('Error deleting recurring chore:', error);
        this.error = 'Failed to delete recurring chore. Please try again.';
        setTimeout(() => this.error = null, 3000);
      }
    });
  }

  /**
   * Open the edit chore modal pre-filled with the chore's details.
   */
  openEditChore(chore: Chore): void {
    this.editingMode = true;
    this.editingChore = chore;
    this.showNewChoreForm = true;
    this.isRecurringChore = chore.type === 'recurring';

    if (this.isRecurringChore) {
      // Populate recurring form
      this.newRecurringChore = {
        title: chore.title,
        description: chore.description,
        frequency: (this.recurringChores.find(rc => rc.id === (chore.recurring_id || ''))?.frequency || 'weekly') as 'daily' | 'weekly' | 'biweekly' | 'monthly',
        points: chore.points
      };

      // Attempt to prefill participants (best-effort using availableRoommates)
      this.selectedParticipants = this.availableRoommates
        .filter(r => r.id === chore.assigned_to || r.username === chore.assigned_to)
        .map(r => r.username);
    } else {
      // Populate individual form
      const roommate = this.availableRoommates.find(r => r.id === chore.assigned_to) ||
                       this.availableRoommates.find(r => r.username === chore.assigned_to);

      this.newIndividualChore = {
        title: chore.title,
        description: chore.description,
        assigned_to: roommate ? roommate.username : chore.assigned_to,
        due_date: this.formatDate(new Date(chore.due_date)),
        points: chore.points
      };
    }
  }

  /**
   * Decide whether to create a new chore or update an existing one based on editingMode flag.
   */
  submitChoreForm(): void {
    if (this.editingMode) {
      this.updateExistingChore();
    } else {
      this.createNewChore();
    }
  }

  /**
   * Update an existing chore (individual or recurring).
   */
  private updateExistingChore(): void {
    if (!this.editingChore) { return; }

    if (this.isRecurringChore) {
      // Update recurring chore template
      this.choreService.updateRecurringChore({
        recurring_chore_id: this.editingChore.recurring_id || this.editingChore.id,
        title: this.newRecurringChore.title,
        description: this.newRecurringChore.description,
        frequency: this.newRecurringChore.frequency,
        points: this.newRecurringChore.points,
        member_usernames: this.selectedParticipants
      }).subscribe({
        next: (updated) => {
          // Ensure status and display name are correct after update
          const now = new Date();
          const due = new Date((updated as any).due_date);
          if (due >= now) {
            (updated as any).status = 'pending';
          }

          const room = this.availableRoommates.find(r => r.id === (updated as any).assigned_to) ||
                       this.availableRoommates.find(r => r.username === (updated as any).assigned_to);
          if (room) {
            (updated as any).assignee_name = room.name;
          }

          // Update local collections
          const idx = this.chores.findIndex(c => c.id === this.editingChore!.id);
          if (idx !== -1) {
            this.chores[idx] = updated as any;
          }
          const rIdx = this.recurringChores.findIndex(rc => rc.id === updated.id);
          if (rIdx !== -1) {
            this.recurringChores[rIdx] = updated;
          }
          this.resetChoreForm();
        },
        error: (error) => {
          console.error('Error updating recurring chore:', error);
          this.error = 'Failed to update chore. Please try again.';
          setTimeout(() => this.error = null, 3000);
        }
      });
    } else {
      // Update individual chore
      // Convert due_date to ISO at 00:00 next day similar to create logic
      const selectedDate = new Date(this.newIndividualChore.due_date);
      selectedDate.setDate(selectedDate.getDate() + 1);
      selectedDate.setHours(0, 0, 0, 0);
      const dueDateISO = selectedDate.toISOString();

      this.choreService.updateChore({
        chore_id: this.editingChore.id,
        title: this.newIndividualChore.title,
        description: this.newIndividualChore.description,
        assigned_to: this.newIndividualChore.assigned_to,
        due_date: dueDateISO,
        points: this.newIndividualChore.points
      }).subscribe({
        next: (updated) => {
          // Ensure status and display name are correct after update
          const now = new Date();
          const due = new Date((updated as any).due_date);
          if (due >= now) {
            (updated as any).status = 'pending';
          }

          const room = this.availableRoommates.find(r => r.id === (updated as any).assigned_to) ||
                       this.availableRoommates.find(r => r.username === (updated as any).assigned_to);
          if (room) {
            (updated as any).assignee_name = room.name;
          }

          // Update local collections
          const idx = this.chores.findIndex(c => c.id === this.editingChore!.id);
          if (idx !== -1) {
            this.chores[idx] = updated as any;
          }
          this.resetChoreForm();
        },
        error: (error) => {
          console.error('Error updating chore:', error);
          this.error = 'Failed to update chore. Please try again.';
          setTimeout(() => this.error = null, 3000);
        }
      });
    }
  }

  onParticipantToggle(username: string, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    event.stopPropagation();
    const checked = !!input?.checked;

    if (checked) {
      if (!this.selectedParticipants.includes(username)) {
        this.selectedParticipants.push(username);
      }
    } else {
      this.selectedParticipants = this.selectedParticipants.filter(u => u !== username);
    }
  }

  // Add toggle method
  toggleParticipantDropdown(e: Event): void {
    e.stopPropagation();
    this.participantDropdownOpen = !this.participantDropdownOpen;
  }
}