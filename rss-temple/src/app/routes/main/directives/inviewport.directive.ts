import {
  Directive,
  ElementRef,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';

import { fromEvent, interval, merge, Subscription } from 'rxjs';
import { debounce, mapTo } from 'rxjs/operators';

const debouncer = interval(100);

export type InViewportEvent =
  | {
      target: HTMLElement;
      isInViewport: false;
    }
  | {
      target: HTMLElement;
      isInViewport: true;
      boundingRect: ClientRect | DOMRect;
    };

export interface Rect {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

type CheckEventType = 'resize' | 'scroll';

@Directive({
  selector: '[appInViewport]',
})
export class InViewportDirective implements OnInit, OnDestroy {
  private _disabled = false;

  @Input('appInViewport')
  get disabled() {
    return this._disabled;
  }

  set disabled(value: boolean) {
    this._disabled = value;

    if (this._disabled && this.subscription !== null) {
      this.subscription.unsubscribe();
      this.subscription = null;
    } else if (!this._disabled && this.subscription === null) {
      this.initEventListeners();
    }
  }

  private _scrollParent: ElementRef<HTMLElement> | HTMLElement = document.body;

  @Input('appInViewportScrollParent')
  get scrollParent() {
    return this._scrollParent;
  }

  set scrollParent(value: ElementRef<HTMLElement> | HTMLElement) {
    if (this.subscription !== null) {
      this.subscription.unsubscribe();
    }

    this._scrollParent = value;

    if (!this._disabled) {
      this.initEventListeners();
    }
  }

  @Input('appInViewportOffset')
  offset: Partial<Rect> = {};

  @Input('appInViewportRecognizedEventTypes')
  recognizedEventTypes = new Set<CheckEventType>(['resize', 'scroll']);

  @Output('appInViewportWatch')
  watch = new EventEmitter<InViewportEvent>();

  private subscription: Subscription | null = null;

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  private static rectIntersects(r1: Rect, r2: Rect) {
    return !(
      r2.left > r1.right ||
      r2.right < r1.left ||
      r2.top > r1.bottom ||
      r2.bottom < r1.top
    );
  }

  ngOnInit() {
    if (!this._disabled) {
      this.initEventListeners();
    }
  }

  ngOnDestroy() {
    if (this.subscription !== null) {
      this.subscription.unsubscribe();
    }
  }

  initEventListeners() {
    const scrollParentNativeElement =
      this.scrollParent instanceof ElementRef
        ? this.scrollParent.nativeElement
        : this.scrollParent;
    this.subscription = merge(
      fromEvent(window, 'resize').pipe(mapTo<Event, CheckEventType>('resize')),
      fromEvent(scrollParentNativeElement, 'scroll').pipe(
        mapTo<Event, CheckEventType>('scroll'),
      ),
    )
      .pipe(debounce(() => debouncer))
      .subscribe({
        next: checkEventType => {
          this.check(checkEventType);
        },
      });
  }

  private check(eventType: CheckEventType) {
    if (this.disabled || !this.recognizedEventTypes.has(eventType)) {
      return;
    }

    const nativeElement = this.elementRef.nativeElement;
    const scrollParentNativeElement =
      this.scrollParent instanceof ElementRef
        ? this.scrollParent.nativeElement
        : this.scrollParent;

    const scrollParentRect = scrollParentNativeElement.getBoundingClientRect();
    const offset = this.offset;

    const viewportRect: Rect = {
      top: scrollParentRect.top + (offset.top ?? 0),
      bottom: scrollParentRect.bottom + (offset.bottom ?? 0),
      left: scrollParentRect.left + (offset.left ?? 0),
      right: scrollParentRect.right + (offset.right ?? 0),
    };

    const boundingRect = nativeElement.getBoundingClientRect();

    let event: InViewportEvent;
    if (InViewportDirective.rectIntersects(boundingRect, viewportRect)) {
      event = {
        target: nativeElement,
        isInViewport: true,
        boundingRect,
      };
    } else {
      event = {
        target: nativeElement,
        isInViewport: false,
      };
    }

    this.watch.emit(event);
  }
}
