import {
  MantineProvider as BaseMantineProvider,
  createTheme,
  colorsTuple,
  Button,
  ActionIcon,
  rem,
} from "@mantine/core";
import classes from "./MantineProvider.module.css";

const theme = createTheme({
  // Typography (Type Scale: 1.25 ratio - major third)
  fontFamily:
    "'Lato', -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif",

  fontSizes: {
    xs: rem(12),   // Мелкие метки, captions
    sm: rem(14),   // Текст форм, body text
    md: rem(16),   // Базовый размер
    lg: rem(18),   // Подзаголовки
    xl: rem(20),   // Заголовки секций
  },

  headings: {
    fontWeight: '600',
    sizes: {
      h1: { fontSize: rem(32), lineHeight: '1.2' },  // Заголовки страниц
      h2: { fontSize: rem(26), lineHeight: '1.25' }, // Секции
      h3: { fontSize: rem(20), lineHeight: '1.3' },  // Карточки
      h4: { fontSize: rem(18), lineHeight: '1.35' }, // Виджеты
      h5: { fontSize: rem(16), lineHeight: '1.4' },  // Мелкие заголовки
      h6: { fontSize: rem(14), lineHeight: '1.4' },  // Лейблы
    },
  },

  // Spacing (4px базовая сетка)
  spacing: {
    xs: rem(4),   // Плотное
    sm: rem(8),   // Компактное
    md: rem(16),  // Стандартное
    lg: rem(24),  // Щедрое
    xl: rem(32),  // Большие секции
  },

  // Breakpoints (Mantine defaults)
  breakpoints: {
    xs: '36em',  // 576px
    sm: '48em',  // 768px
    md: '62em',  // 992px
    lg: '75em',  // 1200px
    xl: '88em',  // 1408px
  },

  // Border radius
  radius: {
    xs: rem(4),
    sm: rem(6),
    md: rem(8),
    lg: rem(12),
    xl: rem(16),
  },

  colors: {
    custom: colorsTuple("#0f824c"),
  },

  primaryColor: "custom",

  // Компактные размеры по умолчанию
  components: {
    Button: Button.extend({
      classNames: classes,
      defaultProps: {
        size: 'sm', // Меньше кнопки
      },
    }),

    ActionIcon: ActionIcon.extend({
      classNames: {
        root: classes.rootActionIcon,
      },
      defaultProps: {
        size: 'md',
      },
    }),

    TextInput: {
      defaultProps: { size: 'sm' },
    },

    Select: {
      defaultProps: { size: 'sm' },
    },

    Table: {
      defaultProps: {
        verticalSpacing: 'xs', // Компактные таблицы
        fontSize: 'sm',
      },
    },
  },
});

export const MantineProvider = ({ children }) => {
  return <BaseMantineProvider theme={theme}>{children}</BaseMantineProvider>;
};
