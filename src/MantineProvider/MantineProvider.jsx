import {
  MantineProvider as BaseMantineProvider,
  createTheme,
  colorsTuple,
  Button,
  ActionIcon,
} from "@mantine/core";
import classes from "./MantineProvider.module.css";

const theme = createTheme({
  fontFamily:
    "'Lato', -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif",
  colors: {
    custom: colorsTuple("#0f824c"),
  },

  primaryColor: "custom",

  components: {
    Button: Button.extend({ classNames: classes }),
    ActionIcon: ActionIcon.extend({
      classNames: {
        root: classes.rootActionIcon,
      },
    }),
  },
});

export const MantineProvider = ({ children }) => {
  return <BaseMantineProvider theme={theme}>{children}</BaseMantineProvider>;
};
