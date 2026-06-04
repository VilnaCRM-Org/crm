# MUI Feature Component

```typescript
import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

type ProfileSavePanelProps = {
  isSaving: boolean;
  onSave: () => void;
};

export function ProfileSavePanel({ isSaving, onSave }: ProfileSavePanelProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography component="h2" variant="h6">
        {t('profile.save.title')}
      </Typography>
      <Button variant="contained" disabled={isSaving} onClick={onSave}>
        {t('profile.save.button')}
      </Button>
    </Box>
  );
}
```

Keep feature copy in `i18n/en.json` and `i18n/uk.json`.
