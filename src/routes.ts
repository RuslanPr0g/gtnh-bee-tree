import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
  layout('routes/shell.tsx', [
    index('routes/home.tsx'),
    route('bee/:mod/:name', 'routes/bee.tsx'),
    route('quest', 'routes/quests.tsx'),
    route('quest/:name', 'routes/quest.tsx'),
    route('import', 'routes/import.tsx'),
    route('*', 'routes/not-found.tsx'),
  ]),
] satisfies RouteConfig;
