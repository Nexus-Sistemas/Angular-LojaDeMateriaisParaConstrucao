import { CommonModule } from '@angular/common';
import { Component, input, model } from '@angular/core';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';

@Component({
    selector: 'app-payment-section',
    imports: [CommonModule, NgxMaskDirective],
    templateUrl: './payment-section.component.html',
    styleUrl: './payment-section.component.css',
})
export class PaymentSectionComponent {
    total = input.required<number>();

    paymentMethod = model.required<'credit' | 'pix' | 'boleto'>();

    setPayment(method: 'credit' | 'pix' | 'boleto') {
        this.paymentMethod.set(method);
    }
}
