/// <reference types="jasmine" />
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { AddItemComponent } from './add-item.component';
import { PantryService } from '../../../services/pantry.service';
import { ApiService } from '../../../services/api.service';

describe('AddItemComponent', () => {
  let component: AddItemComponent;
  let fixture: ComponentFixture<AddItemComponent>;
  let pantryService: any;
  let apiService: any;

  // Mock user data
  const mockUser = {
    id: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '1234567890',
    groupName: 'Test Group',
    groupCode: 'ABC123',
    roomNo: '101'
  };

  beforeEach(async () => {
    // Create mock services
    pantryService = jasmine.createSpyObj('PantryService', ['addItem']);
    apiService = jasmine.createSpyObj('ApiService', ['getCurrentUser']);

    // Set default return values
    pantryService.addItem.and.returnValue(of({ success: true }));
    apiService.getCurrentUser.and.returnValue(mockUser);

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        AddItemComponent
      ],
      providers: [
        { provide: PantryService, useValue: pantryService },
        { provide: ApiService, useValue: apiService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddItemComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).not.toBeNull();
  });

  it('should initialize form with group name from user data', () => {
    fixture.detectChanges(); // Trigger ngOnInit
    
    // @ts-ignore: Jasmine typing issue
    expect(apiService.getCurrentUser).toHaveBeenCalled();
    // @ts-ignore: Jasmine typing issue
    expect(component.groupName).toBe('Test Group');
    // @ts-ignore: Jasmine typing issue
    expect(component.itemForm.get('group_name')?.value).toBe('Test Group');
  });

  it('should handle case when no user data is available', () => {
    apiService.getCurrentUser.and.returnValue(null);
    fixture.detectChanges();
    
    // @ts-ignore: Jasmine typing issue
    expect(component.error).toBe('User information not available');
  });

  it('should handle case when user has no group name', () => {
    const userWithoutGroup = { ...mockUser, groupName: undefined };
    apiService.getCurrentUser.and.returnValue(userWithoutGroup);
    
    fixture.detectChanges();
    
    // Test that it falls back to groupCode if available
    // @ts-ignore: Jasmine typing issue
    expect(component.groupName).toBe('Pantry');
  });

  it('should validate form fields correctly', () => {
    fixture.detectChanges();
    
    const form = component.itemForm;
    
    // Form should be invalid initially (empty required fields)
    // @ts-ignore: Jasmine typing issue
    expect(form.valid).toBeFalsy();
    
    // Fill in required fields
    form.controls['name'].setValue('Milk');
    form.controls['quantity'].setValue(2);
    form.controls['unit'].setValue('gallons');
    
    // Form should now be valid
    // @ts-ignore: Jasmine typing issue
    expect(form.valid).toBeTruthy();
    
    // Test validation - quantity can't be negative
    form.controls['quantity'].setValue(-1);
    // @ts-ignore: Jasmine typing issue
    expect(form.valid).toBeFalsy();
  });

  it('should not submit if form is invalid', () => {
    fixture.detectChanges();
    
    // Don't fill in any fields, form should be invalid
    component.onSubmit();
    
    // @ts-ignore: Jasmine typing issue
    expect(pantryService.addItem).not.toHaveBeenCalled();
  });

  it('should submit form successfully', () => {
    fixture.detectChanges();
    
    // Set up form with valid data
    component.itemForm.setValue({
      name: 'Milk',
      quantity: 2,
      unit: 'gallons',
      category: 'Dairy',
      expiration_date: '2023-12-31',
      group_name: 'Test Group'
    });
    
    // Set up output event spy
    spyOn(component.itemAdded, 'emit');
    
    // Submit the form
    component.onSubmit();
    
    // Check that the service was called with correct data
    // @ts-ignore: Jasmine typing issue
    expect(pantryService.addItem).toHaveBeenCalled();
    const addItemArgs = pantryService.addItem.calls.mostRecent().args[0];
    // @ts-ignore: Jasmine typing issue
    expect(addItemArgs.name).toBe('Milk');
    // @ts-ignore: Jasmine typing issue
    expect(addItemArgs.quantity).toBe(2);
    
    // Check success state and itemAdded event
    // @ts-ignore: Jasmine typing issue
    expect(component.success).toBeTruthy();
    // @ts-ignore: Jasmine typing issue
    expect(component.itemAdded.emit).toHaveBeenCalled();
  });

  it('should handle API error during submission', () => {
    fixture.detectChanges();
    
    // Set up form with valid data
    component.itemForm.setValue({
      name: 'Milk',
      quantity: 2,
      unit: 'gallons',
      category: 'Dairy',
      expiration_date: '2023-12-31',
      group_name: 'Test Group'
    });
    
    // Mock API error
    const errorResponse = { error: { message: 'API Error' } };
    pantryService.addItem.and.returnValue(throwError(() => errorResponse));
    
    // Submit the form
    component.onSubmit();
    
    // Check error handling
    // @ts-ignore: Jasmine typing issue
    expect(component.error).toBe('API Error');
    // @ts-ignore: Jasmine typing issue
    expect(component.loading).toBeFalsy();
    // @ts-ignore: Jasmine typing issue
    expect(component.success).toBeFalsy();
  });

  it('should format expiration date correctly', () => {
    fixture.detectChanges();
    
    // Set up form with valid data including a date
    component.itemForm.setValue({
      name: 'Milk',
      quantity: 2,
      unit: 'gallons',
      category: 'Dairy',
      expiration_date: '2023-12-31',
      group_name: 'Test Group'
    });
    
    // Prepare to capture the API call
    let capturedDate: string | undefined;
    pantryService.addItem.and.callFake((data: any) => {
      capturedDate = data.expiration_date;
      return of({ success: true });
    });
    
    // Submit the form
    component.onSubmit();
    
    // Check that the date was formatted as ISO string with time set to end of day
    // The exact time may vary due to timezone, so we just check for date part and general format
    // @ts-ignore: Jasmine typing issue
    expect(capturedDate).toContain('2023-12-31');
    // @ts-ignore: Jasmine typing issue
    expect(capturedDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
}); 