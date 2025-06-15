import { Component, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { iconoirTrophy } from "@ng-icons/iconoir";
import { GroupService, GroupDetails } from "../services/group.service";
import { ApiService } from "../services/api.service";
import { Modal, initFlowbite } from 'flowbite';
import { Router } from "@angular/router";

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  providers: [provideIcons({ iconoirTrophy })],
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent implements OnInit {
  // Reactive state
  user = signal<any>(null);
  groupDetails = signal<GroupDetails | null>(null);
  leaderboard = signal<any[]>([]);

  loadingGroup = signal(true);
  error = signal<string | null>(null);

  // Leave group modal helpers
  private leaveModal: Modal | null = null;
  carryForward = true; // By default, carry forward points

  constructor(
    private groupService: GroupService,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize Flowbite components including modal
    initFlowbite();

    // Get current user first
    const current = this.api.getCurrentUser();
    if (!current || !current.groupName) {
      this.error.set('You are not in a household group yet.');
      this.loadingGroup.set(false);
      return;
    }

    this.user.set(current);

    // Fetch group details and leaderboard concurrently
    this.groupService.getGroupDetails(current.groupName).subscribe({
      next: (details) => this.groupDetails.set(details),
      error: (err) => {
        console.error('Failed to load group details', err);
        this.error.set('Failed to load group details.');
      }
    });

    this.groupService.getGroupLeaderboard(current.groupName).subscribe({
      next: (board) => this.leaderboard.set(board),
      error: (err) => {
        console.error('Failed to load leaderboard', err);
        this.error.set('Failed to load leaderboard.');
      },
      complete: () => this.loadingGroup.set(false)
    });
  }

  /**
   * Initialise modal element reference after view init (safe lazy approach)
   */
  private initModal(): void {
    if (!this.leaveModal) {
      const el = document.getElementById('leave-group-modal');
      if (el) {
        this.leaveModal = new Modal(el);
      }
    }
  }

  openLeaveModal(): void {
    this.initModal();
    if (this.leaveModal) {
      this.leaveModal.show();
    }
  }

  closeLeaveModal(): void {
    if (this.leaveModal) {
      this.leaveModal.hide();
    }
  }

  // Invoke API to leave group
  confirmLeave(): void {
    this.api.leaveGroup(this.carryForward).subscribe({
      next: () => {
        this.closeLeaveModal();
        // Redirect to group setup page
        this.router.navigate(['/group-setup']);
      },
      error: (err) => {
        console.error('Failed to leave group', err);
        alert('Failed to leave group: ' + (err?.message || 'Unknown error'));
      }
    });
  }

  // Utility to display top 3 trophy color classes
  trophyClass(idx: number): string {
    switch (idx) {
      case 0:
        return 'text-yellow-600';
      case 1:
        return 'text-gray-400';
      case 2:
        return 'text-yellow-800';
      default:
        return '';
    }
  }
} 