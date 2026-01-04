import { Component, inject, OnInit, signal } from '@angular/core';
import { TimelineStep } from '../../shared/interfaces/Cart';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Pedido, StatusPedido, ItemPedido } from '../../models/pedido.models';
import { PedidoService } from '../../services/pedido.service';

@Component({
    selector: 'app-order-page',
    imports: [CommonModule, RouterLink],
    templateUrl: './order-page.component.html',
    styleUrl: './order-page.component.css'
})

export class OrderPageComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private pedidoService = inject(PedidoService);
    private toastr = inject(ToastrService);
    
    pedido = signal<Pedido | null>(null);
    loading = signal(true);
    
    // Dados visuais da Timeline
    timelineSteps = signal<TimelineStep[]>([]);
    progressPercentage = signal(0);
    
    // Mapeamento de Status para Timeline
    private statusMap: Record<string, number> = {
        [StatusPedido.AGUARDANDO_PAGAMENTO]: 0,
        [StatusPedido.PAGO]: 1,
        [StatusPedido.EM_PREPARACAO]: 2,
        [StatusPedido.ENVIADO]: 3,
        [StatusPedido.ENTREGUE]: 4,
        [StatusPedido.CANCELADO]: -1 // Caso especial
    };
    
    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.carregarPedido(id);
            } else {
                this.router.navigate(['/perfil']);
            }
        });
    }
    
    carregarPedido(id: string) {
        this.loading.set(true);
        this.pedidoService.buscarPorId(id).subscribe({
            next: (data) => {
                this.pedido.set(data);
                this.construirTimeline(data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error(err);
                this.toastr.error('Pedido não encontrado.', 'Erro');
                this.router.navigate(['/perfil']);
            }
        });
    }
    
    private construirTimeline(pedido: Pedido) {
        if (pedido.status === StatusPedido.CANCELADO) {
            this.timelineSteps.set([
                { label: 'Realizado', dateOrInfo: '', status: 'completed', icon: 'ph-check' },
                { label: 'Cancelado', dateOrInfo: 'Pedido cancelado', status: 'completed', icon: 'ph-x-circle' }
            ]);
            this.progressPercentage.set(100); // Barra cheia mas vermelha (tratada no CSS se quiser, ou padrão)
            return;
        }
        
        const currentStepIndex = this.statusMap[pedido.status] || 0;
        
        // Definição dos passos padrão
        const steps: TimelineStep[] = [
            { label: 'Realizado', dateOrInfo: '', status: 'pending', icon: 'ph-check' },
            { label: 'Pago', dateOrInfo: '', status: 'pending', icon: 'ph-currency-dollar' },
            { label: 'Preparação', dateOrInfo: '', status: 'pending', icon: 'ph-package' },
            { label: 'Enviado', dateOrInfo: '', status: 'pending', icon: 'ph-truck' },
            { label: 'Entregue', dateOrInfo: '', status: 'pending', icon: 'ph-house' }
        ];
        
        // Atualiza status de cada passo
        steps.forEach((step, index) => {
            if (index < currentStepIndex) {
                step.status = 'completed';
            } else if (index === currentStepIndex) {
                step.status = 'current';
            } else {
                step.status = 'pending';
            }
        });
        
        this.timelineSteps.set(steps);
        
        // Calcula progresso (0 a 100%)
        // São 4 intervalos entre 5 passos (0, 25, 50, 75, 100)
        this.progressPercentage.set(currentStepIndex * 25);
    }
    
    // Getters para o HTML
    get items(): ItemPedido[] {
        return this.pedido()?.itens || [];
    }
    
    get subtotal(): number {
        return this.pedido()?.valorTotal || 0; // Backend já manda o total calculado
        // Se quiser recalcular: return this.items.reduce((acc, i) => acc + i.subTotal, 0);
    }
}