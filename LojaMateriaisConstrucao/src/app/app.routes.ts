import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { ProductPageComponent } from './pages/product-page/product-page.component';
import { CartPageComponent } from './pages/cart-page/cart-page.component';
import { FinalizePurchasePageComponent } from './pages/finalize-purchase-page/finalize-purchase-page.component';
import { PrivacyPolicyPageComponent } from './pages/privacy-policy-page/privacy-policy-page.component';
import { OrderPageComponent } from './pages/order-page/order-page.component';
import { OrderConfirmedPageComponent } from './pages/order-confirmed-page/order-confirmed-page.component';
import { ProfilePageComponent } from './pages/profile-page/profile-page.component';
import { RegisterPageComponent } from './pages/register-page/register-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { FaqPageComponent } from './pages/faq-page/faq-page.component';
import { AboutUsPageComponent } from './pages/about-us-page/about-us-page.component';
import { RecoverPasswordPageComponent } from './pages/recover-password-page/recover-password-page.component';
import { DashboardAdminPageComponent } from './pages/admin/dashboard-admin-page/dashboard-admin-page.component';
import { LayoutWithHeaderComponent } from './pages/layouts/layout-with-header/layout-with-header.component';
import { NotFoundPageComponent } from './pages/not-found-page/not-found-page.component';
import { RegisterProductPageComponent } from './pages/admin/register-product-page/register-product-page.component';
import { RegisterCustomerPageComponent } from './pages/admin/register-customer-page/register-customer-page.component';
import { AdminOrdersPageComponent } from './pages/admin/admin-orders-page/admin-orders-page.component';
import { MainPageComponent } from './pages/admin/main-page/main-page.component';
import { AdministrativeReportsPageComponent } from './pages/admin/administrative-reports-page/administrative-reports-page.component';
import { adminGuard, authGuard } from './core/guards/auth.guard';
import { ForbiddenPageComponent } from './pages/forbidden-page/forbidden-page.component';
import { MyPersonalDataComponent } from './shared/components/profile/my-personal-data/my-personal-data.component';
import { MyAddressesComponent } from './shared/components/profile/my-addresses/my-addresses.component';
import { MyFavoriteProductsComponent } from './shared/components/profile/my-favorite-products/my-favorite-products.component';
import { MyOrdersComponent } from './shared/components/profile/my-orders/my-orders.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full'
    },
    {
        path: '',
        component: LayoutWithHeaderComponent,
        children: [
            { path: 'inicio', component: HomePageComponent },
            { path: 'produto/:id', component: ProductPageComponent },
            { path: 'carrinho', component: CartPageComponent },
            { path: 'faq', component: FaqPageComponent },
            { path: 'sobre-nos', component: AboutUsPageComponent },
            { path: 'politica-de-privacidade', component: PrivacyPolicyPageComponent },
            
            { 
                path: 'finalizar-compra', 
                component: FinalizePurchasePageComponent,
                canActivate: [authGuard] 
            },
            { 
                path: 'pedido/:id', 
                component: OrderPageComponent, 
                canActivate: [authGuard]
            },
            { 
                path: 'pedido-confirmado', 
                component: OrderConfirmedPageComponent,
                canActivate: [authGuard]
            },
            // CONFIGURAÇÃO DE ROTAS FILHAS PARA O PERFIL
            { 
                path: 'perfil', 
                component: ProfilePageComponent,
                canActivate: [authGuard],
                children: [
                    { path: '', redirectTo: 'dados', pathMatch: 'full' },
                    { path: 'dados', component: MyPersonalDataComponent },
                    { path: 'pedidos', component: MyOrdersComponent },
                    { path: 'enderecos', component: MyAddressesComponent },
                    { path: 'favoritos', component: MyFavoriteProductsComponent }
                ]
            }
        ]
    },
    { path: 'login', component: LoginPageComponent },
    { path: 'registrar', component: RegisterPageComponent },
    { path: 'recuperar-senha', component: RecoverPasswordPageComponent },
    {
        path: 'dashboard-admin',
        component: DashboardAdminPageComponent,
        canActivate: [authGuard, adminGuard],
        children: [
            { path: '', component: MainPageComponent },
            { path: 'registrar-product', component: RegisterProductPageComponent },
            { path: 'registrar-cliente', component: RegisterCustomerPageComponent },
            { path: 'pedidos', component: AdminOrdersPageComponent },
            { path: 'relatorios-administrativos', component: AdministrativeReportsPageComponent }
        ]
    },
    { path: 'acesso-negado', component: ForbiddenPageComponent },
    { path: '**', component: NotFoundPageComponent }
];