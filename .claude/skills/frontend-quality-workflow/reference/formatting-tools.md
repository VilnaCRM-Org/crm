# Formatting Tools

## Make Targets

```bash
make fmt-prettier
make fmt-qlty
make format
```

`make format` runs Prettier first, then Qlty formatting.

## Qlty Installation

The current Makefile expects `qlty` on `PATH`. If it is missing, install the CLI:

```bash
command -v qlty >/dev/null || {
  installer="$(mktemp)" \
    && curl -fsSL https://qlty.sh -o "$installer" \
    && sh "$installer"
  rm -f "$installer"
}
```

Inspect `"$installer"` before the `sh` step if you have not run the
installer recently. The installer places the CLI in `$HOME/.qlty/bin`
and updates your shell rc files. After installing, start a new shell
or add `$HOME/.qlty/bin` to `PATH` in the current shell so
`make fmt-qlty` can find `qlty`:

```bash
export PATH="$HOME/.qlty/bin:$PATH"
```

Do not run `qlty init` or stage `.qlty/qlty.toml` as part of formatting unless
the task explicitly asks to add repository Qlty configuration.
