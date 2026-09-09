export interface ScreenSize {
  width: number;
  height: number;
  name: string;
}

export const screenSizes: ReadonlyArray<ScreenSize> = [
  {
    width: 1920,
    height: 1080,
    name: 'full',
  },
  {
    width: 1536,
    height: 864,
    name: 'desktop',
  },
  {
    width: 1440,
    height: 900,
    name: 'desktop2',
  },
  {
    width: 1366,
    height: 768,
    name: 'tablet',
  },
  {
    width: 1280,
    height: 720,
    name: 'tablet2',
  },
  {
    width: 414,
    height: 915,
    name: 'large-mobile',
  },
  {
    width: 412,
    height: 896,
    name: 'large-mobile-2',
  },
  {
    width: 393,
    height: 873,
    name: 'mobile',
  },

  {
    width: 390,
    height: 844,
    name: 'mobile2',
  },
  {
    width: 385,
    height: 854,
    name: 'mobile3',
  },
  {
    width: 375,
    height: 812,
    name: 'mobile4',
  },
  {
    width: 360,
    height: 800,
    name: 'mobile5',
  },
  {
    width: 360,
    height: 780,
    name: 'mobile6',
  },
];

export const currentLanguage: string = process.env.REACT_APP_MAIN_LANGUAGE || 'en';

export const timeoutDuration = 3000;

interface PlaceholderFields {
  name: string;
  email: string;
  password: string;
}

export const placeholders: PlaceholderFields = {
  name: 'Михайло Светський',
  email: 'vilnaCRM@gmail.com',
  password: 'Створіть пароль',
};

export const PAGES = {
  HOME: '/',
  SIGN_UP: '/sign-up',
  SIGN_IN: '/sign-in',
  NOT_FOUND: '/definitely-not-a-route',
} as const;

// The catch-all route is a static, text-only page, so a desktop/mobile pair is enough to
// catch a regression; the full screenSizes matrix would add binary baselines without adding
// signal (issue #169).
export const notFoundScreens: ReadonlyArray<ScreenSize> = [
  { width: 1536, height: 864, name: 'desktop' },
  { width: 393, height: 873, name: 'mobile' },
];
