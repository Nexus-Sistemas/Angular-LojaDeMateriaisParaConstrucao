import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  Pedido,
  StatusPedido,
  ItemPedido,
} from '../../../models/pedido.models';
import { PedidoService } from '../../../services/pedido.service';
import { TimelineStep } from '../../../shared/interfaces/Cart';

@Component({
  selector: 'app-order-page',
  imports: [CommonModule, RouterLink],
  providers: [DatePipe],
  templateUrl: './order-page.component.html',
  styleUrl: './order-page.component.css',
})
export class OrderPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
    private router = inject(Router);
    private pedidoService = inject(PedidoService);
    private toastr = inject(ToastrService);
    private datePipe = inject(DatePipe);
    
    pedido = signal<Pedido | null>(null);
    loading = signal(true);
    
    // Dados visuais da Timeline
    timelineSteps = signal<TimelineStep[]>([]);
    progressPercentage = signal(0);
    
    // Mapeamento de Status para ordem numérica
    private statusOrder: Record<string, number> = {
        [StatusPedido.AGUARDANDO_PAGAMENTO]: 0,
        [StatusPedido.PAGO]: 1,
        [StatusPedido.EM_PREPARACAO]: 2,
        [StatusPedido.ENVIADO]: 3,
        [StatusPedido.ENTREGUE]: 4,
        [StatusPedido.CANCELADO]: -1
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
        const fmtDate = (date?: string) => date ? this.datePipe.transform(date, 'dd/MM/yy HH:mm') || '' : undefined;

        // Caso Cancelado
        if (pedido.status === StatusPedido.CANCELADO) {
            this.timelineSteps.set([
                { label: 'Realizado', dateOrInfo: fmtDate(pedido.dataPedido), status: 'completed', icon: 'ph-shopping-cart' },
                { label: 'Cancelado', dateOrInfo: 'Pedido cancelado', status: 'completed', icon: 'ph-x-circle' }
            ]);
            this.progressPercentage.set(100);
            return;
        }
        
        const currentStepIndex = this.statusOrder[pedido.status] ?? 0;
        
        const steps: TimelineStep[] = [
            { 
                label: 'Realizado', 
                icon: 'ph-shopping-cart',
                status: 'pending',
                dateOrInfo: fmtDate(pedido.dataPedido) 
            },
            { 
                label: 'Pagamento', 
                icon: 'ph-currency-dollar',
                status: 'pending',
                dateOrInfo: pedido.pagamento?.dataPagamento 
                    ? fmtDate(pedido.pagamento.dataPagamento) 
                    : (pedido.status === StatusPedido.AGUARDANDO_PAGAMENTO ? 'Aguardando...' : undefined)
            },
            { 
                label: 'Preparação', 
                icon: 'ph-package',
                status: 'pending',
                dateOrInfo: currentStepIndex === 2 ? 'Em separação' : undefined
            },
            { 
                label: 'Transporte', 
                icon: 'ph-truck',
                status: 'pending',
                dateOrInfo: pedido.entrega?.dataEnvio 
                    ? fmtDate(pedido.entrega.dataEnvio) 
                    : (currentStepIndex === 3 ? 'Em trânsito' : undefined)
            },
            { 
                label: 'Entregue', 
                icon: 'ph-house',
                status: 'pending',
                dateOrInfo: pedido.entrega?.dataEntregaReal 
                    ? fmtDate(pedido.entrega.dataEntregaReal) 
                    : (pedido.entrega?.dataEstimadaEntrega ? `Prev: ${this.datePipe.transform(pedido.entrega.dataEstimadaEntrega, 'dd/MM')}` : undefined)
            }
        ];
        
        // --- MUDANÇA AQUI ---
        // Atualiza status de cada passo
        steps.forEach((step, index) => {
            if (index < currentStepIndex) {
                step.status = 'completed';
            } else if (index === currentStepIndex) {
                // SE O PEDIDO ESTÁ ENTREGUE, O ÚLTIMO PASSO FICA "COMPLETED" (SÓLIDO) AO INVÉS DE "CURRENT" (PISCANDO)
                if (pedido.status === StatusPedido.ENTREGUE) {
                    step.status = 'completed';
                } else {
                    step.status = 'current';
                }
            } else {
                step.status = 'pending';
            }
        });
        
        this.timelineSteps.set(steps);
        
        // Calcula progresso
        const completedCount = steps.filter(s => s.status === 'completed').length;
        // Se estiver entregue (5 concluidos), vai dar > 100%, o Math.min segura em 100.
        const percentage = Math.min(100, (completedCount / (steps.length - 1)) * 100);
        
        this.progressPercentage.set(percentage);
    }
    
    get items(): ItemPedido[] {
        return this.pedido()?.itens || [];
    }
}
