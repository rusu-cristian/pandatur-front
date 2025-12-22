import { Flex, Text, Badge, Divider, Stack } from "@mantine/core";
import { useMobile } from "@hooks";

export const PageHeader = ({ title, count, extraInfo, withDivider = true, badgeColor = "var(--crm-ui-kit-palette-link-primary)", ...props }) => {
  const isMobile = useMobile();

  return (
    <>
      {isMobile ? (
        <Stack gap="md" w="100%" {...props} style={{
          backgroundColor: 'var(--crm-ui-kit-palette-background-primary)',
          color: 'var(--crm-ui-kit-palette-text-primary)',
          border: '1px solid var(--crm-ui-kit-palette-border-primary)',
          borderRadius: 12,
          padding: 12,
        }}>
          <Flex align="center" justify="space-between" w="100%">
            <Flex align="center" gap="8">
              <Text fw={700} size="lg" c="var(--crm-ui-kit-palette-text-primary)">
                {title}
              </Text>
              {!!count && (
                <Badge size="md" bg={badgeColor} c="var(--crm-ui-kit-palette-surface-text-color)">
                  {count}
                </Badge>
              )}
            </Flex>
          </Flex>
          
          {extraInfo && (
            <Flex align="center" gap="sm" wrap="wrap">
              {extraInfo}
            </Flex>
          )}
        </Stack>
      ) : (
        <Flex align="center" justify="space-between" w="100%" {...props} style={{
          backgroundColor: 'var(--crm-ui-kit-palette-background-primary)',
          color: 'var(--crm-ui-kit-palette-text-primary)',
          border: '1px solid var(--crm-ui-kit-palette-border-primary)',
          padding: 12,
        }}>
          <Flex align="center" gap="8">
            <Text fw={700} size="xl" c="var(--crm-ui-kit-palette-text-primary)">
              {title}
            </Text>

            {!!count && (
              <Badge size="lg" bg={badgeColor} c="var(--crm-ui-kit-palette-surface-text-color)">
                {count}
              </Badge>
            )}
          </Flex>

          {extraInfo && (
            <Flex align="center" gap="md">
              {extraInfo}
            </Flex>
          )}
        </Flex>
      )}

      {withDivider && <Divider my="md" style={{ borderColor: 'var(--crm-ui-kit-palette-border-primary)' }} />}
    </>
  );
};
