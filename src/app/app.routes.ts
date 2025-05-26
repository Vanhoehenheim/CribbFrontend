import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { ProfileComponent } from './profile/profile.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ChoresComponent } from './chores/chores.component';
import { PantryComponent } from './components/pantry/pantry.component';

/**
 * Application routes configuration
 * Defines the mapping between URL paths and components
 */
export const routes: Routes = [
    // Public routes accessible without authentication
    { path: '', component: LandingComponent },                // Default route shows landing page
    { path: 'landing-page', component: LandingComponent },    // Explicit landing page route
    { path: 'login', component: LoginComponent },             // User login page
    { path: 'signup', component: SignupComponent },           // New user registration
    
    // Protected routes requiring authentication
    { path: 'profile', component: ProfileComponent },         // User profile page
    
    // Dashboard with nested feature routes
    { 
      path: 'dashboard', 
      component: DashboardComponent,
      children: [
        // Default dashboard child route redirects to chores
        { path: '', redirectTo: 'chores', pathMatch: 'full' },
        
        // Feature routes as children of dashboard
        { path: 'chores', component: ChoresComponent },       // Household chores feature
        { path: 'pantry', component: PantryComponent },        // Pantry management feature
        { path: 'shopping-cart', loadComponent: () => import('./shopping-cart/shopping-cart.component').then(m => m.ShoppingCartComponent) } // Shopping Cart feature
      ]
    },
];