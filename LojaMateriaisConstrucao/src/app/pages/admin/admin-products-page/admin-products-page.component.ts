import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Produto, ProdutoFiltro } from '../../../models/catalogo.models';
import { PageableParams } from '../../../models/shared.models';
import { CatalogoService } from '../../../services/catalogo.service';
import { TipoMovimentacao, MovimentacaoEstoqueRequest } from '../../../models/estoque.models';
import { EstoqueService } from '../../../services/estoque.service';

@Component({
    selector: 'app-admin-products-page',
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
    templateUrl: './admin-products-page.component.html',
    styleUrl: './admin-products-page.component.css'
})
export class AdminProductsPageComponent implements OnInit {
    private catalogoService = inject(CatalogoService);
    private estoqueService = inject(EstoqueService);
    private toastr = inject(ToastrService);
    private fb = inject(FormBuilder);
    
    // Estado da UI
    isLoading = signal(true);
    isAdjusting = signal(false);
    searchTerm = signal('');
    activeStatusFilter = signal<'all' | 'active' | 'inactive'>('all');
    
    // Estado do Modal de Estoque
    showStockModal = signal(false);
    selectedProduct = signal<Produto | null>(null);
    
    // Dados Reais
    products = signal<Produto[]>([]);
    totalElements = signal(0);
    currentPage = signal(0);
    pageSize = signal(10);

    // Cálculos de Paginação
    totalPages = computed(() => {
        const total = Number(this.totalElements());
        const size = Number(this.pageSize());
        if (!total || !size) return 0;
        return Math.ceil(total / size);
    });
    
    visiblePages = computed(() => {
        const total = this.totalPages();
        const current = this.currentPage();
        const maxVisible = 5; 
        
        if (total <= 0) return [];

        let start = Math.max(0, current - Math.floor(maxVisible / 2));
        let end = Math.min(total, start + maxVisible);

        if (end - start < maxVisible) {
            start = Math.max(0, end - maxVisible);
        }

        if (start < 0) start = 0;

        return Array.from({ length: end - start }, (_, i) => start + i);
    });
    
    // Formulário de Ajuste
    stockForm: FormGroup = this.fb.group({
        quantidade: [1, [Validators.required, Validators.min(1)]],
        tipo: [TipoMovimentacao.ENTRADA, Validators.required],
        motivo: ['', [Validators.required, Validators.minLength(5)]]
    });
    
    ngOnInit() {
        this.loadProducts();
    }

    // --- Lógica de Carregamento e Filtros ---

    onSearch(term: string) {
        this.searchTerm.set(term);
        this.currentPage.set(0); 
        this.loadProducts(); 
    }

    applyFilter(filter: 'all' | 'active' | 'inactive') {
        this.activeStatusFilter.set(filter);
        this.currentPage.set(0);
        this.loadProducts();
    }
    
    loadProducts() {
        this.isLoading.set(true);
        
        const pageable: PageableParams = {
            page: this.currentPage(),
            size: this.pageSize(),
            sort: 'titulo,asc'
        };

        const filtro: any = {};
        
        if (this.searchTerm()) {
            filtro.termo = this.searchTerm();
        }

        const status = this.activeStatusFilter();
        if (status === 'active') {
            filtro.apenasAtivos = true;
        } else if (status === 'inactive') {
            filtro.apenasAtivos = false;
        }
        
        // Usamos 'any' aqui propositalmente para inspecionar a resposta do Spring Boot
        // independentemente da interface definida no frontend.
        this.catalogoService.buscarProdutosComFiltro(filtro, pageable).subscribe({
            next: (response: any) => {
                console.log('📦 Resposta Bruta do Backend:', response);

                // 1. Tenta extrair o conteúdo (lista de produtos)
                const content = response.content || response.data || [];
                
                // 2. Tenta extrair o total de elementos de forma inteligente
                // O Spring Boot padrão retorna na raiz. Algumas adaptações retornam dentro de 'page'.
                let total = 0;
                if (typeof response.totalElements === 'number') {
                    total = response.totalElements; // Padrão Spring Boot
                } else if (response.page && typeof response.page.totalElements === 'number') {
                    total = response.page.totalElements; // Padrão Customizado/Aninhado
                } else if (response.pageMetadata && typeof response.pageMetadata.totalElements === 'number') {
                    total = response.pageMetadata.totalElements; // Outro padrão
                }

                console.log(`✅ Processado -> Total: ${total}, Páginas: ${Math.ceil(total / this.pageSize())}`);

                this.products.set(content);
                this.totalElements.set(total);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Erro no carregamento:', err);
                this.toastr.error('Erro ao carregar catálogo.');
                this.isLoading.set(false);
            }
        });
    }
    
    // --- Lógica de Paginação Visual ---

    changePage(newPage: number) {
        if (newPage >= 0 && newPage < this.totalPages()) {
            this.currentPage.set(newPage);
            this.loadProducts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    goToPage(page: number) {
        if (page !== this.currentPage()) {
            this.changePage(page);
        }
    }

    updatePageSize(newSize: string | number) {
        this.pageSize.set(Number(newSize));
        this.currentPage.set(0);
        this.loadProducts();
    }
    
    // --- Lógica de Estoque ---
    
    openStockModal(product: Produto) {
        this.selectedProduct.set(product);
        this.stockForm.reset({ quantidade: 1, tipo: TipoMovimentacao.ENTRADA, motivo: '' });
        this.showStockModal.set(true);
    }
    
    confirmStockAdjustment() {
        if (this.stockForm.invalid || !this.selectedProduct()) {
            this.stockForm.markAllAsTouched();
            return;
        }
        
        this.isAdjusting.set(true);
        const val = this.stockForm.value;
        const request: MovimentacaoEstoqueRequest = {
            produtoId: this.selectedProduct()!.id,
            quantidade: val.quantidade,
            tipo: val.tipo,
            motivo: val.motivo
        };
        
        this.estoqueService.registrarMovimentacao(request).subscribe({
            next: () => {
                this.toastr.success('Estoque atualizado com sucesso!');
                this.showStockModal.set(false);
                this.loadProducts(); 
            },
            error: (err) => this.toastr.error(err.error?.message || 'Erro ao ajustar estoque.'),
            complete: () => this.isAdjusting.set(false)
        });
    }
    
    // --- Outras Ações ---
    
    toggleStatus(product: Produto) {
        const action$ = product.ativo 
        ? this.catalogoService.desativarProduto(product.id)
        : this.catalogoService.ativarProduto(product.id);
        
        action$.subscribe({
            next: () => {
                this.toastr.success(`Status alterado com sucesso.`);
                this.loadProducts();
            },
            error: (err) => this.toastr.error(err.error?.message || 'Erro ao alterar status.')
        });
    }
    
    deleteProduct(product: Produto) {
        if (confirm(`Excluir permanentemente "${product.titulo}"?`)) {
            this.catalogoService.excluirProduto(product.id).subscribe({
                next: () => {
                    this.toastr.success('Produto removido.');
                    this.loadProducts();
                },
                error: (err) => this.toastr.error(err.error?.message || 'Erro ao excluir.')
            });
        }
    }
    
    get enumTipo() { return TipoMovimentacao; }
}