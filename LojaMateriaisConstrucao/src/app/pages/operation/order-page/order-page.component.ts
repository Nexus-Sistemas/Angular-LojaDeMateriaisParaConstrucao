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

    timelineSteps = signal<TimelineStep[]>([]);
    solidProgress = signal(0);
    skeletonProgress = signal(0);

    private statusOrder: Record<string, number> = {
        [StatusPedido.AGUARDANDO_PAGAMENTO]: 0,
        [StatusPedido.PAGO]: 1,
        [StatusPedido.EM_PREPARACAO]: 2,
        [StatusPedido.ENVIADO]: 3,
        [StatusPedido.ENTREGUE]: 4,
        [StatusPedido.CANCELADO]: -1,
    };

    ngOnInit() {
        this.route.paramMap.subscribe((params) => {
            const id = params.get('id');
            if (id) this.carregarPedido(id);
            else this.router.navigate(['/perfil']);
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
            error: () => {
                this.toastr.error('Pedido não encontrado.', 'Erro');
                this.router.navigate(['/perfil']);
            },
        });
    }

    private construirTimeline(pedido: Pedido) {
        const fmtDate = (date?: string) =>
            date
                ? this.datePipe.transform(date, 'dd/MM/yy HH:mm') || ''
                : undefined;

        if (pedido.status === StatusPedido.CANCELADO) {
            this.timelineSteps.set([
                {
                    label: 'Realizado',
                    dateOrInfo: fmtDate(pedido.dataPedido),
                    status: 'completed',
                    icon: 'ph-shopping-cart',
                },
                {
                    label: 'Cancelado',
                    dateOrInfo: 'Pedido cancelado',
                    status: 'completed',
                    icon: 'ph-x-circle',
                },
            ]);
            this.solidProgress.set(100);
            this.skeletonProgress.set(0);
            return;
        }

        const currentVal = this.statusOrder[pedido.status] ?? 0;

        const steps: TimelineStep[] = [
            {
                label: 'Realizado',
                icon: 'ph-shopping-cart',
                status: 'completed',
                dateOrInfo: fmtDate(pedido.dataPedido),
            },
            {
                label: 'Pagamento',
                icon: 'ph-currency-dollar',
                status: currentVal >= 1 ? 'completed' : 'pending',
                dateOrInfo: pedido.pagamento?.dataPagamento
                    ? fmtDate(pedido.pagamento.dataPagamento)
                    : undefined,
            },
            {
                label: 'Preparação',
                icon: 'ph-package',
                status: currentVal > 2 ? 'completed' : 'pending',
                dateOrInfo: undefined,
            },
            {
                label: 'Transporte',
                icon: 'ph-truck',
                status: currentVal > 3 ? 'completed' : 'pending',
                dateOrInfo: pedido.entrega?.dataEnvio
                    ? fmtDate(pedido.entrega.dataEnvio)
                    : undefined,
            },
            {
                label: 'Entregue',
                icon: 'ph-house',
                status: currentVal === 4 ? 'completed' : 'pending',
                dateOrInfo: pedido.entrega?.dataEntregaReal
                    ? fmtDate(pedido.entrega.dataEntregaReal)
                    : pedido.entrega?.dataEstimadaEntrega
                      ? `Prev: ${this.datePipe.transform(
                            pedido.entrega.dataEstimadaEntrega,
                            'dd/MM',
                        )}`
                      : undefined,
            },
        ];

        this.timelineSteps.set(steps);

        const totalSegments = steps.length - 1;

        const lastCompletedIndex =
            [...steps]
                .map((s, i) => (s.status === 'completed' ? i : -1))
                .filter((i) => i !== -1)
                .pop() ?? 0;

        const solid = (lastCompletedIndex / totalSegments) * 100;
        const skeleton =
            lastCompletedIndex < totalSegments
                ? (1 / totalSegments) * 100
                : 0;

        this.solidProgress.set(solid);
        this.skeletonProgress.set(skeleton);
    }

    get items(): ItemPedido[] {
        return this.pedido()?.itens || [];
    }
}
