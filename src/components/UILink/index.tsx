import { ThemeProvider, Link } from "@mui/material";
import { LinkProps } from "@mui/material/Link";
import React from "react";

import Theme from "@/components/UILink/Theme";

export default function UILink(props: LinkProps): JSX.Element {
  const { children } = props;

  return (
    <ThemeProvider theme={Theme}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Link {...props}>{children}</Link>
    </ThemeProvider>
  )
}
