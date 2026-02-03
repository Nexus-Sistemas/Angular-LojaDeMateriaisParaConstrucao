import { Component, input } from '@angular/core';

@Component({
    selector: 'app-identification-section',
    imports: [],
    templateUrl: './identification-section.component.html',
    styleUrl: './identification-section.component.css',
})
export class IdentificationSectionComponent {
    userEmail = input.required<string>();
}
