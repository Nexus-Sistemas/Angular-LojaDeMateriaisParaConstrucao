import { Injectable, inject } from '@angular/core';
import { PedidoService } from './pedido.service';
import {
    EntregaRequest,
    MetodoPagamento,
    PagamentoRequest,
} from '../models/pedido.models';
import { Observable, switchMap, map } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CheckoutService {
    private pedidoService = inject(PedidoService);

  processarCompraCompleta(dados: {
    userId: string;
    endereco: any; // Deve conter o .id
    metodoFrete: 'economic' | 'fast';
    valorFrete: number;
    metodoPagamento: 'credit' | 'pix' | 'boleto';
    total: number;
  }): Observable<any> {
    
    // 1. Passamos o ID do endereço. O Backend já cria o pedido E a entrega associada.
    return this.pedidoService.checkout(dados.userId, dados.valorFrete, dados.endereco.id).pipe(   
      // 3. Registra Pagamento
      switchMap((pedido) => {
        const metodoMap: Record<string, MetodoPagamento> = {
          'credit': MetodoPagamento.CARTAO_CREDITO,
          'pix': MetodoPagamento.PIX,
          'boleto': MetodoPagamento.BOLETO
        };

        const pagamentoReq: PagamentoRequest = {
          metodo: metodoMap[dados.metodoPagamento],
          valor: dados.total,
          numeroParcelas: dados.metodoPagamento === 'credit' ? 1 : 1
        };

        return this.pedidoService.registrarPagamento(pedido.id, pagamentoReq).pipe(
          map(() => pedido)
        );
      })
    );
  }
}
