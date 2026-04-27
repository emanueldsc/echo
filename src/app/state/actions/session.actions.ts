import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Update } from '@ngrx/entity';

import { Session } from '../models/session.model';

export const SessionActions = createActionGroup({
  source: 'Session/API',
  events: {
    'Load Sessions': props<{ sessions: Session[] }>(),
    'Add Session': props<{ session: Session }>(),
    'Upsert Session': props<{ session: Session }>(),
    'Add Sessions': props<{ sessions: Session[] }>(),
    'Upsert Sessions': props<{ sessions: Session[] }>(),
    'Update Session': props<{ session: Update<Session> }>(),
    'Update Sessions': props<{ sessions: Update<Session>[] }>(),
    'Delete Session': props<{ id: string }>(),
    'Delete Sessions': props<{ ids: string[] }>(),
    'Clear Sessions': emptyProps(),
  },
});
