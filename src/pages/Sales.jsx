import React, { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { useSnackbar } from "notistack";
import {
  Box,
  Stack,
  Group,
  MultiSelect,
  Button,
  Paper,
  Text,
  Flex,
} from "@mantine/core";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { api } from "../api";
import { showServerError, getLanguageByKey } from "@utils";
import { Spin, PageHeader } from "@components";
import { DateRangePicker } from "../Components/DateRangePicker";
import { groupTitleOptions } from "../FormOptions/GroupTitleOptions";
import "./Sales.css";

const TYPE_OPTIONS = [
  { value: "0", label: getLanguageByKey("By Users") || "By Users" },
  { value: "1", label: getLanguageByKey("By Destinations") || "By Destinations" },
];

const formatNumber = (num) => {
  if (num === null || num === undefined) return "0.00";
  return Number(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatInteger = (num) => {
  if (num === null || num === undefined) return "0";
  return Number(num).toLocaleString("en-US");
};

// Expandable Row Component for Users Table (handles all 3 levels + detail rows)
const UserRow = ({ userId, userData, depth }) => {
  const [open, setOpen] = useState(false);
  const paddingLeft = 16 + depth * 24;

  return (
    <>
      {/* User summary row */}
      <TableRow className={`sales-row depth-${depth}`}>
        <TableCell sx={{ paddingLeft: `${paddingLeft}px` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton size="small" onClick={() => setOpen(!open)}>
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
            <span>{userId}</span>
          </Box>
        </TableCell>
        <TableCell align="right">{formatInteger(userData?.total?.count)}</TableCell>
        <TableCell align="right">{formatNumber(userData?.total?.commission)}</TableCell>
        <TableCell align="right">{formatNumber(userData?.total?.avgCommission)}</TableCell>
        <TableCell align="right">{formatNumber(userData?.total?.pretNetto)}</TableCell>
        <TableCell align="right">{formatNumber(userData?.total?.sumaContract)}</TableCell>
        <TableCell align="right">{formatNumber(userData?.conversionRateTotal)}%</TableCell>
        <TableCell align="right">{formatNumber(userData?.conversionRateContract)}%</TableCell>
      </TableRow>

      {/* Excursii detail row */}
      <TableRow className={`sales-row depth-${depth + 1} detail-row`} sx={{ display: open ? "table-row" : "none" }}>
        <TableCell sx={{ paddingLeft: `${paddingLeft + 48}px` }}>
          {getLanguageByKey("Excursions") || "Excursions"}
        </TableCell>
        <TableCell align="right">{formatInteger(userData?.excursii?.count)}</TableCell>
        <TableCell align="right">{formatNumber(userData?.excursii?.commission)}</TableCell>
        <TableCell align="right">{formatNumber(userData?.excursii?.avgCommission)}</TableCell>
        <TableCell align="right">{formatNumber(userData?.excursii?.pretNetto)}</TableCell>
        <TableCell align="right">{formatNumber(userData?.excursii?.sumaContract)}</TableCell>
        <TableCell align="right">{formatNumber(userData?.excursii?.weight)}%</TableCell>
        <TableCell align="right">-</TableCell>
      </TableRow>

      {/* Tururi detail row */}
      <TableRow className={`sales-row depth-${depth + 1} detail-row`} sx={{ display: open ? "table-row" : "none" }}>
        <TableCell sx={{ paddingLeft: `${paddingLeft + 48}px` }}>
          {getLanguageByKey("Tours") || "Tours"}
        </TableCell>
        <TableCell align="right">{formatInteger(userData?.tururi?.count)}</TableCell>
        <TableCell align="right">{formatNumber(userData?.tururi?.commission)}</TableCell>
        <TableCell align="right">{formatNumber(userData?.tururi?.avgCommission)}</TableCell>
        <TableCell align="right">{formatNumber(userData?.tururi?.pretNetto)}</TableCell>
        <TableCell align="right">{formatNumber(userData?.tururi?.sumaContract)}</TableCell>
        <TableCell align="right">{formatNumber(userData?.tururi?.weight)}%</TableCell>
        <TableCell align="right">-</TableCell>
      </TableRow>
    </>
  );
};

// User Group Row Component (middle level)
const UserGroupRow = ({ groupName, groupData, depth }) => {
  const [open, setOpen] = useState(false);
  const users = groupData?.data || {};
  const totals = groupData?.totals || {};
  const hasUsers = Object.keys(users).length > 0;
  const paddingLeft = 16 + depth * 24;

  return (
    <>
      <TableRow className={`sales-row depth-${depth}`}>
        <TableCell sx={{ paddingLeft: `${paddingLeft}px` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton size="small" onClick={() => setOpen(!open)} disabled={!hasUsers}>
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
            <strong>{groupName}</strong>
          </Box>
        </TableCell>
        <TableCell align="right">{formatInteger(totals?.total?.count)}</TableCell>
        <TableCell align="right">{formatNumber(totals?.total?.commission)}</TableCell>
        <TableCell align="right">{formatNumber(totals?.total?.avgCommission)}</TableCell>
        <TableCell align="right">{formatNumber(totals?.total?.pretNetto)}</TableCell>
        <TableCell align="right">{formatNumber(totals?.total?.sumaContract)}</TableCell>
        <TableCell align="right">{formatNumber(totals?.conversionRateTotal)}%</TableCell>
        <TableCell align="right">{formatNumber(totals?.conversionRateContract)}%</TableCell>
      </TableRow>

      {open &&
        Object.entries(users).map(([userId, userData]) => (
          <UserRow key={userId} userId={userId} userData={userData} depth={depth + 1} />
        ))}
    </>
  );
};

// Group Title Row Component (top level)
const GroupTitleRow = ({ titleName, titleData, depth }) => {
  const [open, setOpen] = useState(false);
  const userGroups = titleData?.data || {};
  const totals = titleData?.totals || {};
  const hasGroups = Object.keys(userGroups).length > 0;
  const paddingLeft = 16 + depth * 24;

  return (
    <>
      <TableRow className={`sales-row depth-${depth} group-title-row`}>
        <TableCell sx={{ paddingLeft: `${paddingLeft}px` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              size="small"
              onClick={() => setOpen(!open)}
              disabled={!hasGroups}
              sx={{ color: "inherit" }}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
            <strong>{titleName}</strong>
          </Box>
        </TableCell>
        <TableCell align="right">{formatInteger(totals?.total?.count)}</TableCell>
        <TableCell align="right">{formatNumber(totals?.total?.commission)}</TableCell>
        <TableCell align="right">{formatNumber(totals?.total?.avgCommission)}</TableCell>
        <TableCell align="right">{formatNumber(totals?.total?.pretNetto)}</TableCell>
        <TableCell align="right">{formatNumber(totals?.total?.sumaContract)}</TableCell>
        <TableCell align="right">{formatNumber(totals?.conversionRateTotal)}%</TableCell>
        <TableCell align="right">{formatNumber(totals?.conversionRateContract)}%</TableCell>
      </TableRow>

      {open &&
        Object.entries(userGroups).map(([groupName, groupData]) => (
          <UserGroupRow key={groupName} groupName={groupName} groupData={groupData} depth={depth + 1} />
        ))}
    </>
  );
};

// Service Type Row (deepest level for Type 1)
const ServiceTypeRow = ({ typeName, typeData, depth }) => {
  const paddingLeft = 16 + depth * 24;

  return (
    <TableRow className={`sales-row depth-${depth} detail-row`}>
      <TableCell sx={{ paddingLeft: `${paddingLeft}px` }}>{typeName}</TableCell>
      <TableCell align="right">{formatInteger(typeData?.count)}</TableCell>
      <TableCell align="right">{formatNumber(typeData?.commission)}</TableCell>
      <TableCell align="right">{formatNumber(typeData?.avgCommission)}</TableCell>
      <TableCell align="right">{formatNumber(typeData?.pretNetto)}</TableCell>
      <TableCell align="right">{formatNumber(typeData?.sumaContract)}</TableCell>
    </TableRow>
  );
};

// Destination Row (middle level for Type 1)
const DestinationRow = ({ destinationName, destinationData, depth }) => {
  const [open, setOpen] = useState(false);
  const serviceTypes = destinationData?.data || {};
  const totals = destinationData?.totals || {};
  const hasTypes = Object.keys(serviceTypes).length > 0;
  const paddingLeft = 16 + depth * 24;

  return (
    <>
      <TableRow className={`sales-row depth-${depth}`}>
        <TableCell sx={{ paddingLeft: `${paddingLeft}px` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton size="small" onClick={() => setOpen(!open)} disabled={!hasTypes}>
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
            <strong>{destinationName}</strong>
          </Box>
        </TableCell>
        <TableCell align="right">{formatInteger(totals?.count)}</TableCell>
        <TableCell align="right">{formatNumber(totals?.commission)}</TableCell>
        <TableCell align="right">{formatNumber(totals?.avgCommission)}</TableCell>
        <TableCell align="right">{formatNumber(totals?.pretNetto)}</TableCell>
        <TableCell align="right">{formatNumber(totals?.sumaContract)}</TableCell>
      </TableRow>

      {open &&
        Object.entries(serviceTypes).map(([typeName, typeData]) => (
          <ServiceTypeRow key={typeName} typeName={typeName} typeData={typeData} depth={depth + 1} />
        ))}
    </>
  );
};

// Group Title Row for Destinations (top level for Type 1)
const DestinationGroupTitleRow = ({ titleName, titleData, depth }) => {
  const [open, setOpen] = useState(false);
  const destinations = titleData?.data || {};
  const totals = titleData?.totals || {};
  const hasDestinations = Object.keys(destinations).length > 0;
  const paddingLeft = 16 + depth * 24;

  return (
    <>
      <TableRow className={`sales-row depth-${depth} group-title-row`}>
        <TableCell sx={{ paddingLeft: `${paddingLeft}px` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              size="small"
              onClick={() => setOpen(!open)}
              disabled={!hasDestinations}
              sx={{ color: "inherit" }}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
            <strong>{titleName}</strong>
          </Box>
        </TableCell>
        <TableCell align="right">{formatInteger(totals?.count)}</TableCell>
        <TableCell align="right">{formatNumber(totals?.commission)}</TableCell>
        <TableCell align="right">{formatNumber(totals?.avgCommission)}</TableCell>
        <TableCell align="right">{formatNumber(totals?.pretNetto)}</TableCell>
        <TableCell align="right">{formatNumber(totals?.sumaContract)}</TableCell>
      </TableRow>

      {open &&
        Object.entries(destinations).map(([destName, destData]) => (
          <DestinationRow key={destName} destinationName={destName} destinationData={destData} depth={depth + 1} />
        ))}
    </>
  );
};

// Main Table for Type 0 (By Users)
const UsersTable = ({ data }) => {
  const groupTitles = data?.data || {};
  const totals = data?.totals || {};

  return (
    <TableContainer component={Paper} className="sales-table-container">
      <Table size="small">
        <TableHead>
          <TableRow className="sales-header-row">
            <TableCell>{getLanguageByKey("Name") || "Name"}</TableCell>
            <TableCell align="right">{getLanguageByKey("Count") || "Count"}</TableCell>
            <TableCell align="right">{getLanguageByKey("Commission") || "Commission"}</TableCell>
            <TableCell align="right">{getLanguageByKey("Avg Commission") || "Avg Commission"}</TableCell>
            <TableCell align="right">{getLanguageByKey("Net Price") || "Net Price"}</TableCell>
            <TableCell align="right">{getLanguageByKey("Contract Sum") || "Contract Sum"}</TableCell>
            <TableCell align="right">{getLanguageByKey("Conv. Total") || "Conv. Total"}</TableCell>
            <TableCell align="right">{getLanguageByKey("Conv. Contract") || "Conv. Contract"}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Totals Row */}
          <TableRow className="sales-row total-row">
            <TableCell>
              <strong>{getLanguageByKey("TOTAL") || "TOTAL"}</strong>
            </TableCell>
            <TableCell align="right"><strong>{formatInteger(totals?.total?.count)}</strong></TableCell>
            <TableCell align="right"><strong>{formatNumber(totals?.total?.commission)}</strong></TableCell>
            <TableCell align="right"><strong>{formatNumber(totals?.total?.avgCommission)}</strong></TableCell>
            <TableCell align="right"><strong>{formatNumber(totals?.total?.pretNetto)}</strong></TableCell>
            <TableCell align="right"><strong>{formatNumber(totals?.total?.sumaContract)}</strong></TableCell>
            <TableCell align="right"><strong>{formatNumber(totals?.conversionRateTotal)}%</strong></TableCell>
            <TableCell align="right"><strong>{formatNumber(totals?.conversionRateContract)}%</strong></TableCell>
          </TableRow>

          {Object.entries(groupTitles).map(([titleName, titleData]) => (
            <GroupTitleRow key={titleName} titleName={titleName} titleData={titleData} depth={0} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Main Table for Type 1 (By Destinations)
const DestinationsTable = ({ data }) => {
  const groupTitles = data?.data || {};
  const totals = data?.totals || {};

  return (
    <TableContainer component={Paper} className="sales-table-container">
      <Table size="small">
        <TableHead>
          <TableRow className="sales-header-row">
            <TableCell>{getLanguageByKey("Name") || "Name"}</TableCell>
            <TableCell align="right">{getLanguageByKey("Count") || "Count"}</TableCell>
            <TableCell align="right">{getLanguageByKey("Commission") || "Commission"}</TableCell>
            <TableCell align="right">{getLanguageByKey("Avg Commission") || "Avg Commission"}</TableCell>
            <TableCell align="right">{getLanguageByKey("Net Price") || "Net Price"}</TableCell>
            <TableCell align="right">{getLanguageByKey("Contract Sum") || "Contract Sum"}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Totals Row */}
          <TableRow className="sales-row total-row">
            <TableCell>
              <strong>{getLanguageByKey("TOTAL") || "TOTAL"}</strong>
            </TableCell>
            <TableCell align="right"><strong>{formatInteger(totals?.count)}</strong></TableCell>
            <TableCell align="right"><strong>{formatNumber(totals?.commission)}</strong></TableCell>
            <TableCell align="right"><strong>{formatNumber(totals?.avgCommission)}</strong></TableCell>
            <TableCell align="right"><strong>{formatNumber(totals?.pretNetto)}</strong></TableCell>
            <TableCell align="right"><strong>{formatNumber(totals?.sumaContract)}</strong></TableCell>
          </TableRow>

          {Object.entries(groupTitles).map(([titleName, titleData]) => (
            <DestinationGroupTitleRow key={titleName} titleName={titleName} titleData={titleData} depth={0} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export const Sales = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [salesData, setSalesData] = useState(null);

  // Filter states
  const [selectedGroupTitles, setSelectedGroupTitles] = useState(["MD"]);
  const [dateRange, setDateRange] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState(["0", "1"]);

  const fetchSalesData = useCallback(async () => {
    if (selectedGroupTitles.length === 0) {
      enqueueSnackbar(getLanguageByKey("Please select at least one group title") || "Please select at least one group title", {
        variant: "warning",
      });
      return;
    }

    setIsLoading(true);
    try {
      const [startDate, endDate] = dateRange || [];
      
      const payload = {
        group_titles: selectedGroupTitles,
        types: selectedTypes.map((t) => parseInt(t, 10)),
      };

      // Only add date attributes if both dates are set
      if (startDate && endDate) {
        payload.attributes = {
          timestamp_after: format(startDate, "yyyy-MM-dd"),
          timestamp_before: format(endDate, "yyyy-MM-dd"),
        };
      }

      const data = await api.sales.getSalesStats(payload);
      setSalesData(data);
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
      setSalesData(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedGroupTitles, dateRange, selectedTypes, enqueueSnackbar]);

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  // Parsed data for each type
  // Type 0 (Users): leaf level has excursii/tururi/total objects
  // Type 1 (Destinations): leaf level has direct count/commission values
  const usersData = useMemo(() => {
    if (!salesData || !Array.isArray(salesData)) return null;
    return salesData.find((item) => {
      if (!item?.data) return false;
      // Check if leaf level has 'excursii' property (Type 0 structure)
      const groupTitles = Object.values(item.data);
      for (const groupTitle of groupTitles) {
        const userGroups = Object.values(groupTitle?.data || {});
        for (const userGroup of userGroups) {
          const users = Object.values(userGroup?.data || {});
          for (const user of users) {
            if (user?.excursii !== undefined) return true;
          }
        }
      }
      return false;
    });
  }, [salesData]);

  const destinationsData = useMemo(() => {
    if (!salesData || !Array.isArray(salesData)) return null;
    return salesData.find((item) => {
      if (!item?.data) return false;
      // Check if leaf level has direct 'count' property without 'excursii' (Type 1 structure)
      const groupTitles = Object.values(item.data);
      for (const groupTitle of groupTitles) {
        const destinations = Object.values(groupTitle?.data || {});
        for (const destination of destinations) {
          const serviceTypes = Object.values(destination?.data || {});
          for (const serviceType of serviceTypes) {
            // Type 1 has direct count, not excursii
            if (serviceType?.count !== undefined && serviceType?.excursii === undefined) return true;
          }
        }
      }
      return false;
    });
  }, [salesData]);

  const showUsersTable = selectedTypes.includes("0") && usersData;
  const showDestinationsTable = selectedTypes.includes("1") && destinationsData;

  return (
    <Stack gap={12} p="12" className="sales-container">
      <PageHeader
        title={getLanguageByKey("Sales") || "Sales"}
        badgeColor="blue"
        withDivider={true}
      />

      {/* Filters */}
      <Paper p="md" radius="md" withBorder className="sales-filters">
        <Group gap="md" align="flex-end" wrap="wrap">
          <Box style={{ minWidth: 250 }}>
            <Text size="sm" fw={500} mb={4}>
              {getLanguageByKey("Group Title") || "Group Title"}
            </Text>
            <MultiSelect
              data={groupTitleOptions}
              value={selectedGroupTitles}
              onChange={setSelectedGroupTitles}
              placeholder={getLanguageByKey("Select group titles") || "Select group titles"}
              searchable
              clearable={false}
              maxDropdownHeight={260}
              nothingFoundMessage={getLanguageByKey("Nimic găsit") || "Nothing found"}
            />
          </Box>

          <Box>
            <Text size="sm" fw={500} mb={4}>
              {getLanguageByKey("Date Range") || "Date Range"}
            </Text>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder={getLanguageByKey("Select date range") || "Select date range"}
              dateFormat="yyyy-MM-dd"
            />
          </Box>

          <Box style={{ minWidth: 200 }}>
            <Text size="sm" fw={500} mb={4}>
              {getLanguageByKey("View Type") || "View Type"}
            </Text>
            <MultiSelect
              data={TYPE_OPTIONS}
              value={selectedTypes}
              onChange={(val) => setSelectedTypes(val.length > 0 ? val : selectedTypes)}
              placeholder={getLanguageByKey("Select view types") || "Select view types"}
              clearable={false}
              maxDropdownHeight={200}
            />
          </Box>

          <Button onClick={fetchSalesData} loading={isLoading}>
            {getLanguageByKey("Apply") || "Apply"}
          </Button>
        </Group>
      </Paper>

      {/* Data Display */}
      {isLoading ? (
        <Flex align="center" justify="center" style={{ flex: 1, minHeight: 240 }}>
          <Spin />
        </Flex>
      ) : salesData ? (
        <Stack gap="lg" className="sales-tables">
          {showUsersTable && (
            <Box>
              <Text size="lg" fw={600} mb="md">
                {getLanguageByKey("Sales by Users") || "Sales by Users"}
              </Text>
              <UsersTable data={usersData} />
            </Box>
          )}

          {showDestinationsTable && (
            <Box>
              <Text size="lg" fw={600} mb="md">
                {getLanguageByKey("Sales by Destinations") || "Sales by Destinations"}
              </Text>
              <DestinationsTable data={destinationsData} />
            </Box>
          )}

          {!showUsersTable && !showDestinationsTable && (
            <Flex align="center" justify="center" style={{ minHeight: 200 }}>
              <Text c="dimmed">{getLanguageByKey("No data available") || "No data available"}</Text>
            </Flex>
          )}
        </Stack>
      ) : (
        <Flex align="center" justify="center" style={{ minHeight: 200 }}>
          <Text c="dimmed">{getLanguageByKey("No data available") || "No data available"}</Text>
        </Flex>
      )}
    </Stack>
  );
};
