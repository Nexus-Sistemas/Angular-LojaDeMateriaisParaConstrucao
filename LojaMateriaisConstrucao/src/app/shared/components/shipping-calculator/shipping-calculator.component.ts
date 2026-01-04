import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import { ShippingOption } from '../../../models/pedido.models';

@Component({
    selector: 'app-shipping-calculator',
    imports: [CommonModule, FormsModule, NgxMaskDirective],
    templateUrl: './shipping-calculator.component.html',
    styleUrl: './shipping-calculator.component.css'
})
export class ShippingCalculatorComponent {
    @Input() initialZipCode = '';
    @Output() shippingSelected = new EventEmitter<number>();
    
    zipCode = signal('');
    isCalculated = signal(false);
    isLoading = signal(false);
    selectedOptionId = signal<string | null>(null);
    
    shippingOptions = signal<ShippingOption[]>([
        { id: 'eco', label: 'Econômica', deadline: '5 a 7 dias úteis', price: 15.90, icon: 'ph-truck' },
        { id: 'fast', label: 'Rápida', deadline: '1 a 2 dias úteis', price: 32.50, icon: 'ph-lightning' }
    ]);
    
    ngOnInit() {
        if (this.initialZipCode) {
            this.zipCode.set(this.initialZipCode);
            this.calculate();
        }
    }
    
    calculate() {
        const code = this.zipCode().replace(/\D/g, '');
        if (code.length < 8) return;
        
        this.isLoading.set(true);
        
        // Simula um delay de rede
        setTimeout(() => {
            this.isLoading.set(false);
            this.isCalculated.set(true);
            
            // Auto-seleciona a primeira opção (mais barata) por padrão
            this.selectOption(this.shippingOptions()[0]);
        }, 800);
    }
    
    selectOption(option: ShippingOption) {
        this.selectedOptionId.set(option.id);
        this.shippingSelected.emit(option.price);
    }
    
    reset() {
        this.isCalculated.set(false);
        this.selectedOptionId.set(null);
        this.shippingSelected.emit(0);
    }
}
