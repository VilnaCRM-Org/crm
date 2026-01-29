import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';

import authFormSectionStyles from '@/modules/User/features/Auth/components/FormSection/styles';

export default function AuthSkeleton(): JSX.Element {
  return (
      <Box component="section" sx={authFormSectionStyles.formSection}>
        <Box sx={authFormSectionStyles.formWrapper}>
          <Skeleton variant="text" height={44} width="70%" sx={{ mb: 1 }} />
          <Skeleton variant="text" height={28} width="90%" sx={{ mb: 3 }} />

        <Box
          sx={{
            mb: {
              xs: '0.5rem',
              sm: '1.125rem',
              md: '1.4375rem',
              lg: '1.125rem',
              xl: '1rem',
            },
          }}
        >
            <Skeleton variant="text" height={18} width="40%" sx={{ mb: 1 }} />
            <Skeleton
              variant="rectangular"
              sx={{
                borderRadius: '8px',
                height: { xs: '3.25rem', md: '4.9375rem', xl: '4rem' },
              }}
            />
          </Box>
        <Box
          sx={{
            mb: {
              xs: '0.5rem',
              sm: '1.125rem',
              md: '1.4375rem',
              lg: '1.125rem',
              xl: '1rem',
            },
          }}
        >
            <Skeleton variant="text" height={18} width="40%" sx={{ mb: 1 }} />
            <Skeleton
              variant="rectangular"
              sx={{
                borderRadius: '8px',
                height: { xs: '3.25rem', md: '4.9375rem', xl: '4rem' },
              }}
            />
          </Box>
        <Box
          sx={{
            mb: {
              xs: '0.5rem',
              sm: '1.125rem',
              md: '1.4375rem',
              lg: '1.125rem',
              xl: '1rem',
            },
          }}
        >
            <Skeleton variant="text" height={18} width="40%" sx={{ mb: 1 }} />
            <Skeleton
              variant="rectangular"
              sx={{
                borderRadius: '8px',
                height: { xs: '3.25rem', md: '4.9375rem', xl: '4rem' },
              }}
            />
          </Box>

          <Skeleton
            variant="rectangular"
            sx={{
              mb: 3,
              borderRadius: '57px',
              height: { xs: '3.25rem', md: '4rem' },
            }}
          />

          <Divider
            role="presentation"
            sx={{
              mb: {
                xs: '1.0625rem',
                lg: '1.5625rem',
                xl: '0.8755rem',
              },
            }}
          >
            <Skeleton variant="text" width={180} />
          </Divider>

          <Box
            sx={{
              display: 'flex',
              flexWrap: { xs: 'wrap', sm: 'wrap', md: 'nowrap' },
              justifyContent: { md: 'space-between' },
              gap: { xs: '0.3rem', md: 0 },
              mb: 1,
            }}
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                variant="rectangular"
                sx={{
                  borderRadius: '12px',
                  width: {
                    xs: 'calc(50% - 0.15rem)',
                    sm: 'calc(50% - 0.15rem)',
                    md: '8.0625rem',
                    xl: '6.25rem',
                  },
                  height: { xs: '3.25rem', md: '3.75rem' },
                  mb: { xs: '1rem', sm: '0.5rem', md: 0 },
                }}
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ height: '2.5rem' }} />
      </Box>

  );
}
