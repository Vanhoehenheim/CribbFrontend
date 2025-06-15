import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ApiService } from "../services/api.service";
import { Router } from "@angular/router";
import { initFlowbite, Modal } from 'flowbite';

@Component({
  selector: 'app-group-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './group-setup.component.html',
  styleUrls: ['./group-setup.component.css']
})
export class GroupSetupComponent implements OnInit {
  joinGroupForm: FormGroup;
  createGroupForm: FormGroup;

  joinSubmitted = false;
  createSubmitted = false;
  loading = false;
  errorMessage: string | null = null;

  private joinModal: Modal | null = null;
  private createModal: Modal | null = null;

  constructor(private fb: FormBuilder, private api: ApiService, private router: Router) {
    this.joinGroupForm = this.fb.group({
      groupCode: ['', Validators.required],
      roomNo: ['', Validators.required]
    });
    this.createGroupForm = this.fb.group({
      group: ['', Validators.required],
      roomNo: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    initFlowbite();
    const joinEl = document.getElementById('join-modal');
    const createEl = document.getElementById('create-modal');
    if (joinEl) { this.joinModal = new Modal(joinEl); }
    if (createEl) { this.createModal = new Modal(createEl); }
  }

  get jf() { return this.joinGroupForm.controls; }
  get cf() { return this.createGroupForm.controls; }

  openJoinModal() {
    this.errorMessage = null;
    this.joinSubmitted = false;
    if (this.joinModal) { this.joinModal.show(); }
  }

  openCreateModal() {
    this.errorMessage = null;
    this.createSubmitted = false;
    if (this.createModal) { this.createModal.show(); }
  }

  closeJoinModal() { if (this.joinModal) { this.joinModal.hide(); } }
  closeCreateModal() { if (this.createModal) { this.createModal.hide(); } }

  joinGroup() {
    this.joinSubmitted = true;
    if (this.joinGroupForm.invalid) { return; }
    const { groupCode, roomNo } = this.joinGroupForm.value;
    this.loading = true;
    this.api.joinGroupByCode(groupCode, roomNo).subscribe({
      next: () => {
        this.loading = false;
        this.closeJoinModal();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Failed to join group';
        this.loading = false;
      }
    });
  }

  createGroup() {
    this.createSubmitted = true;
    if (this.createGroupForm.invalid) { return; }
    const { group, roomNo } = this.createGroupForm.value;
    this.loading = true;
    this.api.createGroup(group).subscribe({
      next: () => {
        // After creating group, still need to update roomNo locally
        const user = this.api.getCurrentUser();
        if (user) {
          this.api.setUser({ ...user, roomNo });
        }
        this.loading = false;
        this.closeCreateModal();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Failed to create group';
        this.loading = false;
      }
    });
  }
} 