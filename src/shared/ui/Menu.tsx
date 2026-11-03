import { Button, Menu as MantineMenu } from '@mantine/core'
import { Check } from 'lucide-react'
import type { MenuProps } from '@/interfaces/components/MenuProps'

export default function Menu({ label, icon, items }: MenuProps) {
  const visible = items.filter((i) => !i.hidden)
  if (visible.length === 0) return null

  return (
    <MantineMenu position="bottom-end" shadow="md" width={220} withinPortal>
      <MantineMenu.Target>
        <Button variant="default" leftSection={icon}>
          {label}
        </Button>
      </MantineMenu.Target>
      <MantineMenu.Dropdown>
        {visible.map((item) => (
          <MantineMenu.Item
            key={item.key}
            color={item.danger ? 'red' : undefined}
            leftSection={item.icon}
            rightSection={item.checked ? <Check size={14} aria-hidden="true" /> : undefined}
            onClick={item.onClick}
          >
            {item.label}
          </MantineMenu.Item>
        ))}
      </MantineMenu.Dropdown>
    </MantineMenu>
  )
}
