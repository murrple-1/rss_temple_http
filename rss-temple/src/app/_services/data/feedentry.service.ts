import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';

import { map } from 'rxjs/operators';

import { utc } from 'moment';

import { FeedEntry } from '@app/_models/feedentry';
import { sessionToken } from '@app/_modules/session.module';
import { Objects, toObjects } from '@app/_services/data/objects';
import {
    GetOptions,
    toHeader as getToHeader,
    toParams as getToParams,
} from '@app/_services/data/get.interface';
import {
    SomeOptions,
    toHeader as someToHeader,
    toParams as someToParams,
} from '@app/_services/data/some.interface';
import {
    AllOptions,
    toHeader as allToHeader,
    toParams as allToParams,
} from '@app/_services/data/all.interface';

import { environment } from '@environments/environment';

export type Field = 'uuid' | 'id' | 'createdAt' | 'publishedAt' | 'updatedAt' | 'title' | 'url' | 'content' | 'authorName';

function toFeed(value: Record<string, any>) {
    const feedEntry = new FeedEntry();

    if ('uuid' in value) {
        const uuid = value['uuid'];
        if (typeof uuid === 'string') {
            feedEntry.uuid = uuid;
        } else {
            throw new Error('\'uuid\' must be string');
        }
    }

    if ('id' in value) {
        const id = value['id'];
        if (id === null) {
            feedEntry.id = null;
        } else if (typeof id === 'string') {
            feedEntry.id = id;
        } else {
            throw new Error('\'uuid\' must be string');
        }
    }

    if ('createdAt' in value) {
        const createdAt = value['createdAt'];
        if (createdAt === null) {
            feedEntry.createdAt = null;
        } else if (typeof createdAt === 'string') {
            const _moment = utc(createdAt, 'YYYY-MM-DD HH:mm:ss');
            if (_moment.isValid()) {
                feedEntry.createdAt = _moment;
            } else {
                throw new Error('\'createdAt\' invalid');
            }
        } else {
            throw new Error('\'publishedAt\' must be datetime or null');
        }
    }

    if ('publishedAt' in value) {
        const publishedAt = value['publishedAt'];
        if (typeof publishedAt === 'string') {
            const _moment = utc(publishedAt, 'YYYY-MM-DD HH:mm:ss');
            if (_moment.isValid()) {
                feedEntry.publishedAt = _moment;
            } else {
                throw new Error('\'publishedAt\' invalid');
            }
        } else {
            throw new Error('\'publishedAt\' must be datetime');
        }
    }

    if ('updatedAt' in value) {
        const updatedAt = value['updatedAt'];
        if (updatedAt === null) {
            feedEntry.updatedAt = null;
        } else if (typeof updatedAt === 'string') {
            const _moment = utc(updatedAt, 'YYYY-MM-DD HH:mm:ss');
            if (_moment.isValid()) {
                feedEntry.updatedAt = _moment;
            } else {
                throw new Error('\'updatedAt\' invalid');
            }
        } else {
            throw new Error('\'publishedAt\' must be datetime or null');
        }
    }

    if ('title' in value) {
        const title = value['title'];
        if (typeof title === 'string') {
            feedEntry.title = title;
        } else {
            throw new Error('\'title\' must be string');
        }
    }

    if ('url' in value) {
        const url = value['url'];
        if (typeof url === 'string') {
            feedEntry.url = url;
        } else {
            throw new Error('\'url\' must be string');
        }
    }

    if ('content' in value) {
        const content = value['content'];
        if (content === null) {
            feedEntry.content = null;
        } else if (typeof content === 'string') {
            feedEntry.content = content;
        } else {
            throw new Error('\'uuid\' must be string');
        }
    }

    if ('authorName' in value) {
        const authorName = value['authorName'];
        if (authorName === null) {
            feedEntry.authorName = null;
        } else if (typeof authorName === 'string') {
            feedEntry.authorName = authorName;
        } else {
            throw new Error('\'uuid\' must be string');
        }
    }

    return feedEntry;
}

@Injectable()
export class FeedEntryService {
    constructor(
        private http: HttpClient,
    ) { }

    get(uuid: string, options: GetOptions<Field> = {}) {
        const headers = getToHeader(options, sessionToken);
        const params = getToParams(options, () => ['uuid']);

        return this.http.get(environment.apiHost + '/api/feedentry/' + uuid, {
            headers: headers,
            params: params,
        }).pipe<FeedEntry>(
            map(toFeed)
        );
    }

    some(options: SomeOptions<Field> = {}) {
        const headers = someToHeader(options, sessionToken);
        const params = someToParams(options, () => ['uuid']);

        return this.http.get(environment.apiHost + '/api/feedentries', {
            headers: headers,
            params: params,
        }).pipe<Objects<FeedEntry>>(
            map(retObj => toObjects<FeedEntry>(retObj, toFeed))
        );
    }

    all(options: AllOptions<Field> = {}) {
        const headers = allToHeader(options, sessionToken);
        const params = allToParams(options, () => ['uuid']);

        // TODO
        this.http.get(environment.apiHost + '/api/feedentries');
    }
}
