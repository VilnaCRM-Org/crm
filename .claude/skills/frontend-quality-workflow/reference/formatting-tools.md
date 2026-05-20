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
command -v qlty >/dev/null || curl https://qlty.sh | sh
```

After installing, open a new shell or export the installer path so `make
fmt-qlty` can find `qlty`.

Do not run `qlty init` or stage `.qlty/qlty.toml` as part of formatting unless
the task explicitly asks to add repository Qlty configuration.
