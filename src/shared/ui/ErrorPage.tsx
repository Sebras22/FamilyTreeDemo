import { Button, Code, Group, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'
import { useI18n } from '@/shared/i18n/i18n'
import type { ErrorPageProps } from '@/interfaces/components/ErrorPageProps'

const KNOWN = [403, 404, 500] as const

export default function ErrorPage({ status, title, text, details, hardNavigation }: ErrorPageProps) {
  const { t } = useI18n()
  const key = status === 0 ? 'network' : KNOWN.includes(status as 403 | 404 | 500) ? String(status) : '500'
  const retryable = status === 0 || status >= 500

  return (
    <main className="error-page" role="alert">
      <Stack align="center" gap="sm">
        <div className="error-code" aria-hidden="true">
          {status === 0 ? '···' : status}
        </div>
        <Title order={1}>{title ?? t(`err.${key}.title`)}</Title>
        <Text c="dimmed" ta="center" maw={440}>
          {text ?? t(`err.${key}.text`)}
        </Text>
        {details && (
          <Code block maw={560} className="error-details">
            {details}
          </Code>
        )}
        <Group mt="md">
          {retryable && (
            <Button variant="default" onClick={() => window.location.reload()}>
              {t('err.reload')}
            </Button>
          )}
          {hardNavigation ? (
            <Button component="a" href="/">
              {t('err.home')}
            </Button>
          ) : (
            <Button component={Link} to="/">
              {t('err.home')}
            </Button>
          )}
        </Group>
      </Stack>
    </main>
  )
}
