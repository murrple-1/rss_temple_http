import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ClarityModule } from '@clr/angular';

import { of } from 'rxjs';

import { FeedService, FeedEntryService, UserService } from '@app/services/data';
import { FeedCountsObservableService } from '@app/routes/main/services';

import { ExploreComponent } from './explore.component';

async function setup() {
  const mockFeedCountsObservableService = jasmine.createSpyObj<FeedCountsObservableService>(
    'FeedCountsObservableService',
    ['refresh'],
  );
  (mockFeedCountsObservableService as any).feedCounts$ = of({});

  const mockFeedService = jasmine.createSpyObj<FeedService>('FeedService', [
    'query',
  ]);
  const mockFeedEntryService = jasmine.createSpyObj<FeedEntryService>(
    'FeedEntryService',
    ['query'],
  );
  const mockUserService = jasmine.createSpyObj<UserService>('UserService', [
    'get',
    'update',
  ]);

  await TestBed.configureTestingModule({
    imports: [
      FormsModule,
      BrowserAnimationsModule,
      ClarityModule,
      RouterTestingModule.withRoutes([]),
    ],
    declarations: [ExploreComponent],
    providers: [
      {
        provide: FeedService,
        useValue: mockFeedService,
      },
    ],
  }).compileComponents();

  return {
    mockFeedCountsObservableService,
    mockFeedService,
    mockFeedEntryService,
    mockUserService,
  };
}

describe('ExploreComponent', () => {
  it(
    'should create the component',
    waitForAsync(async () => {
      await setup();

      const componentFixture = TestBed.createComponent(ExploreComponent);
      const component = componentFixture.componentInstance;
      expect(component).toBeTruthy();
    }),
  );

  it(
    'can run ngOnInit',
    waitForAsync(async () => {
      const {
        mockUserService,
        mockFeedService,
        mockFeedEntryService,
      } = await setup();
      mockUserService.get.and.returnValue(of({}));
      mockFeedService.query.and.returnValue(
        of({
          objects: [],
          totalCount: 0,
        }),
      );
      mockFeedEntryService.query.and.returnValue(
        of({
          objects: [],
          totalCount: 0,
        }),
      );

      const componentFixture = TestBed.createComponent(ExploreComponent);
      const component = componentFixture.componentInstance;

      component.ngOnInit();

      expect().nothing();
    }),
  );

  // TODO more tests
});