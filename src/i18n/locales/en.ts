import type az from './az';

const en: typeof az = {
  tabs: {
    today: 'Today',
    money: 'Money',
    goals: 'Goals',
    health: 'Health',
  },
  today: {
    greeting: 'Hi, {{name}} 👋',
    scoreLabel: 'DAY SCORE',
    scoreMessage: 'Great job! {{count}} more habits to go.',
    earnings: "Today's earnings",
    perHour: '{{hours}} · {{rate}} PLN/h',
    water: 'Water',
    sleepLastNight: 'Last night',
    habitsTitle: "Today's habits",
  },
  common: {
    comingSoon: 'Coming soon',
    comingSoonText: 'Foxy is working on this section. It will be ready in the next steps!',
    hoursMinutes: '{{h}}h {{m}}m',
  },
};

export default en;
