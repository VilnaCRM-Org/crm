import React from 'react';

function Button() {
  return <button type="button">Button</button>;
}

export default {
  title: 'Example/Button',
  component: Button,
};

export function ButtonElement(): JSX.Element {
  return <button type="button">Click me</button>;
}
