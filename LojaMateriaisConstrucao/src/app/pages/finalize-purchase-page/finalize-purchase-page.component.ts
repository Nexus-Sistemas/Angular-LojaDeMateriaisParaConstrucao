import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/auth/auth.service';
import { EntregaRequest, MetodoPagamento, PagamentoRequest } from '../../models/pedido.models';
import { CarrinhoService } from '../../services/carrinho.service';
import { PedidoService } from '../../services/pedido.service';
import { UsuarioService } from '../../services/usuario.service';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

@Component({
    selector: 'app-finalize-purchase-page',
    imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxMaskDirective],
    providers: [provideNgxMask()], 
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
    private fb = inject(FormBuilder);
    private http = inject(HttpClient);
    
    // Estado Local
    paymentMethod = signal<'credit' | 'pix' | 'boleto'>('credit');
    isLoading = signal(false);
    isLoadingCep = signal(false);
    selectedAddressId = signal<string | null>(null);
    
    // Estado do Formulário de Endereço
    showAddressForm = signal(false);
    editingAddressId = signal<string | null>(null); 
    
    addressForm: FormGroup = this.fb.group({
        apelido: ['', Validators.required],
        cep: ['', [Validators.required, Validators.minLength(8)]],
        logradouro: ['', Validators.required],
        numero: ['', Validators.required],
        complemento: [''],
        bairro: ['', Validators.required],
        cidade: ['', Validators.required],
        uf: ['', [Validators.required, Validators.maxLength(2)]],
        principal: [true]
    });
    
    // Estado do Usuário
    userEmail = computed(() => this.authService.currentUser()?.email || '');
    
    // Estado do Carrinho
    cartItems = computed(() => this.carrinhoService.carrinho()?.itens || []);
    subtotal = computed(() => this.carrinhoService.valorTotal());
    shippingCost = signal(15.90); 
    total = computed(() => this.subtotal() + this.shippingCost());
    
    addresses = this.usuarioService.enderecos;
    
    constructor() {
        effect(() => {
            const userId = this.authService.currentUser()?.id;
            if (userId) {
                this.carrinhoService.carregarCarrinho(userId);
                this.usuarioService.carregarEnderecos(userId);
            }
        });
        
        effect(() => {
            const addrs = this.addresses();
            if (addrs.length > 0 && !this.selectedAddressId()) {
                const principal = addrs.find(a => a.principal);
                if (principal) {
                    this.selectedAddressId.set(principal.id);
                } else {
                    this.selectedAddressId.set(addrs[0].id);
                }
            }
        });
    }
    
    // --- Lógica de CEP (ViaCEP) ---
    buscarCep() {
        const cep = this.addressForm.get('cep')?.value?.replace(/\D/g, '');
        if (!cep || cep.length !== 8) return;
        
        this.isLoadingCep.set(true);
        
        this.http.get<any>(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
            next: (dados) => {
                if (dados.erro) {
                    this.toastr.warning('CEP não encontrado.', 'Atenção');
                    this.addressForm.get('cep')?.setErrors({ invalid: true });
                } else {
                    this.addressForm.patchValue({
                        logradouro: dados.logradouro,
                        bairro: dados.bairro,
                        cidade: dados.localidade,
                        uf: dados.uf,
                        complemento: dados.complemento
                    });
                    this.toastr.success('Endereço encontrado!', 'Sucesso');
                }
            },
            error: () => this.toastr.error('Erro ao buscar o CEP.', 'Erro'),
            complete: () => this.isLoadingCep.set(false)
        });
    }
    
    // --- Lógica de Endereço ---
    toggleAddressForm() {
        this.showAddressForm.update(v => !v);
        if (!this.showAddressForm()) this.resetForm();
    }
    
    resetForm() {
        this.addressForm.reset({ principal: true });
        this.editingAddressId.set(null);
    }
    
    editAddress(address: any) {
        this.editingAddressId.set(address.id);
        this.addressForm.patchValue(address);
        this.showAddressForm.set(true);
    }
    
    deleteAddress(addressId: string) {
        const userId = this.authService.currentUser()?.id;
        if (!userId) return;
        
        if (confirm('Tem certeza que deseja excluir este endereço?')) {
            this.usuarioService.removerEndereco(addressId, userId).subscribe({
                next: () => {
                    this.toastr.info('Endereço removido.');
                    if (this.selectedAddressId() === addressId) {
                        this.selectedAddressId.set(null);
                    }
                },
                error: () => this.toastr.error('Erro ao remover endereço.')
            });
        }
    }
    
    setAsPrimary(addressId: string, event: Event) {
        event.stopPropagation();
        const userId = this.authService.currentUser()?.id;
        if (!userId) return;
        
        this.isLoading.set(true);
        this.usuarioService.definirComoPrincipal(addressId, userId).subscribe({
            next: () => {
                this.toastr.success('Endereço definido como principal.');
                this.selectedAddressId.set(addressId);
            },
            error: () => this.toastr.error('Erro ao atualizar endereço principal.'),
            complete: () => this.isLoading.set(false)
        });
    }
    
    saveAddress() {
        if (this.addressForm.invalid) {
            this.addressForm.markAllAsTouched();
            return;
        }
        
        const userId = this.authService.currentUser()?.id;
        if (!userId) return;
        
        this.isLoading.set(true);
        const addressData = this.addressForm.value;
        
        if (this.editingAddressId()) {
            this.usuarioService.atualizarEndereco(this.editingAddressId()!, addressData, userId).subscribe({
                next: () => {
                    this.toastr.success('Endereço atualizado!');
                    this.toggleAddressForm();
                },
                error: () => this.toastr.error('Erro ao atualizar endereço.'),
                complete: () => this.isLoading.set(false)
            });
        } else {
            const newAddress = { ...addressData, principal: true };
            this.usuarioService.adicionarEndereco(userId, newAddress).subscribe({
                next: () => {
                    this.toastr.success('Endereço adicionado e selecionado!');
                    this.toggleAddressForm();
                },
                error: () => this.toastr.error('Erro ao salvar endereço.'),
                complete: () => this.isLoading.set(false)
            });
        }
    }
    
    // --- Lógica de Checkout ---
    
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
        
        // 1. Criar Pedido (Checkout)
        this.pedidoService.checkout(userId).subscribe({
            next: (pedido) => {
                // 2. Registrar a Entrega (Envia frete e endereço)
                this.processarEntrega(pedido.id);
            },
            error: (err) => {
                console.error(err);
                this.toastr.error('Erro ao criar o pedido.', 'Erro');
                this.isLoading.set(false);
            }
        });
    }
    
    private processarEntrega(pedidoId: string) {
        const enderecoSelecionado = this.addresses().find(a => a.id === this.selectedAddressId());
        
        if (!enderecoSelecionado) {
            this.toastr.error('Erro ao recuperar endereço de entrega.', 'Erro');
            this.isLoading.set(false);
            return;
        }
        
        const entregaReq: EntregaRequest = {
            cep: enderecoSelecionado.cep,
            logradouro: enderecoSelecionado.logradouro,
            numero: enderecoSelecionado.numero,
            complemento: enderecoSelecionado.complemento,
            bairro: enderecoSelecionado.bairro,
            cidade: enderecoSelecionado.cidade,
            uf: enderecoSelecionado.uf,
            valorFrete: this.shippingCost(), // Envia o valor do frete
            prazoDiasUteis: 5, // Simulação
            transportadora: 'Transportadora Padrão' // Opcional ou simulação
        };
        
        this.pedidoService.criarEntrega(pedidoId, entregaReq).subscribe({
            next: () => {
                // 3. Após associar a entrega (e o backend atualizar o total), processa o pagamento
                this.processarPagamento(pedidoId);
            },
            error: (err) => {
                console.error('Erro ao criar entrega:', err);
                this.toastr.error('Erro ao registrar dados de entrega.', 'Erro');
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
            valor: this.total(), // Agora deve bater com o total do backend (itens + frete)
            numeroParcelas: this.paymentMethod() === 'credit' ? 1 : 1 
        };
        
        this.pedidoService.registrarPagamento(pedidoId, pagamentoReq).subscribe({
            next: () => {
                this.toastr.success('Pedido realizado com sucesso!', 'Parabéns');
                this.carrinhoService.limparEstadoLocal();
                this.router.navigate(['/pedido-confirmado']);
            },
            error: (err) => {
                console.error('Erro no pagamento:', err);
                // Exibe mensagem de erro mais detalhada se vier do backend
                const msg = err.error && Array.isArray(err.error) ? err.error[0] : 'Houve um erro no pagamento.';
                this.toastr.warning(`Pedido criado, mas: ${msg}`, 'Atenção');
                
                // Redireciona para detalhes do pedido para tentar pagar novamente
                this.router.navigate(['/pedido', pedidoId]);
            },
            complete: () => this.isLoading.set(false)
        });
    }
}