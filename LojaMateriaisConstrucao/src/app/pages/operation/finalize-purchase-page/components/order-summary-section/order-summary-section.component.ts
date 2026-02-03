import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
    selector: 'app-order-summary-section',
    imports: [CommonModule],
    templateUrl: './order-summary-section.component.html',
    styleUrl: './order-summary-section.component.css',
})
export class OrderSummarySectionComponent {
    cartItems = input.required<any[]>();
    subtotal = input.required<number>();
    total = input.required<number>();

    selectedShippingMethod = input.required<'economic' | 'fast' | null>();
    selectedAddressId = input.required<string | null>();
    isLoading = input.required<boolean>();

    confirm = output<void>();

    confirmarPedido() {
        this.confirm.emit();
    }
}
