import type { MaterialSet } from '@/types/home'

export const materialSets: MaterialSet[] = [
  {
    id: 'gamam-150',
    title: '150 Days GAMAM preparation',
    modules: [
      {
        id: 'gamam-150',
        title: 'GAMAM 150 Days Tracker',
        route: '/gamam-150',
        type: 'all',
        colorScheme: {
          bg: 'from-rose-500 via-rose-600 to-rose-700',
          bgDark: 'dark:from-rose-600 dark:via-rose-700 dark:to-rose-800',
          accent: 'rose',
        },
      },
      {
        id: 'coding',
        title: 'Coding Problems',
        route: '/coding',
        type: 'Coding',
        colorScheme: {
          bg: 'from-blue-500 via-blue-600 to-blue-700',
          bgDark: 'dark:from-blue-600 dark:via-blue-700 dark:to-blue-800',
          accent: 'blue',
        },
      },
      {
        id: 'system-design',
        title: 'System Design Problems',
        route: '/system-design',
        type: 'System Design',
        colorScheme: {
          bg: 'from-green-500 via-green-600 to-green-700',
          bgDark: 'dark:from-green-600 dark:via-green-700 dark:to-green-800',
          accent: 'green',
        },
      },
      {
        id: 'object-oriented-design',
        title: 'Object Oriented Design Problems',
        route: '/object-oriented-design',
        type: 'Object Oriented Design',
        colorScheme: {
          bg: 'from-orange-500 via-orange-600 to-orange-700',
          bgDark: 'dark:from-orange-600 dark:via-orange-700 dark:to-orange-800',
          accent: 'orange',
        },
      },
      {
        id: 'schema-design',
        title: 'Schema Design Problems',
        route: '/schema-design',
        type: 'Schema Design',
        colorScheme: {
          bg: 'from-sky-500 via-sky-600 to-sky-700',
          bgDark: 'dark:from-sky-600 dark:via-sky-700 dark:to-sky-800',
          accent: 'sky',
        },
      },
      {
        id: 'api-design',
        title: 'API Design Problems',
        route: '/api-design',
        type: 'API Design',
        colorScheme: {
          bg: 'from-indigo-500 via-indigo-600 to-indigo-700',
          bgDark: 'dark:from-indigo-600 dark:via-indigo-700 dark:to-indigo-800',
          accent: 'indigo',
        },
      },
      {
        id: 'behavioral',
        title: 'Behavioral Problems',
        route: '/behavioral',
        type: 'Behavioral',
        colorScheme: {
          bg: 'from-teal-500 via-teal-600 to-teal-700',
          bgDark: 'dark:from-teal-600 dark:via-teal-700 dark:to-teal-800',
          accent: 'teal',
        },
      },
    ],
  },
  {
    id: 'advanced-algorithms',
    title: 'Advanced Algorithms Mastery',
    modules: [
      {
        id: 'advanced-algo-1',
        title: 'Dynamic Programming',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-cyan-500 via-cyan-600 to-cyan-700',
          bgDark: 'dark:from-cyan-600 dark:via-cyan-700 dark:to-cyan-800',
          accent: 'cyan',
        },
      },
      {
        id: 'advanced-algo-2',
        title: 'Graph Algorithms',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-emerald-500 via-emerald-600 to-emerald-700',
          bgDark: 'dark:from-emerald-600 dark:via-emerald-700 dark:to-emerald-800',
          accent: 'emerald',
        },
      },
      {
        id: 'advanced-algo-3',
        title: 'Greedy Algorithms',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-rose-500 via-rose-600 to-rose-700',
          bgDark: 'dark:from-rose-600 dark:via-rose-700 dark:to-rose-800',
          accent: 'rose',
        },
      },
      {
        id: 'advanced-algo-4',
        title: 'Backtracking',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-violet-500 via-violet-600 to-violet-700',
          bgDark: 'dark:from-violet-600 dark:via-violet-700 dark:to-violet-800',
          accent: 'violet',
        },
      },
      {
        id: 'advanced-algo-5',
        title: 'String Algorithms',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-amber-500 via-amber-600 to-amber-700',
          bgDark: 'dark:from-amber-600 dark:via-amber-700 dark:to-amber-800',
          accent: 'amber',
        },
      },
      {
        id: 'advanced-algo-6',
        title: 'Bit Manipulation',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-sky-500 via-sky-600 to-sky-700',
          bgDark: 'dark:from-sky-600 dark:via-sky-700 dark:to-sky-800',
          accent: 'sky',
        },
      },
      {
        id: 'advanced-algo-7',
        title: 'Advanced Data Structures',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-fuchsia-500 via-fuchsia-600 to-fuchsia-700',
          bgDark: 'dark:from-fuchsia-600 dark:via-fuchsia-700 dark:to-fuchsia-800',
          accent: 'fuchsia',
        },
      },
    ],
  },
  {
    id: 'system-design-advanced',
    title: 'System Design Advanced Patterns',
    modules: [
      {
        id: 'system-advanced-1',
        title: 'Microservices Architecture',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-lime-500 via-lime-600 to-lime-700',
          bgDark: 'dark:from-lime-600 dark:via-lime-700 dark:to-lime-800',
          accent: 'lime',
        },
      },
      {
        id: 'system-advanced-2',
        title: 'Distributed Systems',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-red-500 via-red-600 to-red-700',
          bgDark: 'dark:from-red-600 dark:via-red-700 dark:to-red-800',
          accent: 'red',
        },
      },
      {
        id: 'system-advanced-3',
        title: 'Scalability Patterns',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-yellow-500 via-yellow-600 to-yellow-700',
          bgDark: 'dark:from-yellow-600 dark:via-yellow-700 dark:to-yellow-800',
          accent: 'yellow',
        },
      },
      {
        id: 'system-advanced-4',
        title: 'Caching Strategies',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-stone-500 via-stone-600 to-stone-700',
          bgDark: 'dark:from-stone-600 dark:via-stone-700 dark:to-stone-800',
          accent: 'stone',
        },
      },
      {
        id: 'system-advanced-5',
        title: 'Database Design',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-zinc-500 via-zinc-600 to-zinc-700',
          bgDark: 'dark:from-zinc-600 dark:via-zinc-700 dark:to-zinc-800',
          accent: 'zinc',
        },
      },
      {
        id: 'system-advanced-6',
        title: 'Message Queues',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-slate-500 via-slate-600 to-slate-700',
          bgDark: 'dark:from-slate-600 dark:via-slate-700 dark:to-slate-800',
          accent: 'slate',
        },
      },
      {
        id: 'system-advanced-7',
        title: 'Load Balancing',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-neutral-500 via-neutral-600 to-neutral-700',
          bgDark: 'dark:from-neutral-600 dark:via-neutral-700 dark:to-neutral-800',
          accent: 'neutral',
        },
      },
    ],
  },
]

