import { NgModule } from "@angular/core";
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
let modules = [MatSnackBarModule, MatListModule, MatInputModule, MatButtonModule, MatSelectModule, MatProgressSpinnerModule, MatIconModule, MatProgressBarModule, MatTooltipModule]
@NgModule({
    imports: modules,
    exports: modules
})
export class MaterialModule { }