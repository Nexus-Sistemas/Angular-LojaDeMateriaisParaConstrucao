import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/auth/auth.service';
import { MetodoPagamento, PagamentoRequest } from '../../models/pedido.models';
import { CarrinhoService } from '../../services/carrinho.service';
import { PedidoService } from '../../services/pedido.service';
import { UsuarioService } from '../../services/usuario.service';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-finalize-purchase-page',
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './finalize-purchase-page.component.html',
    styleUrl: './finalize-purchase-page.component.css'
})

export class FinalizePurchasePageComponent {
    private authService = inject(AuthService);
    private carrinhoService = inject(CarrinhoService);
    private pedidoService = inject(PedidoService);
    public usuarioService = inject(UsuarioService);
    private router = inject(Router);
    private toastr = inject(ToastrService);
    private fb = inject(FormBuilder); // Injetado para criar o formulário
    
    // Estado Local
    paymentMethod = signal<'credit' | 'pix' | 'boleto'>('credit');
    isLoading = signal(false);
    selectedAddressId = signal<string | null>(null);
    
    // Estado do Formulário de Endereço
    showAddressForm = signal(false);
    addressForm: FormGroup = this.fb.group({
        apelido: ['', Validators.required],
        cep: ['', [Validators.required, Validators.minLength(8)]],
        logradouro: ['', Validators.required],
        numero: ['', Validators.required],
        complemento: [''],
        bairro: ['', Validators.required],
        cidade: ['', Validators.required],
        uf: ['', [Validators.required, Validators.maxLength(2)]],
        principal: [true] // Já nasce como principal para ser selecionado
    });
    
    // Estado do Usuário
    userEmail = computed(() => this.authService.currentUser()?.email || '');
    
    // Estado do Carrinho
    cartItems = computed(() => this.carrinhoService.carrinho()?.itens || []);
    subtotal = computed(() => this.carrinhoService.valorTotal());
    shippingCost = signal(15.90); 
    total = computed(() => this.subtotal() + this.shippingCost());
    
    // Acessa a lista de endereços do serviço
    addresses = this.usuarioService.enderecos;
    
    constructor() {
        // Carregar Dados Iniciais
        effect(() => {
            const userId = this.authService.currentUser()?.id;
            if (userId) {
                this.carrinhoService.carregarCarrinho(userId);
                this.usuarioService.carregarEnderecos(userId);
            }
        });
        
        // Selecionar endereço padrão automaticamente
        effect(() => {
            const addrs = this.addresses();
            // Só seleciona automaticamente se não tiver nenhum selecionado OU se acabamos de adicionar um novo (que vira principal)
            if (addrs.length > 0) {
                const principal = addrs.find(a => a.principal);
                // Se houver um principal, usa ele. Se não, mantém o atual ou o primeiro.
                if (principal) {
                    this.selectedAddressId.set(principal.id);
                } else if (!this.selectedAddressId()) {
                    this.selectedAddressId.set(addrs[0].id);
                }
            }
        });
    }
    
    // --- Lógica de Endereço ---
    
    toggleAddressForm() {
        this.showAddressForm.update(v => !v);
        if (!this.showAddressForm()) {
            this.addressForm.reset({ principal: true });
        }
    }
    
    saveAddress() {
        if (this.addressForm.invalid) {
            this.addressForm.markAllAsTouched();
            return;
        }
        
        const userId = this.authService.currentUser()?.id;
        if (!userId) return;
        
        this.isLoading.set(true);
        
        // Garante que será principal para ser selecionado automaticamente pelo effect
        const newAddress = { ...this.addressForm.value, principal: true };
        
        this.usuarioService.adicionarEndereco(userId, newAddress).subscribe({
            next: (res) => {
                this.toastr.success('Endereço adicionado e selecionado!');
                this.toggleAddressForm(); // Fecha o form e limpa
                // O effect vai rodar, ver que esse é o principal e selecioná-lo
            },
            error: (err) => {
                console.error(err);
                this.toastr.error('Erro ao salvar endereço.');
            },
            complete: () => this.isLoading.set(false)
        });
    }
    
    // --- Lógica de Pagamento ---
    
    setPayment(method: 'credit' | 'pix' | 'boleto') {
        this.paymentMethod.set(method);
    }
    
    confirmarPedido() {
        const userId = this.authService.currentUser()?.id;
        if (!userId) {
            this.toastr.error('Erro de autenticação.', 'Erro');
            return;
        }
        
        if (this.cartItems().length === 0) {
            this.toastr.warning('Seu carrinho está vazio.', 'Atenção');
            return;
        }
        
        if (!this.selectedAddressId()) {
            this.toastr.warning('Selecione um endereço de entrega.', 'Atenção');
            return;
        }
        
        this.isLoading.set(true);
        
        this.pedidoService.checkout(userId).subscribe({
            next: (pedido) => {
                this.processarPagamento(pedido.id);
            },
            error: (err) => {
                console.error(err);
                this.toastr.error('Erro ao criar o pedido.', 'Erro');
                this.isLoading.set(false);
            }
        });
    }
    
    private processarPagamento(pedidoId: string) {
        const metodoMap: Record<string, MetodoPagamento> = {
            'credit': MetodoPagamento.CARTAO_CREDITO,
            'pix': MetodoPagamento.PIX,
            'boleto': MetodoPagamento.BOLETO
        };
        
        const pagamentoReq: PagamentoRequest = {
            metodo: metodoMap[this.paymentMethod()],
            valor: this.total(),
            numeroParcelas: this.paymentMethod() === 'credit' ? 1 : 1 
        };
        
        this.pedidoService.registrarPagamento(pedidoId, pagamentoReq).subscribe({
            next: () => {
                this.toastr.success('Pedido realizado com sucesso!', 'Parabéns');
                this.carrinhoService.limparEstadoLocal();
                this.router.navigate(['/pedido-confirmado']);
            },
            error: (err) => {
                console.error(err);
                this.toastr.warning('Pedido criado, mas houve erro no pagamento.', 'Atenção');
                this.router.navigate(['/pedido', pedidoId]);
            },
            complete: () => this.isLoading.set(false)
        });
    }
}