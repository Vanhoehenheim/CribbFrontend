import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification, NotificationType } from '../../../models/notification.model';
import { ShoppingCartService } from '../../../services/shopping-cart.service';
import { catchError } from 'rxjs/operators';
import { EMPTY, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-notification-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification-item.component.html',
  styleUrls: ['./notification-item.component.css']
})
export class NotificationItemComponent {
  @Input() notification!: Notification;
  @Output() markAsRead = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  private shoppingCartService = inject(ShoppingCartService);
  showAddToCartModal: boolean = false;
  quantityForCartModal: number = 1;
  isAddingToCartInModal: boolean = false;
  addToCartModalError: string | null = null;

  // Make enum accessible in template
  NotificationType = NotificationType;
  
  /**
   * Get CSS class based on notification type
   */
  getTypeClass(): string {
    switch (this.notification.type) {
      case NotificationType.EXPIRED:
        return 'text-red-500';
      case NotificationType.EXPIRING:
        return 'text-yellow-500';
      case NotificationType.LOW_STOCK:
        return 'text-blue-500';
      case NotificationType.OUT_OF_STOCK:
        return 'text-orange-500';
      default:
        return '';
    }
  }

  /**
   * Get icon based on notification type
   */
  getTypeIcon(): string {
    switch (this.notification.type) {
      case NotificationType.EXPIRED:
        return 'exclamation-circle';
      case NotificationType.EXPIRING:
        return 'clock';
      case NotificationType.LOW_STOCK:
        return 'shopping-cart';
      case NotificationType.OUT_OF_STOCK:
        return 'exclamation-triangle';
      default:
        return 'bell';
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  /**
   * Handle mark as read button click
   */
  onMarkAsRead(event: Event): void {
    event.stopPropagation();
    this.markAsRead.emit(this.notification.id);
  }

  /**
   * Handle delete button click
   */
  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.notification.id);
  }

  /**
   * Opens the Add to Cart modal.
   */
  openAddToCartModal(event: Event): void {
    event.stopPropagation();
    if (!this.notification) return;

    this.quantityForCartModal = 1;
    this.addToCartModalError = null;
    this.isAddingToCartInModal = false;
    this.showAddToCartModal = true;
    console.log('Opening add to cart modal for:', this.notification.item_name);
  }

  /**
   * Closes the Add to Cart modal.
   */
  closeAddToCartModal(): void {
    this.showAddToCartModal = false;
    console.log('Closing add to cart modal.');
  }

  /**
   * Handle Add to Cart confirmation from modal
   */
  confirmAddToCart(): void {
    if (!this.notification || this.isAddingToCartInModal || this.quantityForCartModal <= 0) {
      this.addToCartModalError = 'Please enter a valid quantity.';
      setTimeout(() => this.addToCartModalError = null, 3000);
      return;
    }

    console.log(`Confirming add item to cart: ${this.notification.item_name}, Quantity: ${this.quantityForCartModal}`);
    this.isAddingToCartInModal = true;
    this.addToCartModalError = null;

    this.shoppingCartService.addItem(this.notification.item_name, this.quantityForCartModal)
      .pipe(
        catchError(error => {
          console.error('Error adding item to cart from notification modal:', error);
          this.addToCartModalError = error.message || 'Failed to add item to cart. Please try again.';
          this.isAddingToCartInModal = false;
          return EMPTY;
        })
      )
      .subscribe({
        next: (result) => {
          if (result) {
            console.log(`Successfully added ${this.notification.item_name} to cart.`);
            this.closeAddToCartModal();
          }
        },
        complete: () => {
          if (!this.addToCartModalError) {
             this.isAddingToCartInModal = false;
          }
        }
      });
  }
} 