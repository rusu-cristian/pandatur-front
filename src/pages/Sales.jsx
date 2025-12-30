import React, { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { useSnackbar } from "notistack";
import {
  Box,
  Stack,
  Group,
  MultiSelect,
  Button,
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
  Paper,
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
  { value: "2", label: getLanguageByKey("By Users (Alt)") || "By Users (Alt)" },
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

// User Row Component (final leaf level) - shows user data with separate excursii/tururi columns
const UserRow = ({ userId, userData, depth }) => {
  const paddingLeft = 16 + depth * 24;

  return (
    <TableRow className={`sales-row depth-${depth} user-row`}>
      <TableCell className="col-name" sx={{ paddingLeft: `${paddingLeft}px` }}>
        <span>{userId}</span>
      </TableCell>
      {/* Excursii columns */}
      <TableCell align="right" className="col-excursii col-border">{formatInteger(userData?.excursii?.count)}</TableCell>
      <TableCell align="right" className="col-excursii">{formatNumber(userData?.excursii?.commission)}</TableCell>
      <TableCell align="right" className="col-excursii">{formatNumber(userData?.excursii?.pretNetto)}</TableCell>
      <TableCell align="right" className="col-excursii">{formatNumber(userData?.excursii?.sumaContract)}</TableCell>
      <TableCell align="right" className="col-excursii">{formatNumber(userData?.excursii?.weight)}%</TableCell>
      {/* Tururi columns */}
      <TableCell align="right" className="col-tururi col-border">{formatInteger(userData?.tururi?.count)}</TableCell>
      <TableCell align="right" className="col-tururi">{formatNumber(userData?.tururi?.commission)}</TableCell>
      <TableCell align="right" className="col-tururi">{formatNumber(userData?.tururi?.pretNetto)}</TableCell>
      <TableCell align="right" className="col-tururi">{formatNumber(userData?.tururi?.sumaContract)}</TableCell>
      <TableCell align="right" className="col-tururi">{formatNumber(userData?.tururi?.weight)}%</TableCell>
      {/* Total columns */}
      <TableCell align="right" className="col-total col-border">{formatInteger(userData?.total?.count)}</TableCell>
      <TableCell align="right" className="col-total">{formatNumber(userData?.total?.commission)}</TableCell>
      <TableCell align="right" className="col-total">{formatNumber(userData?.total?.pretNetto)}</TableCell>
      <TableCell align="right" className="col-total">{formatNumber(userData?.total?.sumaContract)}</TableCell>
      {/* Leads columns */}
      <TableCell align="right" className="col-leads col-border">{formatInteger(userData?.fromDePrelucratCount)}</TableCell>
      <TableCell align="right" className="col-leads">{formatInteger(userData?.toContractIncheiatCount)}</TableCell>
      {/* Conversion rates */}
      <TableCell align="right" className="col-conversion col-border">{formatNumber(userData?.conversionRateTotal)}%</TableCell>
      <TableCell align="right" className="col-conversion">{formatNumber(userData?.conversionRateContract)}%</TableCell>
    </TableRow>
  );
};

// User Group Row Component (middle level - e.g., "Back Flagman")
const UserGroupRow = ({ groupName, groupData, depth }) => {
  const [open, setOpen] = useState(false);
  const users = groupData?.data || {};
  const totals = groupData?.totals || {};
  const hasUsers = Object.keys(users).length > 0;
  const paddingLeft = 16 + depth * 24;

  return (
    <>
      <TableRow className={`sales-row depth-${depth} group-row`}>
        <TableCell className="col-name" sx={{ paddingLeft: `${paddingLeft}px` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton size="small" onClick={() => setOpen(!open)} disabled={!hasUsers}>
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
            <span className="group-name">{groupName}</span>
          </Box>
        </TableCell>
        {/* Excursii columns */}
        <TableCell align="right" className="col-excursii col-border">{formatInteger(totals?.excursii?.count)}</TableCell>
        <TableCell align="right" className="col-excursii">{formatNumber(totals?.excursii?.commission)}</TableCell>
        <TableCell align="right" className="col-excursii">{formatNumber(totals?.excursii?.pretNetto)}</TableCell>
        <TableCell align="right" className="col-excursii">{formatNumber(totals?.excursii?.sumaContract)}</TableCell>
        <TableCell align="right" className="col-excursii">{formatNumber(totals?.excursii?.weight)}%</TableCell>
        {/* Tururi columns */}
        <TableCell align="right" className="col-tururi col-border">{formatInteger(totals?.tururi?.count)}</TableCell>
        <TableCell align="right" className="col-tururi">{formatNumber(totals?.tururi?.commission)}</TableCell>
        <TableCell align="right" className="col-tururi">{formatNumber(totals?.tururi?.pretNetto)}</TableCell>
        <TableCell align="right" className="col-tururi">{formatNumber(totals?.tururi?.sumaContract)}</TableCell>
        <TableCell align="right" className="col-tururi">{formatNumber(totals?.tururi?.weight)}%</TableCell>
        {/* Total columns */}
        <TableCell align="right" className="col-total col-border">{formatInteger(totals?.total?.count)}</TableCell>
        <TableCell align="right" className="col-total">{formatNumber(totals?.total?.commission)}</TableCell>
        <TableCell align="right" className="col-total">{formatNumber(totals?.total?.pretNetto)}</TableCell>
        <TableCell align="right" className="col-total">{formatNumber(totals?.total?.sumaContract)}</TableCell>
        {/* Leads columns */}
        <TableCell align="right" className="col-leads col-border">{formatInteger(totals?.fromDePrelucratCount)}</TableCell>
        <TableCell align="right" className="col-leads">{formatInteger(totals?.toContractIncheiatCount)}</TableCell>
        {/* Conversion rates */}
        <TableCell align="right" className="col-conversion col-border">{formatNumber(totals?.conversionRateTotal)}%</TableCell>
        <TableCell align="right" className="col-conversion">{formatNumber(totals?.conversionRateContract)}%</TableCell>
      </TableRow>

      {open &&
        Object.entries(users).map(([userId, userData]) => (
          <UserRow key={userId} userId={userId} userData={userData} depth={depth + 1} />
        ))}
    </>
  );
};

// Group Title Row Component (top level - e.g., "MD")
const GroupTitleRow = ({ titleName, titleData, depth }) => {
  const [open, setOpen] = useState(false);
  const userGroups = titleData?.data || {};
  const totals = titleData?.totals || {};
  const hasGroups = Object.keys(userGroups).length > 0;
  const paddingLeft = 16 + depth * 24;

  return (
    <>
      <TableRow className={`sales-row depth-${depth} group-title-row`}>
        <TableCell className="col-name" sx={{ paddingLeft: `${paddingLeft}px` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              size="small"
              onClick={() => setOpen(!open)}
              disabled={!hasGroups}
              sx={{ color: "inherit" }}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
            <span className="title-name">{titleName}</span>
          </Box>
        </TableCell>
        {/* Excursii columns */}
        <TableCell align="right" className="col-excursii col-border">{formatInteger(totals?.excursii?.count)}</TableCell>
        <TableCell align="right" className="col-excursii">{formatNumber(totals?.excursii?.commission)}</TableCell>
        <TableCell align="right" className="col-excursii">{formatNumber(totals?.excursii?.pretNetto)}</TableCell>
        <TableCell align="right" className="col-excursii">{formatNumber(totals?.excursii?.sumaContract)}</TableCell>
        <TableCell align="right" className="col-excursii">{formatNumber(totals?.excursii?.weight)}%</TableCell>
        {/* Tururi columns */}
        <TableCell align="right" className="col-tururi col-border">{formatInteger(totals?.tururi?.count)}</TableCell>
        <TableCell align="right" className="col-tururi">{formatNumber(totals?.tururi?.commission)}</TableCell>
        <TableCell align="right" className="col-tururi">{formatNumber(totals?.tururi?.pretNetto)}</TableCell>
        <TableCell align="right" className="col-tururi">{formatNumber(totals?.tururi?.sumaContract)}</TableCell>
        <TableCell align="right" className="col-tururi">{formatNumber(totals?.tururi?.weight)}%</TableCell>
        {/* Total columns */}
        <TableCell align="right" className="col-total col-border">{formatInteger(totals?.total?.count)}</TableCell>
        <TableCell align="right" className="col-total">{formatNumber(totals?.total?.commission)}</TableCell>
        <TableCell align="right" className="col-total">{formatNumber(totals?.total?.pretNetto)}</TableCell>
        <TableCell align="right" className="col-total">{formatNumber(totals?.total?.sumaContract)}</TableCell>
        {/* Leads columns */}
        <TableCell align="right" className="col-leads col-border">{formatInteger(totals?.fromDePrelucratCount)}</TableCell>
        <TableCell align="right" className="col-leads">{formatInteger(totals?.toContractIncheiatCount)}</TableCell>
        {/* Conversion rates */}
        <TableCell align="right" className="col-conversion col-border">{formatNumber(totals?.conversionRateTotal)}%</TableCell>
        <TableCell align="right" className="col-conversion">{formatNumber(totals?.conversionRateContract)}%</TableCell>
      </TableRow>

      {open &&
        Object.entries(userGroups).map(([groupName, groupData]) => (
          <UserGroupRow key={groupName} groupName={groupName} groupData={groupData} depth={depth + 1} />
        ))}
    </>
  );
};

// Service Type Row (deepest level for Type 1) - final leaf showing service type details
const ServiceTypeRow = ({ typeName, typeData, depth }) => {
  const paddingLeft = 16 + depth * 24;

  return (
    <TableRow className={`sales-row depth-${depth} user-row`}>
      <TableCell className="col-name" sx={{ paddingLeft: `${paddingLeft}px` }}>
        <span>{typeName}</span>
      </TableCell>
      <TableCell align="right" className="col-dest col-border">{formatInteger(typeData?.count)}</TableCell>
      <TableCell align="right" className="col-dest">{formatNumber(typeData?.commission)}</TableCell>
      <TableCell align="right" className="col-dest">{formatNumber(typeData?.avgCommission)}</TableCell>
      <TableCell align="right" className="col-dest">{formatNumber(typeData?.pretNetto)}</TableCell>
      <TableCell align="right" className="col-dest">{formatNumber(typeData?.sumaContract)}</TableCell>
      {/* Leads columns */}
      <TableCell align="right" className="col-leads col-border">{formatInteger(typeData?.fromDePrelucratCount)}</TableCell>
      <TableCell align="right" className="col-leads">{formatInteger(typeData?.toContractIncheiatCount)}</TableCell>
      {/* Conversion columns */}
      <TableCell align="right" className="col-conversion col-border">{formatNumber(typeData?.conversionRateTotal)}%</TableCell>
      <TableCell align="right" className="col-conversion">{formatNumber(typeData?.conversionRateContract)}%</TableCell>
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
      <TableRow className={`sales-row depth-${depth} group-row`}>
        <TableCell className="col-name" sx={{ paddingLeft: `${paddingLeft}px` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton size="small" onClick={() => setOpen(!open)} disabled={!hasTypes}>
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
            <span className="group-name">{destinationName}</span>
          </Box>
        </TableCell>
        <TableCell align="right" className="col-dest col-border">{formatInteger(totals?.count)}</TableCell>
        <TableCell align="right" className="col-dest">{formatNumber(totals?.commission)}</TableCell>
        <TableCell align="right" className="col-dest">{formatNumber(totals?.avgCommission)}</TableCell>
        <TableCell align="right" className="col-dest">{formatNumber(totals?.pretNetto)}</TableCell>
        <TableCell align="right" className="col-dest">{formatNumber(totals?.sumaContract)}</TableCell>
        {/* Leads columns */}
        <TableCell align="right" className="col-leads col-border">{formatInteger(totals?.fromDePrelucratCount)}</TableCell>
        <TableCell align="right" className="col-leads">{formatInteger(totals?.toContractIncheiatCount)}</TableCell>
        {/* Conversion columns */}
        <TableCell align="right" className="col-conversion col-border">{formatNumber(totals?.conversionRateTotal)}%</TableCell>
        <TableCell align="right" className="col-conversion">{formatNumber(totals?.conversionRateContract)}%</TableCell>
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
        <TableCell className="col-name" sx={{ paddingLeft: `${paddingLeft}px` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              size="small"
              onClick={() => setOpen(!open)}
              disabled={!hasDestinations}
              sx={{ color: "inherit" }}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
            <span className="title-name">{titleName}</span>
          </Box>
        </TableCell>
        <TableCell align="right" className="col-dest col-border">{formatInteger(totals?.count)}</TableCell>
        <TableCell align="right" className="col-dest">{formatNumber(totals?.commission)}</TableCell>
        <TableCell align="right" className="col-dest">{formatNumber(totals?.avgCommission)}</TableCell>
        <TableCell align="right" className="col-dest">{formatNumber(totals?.pretNetto)}</TableCell>
        <TableCell align="right" className="col-dest">{formatNumber(totals?.sumaContract)}</TableCell>
        {/* Leads columns */}
        <TableCell align="right" className="col-leads col-border">{formatInteger(totals?.fromDePrelucratCount)}</TableCell>
        <TableCell align="right" className="col-leads">{formatInteger(totals?.toContractIncheiatCount)}</TableCell>
        {/* Conversion columns */}
        <TableCell align="right" className="col-conversion col-border">{formatNumber(totals?.conversionRateTotal)}%</TableCell>
        <TableCell align="right" className="col-conversion">{formatNumber(totals?.conversionRateContract)}%</TableCell>
      </TableRow>

      {open &&
        Object.entries(destinations).map(([destName, destData]) => (
          <DestinationRow key={destName} destinationName={destName} destinationData={destData} depth={depth + 1} />
        ))}
    </>
  );
};

// Main Table for Type 0 (By Users) - with separate excursii/tururi columns
const UsersTable = ({ data }) => {
  const groupTitles = data?.data || {};
  const totals = data?.totals || {};

  return (
    <TableContainer component={Paper} className="sales-table-container">
      <Table size="small" className="sales-users-table">
        <TableHead>
          {/* Header group row */}
          <TableRow className="sales-header-group-row">
            <TableCell rowSpan={2} className="col-name header-name">{getLanguageByKey("Name") || "Name"}</TableCell>
            <TableCell colSpan={5} align="center" className="header-excursii">
              {getLanguageByKey("Excursions") || "Excursions"}
            </TableCell>
            <TableCell colSpan={5} align="center" className="header-tururi">
              {getLanguageByKey("Tours") || "Tours"}
            </TableCell>
            <TableCell colSpan={4} align="center" className="header-total">
              {getLanguageByKey("Total") || "Total"}
            </TableCell>
            <TableCell colSpan={2} align="center" className="header-leads">
              {getLanguageByKey("Leads") || "Leads"}
            </TableCell>
            <TableCell colSpan={2} align="center" className="header-conversion">
              {getLanguageByKey("Conversion") || "Conversion"}
            </TableCell>
          </TableRow>
          <TableRow className="sales-header-row">
            {/* Excursii sub-headers */}
            <TableCell align="right" className="col-excursii col-border">{getLanguageByKey("Cnt") || "Cnt"}</TableCell>
            <TableCell align="right" className="col-excursii">{getLanguageByKey("Comm") || "Comm"}</TableCell>
            <TableCell align="right" className="col-excursii">{getLanguageByKey("Net") || "Net"}</TableCell>
            <TableCell align="right" className="col-excursii">{getLanguageByKey("Contract") || "Contract"}</TableCell>
            <TableCell align="right" className="col-excursii">{getLanguageByKey("Weight") || "Wt%"}</TableCell>
            {/* Tururi sub-headers */}
            <TableCell align="right" className="col-tururi col-border">{getLanguageByKey("Cnt") || "Cnt"}</TableCell>
            <TableCell align="right" className="col-tururi">{getLanguageByKey("Comm") || "Comm"}</TableCell>
            <TableCell align="right" className="col-tururi">{getLanguageByKey("Net") || "Net"}</TableCell>
            <TableCell align="right" className="col-tururi">{getLanguageByKey("Contract") || "Contract"}</TableCell>
            <TableCell align="right" className="col-tururi">{getLanguageByKey("Weight") || "Wt%"}</TableCell>
            {/* Total sub-headers */}
            <TableCell align="right" className="col-total col-border">{getLanguageByKey("Cnt") || "Cnt"}</TableCell>
            <TableCell align="right" className="col-total">{getLanguageByKey("Comm") || "Comm"}</TableCell>
            <TableCell align="right" className="col-total">{getLanguageByKey("Net") || "Net"}</TableCell>
            <TableCell align="right" className="col-total">{getLanguageByKey("Contract") || "Contract"}</TableCell>
            {/* Leads sub-headers */}
            <TableCell align="right" className="col-leads col-border">{getLanguageByKey("De Prelucrat") || "De Prelucrat"}</TableCell>
            <TableCell align="right" className="col-leads">{getLanguageByKey("Încheiat") || "Încheiat"}</TableCell>
            {/* Conversion sub-headers */}
            <TableCell align="right" className="col-conversion col-border">{getLanguageByKey("Total") || "Total"}</TableCell>
            <TableCell align="right" className="col-conversion">{getLanguageByKey("Contract") || "Contr"}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Totals Row */}
          <TableRow className="sales-row total-row">
            <TableCell className="col-name">
              <strong>{getLanguageByKey("TOTAL") || "TOTAL"}</strong>
            </TableCell>
            {/* Excursii totals */}
            <TableCell align="right" className="col-excursii col-border"><strong>{formatInteger(totals?.excursii?.count)}</strong></TableCell>
            <TableCell align="right" className="col-excursii"><strong>{formatNumber(totals?.excursii?.commission)}</strong></TableCell>
            <TableCell align="right" className="col-excursii"><strong>{formatNumber(totals?.excursii?.pretNetto)}</strong></TableCell>
            <TableCell align="right" className="col-excursii"><strong>{formatNumber(totals?.excursii?.sumaContract)}</strong></TableCell>
            <TableCell align="right" className="col-excursii"><strong>{formatNumber(totals?.excursii?.weight)}%</strong></TableCell>
            {/* Tururi totals */}
            <TableCell align="right" className="col-tururi col-border"><strong>{formatInteger(totals?.tururi?.count)}</strong></TableCell>
            <TableCell align="right" className="col-tururi"><strong>{formatNumber(totals?.tururi?.commission)}</strong></TableCell>
            <TableCell align="right" className="col-tururi"><strong>{formatNumber(totals?.tururi?.pretNetto)}</strong></TableCell>
            <TableCell align="right" className="col-tururi"><strong>{formatNumber(totals?.tururi?.sumaContract)}</strong></TableCell>
            <TableCell align="right" className="col-tururi"><strong>{formatNumber(totals?.tururi?.weight)}%</strong></TableCell>
            {/* Total totals */}
            <TableCell align="right" className="col-total col-border"><strong>{formatInteger(totals?.total?.count)}</strong></TableCell>
            <TableCell align="right" className="col-total"><strong>{formatNumber(totals?.total?.commission)}</strong></TableCell>
            <TableCell align="right" className="col-total"><strong>{formatNumber(totals?.total?.pretNetto)}</strong></TableCell>
            <TableCell align="right" className="col-total"><strong>{formatNumber(totals?.total?.sumaContract)}</strong></TableCell>
            {/* Leads totals */}
            <TableCell align="right" className="col-leads col-border"><strong>{formatInteger(totals?.fromDePrelucratCount)}</strong></TableCell>
            <TableCell align="right" className="col-leads"><strong>{formatInteger(totals?.toContractIncheiatCount)}</strong></TableCell>
            {/* Conversion totals */}
            <TableCell align="right" className="col-conversion col-border"><strong>{formatNumber(totals?.conversionRateTotal)}%</strong></TableCell>
            <TableCell align="right" className="col-conversion"><strong>{formatNumber(totals?.conversionRateContract)}%</strong></TableCell>
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
      <Table size="small" className="sales-dest-table">
        <TableHead>
          {/* Header group row */}
          <TableRow className="sales-header-group-row">
            <TableCell rowSpan={2} className="col-name header-name">{getLanguageByKey("Name") || "Name"}</TableCell>
            <TableCell colSpan={5} align="center" className="header-dest">
              {getLanguageByKey("Sales Data") || "Sales Data"}
            </TableCell>
            <TableCell colSpan={2} align="center" className="header-leads">
              {getLanguageByKey("Leads") || "Leads"}
            </TableCell>
            <TableCell colSpan={2} align="center" className="header-conversion">
              {getLanguageByKey("Conversion") || "Conversion"}
            </TableCell>
          </TableRow>
          <TableRow className="sales-header-row">
            <TableCell align="right" className="col-dest col-border">{getLanguageByKey("Count") || "Count"}</TableCell>
            <TableCell align="right" className="col-dest">{getLanguageByKey("Comm") || "Commission"}</TableCell>
            <TableCell align="right" className="col-dest">{getLanguageByKey("Avg") || "Avg Comm"}</TableCell>
            <TableCell align="right" className="col-dest">{getLanguageByKey("Net") || "Net Price"}</TableCell>
            <TableCell align="right" className="col-dest">{getLanguageByKey("Contract") || "Contract"}</TableCell>
            {/* Leads sub-headers */}
            <TableCell align="right" className="col-leads col-border">{getLanguageByKey("De Prelucrat") || "De Prelucrat"}</TableCell>
            <TableCell align="right" className="col-leads">{getLanguageByKey("Încheiat") || "Încheiat"}</TableCell>
            {/* Conversion sub-headers */}
            <TableCell align="right" className="col-conversion col-border">{getLanguageByKey("Total") || "Total"}</TableCell>
            <TableCell align="right" className="col-conversion">{getLanguageByKey("Contract") || "Contr"}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Totals Row */}
          <TableRow className="sales-row total-row">
            <TableCell className="col-name">
              <strong>{getLanguageByKey("TOTAL") || "TOTAL"}</strong>
            </TableCell>
            <TableCell align="right" className="col-dest col-border"><strong>{formatInteger(totals?.count)}</strong></TableCell>
            <TableCell align="right" className="col-dest"><strong>{formatNumber(totals?.commission)}</strong></TableCell>
            <TableCell align="right" className="col-dest"><strong>{formatNumber(totals?.avgCommission)}</strong></TableCell>
            <TableCell align="right" className="col-dest"><strong>{formatNumber(totals?.pretNetto)}</strong></TableCell>
            <TableCell align="right" className="col-dest"><strong>{formatNumber(totals?.sumaContract)}</strong></TableCell>
            {/* Leads totals */}
            <TableCell align="right" className="col-leads col-border"><strong>{formatInteger(totals?.fromDePrelucratCount)}</strong></TableCell>
            <TableCell align="right" className="col-leads"><strong>{formatInteger(totals?.toContractIncheiatCount)}</strong></TableCell>
            {/* Conversion totals */}
            <TableCell align="right" className="col-conversion col-border"><strong>{formatNumber(totals?.conversionRateTotal)}%</strong></TableCell>
            <TableCell align="right" className="col-conversion"><strong>{formatNumber(totals?.conversionRateContract)}%</strong></TableCell>
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
  const [selectedTypes, setSelectedTypes] = useState(["0", "1", "2"]);

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
      
      // Sort types to ensure consistent order with response parsing
      const sortedTypes = selectedTypes.map((t) => parseInt(t, 10)).sort((a, b) => a - b);
      
      const payload = {
        group_titles: selectedGroupTitles,
        types: sortedTypes,
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

  // Data is returned as an array based on requested types
  // We need to map the response array to the correct type based on what was requested
  const { usersData, destinationsData, usersAltData } = useMemo(() => {
    if (!salesData || !Array.isArray(salesData)) {
      return { usersData: null, destinationsData: null, usersAltData: null };
    }

    // The API returns data in the order of requested types
    const requestedTypes = selectedTypes.map((t) => parseInt(t, 10)).sort((a, b) => a - b);
    
    let usersData = null;
    let destinationsData = null;
    let usersAltData = null;

    requestedTypes.forEach((type, index) => {
      const data = salesData[index];
      if (!data) return;
      
      if (type === 0) usersData = data;
      else if (type === 1) destinationsData = data;
      else if (type === 2) usersAltData = data;
    });

    return { usersData, destinationsData, usersAltData };
  }, [salesData, selectedTypes]);

  const showUsersTable = selectedTypes.includes("0") && usersData;
  const showDestinationsTable = selectedTypes.includes("1") && destinationsData;
  const showUsersAltTable = selectedTypes.includes("2") && usersAltData;

  const filtersContent = (
    <Group gap="md" align="flex-end" wrap="wrap">
      <MultiSelect
        data={groupTitleOptions}
        value={selectedGroupTitles}
        onChange={setSelectedGroupTitles}
        placeholder={getLanguageByKey("Select group titles") || "Select group titles"}
        searchable
        clearable={false}
        maxDropdownHeight={260}
        nothingFoundMessage={getLanguageByKey("Nimic găsit") || "Nothing found"}
        size="sm"
        style={{ minWidth: 200 }}
      />

      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
        placeholder={getLanguageByKey("Select date range") || "Select date range"}
        dateFormat="yyyy-MM-dd"
        size="sm"
      />

      <MultiSelect
        data={TYPE_OPTIONS}
        value={selectedTypes}
        onChange={(val) => setSelectedTypes(val.length > 0 ? val : selectedTypes)}
        placeholder={getLanguageByKey("Select view types") || "Select view types"}
        clearable={false}
        maxDropdownHeight={200}
        size="sm"
        style={{ minWidth: 180 }}
      />

      <Button onClick={fetchSalesData} loading={isLoading} size="sm">
        {getLanguageByKey("Apply") || "Apply"}
      </Button>
    </Group>
  );

  return (
    <Stack gap={12} p="12" className="sales-container">
      <PageHeader
        title={getLanguageByKey("Sales") || "Sales"}
        badgeColor="blue"
        withDivider={false}
        extraInfo={filtersContent}
      />

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

          {showUsersAltTable && (
            <Box>
              <Text size="lg" fw={600} mb="md">
                {getLanguageByKey("Sales by Users (Alt)") || "Sales by Users (Alt)"}
              </Text>
              <UsersTable data={usersAltData} />
            </Box>
          )}

          {!showUsersTable && !showDestinationsTable && !showUsersAltTable && (
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
