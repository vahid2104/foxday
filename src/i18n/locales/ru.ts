import type az from './az';

const ru: typeof az = {
  tabs: {
    today: 'Сегодня',
    money: 'Деньги',
    goals: 'Цели',
    health: 'Здоровье',
  },
  today: {
    greeting: 'Привет, {{name}} 👋',
    scoreLabel: 'ОЧКИ ДНЯ',
    scoreMessage: 'Отлично! Осталось привычек: {{count}}.',
    earnings: 'Заработок сегодня',
    perHour: '{{hours}} · {{rate}} PLN/ч',
    water: 'Вода',
    sleepLastNight: 'Сон прошлой ночью',
    habitsTitle: 'Привычки на сегодня',
  },
  common: {
    comingSoon: 'Скоро',
    comingSoonText: 'Фокси работает над этим разделом. Скоро будет готово!',
    hoursMinutes: '{{h}}ч {{m}}мин',
  },
};

export default ru;
