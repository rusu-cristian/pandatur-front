import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Collapse,
    IconButton,
    Box,
    Typography,
    Chip,
    Paper,
} from "@mui/material";
import { ChevronRight, ExpandMore } from "@mui/icons-material";
import { getLanguageByKey } from "../utils";

// Форматирование чисел
const formatNumber = (num) => {
    if (num === null || num === undefined) return "-";
    return typeof num === "number" ? num.toFixed(2) : num;
};

// Проверка, является ли объект метриками (конечным узлом)
const isMetricsObject = (obj) => {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
    // Если есть поля totals или data, это не конечный узел
    if (obj.totals || obj.data) return false;
    // Если есть типичные поля метрик, это конечный узел
    return "count" in obj || "commission" in obj || "pretNetto" in obj;
};

// Компонент для отображения метрик
const MetricsRow = ({ totals, level = 0 }) => {
    if (!totals) return null;

    // Если totals это простой объект с метриками (без total, excursii, tururi)
    if (isMetricsObject(totals)) {
        return (
            <Box sx={{ pl: level * 2, py: 1 }}>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Typography variant="body2" fontWeight={500}>
                        {getLanguageByKey("Count")}: {totals.count || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {getLanguageByKey("Commission")}: {formatNumber(totals.commission)}
                    </Typography>
                    {totals.avgCommission && (
                        <Typography variant="body2" color="text.secondary">
                            {getLanguageByKey("Avg Commission")}: {formatNumber(totals.avgCommission)}
                        </Typography>
                    )}
                    {totals.pretNetto && (
                        <Typography variant="body2" color="text.secondary">
                            {getLanguageByKey("Pret Netto")}: {formatNumber(totals.pretNetto)}
                        </Typography>
                    )}
                    {totals.sumaContract && (
                        <Typography variant="body2" color="text.secondary">
                            {getLanguageByKey("Suma Contract")}: {formatNumber(totals.sumaContract)}
                        </Typography>
                    )}
                </Box>
            </Box>
        );
    }

    // Сложная структура с total, excursii, tururi
    const metrics = totals.total || totals;
    const excursii = totals.excursii;
    const tururi = totals.tururi;

    return (
        <Box sx={{ pl: level * 2, py: 1 }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
                {metrics && (
                    <>
                        <Typography variant="body2" fontWeight={500}>
                            {getLanguageByKey("Total")}: {metrics.count || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {getLanguageByKey("Commission")}: {formatNumber(metrics.commission)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {getLanguageByKey("Avg Commission")}: {formatNumber(metrics.avgCommission)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {getLanguageByKey("Pret Netto")}: {formatNumber(metrics.pretNetto)}
                        </Typography>
                        {metrics.sumaContract && (
                            <Typography variant="body2" color="text.secondary">
                                {getLanguageByKey("Suma Contract")}: {formatNumber(metrics.sumaContract)}
                            </Typography>
                        )}
                    </>
                )}
                {totals.conversionRateContract && (
                    <Chip
                        label={`${getLanguageByKey("Conversion")}: ${formatNumber(totals.conversionRateContract)}%`}
                        color="primary"
                        size="small"
                        variant="outlined"
                    />
                )}
                {totals.conversionRateTotal && (
                    <Chip
                        label={`${getLanguageByKey("Conversion Total")}: ${formatNumber(totals.conversionRateTotal)}%`}
                        color="success"
                        size="small"
                        variant="outlined"
                    />
                )}
            </Box>
            {excursii && (
                <Box sx={{ mt: 1, pl: 2, borderLeft: "2px solid #4fc3f7" }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.5}>
                        {getLanguageByKey("Excursii")}:
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Typography variant="caption">Count: {excursii.count || 0}</Typography>
                        <Typography variant="caption">Commission: {formatNumber(excursii.commission)}</Typography>
                        <Typography variant="caption">Avg: {formatNumber(excursii.avgCommission)}</Typography>
                    </Box>
                </Box>
            )}
            {tururi && (
                <Box sx={{ mt: 1, pl: 2, borderLeft: "2px solid #81c784" }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.5}>
                        {getLanguageByKey("Tururi")}:
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Typography variant="caption">Count: {tururi.count || 0}</Typography>
                        <Typography variant="caption">Commission: {formatNumber(tururi.commission)}</Typography>
                        <Typography variant="caption">Avg: {formatNumber(tururi.avgCommission)}</Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

// Рекурсивный компонент для отображения вложенных данных
const NestedDataRow = ({ name, data, totals, level = 0, expandedKeys, onToggle }) => {
    const key = `${level}-${name}`;
    const isExpanded = expandedKeys.has(key);
    
    // Проверяем, есть ли вложенные данные
    const hasChildren = data && 
        typeof data === "object" && 
        !Array.isArray(data) && 
        Object.keys(data).length > 0 &&
        !isMetricsObject(data) &&
        !data.totals;

    return (
        <>
            <TableRow
                sx={{
                    backgroundColor: level % 2 === 0 ? "background.paper" : "action.hover",
                    cursor: hasChildren ? "pointer" : "default",
                    "&:hover": {
                        backgroundColor: hasChildren ? "action.selected" : undefined,
                    },
                }}
                onClick={() => hasChildren && onToggle(key)}
            >
                <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {hasChildren && (
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggle(key);
                                }}
                                sx={{ p: 0.5 }}
                            >
                                {isExpanded ? <ExpandMore /> : <ChevronRight />}
                            </IconButton>
                        )}
                        <Typography
                            variant={level === 0 ? "body1" : "body2"}
                            fontWeight={level === 0 ? 600 : 500}
                        >
                            {name}
                        </Typography>
                    </Box>
                </TableCell>
                <TableCell>
                    <MetricsRow totals={totals} level={level} />
                </TableCell>
            </TableRow>
            {hasChildren && (
                <TableRow>
                    <TableCell colSpan={2} sx={{ py: 0, border: "none" }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2, backgroundColor: "action.hover" }}>
                                <Table size="small">
                                    <TableBody>
                                        {Object.entries(data).map(([childName, childData]) => {
                                            // Если childData это объект с totals и data
                                            const childTotals = childData?.totals;
                                            let childDataObj = childData?.data;
                                            
                                            // Если нет data, но есть сам объект (и это не totals)
                                            if (!childDataObj && childData && typeof childData === "object" && !childData.totals && !isMetricsObject(childData)) {
                                                childDataObj = childData;
                                            }
                                            
                                            // Если childDataObj это метрики, значит это конечный узел
                                            if (!childDataObj || typeof childDataObj !== "object" || Array.isArray(childDataObj) || isMetricsObject(childDataObj)) {
                                                childDataObj = {};
                                            }
                                            
                                            return (
                                                <NestedDataRow
                                                    key={`${key}-${childName}`}
                                                    name={childName}
                                                    data={childDataObj}
                                                    totals={childTotals || (isMetricsObject(childData) ? childData : null)}
                                                    level={level + 1}
                                                    expandedKeys={expandedKeys}
                                                    onToggle={onToggle}
                                                />
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Collapse>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
};

export const SalesMonitorTable = ({ data = [] }) => {
    const [expandedKeys, setExpandedKeys] = useState(new Set());

    const toggleExpanded = (key) => {
        setExpandedKeys((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    if (!data || data.length === 0) {
        return (
            <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography color="text.secondary">{getLanguageByKey("noDate")}</Typography>
            </Box>
        );
    }

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ width: "30%", fontWeight: 600 }}>
                            {getLanguageByKey("Group")}
                        </TableCell>
                        <TableCell sx={{ width: "70%", fontWeight: 600 }}>
                            {getLanguageByKey("Metrics")}
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.flatMap((item, index) => {
                        const topLevelData = item?.data || {};
                        const topLevelTotals = item?.totals;

                        // Если есть data с ключами, показываем их как первый уровень
                        if (Object.keys(topLevelData).length > 0) {
                            return Object.entries(topLevelData).map(([key, value]) => {
                                const childTotals = value?.totals;
                                let childData = value?.data;
                                
                                // Если нет data, но есть сам объект (и это не totals и не метрики)
                                if (!childData && value && typeof value === "object" && !value.totals && !isMetricsObject(value)) {
                                    childData = value;
                                }
                                
                                // Если это метрики, значит нет вложенных данных
                                if (!childData || typeof childData !== "object" || Array.isArray(childData) || isMetricsObject(childData)) {
                                    childData = {};
                                }

                                return (
                                    <NestedDataRow
                                        key={`top-${index}-${key}`}
                                        name={key}
                                        data={childData}
                                        totals={childTotals || topLevelTotals}
                                        level={0}
                                        expandedKeys={expandedKeys}
                                        onToggle={toggleExpanded}
                                    />
                                );
                            });
                        }

                        // Если data пустое, показываем только totals
                        return (
                            <NestedDataRow
                                key={`top-${index}`}
                                name={`Group ${index + 1}`}
                                data={{}}
                                totals={topLevelTotals}
                                level={0}
                                expandedKeys={expandedKeys}
                                onToggle={toggleExpanded}
                            />
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};
