import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ShoppingCartService } from './shopping-cart.service';
import { ApiService } from './api.service';

describe('ShoppingCartService', () => {
  let service: ShoppingCartService;
  let httpMock: HttpTestingController;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['getBaseUrl', 'getAuthHeaders', 'getCurrentUser']);
    apiServiceSpy.getCurrentUser.and.returnValue({ id: 'user123', groupName: 'testGroup' } as any);
    apiServiceSpy.getBaseUrl.and.returnValue('http://localhost:8080/api');

    TestBed.configureTestingModule({
      providers: [
        ShoppingCartService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });
    service = TestBed.inject(ShoppingCartService);
    httpMock = TestBed.inject(HttpTestingController);
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  afterEach(() => {
    httpMock.verify();
  });
});
