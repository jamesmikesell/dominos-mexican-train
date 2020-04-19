import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './components/main/main.component';
import { NameComponent } from './components/name/name.component';
import { InitComponent } from './components/init/init.component';
import { AdminComponent } from './components/admin/admin.component';


const routes: Routes = [
  {
    path: "game",
    component: MainComponent
  },
  {
    path: "name",
    component: NameComponent
  },
  {
    path: "admin",
    component: AdminComponent
  },
  {
    path: "**",
    component: InitComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
