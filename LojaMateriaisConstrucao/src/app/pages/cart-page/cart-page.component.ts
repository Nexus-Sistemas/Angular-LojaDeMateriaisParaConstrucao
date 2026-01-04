import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ItemCarrinho } from '../../models/carrinho.models';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/auth/auth.service';
import { Produto } from '../../models/catalogo.models';
import { CarrinhoService } from '../../services/carrinho.service';
import { CatalogoService } from '../../services/catalogo.service';
import { PopupState } from '../../shared/interfaces/Cart';
import { ShippingCalculatorComponent } from "../../shared/components/shipping-calculator/shipping-calculator.component";

@Component({
    selector: 'app-cart-page',
    imports: [CommonModule, FormsModule, CurrencyPipe, ShippingCalculatorComponent],
    templateUrl: './cart-page.component.html',
    styleUrl: './cart-page.component.css'
})

export class CartPageComponent implements OnInit {
    private carrinhoService = inject(CarrinhoService);
    private authService = inject(AuthService);
    private catalogoService = inject(CatalogoService);
    private toastr = inject(ToastrService);
    private router = inject(Router);
    
    relatedProducts = signal<Produto[]>([]);
    zipCode = signal(''); // Mantemos para passar como initialZipCode se necessário
    shippingCost = signal(0);
    popup = signal<PopupState>({ visible: false, x: 0, y: 0, item: null });
    
    cartItems = computed(() => this.carrinhoService.carrinho()?.itens || []);
    subtotal = computed(() => this.carrinhoService.valorTotal());
    total = computed(() => this.subtotal() + this.shippingCost());
    
    constructor() {
        effect(() => {
            const user = this.authService.currentUser();
            if (user?.id) {
                this.carrinhoService.carregarCarrinho(user.id);
            }
        });
    }
    
    ngOnInit() {
        this.carregarProdutosRelacionados();
    }
    
    carregarProdutosRelacionados() {
        this.catalogoService.listarProdutosVitrine({ page: 0, size: 4 }).subscribe({
            next: (page) => this.relatedProducts.set(page.content)
        });
    }
    
    updateQty(item: ItemCarrinho, delta: number) {
        const novaQuantidade = item.quantidade + delta;
        
        if (novaQuantidade <= 0) {
            this.removeItem(item);
            return;
        }
        
        const clienteId = this.authService.currentUser()?.id;
        const produtoId = item.produtoId; 
        
        if (clienteId && produtoId) {
            this.carrinhoService.atualizarQuantidade(clienteId, produtoId, novaQuantidade).subscribe({
                error: (err) => this.toastr.error('Erro ao atualizar quantidade.', 'Ops!')
            });
        }
    }
    
    removeItem(item: ItemCarrinho) {
        if (confirm(`Deseja remover "${item.nomeProduto}" do carrinho?`)) {
            const clienteId = this.authService.currentUser()?.id;
            const produtoId = item.produtoId;
            
            if (clienteId && produtoId) {
                this.carrinhoService.removerItem(clienteId, produtoId).subscribe({
                    next: () => {
                        this.toastr.info('Item removido.', 'Carrinho');
                        if (this.popup().item === item) {
                            this.hidePopup();
                        }
                    }
                });
            }
        }
    }
    
    addToCart(product: Produto) {
        const clienteId = this.authService.currentUser()?.id;
        if (!clienteId) {
            this.router.navigate(['/login']);
            return;
        }
        
        this.carrinhoService.adicionarItem(clienteId, product.id).subscribe({
            next: () => {
                this.toastr.success(`${product.titulo} adicionado!`, 'Sucesso');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            error: () => this.toastr.error('Erro ao adicionar produto.', 'Erro')
        });
    }
    
    // Agora apenas recebe o valor do componente filho
    updateShippingCost(cost: number) {
        this.shippingCost.set(cost);
    }
    
    finalizarCompra() {
        const clienteId = this.authService.currentUser()?.id;
        if (clienteId) {
            this.router.navigate(['/finalizar-compra']);
        } else {
            this.router.navigate(['/login']);
        }
    }
    
    showPopup(item: ItemCarrinho) {
        this.popup.update(s => ({ ...s, visible: true, item }));
    }
    
    movePopup(event: MouseEvent) {
        if (!this.popup().visible) return;
        
        const gap = 20;
        const popupWidth = 288;
        
        let left = event.clientX + gap;
        let top = event.clientY + gap;
        
        if (left + popupWidth > window.innerWidth) {
            left = event.clientX - popupWidth - gap;
        }
        
        this.popup.update(s => ({ ...s, x: left, y: top }));
    }
    
    hidePopup() {
        this.popup.update(s => ({ ...s, visible: false }));
    }
}