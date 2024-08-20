// testAccessibility.js

// Import the module
const { provideAccessibilitySuggestions } = require('./ai-accessibility-api');

// Sample HTML content for testing
const sampleHTML = `
@if (showToolbar) {
  <header class="trq-d-flex trq-py-2 trq-align-items-center trq-justify-content-center">
    @if (heading) {
      <div
        class="trq-flex-grow-1 trq-mt-0 trq-text-ellipsis trq-text-lg"
        [attr.title]="heading"
        trqId
        trqIdSuffix="heading"
        [trqIdUseParent]="true"
        (assignId)="headerId = $event"
        >{{heading}}</div
      >
    }
    @if (!heading) {
      <ng-content select="[trq-carousel__heading]"></ng-content>
    }
    @if (!isSmallScreen) {
      <ng-container
        *ngTemplateOutlet="showNumberPaginationNoSkipping ? numberPaginationNoSkippingTemplate : navigationTemplate"></ng-container>
    }
    <ng-content select="[trq-carousel__actions]"></ng-content>
  </header>
}

<div
  class="trq-carousel__wrapper trq-position-relative"
  [class.trq-carousel__wrapper--hover-only-buttons]="hoverOnlyButtons">
  @if (showButtons || hoverOnlyButtons) {
    <button
      type="button"
      class="trq-pl-1 trq-pr-2 swiper-button-prev trq-d-inline-flex trq-justify-content-center trq-overflow-hidden"
      [ngClass]="{'swiper-button-rtl': isRTL, 'swiper-button-disabled': disablePrevious}"
      [disabled]="disablePrevious"
      [attr.aria-label]="navPrevLabel"
      [attr.aria-describedby]="ariaDescribedBy || headerId || null"
      (click)="previousSlide()">
      <trq-icon
        [size]="48"
        class="trq-mx-0 trq-aria-disabled"
        aria-hidden="true"
        [name]="isRTL? iconShape.KEYBOARD_ARROW_RIGHT : iconShape.KEYBOARD_ARROW_LEFT"
        [disabled]="disablePrevious">
      </trq-icon>
    </button>
  }

  <!-- INFO: (observerUpdate)=""- This is called only when config has {observer: true} -->
  <swiper-container
    #swiperContainer
    class="trq-carousel"
    [ngClass]="{
      'trq-carousel--overflow' : wrapperOverflow,
      'trq-carousel--transition': slidesInTransition
    }"
    init="false"
    [eventsPrefix]="''"
    [hidden]="hidden"
    (init)="onSwiperInit();"
    (activeindexchange)="onIndexChanged()"
    (slidechange)="slideChange.emit(current)"
    (observerUpdate)="onIndexChanged()"
    (reachbeginning)="onIndexChanged();"
    (reachend)="sliderReachEnd.emit();onIndexChanged()"
    (fromedge)="sliderFromEdge.emit()"
    (slideprevtransitionend)="slidePrevTransitionEnd.emit()"
    (slideprevtransitionstart)="slidePrevTransitionStart.emit()"
    (slidenexttransitionend)="slideNextTransitionEnd.emit()"
    (slidenexttransitionstart)="slideNextTransitionStart.emit()"
    (slidechangetransitionend)="slidesInTransition=false; onSlideChangeTransitionEnd()"
    (slidechangetransitionstart)="onSlideChangeTransitionStart()">
    @for (slide of slides; track slide) {
      <swiper-slide>
        <ng-container [ngTemplateOutlet]="slide.itemTemplate"></ng-container>
      </swiper-slide>
    }
  </swiper-container>
  @if (showButtons || hoverOnlyButtons) {
    <button
      type="button"
      class="trq-pr-1 trq-pl-2 swiper-button-next trq-d-inline-flex trq-justify-content-center trq-overflow-hidden"
      [ngClass]="{'swiper-button-rtl': isRTL, 'swiper-button-disabled': disableNext}"
      [disabled]="disableNext"
      [attr.aria-label]="navNextLabel"
      [attr.aria-describedby]="ariaDescribedBy || headerId || null"
      (click)="nextSlide()">
      <trq-icon
        [size]="48"
        class="trq-mx-0 trq-aria-disabled"
        aria-hidden="true"
        [name]="isRTL? iconShape.KEYBOARD_ARROW_LEFT : iconShape.KEYBOARD_ARROW_RIGHT"
        [disabled]="disableNext"></trq-icon>
    </button>
  }
</div>

@if (isSmallScreen) {
  <div class="trq-mt-1 trq-d-flex trq-align-items-center">
    <ng-container
      *ngTemplateOutlet="showNumberPaginationNoSkipping ? numberPaginationNoSkippingTemplate : null "></ng-container>
    <ng-container *ngTemplateOutlet="showToolbar ? navigationTemplate : null "></ng-container>
  </div>
}

<ng-template #numberPaginationNoSkippingTemplate>
  <div trqCarouselAction class="trq-mr-2 carousel-custom-pagination__text">
    <span [trqTranslate]="paginationI18nResource" [trqTranslateParams]="paginationI18nParams"></span> (<a
      href=""
      class="trq-text-primary trq-carousel__link"
      (click)="startOver($event)"
      [trqTranslate]="paginationStartOverI18nResource"></a
    >)
  </div>
</ng-template>

<ng-template #navigationTemplate>
  <button
    class="trq-pl-1 trq-pr-2 trq-text-capitalize swiper-button-prev trq-carousel-btn--prev"
    [trqButton]="buttonType.FLAT"
    [disabled]="disablePrevious"
    [attr.aria-label]="navPrevLabel"
    [attr.aria-describedby]="ariaDescribedBy || headerId || null"
    (click)="previousSlide()">
    <trq-icon
      class="trq-mx-0 trq-aria-disabled"
      aria-hidden="true"
      [name]="isRTL? iconShape.KEYBOARD_ARROW_RIGHT : iconShape.KEYBOARD_ARROW_LEFT"
      [disabled]="disablePrevious">
    </trq-icon>
    {{navPrevLabel}}
  </button>

  @if (showNumberPagination) {
    <span
      class="trq-text-ellipsis trq-hidden-md-down trq-carousel-ml carousel-custom-pagination__text"
      [trqTranslate]="paginationI18nResource"
      [trqTranslateParams]="paginationI18nParams">
    </span>
  }

  <button
    trqCarouselAction
    class="trq-pr-1 trq-pl-2 trq-text-capitalize trq-carousel-ml swiper-button-next trq-carousel-btn--next"
    [trqButton]="buttonType.FLAT"
    [disabled]="disableNext"
    [attr.aria-label]="navNextLabel"
    [attr.aria-describedby]="ariaDescribedBy || headerId || null"
    (click)="nextSlide()">
    {{navNextLabel}}
    <trq-icon
      class="trq-mx-0 trq-aria-disabled"
      aria-hidden="true"
      [name]="isRTL? iconShape.KEYBOARD_ARROW_LEFT : iconShape.KEYBOARD_ARROW_RIGHT"
      [disabled]="disableNext">
    </trq-icon>
  </button>
</ng-template>



`;

// Test the checkAccessibility function
(async () => {
    console.log('Starting accessibility check...');

    try {
       await provideAccessibilitySuggestions(sampleHTML);
    } catch (error) {
        console.error('Error occurred:', error);
    }
})();
