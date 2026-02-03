import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
    Pedido,
    PagamentoRequest,
    EntregaRequest,
    StatusPedido,
} from '../models/pedido.models';
import { Page, PageableParams } from '../models/shared.models';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class PedidoService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}`;

    // --- PEDIDOS ---

    checkout(
        clienteId: string,
        valorFrete: number,
        enderecoId: string,
    ): Observable<Pedido> {
        const params = new HttpParams()
            .set('valorFrete', valorFrete.toString())
            .set('enderecoId', enderecoId);

        return this.http.post<Pedido>(
            `${this.apiUrl}/pedidos/checkout/${clienteId}`,
            {},
            { params },
        );
    }

    buscarPorId(id: string): Observable<Pedido> {
        return this.http.get<Pedido>(`${this.apiUrl}/pedidos/${id}`);
    }

    listarPorCliente(
        clienteId: string,
        pageable?: PageableParams,
    ): Observable<Page<Pedido>> {
        let params = new HttpParams();
        if (pageable?.page) params = params.set('page', pageable.page);
        if (pageable?.size) params = params.set('size', pageable.size);

        return this.http.get<Page<Pedido>>(
            `${this.apiUrl}/pedidos/cliente/${clienteId}`,
            { params },
        );
    }

    // Admin
    listarTodos(pageable?: PageableParams): Observable<Page<Pedido>> {
        // Mesma lógica de params...
        return this.http.get<Page<Pedido>>(`${this.apiUrl}/pedidos`, {
            params: pageable as any,
        });
    }

    atualizarStatus(id: string, status: StatusPedido): Observable<Pedido> {
        return this.http.patch<Pedido>(
            `${this.apiUrl}/pedidos/${id}/status`,
            {},
            { params: { status } },
        );
    }

    // --- PAGAMENTO E ENTREGA ---

    registrarPagamento(pedidoId: string, pagamento: PagamentoRequest) {
        return this.http.post(
            `${this.apiUrl}/pagamentos/pedido/${pedidoId}`,
            pagamento,
        );
    }

    criarEntrega(pedidoId: string, entrega: EntregaRequest) {
        return this.http.post(
            `${this.apiUrl}/entregas/pedido/${pedidoId}`,
            entrega,
        );
    }
}
