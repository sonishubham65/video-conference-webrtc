import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AuthService } from './services/auth.service';


const routes: Routes = [{
    path: "",
    component: HomeComponent
}, {
    path: "home",
    redirectTo: "",
    pathMatch: 'full'
}, {
    path: "account",
    loadChildren: () => import('./account/account.module').then(m => m.AccountModule)
}, {
    path: "dashboard",
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthService]
}];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
