import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { AddressFormComponent } from '../../../../../shared/components/forms/address-form/address-form.component';
import { NgxMaskPipe } from 'ngx-mask';

@Component({
    selector: 'app-delivery-address-section',
    imports: [CommonModule, AddressFormComponent, NgxMaskPipe],
    templateUrl: './delivery-address-section.component.html',
    styleUrl: './delivery-address-section.component.css',
})
export class DeliveryAddressSectionComponent {
    addresses = input.required<any[]>();
    selectedAddressId = input.required<string | null>();
    showAddressForm = input.required<boolean>();
    editingAddress = input<any>(null);

    selectAddress = output<string>();
    toggleForm = output<void>();
    editAddress = output<any>();
    deleteAddress = output<string>();
    setAsPrimary = output<{ id: string; event: Event }>();
    saveAddress = output<any>();

    onSetPrimary(id: string, event: Event) {
        this.setAsPrimary.emit({ id, event });
    }
}
