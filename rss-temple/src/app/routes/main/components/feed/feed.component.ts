import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Subject, zip } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

import {
  FeedService,
  FeedEntryService,
  UserCategoryService,
} from '@app/services/data';
import { HttpErrorService } from '@app/services';
import { Feed, FeedEntry, UserCategory } from '@app/models';

interface FeedImpl extends Feed {
  uuid: string;
  title: string;
  feedUrl: string;
  customTitle: string | null;
  subscribed: boolean;
  userCategoryUuids: string[];
}

interface FeedEntryImpl extends FeedEntry {
  uuid: string;
  url: string;
  title: string;
  content: string;
  isRead: boolean;
  isFavorite: boolean;
}

interface UserCategoryImpl extends UserCategory {
  text: string;
}

@Component({
  templateUrl: 'feed.component.html',
  styleUrls: ['feed.component.scss'],
})
export class FeedComponent implements OnInit, OnDestroy {
  feed: FeedImpl | null = null;
  feedEntries: FeedEntryImpl[] = [];
  userCategories: UserCategoryImpl[] = [];

  private unsubscribe$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private zone: NgZone,
    private feedService: FeedService,
    private feedEntryService: FeedEntryService,
    private userCategoryService: UserCategoryService,
    private httpErrorService: HttpErrorService,
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(takeUntil(this.unsubscribe$)).subscribe({
      next: paramMap => {
        const url = paramMap.get('url');
        const count = parseInt(paramMap.get('count') || '5', 10);

        if (url) {
          this.getFeed(url, count);
        }
      },
    });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private getFeed(url: string, count: number) {
    this.feedService
      .get(url, {
        fields: [
          'uuid',
          'title',
          'customTitle',
          'subscribed',
          'userCategoryUuids',
        ],
      })
      .pipe(
        takeUntil(this.unsubscribe$),
        map(feed => {
          return feed as FeedImpl;
        }),
      )
      .subscribe({
        next: feed => {
          feed.feedUrl = url;

          const feedEntryObservable = this.feedEntryService.query({
            fields: ['uuid', 'url', 'title', 'content', 'isRead', 'isFavorite'],
            returnTotalCount: false,
            count: count,
            search: `feedUuid:"${feed.uuid}"`,
            sort: 'createdAt:DESC,publishedAt:DESC,updatedAt:DESC',
          });

          if (feed.userCategoryUuids.length > 0) {
            zip(
              feedEntryObservable,
              this.userCategoryService.queryAll({
                fields: ['text'],
                returnTotalCount: false,
                search: `uuid:"${feed.userCategoryUuids.join('|')}"`,
                sort: 'text:ASC',
              }),
            )
              .pipe(
                takeUntil(this.unsubscribe$),
                map(([feedEntries, userCategories]) => {
                  if (
                    feedEntries.objects !== undefined &&
                    userCategories.objects !== undefined
                  ) {
                    return [feedEntries.objects, userCategories.objects] as [
                      FeedEntryImpl[],
                      UserCategoryImpl[]
                    ];
                  }
                  throw new Error('malformed response');
                }),
              )
              .subscribe({
                next: ([feedEntries, userCategories]) => {
                  this.zone.run(() => {
                    this.feed = feed;
                    this.feedEntries = feedEntries;
                    this.userCategories = userCategories;
                  });
                },
                error: error => {
                  this.httpErrorService.handleError(error);
                },
              });
          } else {
            feedEntryObservable
              .pipe(
                takeUntil(this.unsubscribe$),
                map(feedEntries => {
                  if (feedEntries.objects !== undefined) {
                    return feedEntries.objects as FeedEntryImpl[];
                  }
                  throw new Error('malformed response');
                }),
              )
              .subscribe({
                next: feedEntries => {
                  this.zone.run(() => {
                    this.feed = feed;
                    this.feedEntries = feedEntries;
                    this.userCategories = [];
                  });
                },
                error: error => {
                  this.httpErrorService.handleError(error);
                },
              });
          }
        },
        error: error => {
          this.httpErrorService.handleError(error);
        },
      });
  }

  onSubscribe() {
    if (this.feed && this.feed.feedUrl) {
      this.feedService
        .subscribe(this.feed.feedUrl)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe({
          next: () => {
            this.zone.run(() => {
              if (this.feed !== null) {
                this.feed.subscribed = true;
              }
            });
          },
          error: error => {
            this.httpErrorService.handleError(error);
          },
        });
    }
  }

  onUnsubscribe() {
    if (this.feed && this.feed.feedUrl) {
      this.feedService
        .unsubscribe(this.feed.feedUrl)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe({
          next: () => {
            this.zone.run(() => {
              if (this.feed !== null) {
                this.feed.subscribed = false;
              }
            });
          },
          error: error => {
            this.httpErrorService.handleError(error);
          },
        });
    }
  }

  onAddUserCategory() {
    console.log('Hello');
  }
}
