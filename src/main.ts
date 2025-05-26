import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';

/**
 * Application entry point
 * Bootstraps the root component with necessary providers
 */
bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),    // Enables HTTP requests throughout the application
    provideRouter(routes)   // Configures the Angular router with defined routes
  ]
}).catch(err => console.error(err));
