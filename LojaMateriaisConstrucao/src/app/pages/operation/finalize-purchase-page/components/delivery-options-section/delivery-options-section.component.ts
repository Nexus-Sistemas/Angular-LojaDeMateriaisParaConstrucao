import { CommonModule } from '@angular/common';
import { Component, input, model } from '@angular/core';

@Component({
    selector: 'app-delivery-options-section',
    imports: [CommonModule],
    templateUrl: './delivery-options-section.component.html',
    styleUrl: './delivery-options-section.component.css',
})
export class DeliveryOptionsSectionComponent {
    hasAddressSelected = input.required<boolean>();

    selectedShippingMethod = model.required<'economic' | 'fast' | null>();
}