import { Grid, Text, Paper, Stack, Box, Divider } from "@mantine/core";
import { categories, actions, levels } from "../../utils/permissionConstants";

const getCircleStyle = (isActive, color) => ({
    width: 12,
    height: 12,
    borderRadius: "50%",
    border: `1px solid ${color}`,
    backgroundColor: isActive ? color : "transparent",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
});

const RoleMatrix = ({ permissions = {}, onChange }) => {
    return (
        <Paper withBorder p="xs" radius="md">
            <Grid columns={actions.length + 2} gutter={4} mb={4} align="center">
                <Grid.Col span={1}></Grid.Col>
                {actions.map((action) => (
                    <Grid.Col span={1} key={action}>
                        <Text fw={500} ta="center" size="xs">{action}</Text>
                    </Grid.Col>
                ))}
            </Grid>

            {categories.map((category, index) => (
                <Box key={category}>
                    {index > 0 && <Divider my={4} />}
                    <Grid columns={actions.length + 2} gutter={4} align="center">
                        <Grid.Col span={1}>
                            <Text fw={500} size="xs">{category}</Text>
                        </Grid.Col>

                        {actions.map((action) => {
                            const key = `${category}_${action}`;
                            const currentLevel = permissions[key];

                            return (
                                <Grid.Col span={1} key={key}>
                                    <Stack align="center" gap={3}>
                                        {levels.map(({ value, color }) => (
                                            <Box
                                                key={value}
                                                onClick={() =>
                                                    onChange(
                                                        key,
                                                        currentLevel === value ? undefined : value
                                                    )
                                                }
                                                style={getCircleStyle(currentLevel === value, color)}
                                            />
                                        ))}
                                    </Stack>
                                </Grid.Col>
                            );
                        })}

                        <Grid.Col span={1}>
                            <Stack gap={2}>
                                {levels.map(({ value, label, color }) => (
                                    <Text key={value} size="10px" c={color} style={{ lineHeight: 1.2 }}>
                                        {label}
                                    </Text>
                                ))}
                            </Stack>
                        </Grid.Col>
                    </Grid>
                </Box>
            ))}
        </Paper>
    );
};

export default RoleMatrix;
