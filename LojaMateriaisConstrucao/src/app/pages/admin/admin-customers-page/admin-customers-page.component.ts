import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { PageableParams } from '../../../models/shared.models';
import { Cliente } from '../../../models/usuario.models';
import { UsuarioService } from '../../../services/usuario.service';
import { NgxMaskPipe } from 'ngx-mask';

@Component({
  selector: 'app-admin-customers-page',
  imports: [CommonModule, FormsModule, RouterLink, NgxMaskPipe],
  templateUrl: './admin-customers-page.component.html',
  styleUrl: './admin-customers-page.component.css',
})
export class AdminCustomersPageComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private toastr = inject(ToastrService);

  // Estado da UI
  isLoading = signal(true);
  searchTerm = signal('');

  // Dados
  customers = signal<Cliente[]>([]);
  totalElements = signal(0);
  currentPage = signal(0);
  pageSize = signal(10);

  // --- LÓGICA DE PAGINAÇÃO (Idêntica ao Catálogo) ---

  totalPages = computed(() => {
    const total = Number(this.totalElements());
    const size = Number(this.pageSize());
    if (!total || !size) return 0;
    return Math.ceil(total / size);
  });

  // Calcula quais números de página mostrar (ex: 1, 2, 3, 4, 5)
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

  ngOnInit() {
    this.loadCustomers();
  }

  // Busca com reset de página
  onSearch(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(0);
    this.loadCustomers();
  }

  // Mudança de tamanho da página
  updatePageSize(newSize: string | number) {
    this.pageSize.set(Number(newSize));
    this.currentPage.set(0);
    this.loadCustomers();
  }

  // Navegação direta
  goToPage(page: number) {
    if (page !== this.currentPage()) {
      this.changePage(page);
    }
  }

  // Navegação relativa (Anterior/Próxima)
  changePage(newPage: number) {
    if (newPage >= 0 && newPage < this.totalPages()) {
      this.currentPage.set(newPage);
      this.loadCustomers();
      // Scroll suave para o topo da tabela
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  loadCustomers() {
    this.isLoading.set(true);
    const params: PageableParams = {
      page: this.currentPage(),
      size: this.pageSize(),
      sort: 'nome,asc',
    };

    // Passa o termo de busca se existir
    this.usuarioService
      .listarTodosClientes(params, this.searchTerm())
      .subscribe({
        next: (page: any) => {
          // Suporte flexível para diferentes estruturas de resposta
          const content = page.content || page.data || [];
          let total = 0;

          if (typeof page.totalElements === 'number')
            total = page.totalElements;
          else if (page.page?.totalElements) total = page.page.totalElements;

          this.customers.set(content);
          this.totalElements.set(total);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Erro ao sincronizar lista de clientes.');
          this.isLoading.set(false);
        },
      });
  }

  toggleStatus(customer: Cliente) {
    this.toastr.info(`Simulação: Status de ${customer.nome} alterado.`, 'Info');
  }

  deleteCustomer(customer: Cliente) {
    if (
      confirm(`Tem certeza que deseja remover o cliente "${customer.nome}"?`)
    ) {
      this.toastr.info('Ação de exclusão enviada.');
    }
  }
}
