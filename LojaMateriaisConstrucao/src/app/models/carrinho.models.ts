export interface ItemCarrinho {
    id: string;
    nomeProduto: string;
    produtoId: string;
    quantidade: number;
    precoUnitario: number;
    subTotal: number;
}

export interface Carrinho {
    id: string;
    clienteId: string;
    itens: ItemCarrinho[];
    total: number;
    dataAtualizacao: string;
}