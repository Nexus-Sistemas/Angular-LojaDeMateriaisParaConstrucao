import { ItemCarrinho } from "../../models/carrinho.models";

export interface ProductResume {
    id: number;
    name: string;
    category: string;
    price: number;
    stock: number;
    images: string[];
}

export interface CartItem extends ProductResume {
    quantity: number;
}

export interface PopupState {
    visible: boolean;
    x: number;
    y: number;
    item: ItemCarrinho | null;
}

export type PaymentMethod = 'credit' | 'pix' | 'boleto';

export interface TimelineStep {
    label: string;
    icon: string;
    status: 'completed' | 'current' | 'pending';
    dateOrInfo?: string;
}