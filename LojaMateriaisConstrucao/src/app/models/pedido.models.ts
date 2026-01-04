// --- ENUMS ---

export enum StatusPedido {
    AGUARDANDO_PAGAMENTO = 'AGUARDANDO_PAGAMENTO',
    PAGO = 'PAGO',
    EM_PREPARACAO = 'EM_PREPARACAO',
    ENVIADO = 'ENVIADO',
    ENTREGUE = 'ENTREGUE',
    CANCELADO = 'CANCELADO'
}

export enum StatusPagamento {
    PENDENTE = 'PENDENTE',
    APROVADO = 'APROVADO',
    RECUSADO = 'RECUSADO',
    CANCELADO = 'CANCELADO',
    ESTORNADO = 'ESTORNADO'
}

export enum MetodoPagamento {
    CARTAO_CREDITO = 'CARTAO_CREDITO',
    CARTAO_DEBITO = 'CARTAO_DEBITO',
    BOLETO = 'BOLETO',
    PIX = 'PIX'
}

export enum StatusEntrega {
    PENDENTE = 'PENDENTE',
    EM_SEPARACAO = 'EM_SEPARACAO',
    ENVIADO = 'ENVIADO',
    ENTREGUE = 'ENTREGUE',
    CANCELADO = 'CANCELADO',
    DEVOLVIDO = 'DEVOLVIDO'
}

// --- INTERFACES ---

export interface ItemPedido {
    nomeProduto: string;
    quantidade: number;
    precoUnitario: number;
    subTotal: number;
}

export interface Pagamento {
    id: string;
    dataPagamento?: string;
    status: StatusPagamento;
    metodo: MetodoPagamento;
    valor: number;
    numeroParcelas: number;
    codigoTransacaoGateway?: string;
    pedidoId: string;
}

export interface PagamentoRequest {
    metodo: MetodoPagamento;
    valor: number;
    numeroParcelas: number;
}

export interface Entrega {
    id: string;
    status: StatusEntrega;
    codigoRastreio?: string;
    transportadora?: string;
    valorFrete: number;
    prazoDiasUteis: number;
    dataEstimadaEntrega?: string;
    dataEnvio?: string;
    dataEntregaReal?: string;
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
}

export interface EntregaRequest {
    codigoRastreio?: string;
    transportadora?: string;
    valorFrete: number;
    prazoDiasUteis: number;
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
}

export interface Pedido {
    id: string;
    dataPedido: string;
    status: StatusPedido;
    valorTotal: number;
    valorDesconto: number;
    clienteId: string;
    entrega?: Entrega;
    pagamento?: Pagamento;
    itens: ItemPedido[];
}

export interface ShippingOption {
    id: string;
    label: string;
    deadline: string;
    price: number;
    icon: string;
}