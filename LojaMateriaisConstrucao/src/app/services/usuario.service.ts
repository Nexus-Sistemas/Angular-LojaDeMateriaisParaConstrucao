import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Endereco, EnderecoRequest } from '../models/usuario.models';
import { Observable, tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UsuarioService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/enderecos`;
    
    private _enderecos = signal<Endereco[]>([]);
    public enderecos = this._enderecos.asReadonly();
    
    carregarEnderecos(clienteId: string) {
        this.http.get<Endereco[]>(`${this.apiUrl}/cliente/${clienteId}`)
        .subscribe({
            next: (lista) => this._enderecos.set(lista),
            error: (err) => console.error('Erro ao carregar endereços', err)
        });
    }
    
    adicionarEndereco(clienteId: string, dto: EnderecoRequest): Observable<Endereco> {
        return this.http.post<Endereco>(`${this.apiUrl}/cliente/${clienteId}`, dto)
        .pipe(
            tap(() => this.carregarEnderecos(clienteId)) // Atualiza a lista automaticamente após salvar
        );
    }
    
    atualizarEndereco(id: string, dto: EnderecoRequest, clienteId: string): Observable<Endereco> {
        return this.http.put<Endereco>(`${this.apiUrl}/${id}`, dto)
        .pipe(
            tap(() => this.carregarEnderecos(clienteId))
        );
    }
    
    removerEndereco(id: string, clienteId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`)
        .pipe(
            tap(() => this.carregarEnderecos(clienteId))
        );
    }
    
    definirComoPrincipal(id: string, clienteId: string): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${id}/principal`, {})
        .pipe(
            tap(() => this.carregarEnderecos(clienteId))
        );
    }
}