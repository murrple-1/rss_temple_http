import { Component, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { first } from 'rxjs/operators';

import { FeedService } from '@app/_services/data/feed.service';
import { FeedEntry } from '@app/_models/feedentry';
import { FeedEntryService } from '@app/_services/data/feedentry.service';
import { Feed } from '@app/_models/feed';

@Component({
    templateUrl: 'main.component.html',
    styleUrls: ['main.component.scss'],
})
export class MainComponent implements OnInit {
    subscribedFeeds: Feed[];
    feedEntries: FeedEntry[];

    constructor(
        private feedService: FeedService,
        private feedEntryService: FeedEntryService,
        private zone: NgZone,
        private route: ActivatedRoute,
    ) { }

    ngOnInit() {
        const count = parseInt(this.route.snapshot.paramMap.get('count') || '5', 10);

        this.feedService.allSubscribed({
            fields: ['uuid', 'title', 'feedUrl'],
            returnTotalCount: false,
        }).pipe(
            first()
        ).subscribe(feeds => {
            this.zone.run(() => {
                this.subscribedFeeds = feeds.objects;
            });

            this.feedEntryService.some({
                fields: ['url', 'title', 'content'],
                returnTotalCount: false,
                count: count,
                search: 'feedUuid:"' + feeds.objects.map(feed => feed.uuid).join('|') + '"',
                sort: 'createdAt:DESC,publishedAt:DESC,updatedAt:DESC',
            }).pipe(
                first()
            ).subscribe(feedEntries => {
                this.zone.run(() => {
                    this.feedEntries = feedEntries.objects;
                });
            }, error => {
                console.log(error);
            });
        }, error => {
            console.log(error);
        });
    }
}
