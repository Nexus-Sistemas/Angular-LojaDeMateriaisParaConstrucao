import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FavoriteItem } from '../../../interfaces/FavoriteItem';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../core/auth/auth.service';
import { CarrinhoService } from '../../../../services/carrinho.service';

@Component({
    selector: 'app-my-favorite-products',
    imports: [CommonModule],
    templateUrl: './my-favorite-products.component.html',
    styleUrl: './my-favorite-products.component.css'
})
export class MyFavoriteProductsComponent {
    private toastr = inject(ToastrService);
    private carrinhoService = inject(CarrinhoService);
    private authService = inject(AuthService);
    
    // Mock de dados - Em produção, você chamaria um 'FavoritosService'
    favorites = signal<any[]>([
        { 
            id: '1', 
            name: 'Furadeira de Impacto Bosch', 
            category: 'Ferramentas', 
            price: 299.90, 
            image: 'https://placehold.co/400x400/f3f4f6/a1a1aa?text=Furadeira', 
            inStock: true 
        },
        { 
            id: '2', 
            name: 'Jogo de Chaves 12pçs', 
            category: 'Acessórios', 
            price: 89.90, 
            image: 'https://placehold.co/400x400/f3f4f6/a1a1aa?text=Chaves', 
            inStock: false 
        }
    ]);
    
    removeFavorite(id: string) {
        this.favorites.update(f => f.filter(item => item.id !== id));
        this.toastr.info('Produto removido dos favoritos.');
    }
    
    clearAll() {
        if (confirm('Deseja limpar toda a sua lista de favoritos?')) {
            this.favorites.set([]);
            this.toastr.info('Lista de favoritos limpa.');
        }
    }
    
    addToCart(item: any) {
        const userId = this.authService.currentUser()?.id;
        
        if (!userId) {
            this.toastr.warning('Faça login para adicionar ao carrinho.');
            return;
        }
        
        this.carrinhoService.adicionarItem(userId, item.id).subscribe({
            next: () => this.toastr.success(`${item.name} adicionado ao carrinho!`),
            error: () => this.toastr.error('Erro ao adicionar produto.')
        });
    }
}
