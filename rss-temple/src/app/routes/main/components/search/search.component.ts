import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { of, Subject } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';

import { Feed, FeedEntry } from '@app/models';
import { FeedEntryService, FeedService } from '@app/services/data';
import { HttpErrorService } from '@app/services';
import { Sort } from '@app/services/data/sort.interface';

type FeedImpl = Required<Pick<Feed, 'uuid' | 'title' | 'feedUrl' | 'homeUrl'>>;
type FeedEntryImpl = Required<
  Pick<FeedEntry, 'publishedAt' | 'feedUuid' | 'title' | 'url'>
>;

interface FeedEntryDescriptor {
  title: string;
  url: string;
  publishedAt: Date;
  feedTitle: string;
  feedUrl: string;
  feedHomeUrl: string | null;
}

@Component({
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit, OnDestroy {
  searchText = '';

  feedEntryDescriptors: FeedEntryDescriptor[] = [];

  private readonly unsubscribe$ = new Subject<void>();

  constructor(
    private zone: NgZone,
    private router: Router,
    private route: ActivatedRoute,
    private feedService: FeedService,
    private feedEntryService: FeedEntryService,
    private httpErrorService: HttpErrorService,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe({
      next: paramMap => {
        const searchText = paramMap.get('searchText') ?? '';
        this.zone.run(() => {
          this.searchText = searchText;
        });

        this.reload();
      },
    });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private reload() {
    const searchText = this.searchText;
    if (searchText.length < 1) {
      this.feedEntryDescriptors = [];
      return;
    }

    this.feedEntryService
      .query({
        fields: [
          'authorName',
          'content',
          'publishedAt',
          'feedUuid',
          'title',
          'url',
        ],
        count: 12,
        returnTotalCount: false,
        search: `title:"${searchText}" or content:"${searchText}"`,
        sort: new Sort([['publishedAt', 'DESC']]),
      })
      .pipe(
        takeUntil(this.unsubscribe$),
        map(response => {
          if (response.objects !== undefined) {
            return response.objects as FeedEntryImpl[];
          }
          throw new Error('malformed response');
        }),
        switchMap(feedEntries => {
          const feedUuids = Array.from(
            new Set(feedEntries.map(fe => fe.feedUuid)),
          );

          return this.feedService
            .queryAll({
              fields: ['uuid', 'title', 'feedUrl', 'homeUrl'],
              returnTotalCount: false,
              search: `uuid:"${feedUuids.join(',')}"`,
            })
            .pipe(
              map(response => {
                if (response.objects !== undefined) {
                  return [feedEntries, response.objects] as [
                    FeedEntryImpl[],
                    FeedImpl[],
                  ];
                }
                throw new Error('malformed response');
              }),
            );
        }),
      )
      .subscribe({
        next: ([feedEntries, feeds]) => {
          const feedEntryDescriptors = feedEntries.map<FeedEntryDescriptor>(
            fe => {
              const feed = feeds.find(f => f.uuid === fe.feedUuid);
              if (feed === undefined) {
                throw new Error('feed undefined');
              }

              return {
                title: fe.title,
                url: fe.url,
                publishedAt: fe.publishedAt,
                feedTitle: feed.title,
                feedUrl: feed.feedUrl,
                feedHomeUrl: feed.homeUrl,
              };
            },
          );

          this.zone.run(() => {
            this.feedEntryDescriptors = feedEntryDescriptors;
          });
        },
        error: error => {
          this.httpErrorService.handleError(error);
        },
      });
  }

  goTo(feedEntryDescriptor: FeedEntryDescriptor) {
    this.router.navigate(['/main/feed', feedEntryDescriptor.feedUrl]);
  }
}
