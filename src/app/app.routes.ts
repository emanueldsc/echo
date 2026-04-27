import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./home-page/home-page').then((m) => m.HomePage),
        title: 'Echo | Home',
    },
    {
        path: 'home',
        redirectTo: '',
        pathMatch: 'full',
    },
    {
        path: 'room/:code',
        loadComponent: () => import('./room-page/room-page').then((m) => m.RoomPage),
        title: 'Echo | Room',
    },
    {
        path: '**',
        redirectTo: '',
    },
];
