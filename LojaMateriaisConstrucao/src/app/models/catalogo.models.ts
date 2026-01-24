// --- CATEGORIAS ---

export interface Categoria {
    id: string;
    nome: string;
    descricao?: string;
    slug: string;
    ativa: boolean;
    categoriaPaiId?: string;
    subcategorias: Categoria[]; 
}

export interface CategoriaRequest {
    nome: string;
    descricao?: string;
    slug: string;
    ativa: boolean;
    categoriaPaiId?: string | null;
}

// --- PRODUTOS ---

export interface ImagemProduto {
    id: string;
    url: string;
    ordem: number;
    principal: boolean;
}

export interface Produto {
    id: string;
    codigoControle: string;
    titulo: string;
    descricao: string;
    preco: number;
    precoPromocional?: number;
    estoque: number;
    ativo: boolean;
    pesoKg?: number;
    dimensoes?: string;
    categoria?: Categoria;
    imagens: ImagemProduto[];
}

export interface PageMetadata {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
}

export interface PagedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first?: boolean;
    last?: boolean;
    empty?: boolean;
}

export interface ProdutoRequest {
    codigoControle: string;
    titulo: string;
    descricao: string;
    preco: number;
    precoPromocional?: number;
    estoque: number;
    ativo: boolean;
    pesoKg?: number;
    dimensoes?: string;
    categoriaId: string;
    imagens: string[]; // ADICIONADO: Lista de URLs para envio
}

// --- FILTROS ---

export interface ProdutoFiltro {
    termo?: string;
    categoriaId?: string;
    precoMin: number;
    precoMax: number;
    apenasAtivos?: boolean;
}