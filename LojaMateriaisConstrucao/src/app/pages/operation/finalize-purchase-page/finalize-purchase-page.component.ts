import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideNgxMask } from 'ngx-mask';
import { AuthService } from '../../../core/auth/auth.service';
import {
    EntregaRequest,
    MetodoPagamento,
    PagamentoRequest,
} from '../../../models/pedido.models';
import { CarrinhoService } from '../../../services/carrinho.service';
import { PedidoService } from '../../../services/pedido.service';
import { UsuarioService } from '../../../services/usuario.service';
import { IdentificationSectionComponent } from './components/identification-section/identification-section.component';
import { DeliveryAddressSectionComponent } from './components/delivery-address-section/delivery-address-section.component';
import { DeliveryOptionsSectionComponent } from './components/delivery-options-section/delivery-options-section.component';
import { PaymentSectionComponent } from './components/payment-section/payment-section.component';
import { OrderSummarySectionComponent } from './components/order-summary-section/order-summary-section.component';
import { TitleSectionComponent } from './components/title-section/title-section.component';
import { CheckoutService } from '../../../services/checkout.service';

@Component({
    selector: 'app-finalize-purchase-page',
    imports: [
        CommonModule,
        FormsModule,
        PaymentSectionComponent,
        OrderSummarySectionComponent,
        ReactiveFormsModule,
        IdentificationSectionComponent,
        DeliveryAddressSectionComponent,
        DeliveryOptionsSectionComponent,
        TitleSectionComponent,
    ],
    providers: [provideNgxMask()],
    templateUrl: './finalize-purchase-page.component.html',
    styleUrl: './finalize-purchase-page.component.css',
})
export class FinalizePurchasePageComponent {
    private authService = inject(AuthService);
    private carrinhoService = inject(CarrinhoService);
    private usuarioService = inject(UsuarioService);
    private checkoutService = inject(CheckoutService);
    private router = inject(Router);
    private toastr = inject(ToastrService);

    // --- Estado ---
    paymentMethod = signal<'credit' | 'pix' | 'boleto'>('credit');
    isLoading = signal(false);
    selectedAddressId = signal<string | null>(null);
    selectedShippingMethod = signal<'economic' | 'fast' | null>(null);

    showAddressForm = signal(false);
    editingAddress = signal<any>(null);

    // --- Computed Signals ---
    userEmail = computed(() => this.authService.currentUser()?.email || '');
    cartItems = computed(() => this.carrinhoService.carrinho()?.itens || []);
    subtotal = computed(() => this.carrinhoService.valorTotal());
    addresses = this.usuarioService.enderecos;

    shippingCost = computed(() => {
        const method = this.selectedShippingMethod();
        if (method === 'fast') return 15.9;
        return 0.0;
    });

    total = computed(() => this.subtotal() + this.shippingCost());

    constructor() {
        // Carrega carrinho e endereços
        effect(() => {
            const userId = this.authService.currentUser()?.id;
            if (userId) {
                this.carrinhoService.carregarCarrinho(userId);
                this.usuarioService.carregarEnderecos(userId);
            }
        });

        // Seleciona endereço principal automaticamente
        effect(() => {
            const addrs = this.addresses();
            if (addrs.length > 0 && !this.selectedAddressId()) {
                const principal = addrs.find((a) => a.principal);
                this.selectedAddressId.set(
                    principal ? principal.id : addrs[0].id,
                );
            }
        });
    }

    // --- Ações de Endereço ---

    toggleAddressForm() {
        this.showAddressForm.update((v) => !v);
        if (!this.showAddressForm()) this.editingAddress.set(null);
    }

    editAddress(address: any) {
        this.editingAddress.set(address);
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
                        this.selectedShippingMethod.set(null);
                    }
                },
                error: () => this.toastr.error('Erro ao remover endereço.'),
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
            error: () => this.toastr.error('Erro ao atualizar.'),
            complete: () => this.isLoading.set(false),
        });
    }

    handleAddressSave(addressData: any) {
        const userId = this.authService.currentUser()?.id;
        if (!userId) return;

        this.isLoading.set(true);
        const action$ = this.editingAddress()
            ? this.usuarioService.atualizarEndereco(
                  this.editingAddress().id,
                  addressData,
                  userId,
              )
            : this.usuarioService.adicionarEndereco(userId, {
                  ...addressData,
                  principal: true,
              });

        action$.subscribe({
            next: () => {
                this.toastr.success(
                    this.editingAddress()
                        ? 'Endereço atualizado!'
                        : 'Endereço adicionado!',
                );
                this.toggleAddressForm();
            },
            error: () => this.toastr.error('Erro ao salvar endereço.'),
            complete: () => this.isLoading.set(false),
        });
    }

    // --- Ações de Checkout ---

    setPayment(method: 'credit' | 'pix' | 'boleto') {
        this.paymentMethod.set(method);
    }

    confirmarPedido() {
        const userId = this.authService.currentUser()?.id;

        // Validações básicas
        if (!userId) {
            this.toastr.error('Erro de autenticação.');
            return;
        }
        if (this.cartItems().length === 0) {
            this.toastr.warning('Carrinho vazio.');
            return;
        }
        if (!this.selectedAddressId()) {
            this.toastr.warning('Selecione um endereço.');
            return;
        }
        if (!this.selectedShippingMethod()) {
            this.toastr.warning('Selecione o frete.');
            return;
        }

        const enderecoSelecionado = this.addresses().find(
            (a) => a.id === this.selectedAddressId(),
        );
        if (!enderecoSelecionado) return;

        this.isLoading.set(true);

        // Chama o Service Facade para processar tudo
        this.checkoutService
            .processarCompraCompleta({
                userId: userId,
                endereco: enderecoSelecionado,
                metodoFrete: this.selectedShippingMethod()!,
                valorFrete: this.shippingCost(),
                metodoPagamento: this.paymentMethod(),
                total: this.total(),
            })
            .subscribe({
                next: () => {
                    this.toastr.success(
                        'Pedido realizado com sucesso!',
                        'Parabéns',
                    );
                    this.carrinhoService.limparEstadoLocal();
                    this.router.navigate(['/pedido-confirmado']);
                },
                error: (err) => {
                    console.error('Erro no checkout:', err);
                    // Tenta extrair mensagem amigável se vier array de erros
                    const msg =
                        err.error && Array.isArray(err.error)
                            ? err.error[0]
                            : 'Erro ao processar pedido.';
                    this.toastr.error(msg, 'Atenção');
                    this.isLoading.set(false);
                },
            });
    }
}
