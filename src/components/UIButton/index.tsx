import { ThemeProvider, Button } from "@mui/material";
import { ButtonProps } from "@mui/material/Button";
import React from "react";

import Theme from "@/components/UILink/Theme";

export default function UIButton(props: ButtonProps): JSX.Element {
  const { children } = props;

  return (
    <ThemeProvider theme={Theme}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Button {...props}>{children}</Button>
    </ThemeProvider>
  )
}
