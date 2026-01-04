import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { Pedido, StatusPedido } from '../../../../models/pedido.models';
import { PedidoService } from '../../../../services/pedido.service';

@Component({
    selector: 'app-my-orders',
    imports: [CommonModule, RouterLink],
    templateUrl: './my-orders.component.html',
    styleUrl: './my-orders.component.css'
})
export class MyOrdersComponent implements OnInit {
    private authService = inject(AuthService);
    private pedidoService = inject(PedidoService);
    
    orders = signal<Pedido[]>([]);
    isLoading = signal(true);
    hasError = signal(false);
    
    ngOnInit() {
        this.loadOrders();
    }
    
    loadOrders() {
        const userId = this.authService.currentUser()?.id;
        
        if (!userId) {
            this.hasError.set(true);
            this.isLoading.set(false);
            return;
        }
        
        this.pedidoService.listarPorCliente(userId, { page: 0, size: 20, sort: 'dataPedido,desc' })
        .subscribe({
            next: (page) => {
                this.orders.set(page.content);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Erro ao carregar pedidos', err);
                this.hasError.set(true);
                this.isLoading.set(false);
            }
        });
    }
    
    // Helpers de UI para Status
    getStatusLabel(status: StatusPedido): string {
        const labels: Record<StatusPedido, string> = {
            [StatusPedido.AGUARDANDO_PAGAMENTO]: 'Aguardando Pagamento',
            [StatusPedido.PAGO]: 'Pago',
            [StatusPedido.EM_PREPARACAO]: 'Em Preparação',
            [StatusPedido.ENVIADO]: 'Enviado',
            [StatusPedido.ENTREGUE]: 'Entregue',
            [StatusPedido.CANCELADO]: 'Cancelado'
        };
        return labels[status] || status;
    }
    
    getStatusColor(status: StatusPedido): string {
        switch (status) {
            case StatusPedido.AGUARDANDO_PAGAMENTO:
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case StatusPedido.PAGO:
            case StatusPedido.EM_PREPARACAO:
            return 'bg-blue-100 text-blue-800 border-blue-200';
            case StatusPedido.ENVIADO:
            return 'bg-purple-100 text-purple-800 border-purple-200';
            case StatusPedido.ENTREGUE:
            return 'bg-green-100 text-green-800 border-green-200';
            case StatusPedido.CANCELADO:
            return 'bg-red-100 text-red-800 border-red-200';
            default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    }
    
    getStatusIcon(status: StatusPedido): string {
        switch (status) {
            case StatusPedido.AGUARDANDO_PAGAMENTO: return 'ph-clock';
            case StatusPedido.PAGO: return 'ph-check-circle';
            case StatusPedido.EM_PREPARACAO: return 'ph-package';
            case StatusPedido.ENVIADO: return 'ph-truck';
            case StatusPedido.ENTREGUE: return 'ph-house';
            case StatusPedido.CANCELADO: return 'ph-x-circle';
            default: return 'ph-info';
        }
    }
}