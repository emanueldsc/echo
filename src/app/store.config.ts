import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { roomFeature } from './state/reducers/room.reducer';
import { roundHistoriesFeature } from './state/reducers/round-history.reducer';
import { sessionsFeature } from './state/reducers/session.reducer';
import { votingsFeature } from './state/reducers/voting.reducer';

import { RoomEffects } from './state/effects/room.effects';
import { RoundHistoryEffects } from './state/effects/round-history.effects';
import { SessionEffects } from './state/effects/session.effects';
import { VotingEffects } from './state/effects/voting.effects';

export const storeConfig: ApplicationConfig = {
  providers: [
    provideStore({
      [sessionsFeature.name]: sessionsFeature.reducer,
      [roomFeature.name]: roomFeature.reducer,
      [votingsFeature.name]: votingsFeature.reducer,
      [roundHistoriesFeature.name]: roundHistoriesFeature.reducer,
    }),
    provideEffects([
      SessionEffects,
      RoomEffects,
      VotingEffects,
      RoundHistoryEffects,
    ]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      features: {
        pause: true,
        lock: true,
        persist: true,
      },
    }),
  ],
};
