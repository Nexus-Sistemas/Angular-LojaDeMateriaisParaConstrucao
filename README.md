![Versão Atual](https://img.shields.io/github/v/release/Nexus-Sistemas/Angular-LojaDeMateriaisParaConstrucao?include_prereleases&label=Versão&color=orange&style=for-the-badge)

# 🏗️ ConstruMonte

### E-commerce de Materiais de Construção

Bem-vindo ao repositório do **ConstruMonte**, uma plataforma de e-commerce moderna e robusta desenvolvida para lojas de materiais de construção.
O projeto utiliza uma arquitetura **full-stack** completa, escalável e alinhada a boas práticas de mercado.

---

## 📸 Preview

![Preview do ConstruMonte](./preview.PNG)

---

## 🚀 Funcionalidades

O projeto conta com diversas funcionalidades essenciais para um e-commerce completo:

### 🏠 Catálogo (Home)

* Listagem de produtos com **filtros dinâmicos** (Categoria, Preço, Marca, Avaliação) integrados à API
* Alternância entre visualização **Grid** e **Lista**
* Busca e ordenação via backend
* **Banner rotativo (Hero Carousel)** com ofertas
* **Quick View**: popup interativo ao passar o mouse sobre os produtos

### 📦 Página do Produto

* Galeria de imagens com **zoom**
* **Cálculo de frete** (simulado)
* Abas de navegação:

  * Visão Geral
  * Especificações
  * Avaliações

### 🛒 Carrinho de Compras

* Gestão de itens persistente
* Resumo financeiro com **cálculo de frete**

### 👤 Área do Usuário

* Autenticação e Autorização (**Login/Cadastro**)
* Perfil completo com **Dashboard**
* Histórico de pedidos com **rastreamento**
* Gestão de endereços e dados pessoais

### 📄 Institucional

* Páginas de:

  * Sobre Nós
  * Política de Privacidade
  * FAQ / Ajuda

---

## 🛠️ Tecnologias Utilizadas

### Frontend

* **Angular** — Framework principal para construção da SPA
* **TypeScript** — Linguagem base do frontend
* **Tailwind CSS** — Estilização utilitária e responsiva
* **Phosphor Icons** — Ícones vetoriais modernos

### Backend

* **Java 21 (LTS)** — Linguagem robusta e performática
* **Spring Boot** — Criação de APIs RESTful
* **Spring Data JPA** — Persistência de dados
* **Spring Security** — Autenticação e autorização com JWT

### Banco de Dados

* **PostgreSQL** — Banco de dados relacional confiável

---

## 📂 Estrutura do Projeto

A arquitetura do projeto separa claramente as responsabilidades entre **backend** e **frontend**:

```bash
/
├── backend/                    # API Java Spring Boot
│   ├── src/main/java           # Código fonte
│   │   └── com/projeto         # Pacote raiz da aplicação
│   │       ├── config/         # Configurações (Security, CORS, Swagger)
│   │       ├── controllers/    # Endpoints REST
│   │       ├── models/         # Entidades JPA
│   │       ├── repositories/   # Acesso a dados
│   │       ├── services/       # Regras de negócio
│   │       └── dtos/           # DTOs (Request / Response)
│   └── src/main/resources      # Configurações e migrações
│
├── frontend/                   # Aplicação Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/           # Serviços globais, guards, interceptors
│   │   │   ├── shared/         # Componentes reutilizáveis
│   │   │   ├── layout/         # Header, Footer, Navigation
│   │   │   ├── features/       # Módulos de negócio
│   │   │   ├── app.component.ts
│   │   │   └── app.routes.ts   # Rotas da aplicação
│   │   ├── assets/             # Imagens, fontes, i18n
│   │   └── styles/             # Estilos globais e Tailwind
│   ├── angular.json
│   └── package.json
│
└── README.md                   # Documentação do projeto
```

---

## 🚀 Como Rodar o Projeto

### 🔧 Pré-requisitos

* **Node.js** e **npm**
* **Java JDK 21**
* **Maven**
* **PostgreSQL** (instalado e em execução)

---

### 1️⃣ Configuração do Banco de Dados

Crie um banco de dados no PostgreSQL:

```sql
CREATE DATABASE construmonte_db;
```

Configure as credenciais no arquivo `application.properties` do backend.

---

### 2️⃣ Rodando o Backend (Spring Boot)

```bash
cd backend
mvn spring-boot:run
```

O servidor iniciará na porta **8080**.

---

### 3️⃣ Rodando o Frontend (Angular)

```bash
cd frontend
npm install
ng serve
```

Acesse a aplicação em:
👉 **[http://localhost:4200](http://localhost:4200)**

---

## 🎨 Design System

O projeto utiliza um **Design System** baseado em identidade visual do segmento de construção:

* **Cor Primária (Brand):** `#ea580c` (Laranja / Tijolo)
* **Fonte:** Inter (Google Fonts)

---

## 🤝 Contribuição

Contribuições são sempre bem-vindas! 🚀

Passos para contribuir:

1. Faça um **Fork** do projeto
2. Crie uma **Branch** para sua feature

   ```bash
   git checkout -b feature/NovaFeature
   ```
3. Faça o **Commit**

   ```bash
   git commit -m "Adicionando nova feature"
   ```
4. Faça o **Push**

   ```bash
   git push origin feature/NovaFeature
   ```
5. Abra um **Pull Request**

---

Desenvolvido por **Raphael Muniz**
