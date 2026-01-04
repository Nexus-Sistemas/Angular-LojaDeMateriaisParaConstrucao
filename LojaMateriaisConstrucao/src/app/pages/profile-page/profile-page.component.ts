import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { provideNgxMask } from 'ngx-mask';
import { AuthService } from '../../core/auth/auth.service';

@Component({
    selector: 'app-profile-page',
    imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
    providers: [provideNgxMask()],
    templateUrl: './profile-page.component.html',
    styleUrl: './profile-page.component.css'
})

export class ProfilePageComponent {
    private authService = inject(AuthService);
    
    user = signal({
        name: 'Utilizador',
        email: '',
        memberSince: new Date().getFullYear().toString(),
        avatar: ''
    });
    
    constructor() {
        effect(() => {
            const currentUser = this.authService.currentUser();
            if (currentUser) {
                this.user.update(u => ({
                    ...u,
                    email: currentUser.email,
                    name: currentUser.email.split('@')[0],
                    avatar: `https://ui-avatars.com/api/?name=${currentUser.email}&background=0f172a&color=fff&size=128`
                }));
            }
        });
    }
    
    logout() {
        this.authService.logout();
    }
}