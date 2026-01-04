import { Component } from '@angular/core';
import { MyOrdersComponent } from "../../shared/components/profile/my-orders/my-orders.component";

@Component({
    selector: 'app-my-orders-page',
    imports: [MyOrdersComponent],
    templateUrl: './my-orders-page.component.html',
    styleUrl: './my-orders-page.component.css'
})
export class MyOrdersPageComponent {
    
}